import pandas as pd
from .base_parser import BaseExcelParser
from utils.logger_config import setup_logger

logger = setup_logger()

class AseExcelParser(BaseExcelParser):
    """
    Parser focado no Layout P5 -> ASE -> TESTE.
    Extrai dados críticos e retorna o dicionário pronto de substituições
    que o Word DocumentService fará uso.
    """
    
    def parse(self, file_path: str) -> dict:
        try:
            logger.info("-> Utilizando AseExcelParser (Customizado)!")
            # Usar header=None previne que o Pandas engula a 1ª linha como nome das colunas
            sheets_dict = pd.read_excel(file_path, sheet_name=None, header=None)
            
            extracted_tags = {}
            full_text = []

            for sheet_name, df in sheets_dict.items():
                if df.empty:
                    continue
                
                # ATENÇÃO: NÃO usaremos df.dropna() aqui!
                # Se apagarmos as colunas vazias, as posições absolutas (ex: Coluna H) serão distorcidas.
                
                # Coordenadas Excel -> Pandas DataFrame:
                # Coluna A = 0 | B = 1 | C = 2 | D = 3 | E = 4 | F = 5 | G = 6
                # Linha 8 = index 7 | Coluna G = index 6
                try:
                    freq = str(df.iloc[7, 6]) if not pd.isna(df.iloc[7, 6]) else "N/A"
                    max_peak = str(df.iloc[8, 6]) if not pd.isna(df.iloc[8, 6]) else "N/A"
                    cispr = str(df.iloc[9, 6]) if not pd.isna(df.iloc[9, 6]) else "N/A"
                except IndexError:
                    # Caso a planilha venha pela metade ou menor que G10
                    freq, max_peak, cispr = "N/A", "N/A", "N/A"
                
                extracted_tags["[FREQ_EXTRAIDA_ASE]"] = freq
                extracted_tags["[MAX_PEAK_EXTRAIDO_ASE]"] = max_peak
                extracted_tags["[CISPR_AVERAGE_ASE]"] = cispr
                
            # Retornamos o Dicionário direto, já mapeado
            logger.info(f"[ASE_PARSER RAW_DATA] \nFreq RAW: {freq} \nMaxPeak RAW: {max_peak} \nCispr RAW: {cispr}\n")
            return extracted_tags
            
        except Exception as e:
            logger.error(f"Erro no AseExcelParser p/ {file_path}: {str(e)}")
            raise
