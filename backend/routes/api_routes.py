import os
import uuid
import base64
import threading
from datetime import datetime
from flask_restx import Namespace, Resource
from flask import request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

from services import services
from utils.logger_config import setup_logger
from utils.validators import RequestPayload, validate_payload
from utils.security import validate_file_shield
from utils.cleanup import clean_temp_directories
from utils.file_handler import FileHandler
from config_loader import config

logger = setup_logger()
api_ns = Namespace('api', description='Operações principais de processamento OCR', path='/')

# Instância única para utilitários de arquivos
file_handler = FileHandler()

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

        # 1. Identificação de Tags e Categorização
        # Gera o mapeamento inteligente nome_arquivo -> [tag] ou nome_seguro
        tag_mapping = file_handler.map_files_to_tags(file_paths)
        
        ocr_target = payload.ocr_target
        capa_path = None
        excel_paths = []
        outras_imagens = []

        for p in file_paths:
            filename = os.path.basename(p)
            ext = p.split('.')[-1].lower()
            
            # Caso 1: Arquivo é o designado pelo frontend como a CAPA (PDF ou Imagem para OCR)
            if ocr_target and filename == secure_filename(ocr_target):
                capa_path = p
                logger.info(f"[{job_id}] CAPA Identificada: {filename}")
            
            # Caso 2: Arquivo Excel de registro de ensaios
            elif ext in ['xlsx', 'xls']:
                excel_paths.append(p)
                logger.info(f"[{job_id}] EXCEL Identificado: {filename}")
            
            # Caso 3: Imagens adicionais para o corpo do relatório
            elif ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp']:
                outras_imagens.append(p)
                logger.debug(f"[{job_id}] IMAGEM identificada: {filename} (Final Tag: {tag_mapping.get(filename)})")

        normalized_layout = layout_filename.replace('.docx', '')
        extracted_data_results = {}

        # 2. Processamento da CAPA (Fluxo Condicional: Extração Digital -> OCR Fallback)
        if capa_path:
            filename = os.path.basename(capa_path)
            ext = filename.split('.')[-1].lower()
            jobs[job_id].update({'progress': 20, 'message': f'Analisando Capa: {filename}'})
            
            success_digital = False
            # Tentativa 1: Extração Digital (se for PDF)
            if ext == 'pdf':
                logger.info(f"[{job_id}] Tentando extração digital em {filename}...")
                digital_results = services.pdf_extract_service.extract_data(capa_path)
                
                # Valida se a extração digital obteve dados significativos
                if "error" not in digital_results and any(v != "Não encontrado" for k, v in digital_results.items() if k != "full_text_raw"):
                    extracted_data_results[filename] = digital_results
                    success_digital = True
                    logger.info(f"[{job_id}] Sucesso na extração DIGITAL para {filename}. Ignorando OCR.")

            # Tentativa 2: OCR (se falhou a digital ou se for IMAGEM diretamente)
            if not success_digital:
                if ext == 'pdf':
                    logger.warning(f"[{job_id}] Extração digital falhou em {filename}. Iniciando Fallback OCR...")
                else:
                    logger.info(f"[{job_id}] Iniciando processamento OCR na Capa (Imagem)...")
                
                gen = services.ocr_service.process_batch([capa_path], layout_name=normalized_layout)
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

        # 3. Processamento de Arquivos EXCEL
        if len(excel_paths) > 0:
            logger.info(f"[{job_id}] Iniciando extração de dados do Excel ({len(excel_paths)} arquivos)...")
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
            # Usa o nome mapeado (Tag) se existir, senão usa o nome seguro do arquivo
            tag_name = tag_mapping.get(name, name)
            text = extracted_data_results.get(name, "")
            file_data_list.append({"filename": tag_name, "text": text, "path": file_path})

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

@api_ns.route('/health')
class HealthCheck(Resource):
    def get(self):
        """Verifica se o backend está rodando"""
        return {"status": "ok", "message": "Backend Flask rodando!"}

@api_ns.route('/process')
class ProcessDocuments(Resource):
    def post(self):
        """Inicia o processamento de documentos"""
        payload = validate_payload(RequestPayload)
        request_id = datetime.now().strftime("%H%M%S")
        job_id = str(uuid.uuid4())[:8]
        
        if 'files' not in request.files:
            return {"success": False, "error": "Nenhum arquivo enviado"}, 400
        
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

        return {"success": True, "job_id": job_id, "status": "queued"}

@api_ns.route('/status/<string:job_id>')
class JobStatus(Resource):
    def get(self, job_id):
        """Consulta o status de um job de processamento"""
        job_info = jobs.get(job_id)
        if not job_info:
            return {"success": False, "error": "Job ID não encontrado"}, 404
        return job_info

@api_ns.route('/check_layout')
class CheckLayout(Resource):
    def post(self):
        """Verifica a existência de um layout no servidor"""
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
            return {"success": False, "error": "layout não encontrado"}, 400
            
        return {"success": True}

@api_ns.route('/download/<string:filename>')
class DownloadFile(Resource):
    def get(self, filename):
        """Baixa um relatório gerado"""
        clean_temp_directories(keep_export_filename=filename)
        return send_from_directory(EXPORT_FOLDER, filename, as_attachment=True)
