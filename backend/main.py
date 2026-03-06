import os
import logging
import threading
import subprocess
import base64
from datetime import datetime
import webview
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from utils.logger_config import setup_logger
from utils.cleanup import clean_temp_directories
from services.ocr_service import OCRService
from services.document_service import DocumentService
from werkzeug.utils import secure_filename

# Configuração inicial de Logs e Pastas
logger = setup_logger()

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

UPLOAD_FOLDER = 'storage/uploads'
EXPORT_FOLDER = 'storage/exports'
LAYOUT_FOLDER = 'storage/layout'

def init_project():
    """Garante que as pastas necessárias existam antes de começar."""
    directories = [UPLOAD_FOLDER, EXPORT_FOLDER, LAYOUT_FOLDER, 'logs']
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info(f"Diretório criado: {directory}")

init_project()

# Instancia os serviços
ocr_service = OCRService()
doc_service = DocumentService()

# --- API FLASK ---

@app.route('/')
def serve_frontend():
    """Serve o frontend React de 'dist' se existir, senão avisa."""
    if os.path.exists(app.static_folder):
        return send_from_directory(app.static_folder, 'index.html')
    return "Frontend não compilado. Rode 'npm run build' na pasta frontend ou use o Vite dev server (porta 5173)."

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend Flask rodando!"})

@app.route('/api/process', methods=['POST'])
def process_documents():
    """
    Endpoint principal para processamento de OCR e geração de Word.
    """
    request_id = datetime.now().strftime("%H%M%S")
    logger.info(f"[{request_id}] Recebida nova requisição de processamento.")
    
    try:
        if 'files' not in request.files:
            logger.warning(f"[{request_id}] Falha: Nenhum arquivo enviado.")
            return jsonify({"success": False, "error": "Nenhum arquivo enviado"}), 400
        
        files = request.files.getlist('files')
        sector = request.form.get('sector', 'Geral')
        
        # Pega os testes (pode ser um array enviado como JSON string)
        import json
        tests_raw = request.form.get('tests', '[]')
        try:
            tests_list = json.loads(tests_raw)
        except:
            tests_list = [tests_raw] if tests_raw else []

        main_test = tests_list[0] if tests_list else "Padrao"

        # Usaremos o arquivo de layout determinado no frontend (layout_id) que vem em base64
        layout_id_b64 = request.form.get('layout_id')
        if layout_id_b64:
            try:
                # Adiciona o padding que pode ser perdido na transferência
                layout_id_b64 += "=" * ((4 - len(layout_id_b64) % 4) % 4)
                layout_filename = base64.b64decode(layout_id_b64).decode('utf-8')
            except Exception as e:
                logger.error(f"Erro ao decodificar base64 ({layout_id_b64}): {str(e)}")
                layout_filename = f"{main_test}.docx"
        else:
            layout_filename = f"{main_test}.docx"
            
        logger.info(f"[{request_id}] Setor: {sector} | Teste Principal: {main_test} | Layout Arquivo: {layout_filename} | Arquivos: {len(files)}")
        
        file_paths = []
        for file in files:
            if file.filename == '': continue
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            file_paths.append(file_path)
            logger.info(f"[{request_id}] Arquivo salvo: {filename}")

        # Verificação do Arquivo de Layout antes de iniciar o OCR
        layout_path = os.path.join(LAYOUT_FOLDER, layout_filename)
        if not os.path.exists(layout_path):
            logger.warning(f"[{request_id}] Falha: Layout '{layout_filename}' não encontrado.")
            return jsonify({
                "success": False, 
                "error": "layout de relatório não registrado"
            }), 400

        # Execução do OCR informando o layout para cortes inteligentes
        normalized_layout = layout_filename.replace('.docx', '')
        ocr_results = ocr_service.process_batch(file_paths, layout_name=normalized_layout)
        
        # Preparando dados para injeção no Word
        file_data_list = []
        for file_path in file_paths:
            name = os.path.basename(file_path)
            text = ocr_results.get(name, "")
            file_data_list.append({
                "filename": name,
                "text": text,
                "path": file_path
            })

        # Geração do Relatório usando Layout
        report_filename = f"Relatorio_{main_test.replace(' ', '_')}_{request_id}.docx"
        
        # O layout_name que passamos pro document_service terá a extensao .docx removida
        output_path = doc_service.generate_report(
            file_data=file_data_list, 
            filename=report_filename, 
            layout_name=layout_filename.replace('.docx', '')
        )
        
        logger.info(f"[{request_id}] Sucesso! Relatório gerado com layout '{layout_filename}': {report_filename}")
        
        return jsonify({
            "success": True, 
            "report_path": report_filename 
        })
    except Exception as e:
        logger.error(f"[{request_id}] Erro crítico no processamento: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/check_layout', methods=['POST'])
def check_layout():
    """
    Verifica se o layout (template .docx) existe na pasta de layouts.
    """
    try:
        data = request.json or {}
        tests_list = data.get('tests', [])
        main_test = tests_list[0] if tests_list else "Padrao"
        
        layout_id_b64 = data.get('layout_id')
        if layout_id_b64:
            try:
                # Adiciona o padding que pode ser perdido na transferência
                layout_id_b64 += "=" * ((4 - len(layout_id_b64) % 4) % 4)
                layout_filename = base64.b64decode(layout_id_b64).decode('utf-8')
            except Exception as e:
                logger.error(f"Erro ao decodificar base64 em check_layout ({layout_id_b64}): {str(e)}")
                layout_filename = f"{main_test}.docx"
        else:
            layout_filename = f"{main_test}.docx"
        
        layout_path = os.path.join(LAYOUT_FOLDER, layout_filename)
        
        if not os.path.exists(layout_path):
            return jsonify({
                "success": False, 
                "error": "não há layout cadastrado para este Ensaio"
            }), 400
            
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Erro ao checar layout: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    # Executa a limpeza do sistema retendo apenas o arquivo sacado
    clean_temp_directories(keep_export_filename=filename)
    return send_from_directory(EXPORT_FOLDER, filename, as_attachment=True)

def get_windows_username():
    """Obtém o nome do usuário/máquina logado via PowerShell."""
    try:
        # PowerShell command para pegar o nome completo ou o USERNAME
        cmd = ["powershell", "-NoProfile", "-Command", "(Get-WmiObject -Class Win32_UserAccount -Filter \"Name='$env:USERNAME' and Domain='$env:USERDOMAIN'\").FullName"]
        
        # creationflags=subprocess.CREATE_NO_WINDOW (0x08000000) impede de abrir janela pop-up preta
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, creationflags=0x08000000)
        fullname = result.stdout.strip()
        
        if fullname:
            return fullname
            
        # Fallback de segurança caso fullname não exista
        cmd_fallback = ["powershell", "-NoProfile", "-Command", "$env:USERNAME"]
        res_fallback = subprocess.run(cmd_fallback, capture_output=True, text=True, check=True, creationflags=0x08000000)
        return res_fallback.stdout.strip() or "Engenheiro"
    except Exception as e:
        logger.error(f"Erro ao obter usuário via PowerShell: {str(e)}")
        return "Engenheiro"

