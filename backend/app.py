import os
import threading
import webview
from flask import Flask, jsonify, request, send_from_directory, Blueprint
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from routes.api_routes import api_ns
from routes.system_routes import system_ns, get_windows_username, get_windows_profile_picture
from utils.logger_config import setup_logger
from utils.scheduler import start_cleanup_scheduler
from utils.security import SecurityException
from flask_restx import Api
from config_loader import config

logger = setup_logger()

def create_app():
    # Caminho absoluto para evitar problemas de resolução de diretório
    dist_path = config.FRONTEND_DIST
    
    app = Flask(__name__, static_folder=dist_path, static_url_path='')
    CORS(app)

    # Configuração do Swagger (Flask-RESTX) diretamente no App com prefixo /api
    # Isso garante que as rotas sejam registradas corretamente no mapa global
    api = Api(app, 
        version='1.0', 
        title=f'{config.APP_NAME} API',
        description='Documentação automática das rotas do sistema de automação OCR',
        prefix='/api',
        doc='/api/docs'
    )

    # Registro de Namespaces no API object
    # path='' dentro de um Api(prefix='/api') coloca as rotas em /api/rota
    api.add_namespace(system_ns, path='')
    api.add_namespace(api_ns, path='')

    # Rota genérica para servir o frontend (definida APÓS a API para evitar interceptação)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """Serve o frontend compilado e lida com SPA routing"""
        # Se começar com api ou docs, não deve ser tratado por esta função
        if path.startswith('api') or path.startswith('docs'):
            return jsonify({"error": "Endpoint não encontrado"}), 404

        # Tenta servir o arquivo solicitado diretamente da pasta static
        file_path = os.path.join(dist_path, path)
        if path != "" and os.path.exists(file_path) and not os.path.isdir(file_path):
            return send_from_directory(dist_path, path)
        
        # Fallback para index.html (SPA)
        index_path = os.path.join(dist_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(dist_path, 'index.html')
        
        return f"Recurso {path} não encontrado.", 404

    # Configuração de Erros Globais (Apenas para rotas que NÃO são capturadas pelo handler acima)
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
