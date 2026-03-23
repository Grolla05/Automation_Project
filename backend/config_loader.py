import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega o arquivo .env se ele existir (Aderência ao 12-Factor: Configurações via Environment)
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
    HTTP_HOST = os.environ.get("HTTP_HOST", "0.0.0.0")
    
    # 3. Gestão de Logs
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper() # DEBUG, INFO, WARNING, ERROR, CRITICAL
    
    # 4. Storage & Caminhos (Resolvidos dinamicamente)
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join("storage", "uploads"))
    EXPORT_FOLDER = os.environ.get("EXPORT_FOLDER", os.path.join("storage", "exports"))
    LAYOUT_FOLDER = os.environ.get("LAYOUT_FOLDER", os.path.join("storage", "layout"))
    LOGS_FOLDER = os.environ.get("LOGS_FOLDER", "logs")
    
    # 5. Segurança (Opcional - Removido se não houver sessões Flask)

    @classmethod
    def get_all_directories(cls):
        """Retorna lista de diretórios que precisam ser criados no startup."""
        return [cls.UPLOAD_FOLDER, cls.EXPORT_FOLDER, cls.LAYOUT_FOLDER, cls.LOGS_FOLDER]

config = Config()
