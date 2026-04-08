import pandas as pd
from .base_parser import BaseExcelParser
from utils.logger_config import setup_logger

logger = setup_logger()

class DefaultExcelParser(BaseExcelParser):
    """
    Parser padrão: lê todas as abas, remove vazias e 
    converte tudo em uma string formatada linear que mapeia
    para a tag [DADOS_CAPTURADOS_ARQUIVO_UPLOAD].
    """
    
    def parse(self, file_path: str) -> dict:
        try:
            # Usa o método centralizado da BaseExcelParser para lidar com senhas
            sheets_dict = self._read_excel_safe(file_path, sheet_name=None)
            full_text = []

            for sheet_name, df in sheets_dict.items():
                if df.empty:
                    continue
                
                sheet_content = f"--- [Aba Genérica: {sheet_name}] ---\n"
                df.dropna(how='all', inplace=True)
                df.dropna(axis=1, how='all', inplace=True)
                
                sheet_content += df.to_string(index=False, na_rep='-')
                full_text.append(sheet_content)

            extracted_string = "\n\n".join(full_text).strip()
            
            # Encapsula na TAG padrão caso a Factory chame o Default
            return {
                "[DADOS_CAPTURADOS_ARQUIVO_UPLOAD]": extracted_string
            }
        except Exception as e:
            logger.error(f"Erro no DefaultExcelParser p/ {file_path}: {str(e)}")
            raise
