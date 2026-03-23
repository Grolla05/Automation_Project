import os
import uuid
import base64
import threading
from datetime import datetime
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from services import services
from utils.logger_config import setup_logger
from utils.validators import RequestPayload, validate_payload
from utils.security import validate_file_shield
from utils.cleanup import clean_temp_directories
from config_loader import config

logger = setup_logger()
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Configuração de Pastas via Config Loader (12-Factor App)
UPLOAD_FOLDER = config.UPLOAD_FOLDER
EXPORT_FOLDER = config.EXPORT_FOLDER
LAYOUT_FOLDER = config.LAYOUT_FOLDER

# Armazenamento em memória para estados dos jobs
jobs = {}

def run_pipeline_task(job_id, payload, file_paths, request_id, main_test):
    """Executa o pipeline completo em segundo plano."""
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

        # 2. Extração da Capa
        if len(ocr_paths) > 0:
            for p in ocr_paths:
                filename = os.path.basename(p)
                ext = p.split('.')[-1].lower()
                jobs[job_id].update({'progress': 20, 'message': f'Analisando Capa: {filename}'})
                
                success_digital = False
                if ext == 'pdf':
                    digital_results = services.pdf_extract_service.extract_data(p)
                    if "error" not in digital_results and any(v != "Não encontrado" for k, v in digital_results.items() if k != "full_text_raw"):
                        extracted_data_results[filename] = digital_results
                        success_digital = True
                
                if not success_digital:
                    gen = services.ocr_service.process_batch([p], layout_name=normalized_layout)
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
            gen = services.excel_service.process_batch(excel_paths, layout_name=normalized_layout)
            while True:
                try:
                    msg = next(gen)
                    jobs[job_id].update({
                        'progress': 65 + int((msg['progress'] - 70) * 1.0),
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
        services.doc_service.generate_report(
            file_data=file_data_list, 
            filename=report_filename, 
            layout_name=layout_filename.replace('.docx', '')
        )
        
        jobs[job_id] = {
            'status': 'completed', 
            'progress': 100, 
            'message': 'Relatório gerado com sucesso!',
            'report_path': report_filename
        }

    except Exception as e:
        logger.error(f"Erro crítico no Job {job_id}: {str(e)}", exc_info=True)
        jobs[job_id] = {'status': 'error', 'error': str(e)}

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend Flask rodando!"})

@api_bp.route('/process', methods=['POST'])
def process_documents():
    payload = validate_payload(RequestPayload)
    request_id = datetime.now().strftime("%H%M%S")
    job_id = str(uuid.uuid4())[:8]
    
    if 'files' not in request.files:
        return jsonify({"success": False, "error": "Nenhum arquivo enviado"}), 400
    
    files = request.files.getlist('files')
    tests_list = payload.tests
    main_test = str(tests_list[0]) if tests_list else "Padrao"
    main_test = main_test.replace('[', '').replace(']', '').replace('"', '').replace("'", "")

    for file in files:
        if file.filename == '': continue
        validate_file_shield(file)

    file_paths = []
    for file in files:
        if file.filename == '': continue
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        file_paths.append(file_path)

    thread = threading.Thread(
        target=run_pipeline_task, 
        args=(job_id, payload, file_paths, request_id, main_test)
    )
    thread.start()

    return jsonify({"success": True, "job_id": job_id, "status": "queued"})

@api_bp.route('/status/<job_id>', methods=['GET'])
def get_job_status(job_id):
    job_info = jobs.get(job_id)
    if not job_info:
        return jsonify({"success": False, "error": "Job ID não encontrado"}), 404
    return jsonify(job_info)

@api_bp.route('/check_layout', methods=['POST'])
def check_layout():
    data = request.json or {}
    tests_list = data.get('tests', [])
    main_test = tests_list[0] if tests_list else "Padrao"
    
    layout_id_b64 = data.get('layout_id')
    if layout_id_b64:
        try:
            layout_id_b64 = layout_id_b64.replace(" ", "").replace("\n", "").replace("\r", "")
            layout_id_b64 += "=" * ((4 - len(layout_id_b64) % 4) % 4)
            decoded_bytes = base64.b64decode(layout_id_b64)
            try:
                layout_filename = decoded_bytes.decode('utf-8')
            except UnicodeDecodeError:
                layout_filename = decoded_bytes.decode('iso-8859-1')
        except Exception as e:
            logger.error(f"Erro ao decodificar base64: {str(e)}")
            layout_filename = f"{main_test}.docx"
    else:
        layout_filename = f"{main_test}.docx"
    
    layout_path = os.path.join(LAYOUT_FOLDER, layout_filename)
    if not os.path.exists(layout_path):
        return jsonify({"success": False, "error": "layout não encontrado"}), 400
        
    return jsonify({"success": True})

@api_bp.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    clean_temp_directories(keep_export_filename=filename)
    return send_from_directory(EXPORT_FOLDER, filename, as_attachment=True)
