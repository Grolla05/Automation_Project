import pandas as pd
from .base_parser import BaseExcelParser
from utils.logger_config import setup_logger

logger = setup_logger()

class AseShExcelParser(BaseExcelParser):
    """
    Parser focado no Layout ASE SH.
    Extrai dados separados por abas, começando pela segunda aba da planilha,
    na qual extrai os dados de B29 até B60 e B24.
    B29 a B60 são medições e B24 é salvo como PH fluido de controle.
    """
    
    def parse(self, file_path: str) -> dict:
        try:
            logger.info("-> Utilizando AseShExcelParser!")
            # Usar header=None previne que o Pandas engula a 1ª linha como nome das colunas
            sheets_dict = pd.read_excel(file_path, sheet_name=None, header=None)
            
            extracted_tags = {}
            sheet_names = list(sheets_dict.keys())
            
            # Começa a partir da segunda aba (índice 1) se existir
            if len(sheet_names) > 1:
                for sheet_name in sheet_names[1:]:
                    df = sheets_dict[sheet_name]
                    if df.empty:
                        continue
                    
                    # Nome seguro da aba para compor a tag
                    safe_sheet_name = str(sheet_name).strip().upper().replace(" ", "_").replace("-", "_")
                    
                    # Coordenadas Excel -> Pandas DataFrame:
                    # B24 -> row 23, col 1
                    try:
                        ph_val = df.iloc[23, 1]
                        ph_str = str(ph_val).strip() if not pd.isna(ph_val) else "N/A"
                    except IndexError:
                        ph_str = "N/A"
                        
                    # Tag B24 "PH fluido de controle" -> "[PH_FLUIDO_CONTROLE_<nome_aba>]"
                    extracted_tags[f"[PH_FLUIDO_CONTROLE]"] = ph_str
                    
                    # Medições: B29 a B60 -> row 28 a 59, col 1
                    for row_idx in range(28, 60): # 28 a 59 (inclusive)
                        # Índice 1 a 32
                        med_idx = row_idx - 27
                        try:
                            val = df.iloc[row_idx, 1]
                            val_str = str(val).strip() if not pd.isna(val) else ""
                        except IndexError:
                            val_str = ""
                        
                        extracted_tags[f"[MEDICAO_{med_idx}_PH]"] = val_str
            else:
                logger.warning(f"Planilha {file_path} não possui segunda aba.")
                
            logger.info(f"[ASE_SH_PARSER EXTRACTION] Concluída. {len(extracted_tags)} tags geradas.")
            return extracted_tags
            
        except Exception as e:
            logger.error(f"Erro no AseShExcelParser p/ {file_path}: {str(e)}")
            raise
