import logging
import os
import gzip
import shutil
import queue
from datetime import datetime
from logging.handlers import RotatingFileHandler, QueueHandler, QueueListener
from config_loader import config

# --- CONFIGURAÇÕES DE ARQUITETURA ---
LOG_DIR = config.LOGS_FOLDER
MAX_BYTES = 10 * 1024 * 1024  # 10MB
BACKUP_COUNT = 5
CONSOLE_LEVEL = getattr(logging, config.LOG_LEVEL, logging.INFO)
FILE_LEVEL = logging.DEBUG      # Volume massivo para o disco

def namer(name):
    """Callback para definir o nome do arquivo rotacionado com extensão .gz"""
    return name + ".gz"

def rotator(source, dest):
    """
    Callback para comprimir o arquivo de log durante a rotação.
    Nota: Como estamos usando QueueListener, esta operação ocorre na thread 
    do listener, não bloqueando a execução principal do software.
    """
    with open(source, 'rb') as f_in:
        with gzip.open(dest, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    os.remove(source)

def setup_logger():
    """
    Configura o sistema de logging com padrão industrial:
    1. RotatingFileHandler para limite de espaço e backups.
    2. Compressão Gzip automática.
    3. QueueHandler para processamento assíncrono (Non-blocking).
    4. Separação de verbosidade entre Console e Arquivo.
    """
    log_dir = LOG_DIR
    if not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    current_date = datetime.now().strftime("%Y-%m-%d")
    log_filename = f"{current_date}.log"
    log_path = os.path.join(log_dir, log_filename)
    
    # Obtém o logger principal
    logger = logging.getLogger('ocr_automation')
    
    # Evita re-configuração se handlers já existirem
    if logger.hasHandlers():
        return logger
        
    # O logger raiz deve aceitar o nível mais baixo (DEBUG) 
    # para que os handlers possam filtrar individualmente
    logger.setLevel(logging.DEBUG)
    
    # --- FORMATADORES PREMIUM ---
    # Formato Detalhado (Arquivo): Inclui Thread, Módulo e Linha para Debug massivo
    file_format = logging.Formatter(
        fmt='[%(asctime)s] | %(levelname)-8s | [%(threadName)s] | %(name)s:%(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Formato Minimalista (Console): Apenas mensagem e nível para manter o output limpo
    console_format = logging.Formatter(
        fmt='%(levelname)s: %(message)s'
    )
    
    # --- HANDLERS REAIS (BACKEND) ---
    
    # Handler para Arquivo com Rotação e Compressão
    file_handler = RotatingFileHandler(
        log_path, 
        maxBytes=MAX_BYTES, 
        backupCount=BACKUP_COUNT, 
        encoding='utf-8'
    )
    file_handler.setFormatter(file_format)
    file_handler.setLevel(FILE_LEVEL)
    
    # Atribui callbacks de compressão
    file_handler.namer = namer
    file_handler.rotator = rotator
    
    # Handler para Console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(console_format)
    console_handler.setLevel(CONSOLE_LEVEL)
    
    # --- ARQUITETURA ASSÍNCRONA ---
    # Cria uma fila para desacoplar a thread principal do I/O de disco e compressão
    log_queue = queue.Queue(-1)
    
    # Handler que a aplicação usará (apenas coloca na fila)
    queue_handler = QueueHandler(log_queue)
    logger.addHandler(queue_handler)
    
    # Listener que retira da fila e envia para os destinos reais
    # respect_handler_level=True garante que o nível INFO do console seja respeitado
    listener = QueueListener(log_queue, file_handler, console_handler, respect_handler_level=True)
    listener.start()
    
    # Mensagem de Inicialização Técnica
    logger.info("="*80)
    logger.info(f"SISTEMA DE LOG INTEGRADO - {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    logger.info(f"ARQUIVO: {log_path} (Rotativo 10MB | Compression: GZ)")
    logger.info("="*80)
    
    return logger
