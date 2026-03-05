import os
import logging
import threading
from datetime import datetime
import webview
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from utils.logger_config import setup_logger
from services.ocr_service import OCRService
from services.document_service import DocumentService
from werkzeug.utils import secure_filename

# Configuração inicial de Logs e Pastas
logger = setup_logger()

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app)

UPLOAD_FOLDER = 'storage/uploads'
EXPORT_FOLDER = 'storage/exports'

def init_project():
    """Garante que as pastas necessárias existam antes de começar."""
    directories = [UPLOAD_FOLDER, EXPORT_FOLDER, 'logs']
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

        # Usaremos o primeiro teste selecionado como nome para o layout
        main_test = tests_list[0] if tests_list else "Padrao"
        
        logger.info(f"[{request_id}] Setor: {sector} | Teste Principal: {main_test} | Arquivos: {len(files)}")
        
        file_paths = []
        for file in files:
            if file.filename == '': continue
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            file_paths.append(file_path)
            logger.info(f"[{request_id}] Arquivo salvo: {filename}")

        # Execução do OCR
        ocr_results = ocr_service.process_batch(file_paths)
        
        # Consolidação do texto
        consolidated_text = ""
        for name, text in ocr_results.items():
            consolidated_text += f"\n--- {name} ---\n{text}\n"

        # Geração do Relatório usando Layout
        report_filename = f"Relatorio_{main_test.replace(' ', '_')}_{request_id}.docx"
        
        # O layout deve ter o mesmo nome da opção selecionada (ex: "Bluetooth Low Energy.docx")
        output_path = doc_service.generate_report(
            consolidated_text, 
            filename=report_filename, 
            layout_name=main_test
        )
        
        logger.info(f"[{request_id}] Sucesso! Relatório gerado com layout '{main_test}': {report_filename}")
        
        return jsonify({
            "success": True, 
            "report_path": report_filename 
        })
    except Exception as e:
        logger.error(f"[{request_id}] Erro crítico no processamento: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(EXPORT_FOLDER, filename, as_attachment=True)

@app.route('/api/user/info', methods=['GET'])
def get_user_info():
    return jsonify({"name": "Engenheiro de Ensaios"})

# --- INTERFACE DESKTOP (PyWebView) ---

class Api:
    """API exposta ao JavaScript via window.pywebview.api"""
    def getUserInfo(self):
        return {"name": "Engenheiro de Ensaios (Desktop)"}

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
        'Automação de Laudos OCR', 
        url=window_url, 
        js_api=api,
        width=1200,
        height=800,
        resizable=True,
        background_color='#ffffff'
    )

    # 3. Inicia o loop da interface desktop
    webview.start(debug=True)