@app.route('/api/user/info', methods=['GET'])
def get_user_info():
    username = get_windows_username()
    return jsonify({"name": username})

# --- INTERFACE DESKTOP (PyWebView) ---

class Api:
    """API exposta ao JavaScript via window.pywebview.api"""
    def getUserInfo(self):
        username = get_windows_username()
        return {"name": username}

    def processImages(self, data):
        # Este método pode ser usado para bypassar o Flask se desejar
        # Mas por enquanto mantemos a comunicação via HTTP para simplicidade
        logger.info(f"Processamento solicitado via WebView: {data['sector']}")
        return {"success": True, "message": "Use a API HTTP por enquanto."}

    def downloadReport(self, filename):
        """Abre o arquivo gerado diretamente no sistema operacional."""
        try:
            full_path = os.path.abspath(os.path.join(EXPORT_FOLDER, filename))
            if os.path.exists(full_path):
                # Executa a limpeza do sistema e de lixos temporários em upload
                clean_temp_directories(keep_export_filename=filename)
                os.startfile(full_path) # Comando específico Windows
                return {"success": True}
            return {"success": False, "error": "Arquivo não encontrado."}
        except Exception as e:
            logger.error(f"Erro ao abrir arquivo: {str(e)}")
            return {"success": False, "error": str(e)}

def run_flask():
    """Inicia o servidor Flask em uma thread separada."""
    # Desativamos o reloader para não travar a thread
    app.run(port=5000, debug=False, use_reloader=False)

if __name__ == "__main__":
    # 1. Inicia Flask em segundo plano
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    logger.info("Servidor Flask iniciado em segundo plano.")

    # 2. Configura a janela do PyWebView
    # Durante desenvolvimento, você pode mudar localhost:5000 para localhost:5173 para ver as mudanças do Vite em tempo real
    window_url = 'http://localhost:5173' # Padrão do Vite
    
    # Se o build existir, usa a porta do Flask
    if os.path.exists(app.static_folder):
        window_url = 'http://localhost:5000'
        logger.info("Frontend compilado encontrado. Usando servidor Flask.")
    else:
        logger.warning("Frontend 'dist' não encontrado. Tentando carregar do Vite (porta 5173).")

    api = Api()
    window = webview.create_window(
        "OCR automation for reports", 
        url=window_url, 
        js_api=api,
        width=1200,
        height=800,
        resizable=True,
        background_color='#ffffff'
    )

    # 3. Inicia o loop da interface desktop
    webview.start(debug=True)