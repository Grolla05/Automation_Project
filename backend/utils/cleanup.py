import os
from utils.logger_config import setup_logger

logger = setup_logger()

def clean_temp_directories(keep_export_filename=None):
    """
    Remove todos os arquivos da pasta de uploads.
    Remove todos os arquivos da pasta de exports exceto o relatório atual.
    
    Args:
        keep_export_filename (str): Nome do arquivo que não deve ser apagado (relatório recém gerado).
    """
    upload_dir = 'storage/uploads'
    export_dir = 'storage/exports'

    try:
        # 1. Limpando a pasta de Uploads completamente
        if os.path.exists(upload_dir):
            for file_name in os.listdir(upload_dir):
                file_path = os.path.join(upload_dir, file_name)
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                except Exception as e:
                    logger.warning(f"Não foi possível apagar arquivo temporário de upload {file_name}: {str(e)}")

        # 2. Limpando a pasta de Exports (Mantendo apenas o arquivo atual)
        if os.path.exists(export_dir):
            for file_name in os.listdir(export_dir):
                # Ignora a deleção caso seja o arquivo do relatório da sessão atual
                if keep_export_filename and file_name == keep_export_filename:
                    continue
                
                file_path = os.path.join(export_dir, file_name)
                try:
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                except Exception as e:
                    logger.warning(f"Não foi possível apagar relatório antigo {file_name}: {str(e)}")
                    
        logger.info(f"Rotina de auto-limpeza concluída. Pasta limpa. Relatório mantido: {keep_export_filename}")
        
    except Exception as e:
        logger.error(f"Falha ao executar rotina de limpeza de diretórios: {str(e)}")
