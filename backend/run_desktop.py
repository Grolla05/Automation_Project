import os
import threading
import webview
from app import create_app, init_project, WebViewApi, run_flask
from utils.scheduler import start_cleanup_scheduler
from utils.logger_config import setup_logger
from config_loader import config

logger = setup_logger()

def run_desktop():
    """Inicialização para modo Desktop (GUI via WebView)"""
    logger.info("Iniciando em modo DESKTOP (GUI)...")
    
    # Inicializa pastas necessárias
    init_project()
    
    # Inicia agendador de limpeza
    start_cleanup_scheduler()

    # Cria app Flask
    app = create_app()
    
    # Define URL base
    # Se distribuído, aponta para o Flask (localhost:5000)
    # Em desenvolvimento frontend, pode apontar para o Vite (5173)
    window_url = 'http://localhost:5173'
    if os.path.exists(app.static_folder):
        # Impedir o uso de 0.0.0.0 como endereço de destino do cliente
        host = config.HTTP_HOST if config.HTTP_HOST != '0.0.0.0' else '127.0.0.1'
        window_url = f'http://{host}:{config.HTTP_PORT}'
        logger.info(f"Frontend compilado encontrado. Usando servidor Flask em {window_url}")
    else:
        logger.warning("Frontend 'dist' não encontrado. Tentando carregar do Vite (porta 5173).")

    # Inicia Flask em uma thread separada (daemon=True morre com a GUI)
    flask_thread = threading.Thread(target=run_flask, args=(app,), daemon=True)
    flask_thread.start()
    
    logger.info("Flask rodando em segundo plano para a GUI.")

    # Configura e inicia janela do PyWebView
    webview_api = WebViewApi()
    window = webview.create_window(
        config.APP_NAME, 
        url=window_url, 
        js_api=webview_api,
        width=config.UI_WIDTH,
        height=config.UI_HEIGHT,
        resizable=True,
        background_color='#F5F5F7'
    )
    
    # Inicia a interface gráfica
    webview.start(debug=config.DEBUG)

if __name__ == "__main__":
    run_desktop()
