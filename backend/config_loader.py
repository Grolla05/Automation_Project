import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 12-Factor App: Configurações via Environment (.env ou variáveis do sistema)
# Carrega o arquivo .env se ele existir no diretório raiz ou diretório pai
load_dotenv()

class Config:
    """
    Gerenciador agnóstico de configurações baseadas em variáveis de ambiente.
    Implementa fallbacks seguros para garantir operacionalidade em qualquer ambiente.
    """
    
    # 0. Detecção de Ambiente (Frozen vs Script)
    # No PyInstaller, sys.frozen é True e sys._MEIPASS aponta para a pasta temporária
    _FROZEN = getattr(sys, 'frozen', False)
    _ROOT_DIR = sys._MEIPASS if _FROZEN else os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    # 1. Informações Básicas do App
    APP_NAME = os.environ.get("APP_NAME", "OCR_Automation")
    ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = os.environ.get("DEBUG", "True").lower() == "true"
    
    # 2. Configurações de Rede
    HTTP_PORT = int(os.environ.get("HTTP_PORT", 5000))
    HTTP_HOST = os.environ.get("HTTP_HOST", "127.0.0.1") # 127.0.0.1 é mais seguro para desktop local
    
    # 3. Gestão de Logs
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "DEBUG" if DEBUG else "INFO").upper()
    LOGS_FOLDER = os.environ.get("LOGS_FOLDER", "logs")

    # 4. Segurança & Senhas
    # Suporta múltiplas senhas separadas por vírgula
    _raw_passwords = os.environ.get("ASE_EXCEL_PASSWORD", "")
    ASE_EXCEL_PASSWORDS = [p.strip() for p in _raw_passwords.split(",") if p.strip()]
    
    # 5. Storage & Caminhos (Resolvidos dinamicamente)
    # Se estiver rodando como EXE, o armazenamento deve ser externo para persistir dados
    # Se for script, usa a estrutura do projeto
    BASE_DIR = Path(_ROOT_DIR)
    
    # Pastas de dados - Para o executável, preferimos caminhos absolutos fora do temp se possível
    # Mas para o funcionamento interno do app (como layouts de template), usamos o internal
    internal_storage = os.path.join(_ROOT_DIR, "storage") if _FROZEN else os.path.join(_ROOT_DIR, "backend", "storage")
    
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(internal_storage, "uploads"))
    EXPORT_FOLDER = os.environ.get("EXPORT_FOLDER", os.path.join(internal_storage, "exports"))
    LAYOUT_FOLDER = os.environ.get("LAYOUT_FOLDER", os.path.join(internal_storage, "layout"))
    
    # Configurações de UI
    UI_WIDTH = int(os.environ.get("UI_WIDTH", 1280))
    UI_HEIGHT = int(os.environ.get("UI_HEIGHT", 1000))
    
    # Caminho do Frontend ajustado para EXE vs DEV
    if _FROZEN:
        FRONTEND_DIST = os.path.abspath(os.path.join(_ROOT_DIR, 'frontend', 'dist'))
    else:
        FRONTEND_DIST = os.path.abspath(os.path.join(_ROOT_DIR, 'frontend', 'dist'))

    @classmethod
    def get_all_directories(cls):
        """Retorna lista de diretórios que precisam ser criados no startup."""
        return [cls.UPLOAD_FOLDER, cls.EXPORT_FOLDER, cls.LAYOUT_FOLDER, cls.LOGS_FOLDER]

    def __repr__(self):
        return f"<Config: {self.APP_NAME} ({self.ENV}) Port:{self.HTTP_PORT}>"

# Instância única para importação em todo o projeto
config = Config()
