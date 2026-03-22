import os
import logging
import threading
import subprocess
import base64
import uuid
from datetime import datetime
import webview
from flask import Flask, request, jsonify, send_from_directory, Response
import json
from flask_cors import CORS
from utils.logger_config import setup_logger
from utils.cleanup import clean_temp_directories
from utils.scheduler import start_cleanup_scheduler
from utils.validators import RequestPayload, validate_payload
from services.ocr_service import OCRService
from services.pdfExtract_service import PDFExtractService
from services.document_service import DocumentService
from services.excel_service import ExcelService
from werkzeug.utils import secure_filename
from utils.security import validate_file_shield, SecurityException


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
pdf_extract_service = PDFExtractService()
doc_service = DocumentService()
excel_service = ExcelService()

# --- API FLASK ---

from werkzeug.exceptions import HTTPException

@app.errorhandler(Exception)
def handle_global_exception(e):
    # Se for um erro HTTP controlado (como 404, 400 via abort), retorna ele mesmo
    if isinstance(e, HTTPException):
        return e

    """
    Capturador Global de Exceções.
    Garante que qualquer erro em rotas /api retorne uma interface amigável e segura,
    enquanto registra o erro técnico com severidade CRITICAL no log.
    """
    # Se for uma falha de segurança detectada pelo nosso interceptor
    if isinstance(e, SecurityException):
        logger.warning(f"Tentativa de upload malicioso bloqueada: {str(e)}")
        return jsonify({
            'success': False,
            'error_code': 'SEC_01',
            'message': str(e) # Passamos a mensagem de segurança explicitamente
        }), 403

    if request.path.startswith('/api'):
        # Loga com severidade CRITICAL e inclui o traceback completo para depuração interna
        logger.critical(f"Falha crítica em {request.path}: {str(e)}", exc_info=True)
        
        return jsonify({
            'success': False, 
            'error_code': 'SYS_01', 
            'message': 'Mensagem tratada e segura para humanos'
        }), 500
    
    # Se não for uma rota /api, apenas loga e retorna erro padrão
    logger.error(f"Erro inesperado fora da API: {str(e)}", exc_info=True)
    return "Erro interno do servidor", 500

@app.route('/')
def serve_frontend():
    """Serve o frontend React de 'dist' se existir, senão avisa."""
    if os.path.exists(app.static_folder):
        return send_from_directory(app.static_folder, 'index.html')
    return "Frontend não compilado. Rode 'npm run build' na pasta frontend ou use o Vite dev server (porta 5173)."

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend Flask rodando!"})

# Armazenamento em memória para estados dos jobs
jobs = {}

