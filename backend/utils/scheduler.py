import os
import time
import logging
from apscheduler.schedulers.background import BackgroundScheduler

# Reutilizamos o logger configurado do sistema
logger = logging.getLogger('ocr_automation')

def clean_old_files():
    """
    Motor de limpeza inteligente com regras de retenção diferenciadas:
    - Uploads: 1 hora
    - Exports: 2 semanas
    - Logs: 1 mês
    """
    now = time.time()
    
    # --- DEFINIÇÃO DE GAPS (em segundos) ---
    ONE_HOUR = 3600
    TWO_WEEKS = 7 * 24 * 3600
    ONE_MONTH = 30 * 24 * 3600
    
    # Configuração: (Caminho, Tempo de Retenção, Descrição)
    retention_rules = [
        ('storage/uploads', ONE_HOUR, "Uploads (Temporário)"),
        ('storage/exports', TWO_WEEKS, "Exports (Relatórios)"),
        ('logs', ONE_MONTH, "Logs Históricos")
    ]
    
    deleted_count = 0
    
    for folder, limit, label in retention_rules:
        # Aumenta a resiliência caso a pasta pai (storage) exista mas a subpasta não
        abs_folder = os.path.abspath(folder)
        if not os.path.exists(abs_folder):
            continue
            
        for filename in os.listdir(abs_folder):
            file_path = os.path.join(abs_folder, filename)
            
            # Pula subdiretórios
            if os.path.isdir(file_path):
                continue
                
            try:
                # Obtém a última data de modificação
                file_mtime = os.path.getmtime(file_path)
                
                if (now - file_mtime) > limit:
                    os.remove(file_path)
                    deleted_count += 1
                    logger.debug(f"Ciclo de Vida [{label}]: Removido {filename}")
                    
            except PermissionError:
                # Ignora arquivos em uso (como o log de hoje ou relatório sendo lido)
                continue
            except Exception as e:
                logger.warning(f"Falha ao limpar {filename} em {folder}: {str(e)}")

    if deleted_count > 0:
        logger.info(f"Fim do Ciclo de Vida: {deleted_count} arquivos expirados removidos.")

def start_cleanup_scheduler():
    """
    Inicializa o agendador e registra a tarefa de limpeza periódica.
    Garante compatibilidade com a thread do PyWebView (não-bloqueante).
    """
    # daemon=True garante que o scheduler morra se o app principal fechar
    scheduler = BackgroundScheduler(daemon=True)
    
    # Executa a limpeza a cada 30 minutos
    scheduler.add_job(
        clean_old_files, 
        'interval', 
        minutes=30, 
        id='cleanup_task'
    )
    
    scheduler.start()
    
    # Execução assíncrona imediata para higienizar o ambiente no boot
    # (Evita acumular lixo se o PC foi desligado há muito tempo)
    try:
        clean_old_files()
    except Exception as e:
        logger.error(f"Erro na limpeza inicial do sistema: {str(e)}")
    
    logger.info("BackgroundScheduler: Gestão de Ciclo de Vida de arquivos configurada (30min interval).")
