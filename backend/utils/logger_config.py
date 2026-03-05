import logging
import os
from datetime import datetime

def setup_logger():
    """
    Configura o sistema de logs da aplicação.
    Gera um arquivo por dia no formato logs/YYYY-MM-DD.log.
    """
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
        
    # Gera o nome do arquivo baseado na data de execução
    current_date = datetime.now().strftime("%Y-%m-%d")
    log_filename = f"{current_date}.log"
    log_path = os.path.join(log_dir, log_filename)
    
    # Obtém o logger principal
    logger = logging.getLogger('ocr_automation')
    
    # Se o logger já tiver handlers, não adiciona novamente (evita duplicação de logs)
    if logger.hasHandlers():
        return logger
        
    logger.setLevel(logging.INFO)
    
    # --- FORMATAÇÃO PREMIUM ---
    # [Timestamp] | Nível | Módulo | Mensagem
    log_format = logging.Formatter(
        fmt='[%(asctime)s] | %(levelname)-8s | %(name)-14s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler para o ARQUIVO (logs/YYYY-MM-DD.log)
    file_handler = logging.FileHandler(log_path, encoding='utf-8')
    file_handler.setFormatter(log_format)
    file_handler.setLevel(logging.INFO)
    
    # Handler para o CONSOLE (Terminal)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_format)
    console_handler.setLevel(logging.INFO)
    
    # Adiciona os handlers ao logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Log de inicialização do sistema de log
    logger.info("="*60)
    logger.info(f"SESSÃO INICIADA EM: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    logger.info(f"ARQUIVO DE LOG: {log_path}")
    logger.info("="*60)
    
    return logger
