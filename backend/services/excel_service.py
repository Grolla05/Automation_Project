import os
import logging
from utils.logger_config import setup_logger
from .excel_parsers import get_parser_for_layout

# Inicializa o logger para uso no serviço
logger = setup_logger()

class ExcelService:
    """
    Serviço especializado em extração de dados de planilhas Excel.
    Delega a lógica de parsing para classes especializadas via Factory Pattern.
    """

    def __init__(self):
        pass

    def process_batch(self, file_paths, layout_name=None):
        """
        Método Principal: Processa uma lista de arquivos de Excel.
        Yields progress messages.
        """
        if not file_paths:
            return {}

        batch_results = {}
        parser = get_parser_for_layout(layout_name)

        for i, path in enumerate(file_paths):
            file_name = os.path.basename(path)
            yield {"progress": 70 + int((i/len(file_paths))*20), "message": f"Processando Excel: {file_name}"}
            
            try:
                if not os.path.exists(path):
                    batch_results[file_name] = "ERRO: Arquivo não encontrado."
                    continue

                extracted_text = parser.parse(path)
                batch_results[file_name] = extracted_text
            except Exception as e:
                logger.error(f"Erro ao processar a planilha {file_name}: {str(e)}")
                batch_results[file_name] = f"ERRO Excel: {str(e)}"

        return batch_results