def run_pipeline_task(job_id, payload, file_paths, request_id, main_test):
    """
    Executa o pipeline completo em segundo plano e atualiza o dicionário 'jobs'.
    """
    try:
        jobs[job_id] = {'status': 'processing', 'progress': 5, 'message': 'Iniciando pipeline...'}
        
        # 0. Decodificação do Layout
        layout_id_b64 = payload.layout_id
        if layout_id_b64:
            try:
                clean_b64 = layout_id_b64.replace(" ", "").replace("\n", "").replace("\r", "")
                clean_b64 += "=" * ((4 - len(clean_b64) % 4) % 4)
                decoded_bytes = base64.b64decode(clean_b64)
                layout_filename = decoded_bytes.decode('utf-8', errors='ignore') or f"{main_test}.docx"
                if not layout_filename.endswith('.docx'):
                    layout_filename += '.docx'
            except Exception as e:
                logger.error(f"Erro ao decodificar base64 layout: {str(e)}")
                layout_filename = f"{main_test}.docx"
        else:
            layout_filename = f"{main_test}.docx"
            
        jobs[job_id].update({'progress': 10, 'message': f'Usando layout: {layout_filename}'})

        # 1. Triagem de Arquivos
        layout_path = os.path.join(LAYOUT_FOLDER, layout_filename)
        if not os.path.exists(layout_path):
            jobs[job_id] = {'status': 'error', 'error': 'Layout não encontrado no servidor.'}
            return

        ocr_target = payload.ocr_target
        ocr_paths = []
        excel_paths = []
        for p in file_paths:
            filename = os.path.basename(p)
            ext = p.split('.')[-1].lower()
            if ext in ['xlsx', 'xls']:
                excel_paths.append(p)
            elif ocr_target and filename == secure_filename(ocr_target):
                ocr_paths.append(p)
        
        normalized_layout = layout_filename.replace('.docx', '')
        extracted_data_results = {}

        # 2. Extração da Capa (Digital ou OCR)
        if len(ocr_paths) > 0:
            for p in ocr_paths:
                filename = os.path.basename(p)
                ext = p.split('.')[-1].lower()
                jobs[job_id].update({'progress': 20, 'message': f'Analisando Capa: {filename}'})
                
                success_digital = False
                if ext == 'pdf':
                    digital_results = pdf_extract_service.extract_data(p)
                    if "error" not in digital_results and any(v != "Não encontrado" for k, v in digital_results.items() if k != "full_text_raw"):
                        extracted_data_results[filename] = digital_results
                        success_digital = True
                        logger.info(f"[{request_id}] Sucesso na extração DIGITAL para: {filename}. OCR ignorado.")
                
                if not success_digital:
                    # Consome o generator do OCR
                    gen = ocr_service.process_batch([p], layout_name=normalized_layout)
                    while True:
                        try:
                            progress_info = next(gen)
                            jobs[job_id].update({
                                'progress': 20 + int(progress_info['progress'] * 0.45),
                                'message': progress_info['message']
                            })
                        except StopIteration as e:
                            extracted_data_results.update(e.value)
                            break
        
        jobs[job_id].update({'progress': 65, 'message': 'Extração de capa concluída.'})

        # 3. Extração de Dados do Excel
        if len(excel_paths) > 0:
            gen = excel_service.process_batch(excel_paths, layout_name=normalized_layout)
            while True:
                try:
                    msg = next(gen)
                    jobs[job_id].update({
                        'progress': 65 + int((msg['progress'] - 70) * 1.0), # Ajuste escala
                        'message': msg['message']
                    })
                except StopIteration as e:
                    extracted_data_results.update(e.value)
                    break
        
        jobs[job_id].update({'progress': 90, 'message': 'Gerando relatório Word...'})

        # 4. Geração do Relatório
        file_data_list = []
        for file_path in file_paths:
            name = os.path.basename(file_path)
            text = extracted_data_results.get(name, "")
            file_data_list.append({"filename": name, "text": text, "path": file_path})

        report_filename = f"Relatorio_{main_test.replace(' ', '_')}_{request_id}.docx"
        doc_service.generate_report(
            file_data=file_data_list, 
            filename=report_filename, 
            layout_name=layout_filename.replace('.docx', '')
        )
        
        # Conclusão
        jobs[job_id] = {
            'status': 'completed', 
            'progress': 100, 
            'message': 'Relatório gerado com sucesso!',
            'report_path': report_filename
        }
        logger.info(f"[{request_id}] Pipeline finalizado com sucesso para Job ID: {job_id}")

    except Exception as e:
        logger.error(f"Erro crítico no Job {job_id}: {str(e)}", exc_info=True)
        jobs[job_id] = {
            'status': 'error', 
            'error': str(e)
        }

@app.route('/api/process', methods=['POST'])
def process_documents():
    """
    Endpoint assíncrono que inicia o processamento em background.
    """
    payload = validate_payload(RequestPayload)
    request_id = datetime.now().strftime("%H%M%S")
    job_id = str(uuid.uuid4())[:8] # Job ID curto para fácil acompanhamento
    
    if 'files' not in request.files:
        return jsonify({"success": False, "error": "Nenhum arquivo enviado"}), 400
    
    files = request.files.getlist('files')
    tests_list = payload.tests
    main_test = str(tests_list[0]) if tests_list else "Padrao"
    main_test = main_test.replace('[', '').replace(']', '').replace('"', '').replace("'", "")

    # Validação Blindada de Segurança (MIME Sanitization)
    for file in files:
        if file.filename == '': continue
        # Intercepta o Buffer em Bytes na subida primária
        validate_file_shield(file)

    # Salva arquivos fisicamente antes de iniciar a thread
    file_paths = []
    for file in files:
        if file.filename == '': continue
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        file_paths.append(file_path)

    # Inicia processamento em thread separada
    thread = threading.Thread(
        target=run_pipeline_task, 
        args=(job_id, payload, file_paths, request_id, main_test)
    )
    thread.start()

    logger.info(f"[{request_id}] Job {job_id} enfileirado com sucesso.")
    return jsonify({
        "success": True, 
        "job_id": job_id,
        "status": "queued"
    })

