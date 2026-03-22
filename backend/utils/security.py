import os
import logging
import magic
from typing import List, Optional

logger = logging.getLogger(__name__)

# Configuração de tipos MIME permitidos por extensão real (mapeamento de segurança)
# Isso ignora o que o usuário diz que a extensão é (.filename.endswith)
# e foca no que o Buffer realmente contém via Magic Number (MIME Header Peek).
ALLOWED_MIME_TYPES = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'text/plain': ['.txt', '.csv'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
}

# Assinaturas conhecidas (Magic Numbers) como fallback nativo (Native Header Peek)
# Útil se libmagic falhar ou para uma segunda camada de validação ultra-rápida.
NATIVE_HEADERS = {
    b'%PDF': 'application/pdf',
    b'PK\x03\x04': 'application/zip', # DOCX/XLSX são ZIPs internamente
    b'MZ': 'application/x-msdos-program', # EXE / DLL
}

class SecurityException(Exception):
    """Exceção levantada quando um arquivo malicioso ou disfarçado é detectado."""
    def __init__(self, message, filename=None):
        self.message = message
        self.filename = filename
        super().__init__(self.message)

def get_mime_from_buffer(buffer: bytes) -> str:
    """
    Identifica o MIME Type real lendo os primeiros bytes do buffer.
    Usa python-magic (libmagic) com fallback para Native Header Peek.
    """
    try:
        # Tenta usar libmagic (Absolute Library)
        # O buffer é lido na subida primária (primeiros 2048 bytes são suficientes)
        mime = magic.from_buffer(buffer[:2048], mime=True)
        return mime
    except Exception as e:
        logger.warning(f"libmagic não disponível ou falhou: {str(e)}. Usando Native Header Peek.")
        
        # Fallback: Native Header Peek (Assinaturas Binárias)
        for header, mime in NATIVE_HEADERS.items():
            if buffer.startswith(header):
                return mime
        
        return "application/octet-stream"

def validate_file_shield(file_storage, allowed_extensions: Optional[List[str]] = None):
    """
    Função Blindada de Segurança (MIME Sanitization).
    
    1. Lê o buffer inicial do arquivo sem salvar no disco (Subida Primária).
    2. Identifica o MIME real via Header Peek.
    3. Detecta se houve renomeação maliciosa (ex: .exe -> .pdf).
    4. Estoura exceção imediata de Segurança se houver discrepância.
    """
    filename = file_storage.filename
    original_ext = os.path.splitext(filename)[1].lower()
    
    # Lê os primeiros bytes para análise de segurança
    # Importante: Mantemos o ponteiro do stream para que o salvamento posterior funcione
    header_buffer = file_storage.read(2048)
    file_storage.seek(0) # Volta o ponteiro para o início para não corromper o arquivo
    
    actual_mime = get_mime_from_buffer(header_buffer)
    
    # REGRA DE OURO: Se o MIME indicar um Executável, estoure imediatamente, indiferente da extensão.
    if actual_mime == 'application/x-msdos-program' or header_buffer.startswith(b'MZ'):
        logger.critical(f"ALERTA DE SEGURANÇA: Arquivo binário detectado! Filename: {filename}")
        raise SecurityException(f"Ameaça detectada: O arquivo '{filename}' contém código executável oculto.", filename)

    # Validação Cruzada: O que o arquivo DIZ ser vs o que ele REALMENTE É.
    # Se o arquivo diz que é .pdf (via extensão) mas o buffer diz que não é, bloqueamos.
    if actual_mime in ALLOWED_MIME_TYPES:
        valid_exts = ALLOWED_MIME_TYPES[actual_mime]
        if original_ext not in valid_exts:
            logger.warning(f"Inconsistência de Segurança: Extensão {original_ext} não condiz com MIME {actual_mime}")
            raise SecurityException(f"Segurança Violada: O arquivo '{filename}' parece estar disfarçado (MIME {actual_mime} vs Ext {original_ext}).")
    
    # Se uma lista de extensões permitidas foi passada, valida o MIME contra ela
    if allowed_extensions:
        allowed_mimes = [m for m, exts in ALLOWED_MIME_TYPES.items() if any(e in allowed_extensions for e in exts)]
        if actual_mime not in allowed_mimes:
             raise SecurityException(f"Tipo de arquivo não permitido: {actual_mime}")

    logger.info(f"Arquivo '{filename}' validado e sanitizado (MIME: {actual_mime})")
    return True
