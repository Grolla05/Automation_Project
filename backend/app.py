import os
import threading
import webview
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from routes.api_routes import api_bp
from routes.system_routes import system_bp, get_windows_username, get_windows_profile_picture
from utils.logger_config import setup_logger
from utils.scheduler import start_cleanup_scheduler
from utils.security import SecurityException
from flask_restx import Api
from config_loader import config

logger = setup_logger()

def create_app():
    app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
    CORS(app)

    # Configuração do Swagger (Flask-RESTX)
    api = Api(app, 
        version='1.0', 
        title=f'{config.APP_NAME} API',
        description='Documentação automática das rotas do sistema de automação OCR',
        doc='/api/docs'
    )

    # Registro de Blueprints
    app.register_blueprint(system_bp)
    app.register_blueprint(api_bp)

    # Configuração de Erros Globais
    @app.errorhandler(Exception)
    def handle_global_exception(e):
        if isinstance(e, HTTPException):
            return e

        if isinstance(e, SecurityException):
            logger.warning(f"Tentativa de upload malicioso bloqueada: {str(e)}")
            return jsonify({
                'success': False,
                'error_code': 'SEC_01',
                'message': str(e)
            }), 403

        if request.path.startswith('/api'):
            logger.critical(f"Falha crítica em {request.path}: {str(e)}", exc_info=True)
            return jsonify({
                'success': False, 
                'error_code': 'SYS_01', 
                'message': 'Mensagem tratada e segura para humanos'
            }), 500
        
        logger.error(f"Erro inesperado fora da API: {str(e)}", exc_info=True)
        return "Erro interno do servidor", 500

    return app

def init_project():
    directories = config.get_all_directories()
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info(f"Diretório criado: {directory}")

class WebViewApi:
    """API exposta ao JavaScript via window.pywebview.api"""
    def getUserInfo(self):
        return {"name": get_windows_username(), "picture": get_windows_profile_picture()}

    def downloadReport(self, filename):
        try:
            full_path = os.path.abspath(os.path.join(config.EXPORT_FOLDER, filename))
            if os.path.exists(full_path):
                # Usar os.startfile apenas se estiver no Windows
                if os.name == 'nt':
                    os.startfile(full_path)
                return {"success": True}
            return {"success": False, "error": "Arquivo não encontrado."}
        except Exception as e:
            logger.error(f"Erro no downloadReport via WebView: {str(e)}")
            return {"success": False, "error": str(e)}

    # Outros métodos podem ser adicionados aqui conforme necessário

def run_flask(app):
    app.run(host=config.HTTP_HOST, port=config.HTTP_PORT, debug=config.DEBUG, use_reloader=False)

# O bloco if __name__ == "__main__" foi movido para run_server.py e run_desktop.py