@app.route('/api/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """
    Consulta o status de um processamento em background.
    """
    job_info = jobs.get(job_id)
    if not job_info:
        return jsonify({"success": False, "error": "Job ID não encontrado"}), 404
        
    return jsonify(job_info)

@app.route('/api/check_layout', methods=['POST'])
def check_layout():
    """
    Verifica se o layout (template .docx) existe na pasta de layouts.
    """
    data = request.json or {}
    tests_list = data.get('tests', [])
    main_test = tests_list[0] if tests_list else "Padrao"
    
    layout_id_b64 = data.get('layout_id')
    if layout_id_b64:
        try:
            # Limpeza e Padding
            layout_id_b64 = layout_id_b64.replace(" ", "").replace("\n", "").replace("\r", "")
            layout_id_b64 += "=" * ((4 - len(layout_id_b64) % 4) % 4)
            
            # Decodificação resiliente
            decoded_bytes = base64.b64decode(layout_id_b64)
            try:
                layout_filename = decoded_bytes.decode('utf-8')
            except UnicodeDecodeError:
                layout_filename = decoded_bytes.decode('iso-8859-1')
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

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    # Executa a limpeza do sistema retendo apenas o arquivo sacado
    clean_temp_directories(keep_export_filename=filename)
    return send_from_directory(EXPORT_FOLDER, filename, as_attachment=True)

def get_windows_profile_picture():
    """Obtém a foto de perfil do usuário logado via PowerShell/Registry do Windows 10/11."""
    try:
        # Pega a foto de perfil de resolução 240px no cache do Registry
        cmd = [
            "powershell", "-NoProfile", "-Command",
            "(Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AccountPicture\\Users\\*' | Select-Object -ExpandProperty Image240 -ErrorAction SilentlyContinue) | Select-Object -First 1"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, creationflags=0x08000000)
        img_path = result.stdout.strip()
        
        if img_path and os.path.exists(img_path):
            with open(img_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_string}"
    except Exception as e:
        logger.error(f"Erro ao obter foto de perfil: {str(e)}")
    return None

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
    picture = get_windows_profile_picture()
    return jsonify({"name": username, "picture": picture})

# --- CLASSES DE EXCEÇÃO ---

class AppException(Exception):
    """Exceção base para erros controlados da aplicação."""
    def __init__(self, message, error_code="SYS_01"):
        super().__init__(message)
        self.error_code = error_code
        self.message = message

# --- INTERFACE DESKTOP (PyWebView) ---

class Api:
    """API exposta ao JavaScript via window.pywebview.api"""
    def getUserInfo(self):
        username = get_windows_username()
        picture = get_windows_profile_picture()
        return {"name": username, "picture": picture}

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
            # Relançamos para o Error Handler Global capturar nas rotas de API
            # ou registramos aqui se for chamado internamente
            raise e

    def getSettings(self):
        """Lê as configurações do arquivo JSON."""
        try:
            # Caminho de persistência (tenta na lib do frontend primeiro, se não existir usa storage)
            settings_path = os.path.abspath("../frontend/src/lib/user_settings.json")
            if not os.path.exists(settings_path):
                settings_path = os.path.abspath("storage/user_settings.json")
            
            if os.path.exists(settings_path):
                import json
                with open(settings_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {"theme": "light"} # Default
        except Exception as e:
            logger.error(f"Erro ao ler configurações: {str(e)}")
            return {"theme": "light"} # Silencioso para não quebrar a UI

    def saveSettings(self, settings):
        """Salva as configurações no arquivo JSON."""
        try:
            # Garante que as configurações persistam em storage/
            settings_path = os.path.abspath("storage/user_settings.json")
            
            # Também tenta atualizar na pasta lib do frontend para dev
            dev_path = os.path.abspath("../frontend/src/lib/user_settings.json")
            
            import json
            for path in [settings_path, dev_path]:
                try:
                    # Cria diretórios se necessário (especialmente para storage/)
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    with open(path, 'w', encoding='utf-8') as f:
                        json.dump(settings, f, indent=2, ensure_ascii=False)
                except:
                    continue
                    
        except Exception as e:
            # Relançamos para garantir que a API retorne o erro SYS_01 unificado
            raise e

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    api_instance = Api()
    if request.method == 'GET':
        return jsonify(api_instance.getSettings())
    else:
        data = request.json
        res = api_instance.saveSettings(data)
        return jsonify(res)

def run_flask():
    """Inicia o servidor Flask em uma thread separada."""
    # Desativamos o reloader para não travar a thread
    app.run(port=5000, debug=False, use_reloader=False)

if __name__ == "__main__":
    # 0. Inicia o agendador de limpeza em background (Gestão de Ciclo de Vida)
    start_cleanup_scheduler()

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
        "Automation Project", 
        url=window_url, 
        js_api=api,
        width=1280,
        height=1000,
        resizable=True,
        background_color='#F5F5F7'
    )

    # 3. Inicia o loop da interface desktop
    webview.start(debug=True)