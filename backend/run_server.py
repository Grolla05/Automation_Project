import os
from app import create_app, init_project
from utils.scheduler import start_cleanup_scheduler
from utils.logger_config import setup_logger
from config_loader import config

logger = setup_logger()

def run_server():
    """Inicialização pura para modo Servidor / Cloud (sem GUI)"""
    logger.info("Iniciando em modo SERVIDOR (SaaS)...")
    
    # Inicializa estrutura de pastas
    init_project()
    
    # Inicia tarefas de agendamento (limpeza de temporários)
    start_cleanup_scheduler()
    
    # Cria a instância do Flask
    app = create_app()
    
    # Roda o servidor. Em produção Cloud, geralmente se usa Gunicorn ou Waitress.
    app.run(
        host=config.HTTP_HOST, 
        port=config.HTTP_PORT, 
        debug=config.DEBUG, 
        use_reloader=config.DEBUG
    )

if __name__ == "__main__":
    run_server()
