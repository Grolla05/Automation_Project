import os
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
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    # Pastas de dados - Aderência ao Factor III (Config)
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join("storage", "uploads"))
    EXPORT_FOLDER = os.environ.get("EXPORT_FOLDER", os.path.join("storage", "exports"))
    LAYOUT_FOLDER = os.environ.get("LAYOUT_FOLDER", os.path.join("storage", "layout"))
    
    # Configurações de UI
    UI_WIDTH = int(os.environ.get("UI_WIDTH", 1280))
    UI_HEIGHT = int(os.environ.get("UI_HEIGHT", 1000))
    FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))

    @classmethod
    def get_all_directories(cls):
        """Retorna lista de diretórios que precisam ser criados no startup."""
        return [cls.UPLOAD_FOLDER, cls.EXPORT_FOLDER, cls.LAYOUT_FOLDER, cls.LOGS_FOLDER]

    def __repr__(self):
        return f"<Config: {self.APP_NAME} ({self.ENV}) Port:{self.HTTP_PORT}>"

# Instância única para importação em todo o projeto
config = Config()
