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
        Utiliza o Factory para obter o processador correspondente ao Ensaio.
        
        Args:
            file_paths (list): Lista de strings com os caminhos completos.
            layout_name (str, optional): O tipo do ensaio/layout, usado pela Factory.
        Returns:
            dict: Mapeamento { nome_arquivo : texto_extraído }
        """
        logger.info(f"Iniciando processamento em lote de {len(file_paths)} planilhas(s) Excel. Layout detectado: {layout_name}")
        batch_results = {}
        
        # Pede a Factory que retorne o Script apropriado para este tipo de Ensaio
        parser = get_parser_for_layout(layout_name)

        for path in file_paths:
            file_name = os.path.basename(path)
            logger.info(f">>> Processando Planilha: {file_name}")
            
            try:
                if not os.path.exists(path):
                    logger.error(f"Arquivo não encontrado: {path}")
                    batch_results[file_name] = "ERRO: Arquivo físico não encontrado no servidor."
                    continue

                # Delega a inteligência de negócios ao Parser instanciado pela Factory
                extracted_text = parser.parse(path)
                batch_results[file_name] = extracted_text
                
                logger.info(f"--- Sucesso ao processar a planilha: {file_name}")
                
                # Exibe TODOS os dados extraídos no console para depuração
                logger.info(f"\n[DEBUG] DADOS TOTAIS EXTRAÍDOS DA PLANILHA '{file_name}':\n{extracted_text}\n")

            except Exception as e:
                logger.error(f"Erro ao processar a planilha {file_name}: {str(e)}")
                batch_results[file_name] = f"ERRO DURANTE PROCESSAMENTO DE PLANILHA: {str(e)}"

        logger.info("Processamento em lote de planilhas finalizado.")
        return batch_results
