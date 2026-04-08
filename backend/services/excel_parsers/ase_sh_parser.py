import pandas as pd
from .base_parser import BaseExcelParser
from utils.logger_config import setup_logger

logger = setup_logger()

class AseShExcelParser(BaseExcelParser):
    """
    Parser focado no Layout ASE SH.
    A aba 4 é deliberadamente ignorada.
    """

    # Índices das abas a processar (0-indexado)
    # Aba 2  → índice 1  |  Aba 3  → índice 2  |  Aba 4  → índice 3 (IGNORADA)
    # Aba 5  → índice 4  |  ...    |  Aba 13 → índice 12
    TARGET_SHEET_INDICES = {1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12}

    # Mapa de índice de coluna pandas (0-based) → letra Excel
    _COL_LETTERS = {
        0: "A", 1: "B", 2: "C", 3: "D",
        4: "E", 5: "F", 6: "G", 7: "H",
        8: "I", 9: "J", 10: "K", 11: "L",
    }

    # ──────────────────────────────────────────────
    #  Utilitário de leitura de célula
    # ──────────────────────────────────────────────

    def _cell(self, df: pd.DataFrame, excel_row: int, excel_col: int) -> str:
        """
        Lê uma célula pelo endereço Excel (1-indexado) e retorna string segura.
        excel_col: A=1, B=2, C=3, D=4, E=5, F=6, G=7 ...
        """
        try:
            val = df.iloc[excel_row - 1, excel_col - 1]
            return str(val).strip() if not pd.isna(val) else "N/A"
        except IndexError:
            return "N/A"

    def _col_letter(self, excel_col: int) -> str:
        """Converte número de coluna Excel (1-indexado) para letra."""
        return self._COL_LETTERS.get(excel_col - 1, f"COL{excel_col}")

    def _extract_range(self, df: pd.DataFrame, prefix: str,
                       row_start: int, row_end: int,
                       col_start: int, col_end: int) -> dict:
        """
        Extrai um bloco retangular de células e gera tags no formato:
            [PREFIX_{col_letra}{row_num}]
        ex: prefix='ABA5', B22:D24 → [ABA5_B22], [ABA5_C22], [ABA5_D22] ...
        """
        tags = {}
        for r in range(row_start, row_end + 1):
            for c in range(col_start, col_end + 1):
                letter = self._col_letter(c)
                tags[f"[{prefix}_{letter}{r}]"] = self._cell(df, r, c)
        return tags
    
    # Aba 2 (PH)
    def _extract_aba2_tags(self, df: pd.DataFrame) -> dict:
        tags = {}

        # B24 → PH fluido de controle
        tags["[PH_FLUIDO_CONTROLE]"] = self._cell(df, 24, 2)
        tags["[PH_Temperatura_Relativa]"] = self._extract_numeric_value(self._cell(df, 16, 3))   # C15
        tags["[PH_Umidade_Relativa]"] = self._extract_numeric_value(self._cell(df, 16, 4))   # D15
        tags["[PH_EQUIPAMENTOS_UTILIZADOS]"] = self._cell(df, 14, 3)   # C15
        tags["[PH_DATA_EXECUCAO]"] = self._cell(df, 15, 3)   # D15

        # B29:B60 → medições 1 a 32
        for excel_row in range(29, 61):
            med_idx = excel_row - 28
            tags[f"[MEDICAO_{med_idx}_PH]"] = self._cell(df, excel_row, 2)

        return tags

    # Aba 3 (Metais extraíveis)
    # Mapa semântico: índice de coluna Excel (1-based) → nome da tag
    _ABA3_COL_NAMES = {
        2: "CHUMBO",     # Coluna B
        3: "ESTANHO",    # Coluna C
        4: "ZINCO",      # Coluna D
        5: "FERRO",      # Coluna E
        6: "SOMATORIO",  # Coluna F  (sem acento para compatibilidade com Word)
        7: "CADMIO",     # Coluna G  (sem acento)
    }

    def _extract_aba3_tags(self, df: pd.DataFrame) -> dict:
        tags = {}

        # --- Células únicas ---
        tags["[ABA3_Temperatura_Relativa]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA3_Umidade_Relativa]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA3_EQUIPAMENTOS_UTILIZADOS]"] = self._cell(df, 13, 3)   # C15
        tags["[ABA3_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # D15

        # --- Matriz B22:G53 com nomes semânticos ---
        # Linha 22 = medição nº 1, linha 53 = medição nº 32
        for excel_row in range(22, 54):                     # linhas 22 a 53
            medicao_num = excel_row - 21                    # 1 a 32
            for excel_col, col_name in self._ABA3_COL_NAMES.items():
                tag_name = f"[ABA3_{col_name}_{medicao_num}]"
                tags[tag_name] = self._cell(df, excel_row, excel_col)

        return tags

    # ──────────────────────────────────────────────
    #  Aba 5 (MS-0028930 ISO 80369-20)
    #   Tags de células únicas:
    #     [ABA5_C13]   ← C13
    #     [ABA5_C14]   ← C14
    #     [ABA5_C15]   ← C15
    #     [ABA5_D15]   ← D15
    #     [ABA5_C18]   ← C18
    #     [ABA5_C19]   ← C19
    #     [ABA5_F18]   ← F18
    #
    #   Tags da matriz B21:G52:
    #     Formato → [ABA5_{NOME_COLUNA}_{N}]  onde N = 1..32
    #     Coluna B → [ABA5_INICIAL_1]     …  [ABA5_INICIAL_32]
    #     Coluna C → [ABA5_FINAL_1]    …  [ABA5_FINAL_32]
    #     Coluna D → [ABA5_VARIAÇÃO_1]      …  [ABA5_VARIAÇÃO_32]
    #     Coluna E → [ABA5_TEMPO_1]      …  [ABA5_TEMPO_32]
    #     Coluna F → [ABA5_VAZAMENTO_1]  …  [ABA5_VAZAMENTO_32]
    #     Coluna G → [ABA5_AVALIACAO_1]     …  [ABA5_AVALIACAO_32]
    # ──────────────────────────────────────────────

    # Mapa semântico da aba 5: coluna Excel (1-based) → nome da tag
    # Ajuste os nomes se as colunas da aba 5 forem diferentes da aba 3
    _ABA5_COL_NAMES = {
        2: "INICIAL",     # Coluna B
        3: "FINAL",    # Coluna C
        4: "VARIACAO",      # Coluna D
        5: "TEMPO",      # Coluna E
        6: "VAZAMENTO",  # Coluna F
        7: "AVALIACAO",     # Coluna G
    }

    def _extract_aba5_tags(self, df: pd.DataFrame) -> dict:
        tags = {}

        # --- Células únicas ---
        tags["[ABA5_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA5_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA5_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA5_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA5_VOLUME]"] = self._cell(df, 18, 3)   # C18
        tags["[ABA5_LIMITE_PA]"] = self._cell(df, 19, 3)   # C19
        tags["[ABA5_PRESSAO_MIN]"] = self._cell(df, 18, 6)   # F18

        # --- Matriz B21:G52 com nomes semânticos ---
        # Linha 21 = medição nº 1, linha 52 = medição nº 32
        for excel_row in range(21, 53):                       # linhas 21 a 52
            medicao_num = excel_row - 20                      # 1 a 32
            for excel_col, col_name in self._ABA5_COL_NAMES.items():
                tag_name = f"[ABA5_{col_name}_{medicao_num}]"
                tags[tag_name] = self._cell(df, excel_row, excel_col)

        return tags

    # ──────────────────────────────────────────────
    #  Aba 6 (Dimensões)  — definir células abaixo
    #   Tags: [ABA6_{col}{row}]
    # ──────────────────────────────────────────────

    # Mapa semântico da aba 7: coluna Excel (1-based) → nome da tag
    # Substitua COL_B, COL_C... pelos nomes reais das colunas da planilha
    _ABA6_COL_NAMES = {
        2: "DIAMETRO_EXTERNO",   # Coluna B — renomear
        3: "RESULTADO1",   # Coluna C — renomear
        4: "DIAMETRO_INTERNO",   # Coluna D — renomear
        5: "RESULTADO2",   # Coluna E — renomear
    }

    def _extract_aba6_tags(self, df: pd.DataFrame) -> dict:
        tags = {}

        # --- Células únicas — linha 20 ---
        tags["[ABA6_DIAMETRO_EXTERNO]"] = self._cell(df, 20, 2)   # B20
        tags["[ABA6_TOLERANCIO_MINIMA]"] = self._cell(df, 20, 3)   # C20
        tags["[ABA6_TOLERANCIO_MAXIMA]"] = self._cell(df, 20, 4)   # D20
        tags["[ABA6_DIAMETRO_INTERNO]"] = self._cell(df, 20, 5)   # E20
        tags["[ABA6_TIPO_PAREDE]"] = self._cell(df, 20, 6)   # F20
        tags["[ABA6_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA6_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA6_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA6_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15

        # --- Matriz B24:E55 com nomes semânticos ---
        # Linha 24 = medição nº 1, linha 55 = medição nº 32
        for excel_row in range(24, 56):                        # linhas 24 a 55
            medicao_num = excel_row - 23                        # 1 a 32
            for excel_col, col_name in self._ABA6_COL_NAMES.items():
                tag_name = f"[ABA6_{col_name}_{medicao_num}]"
                tags[tag_name] = self._cell(df, excel_row, excel_col)

        return tags

    #  Aba 7 (Rigidez)
    def _extract_aba7_tags(self, df: pd.DataFrame) -> dict:
        tags = {}

        # --- Células únicas — linha 20 ---
        tags["[ABA7_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA7_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA7_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA7_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA7_DIAMETRO_EXTERNO]"] = self._cell(df, 18, 2) #B18
        tags["[ABA7_TIPO_PAREDE]"] = self._cell(df, 18, 3) #C18
        tags["[ABA7_VAO_AJUSTADO]"] = self._cell(df, 18, 4) #D18
        tags["[ABA7_FORCA_DOBRAMENTO]"] = self._cell(df, 18, 5) #E18
        tags["[ABA7_DEFLEXAO_MAXIMA]"] = self._cell(df, 18, 6) #F18

        # --- Matriz E21:E52 ---
        # Extrai os valores da coluna E (DEFLEXAO_MEDIDA), linhas 21 a 52
        for excel_row in range(21, 53):
            medicao_num = excel_row - 20
            tags[f"[ABA7_DEFLEXAO_MEDIDA_{medicao_num}]"] = self._cell(df, excel_row, 5)

        return tags

    # ──────────────────────────────────────────────
    #  Aba 8 (Ressistência a quebra)  — definir células abaixo
    #   Tags: [ABA8_{col}{row}]
    # ──────────────────────────────────────────────

    def _extract_aba8_tags(self, df: pd.DataFrame) -> dict:
        tags = {}
        
        tags["[ABA8_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA8_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA8_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA8_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[DISTANCIA_VAO]"] = self._cell(df, 19, 2)   # B19
        tags["[TIPO_PAREDE]"] = self._cell(df, 19, 3)   # C19
        tags["[ÂNGULO_APLICADO]"] = self._cell(df, 19, 4)   # D19

        # --- Matriz B22:B53 ---
        # Extrai os valores da coluna B, linhas 22 a 53
        for excel_row in range(22, 54):
            medicao_num = excel_row - 21
            tags[f"[ABA8_VALOR_{medicao_num}]"] = self._cell(df, excel_row, 2)
        
        return tags

    # ──────────────────────────────────────────────
    #  Aba 9 (Ressistividade à Corrosão)  — definir células abaixo
    #   Tags: [ABA9_{col}{row}]
    # ──────────────────────────────────────────────

    def _extract_aba9_tags(self, df: pd.DataFrame) -> dict:
        tags = {}
        
        tags["[ABA9_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA9_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA9_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA9_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA9_TEMPO_ENSAIO_INICIAL]"] = self._cell(df, 16, 3)   # C16
        tags["[ABA9_TEMPO_ENSAIO_FINAL]"] = self._cell(df, 16, 4)   # D16
        tags["[ABA9_TIPO_DE_PRODUTO]"] = self._cell(df, 17, 3)   # C17
        tags["[ABA9_NUMEROS]"] = self._cell(df, 17, 4)   # D17
        
        # --- Matriz B20:B51 ---
        # Extrai os valores da coluna B, linhas 20 a 51
        for excel_row in range(20, 52):
            medicao_num = excel_row - 19
            tags[f"[ABA9_VALOR_{medicao_num}]"] = self._cell(df, excel_row, 2)

        return tags

    #  Aba 10 (Toler. ISO) — definir células abaixo
    def _extract_aba10_tags(self, df: pd.DataFrame) -> dict:
        tags = {}
        
        tags["[ABA10_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA10_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA10_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA10_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA10_COMPRIMENTO_CANULA]"] = self._cell(df, 21, 2)   # B21
        tags["[ABA10_TOLERANCIA__MAXIMA]"] = self._cell(df, 22, 3)   # C22
        tags["[ABA10_TOLERANCIA_MINIMA]"] = self._cell(df, 22, 4)   # D22
        
        # --- Matriz B26:B57 ---
        # Extrai os valores da coluna B, linhas 26 a 57
        for excel_row in range(26, 58):
            medicao_num = excel_row - 25
            tags[f"[ABA10_VALOR_{medicao_num}]"] = self._cell(df, excel_row, 2)
        
        return tags

    #  Aba 11 (Canhão e cânula) — definir células abaixo
    def _extract_aba11_tags(self, df: pd.DataFrame) -> dict:
        tags = {}
        
        tags["[ABA11_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA11_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA11_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA11_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA11_DIAMETRO_EXTERNO]"] = self._cell(df, 18, 2)   # B18
        tags["[ABA11_FORCA_MINIMA]"] = self._cell(df, 18, 3)   # C18
        
        # --- Matriz B22:B53 ---
        # Extrai os valores da coluna B, linhas 22 a 53
        for excel_row in range(22, 54):
            medicao_num = excel_row - 21
            tags[f"[ABA11_VALOR_{medicao_num}]"] = self._cell(df, excel_row, 2)
        
        return tags

    # ──────────────────────────────────────────────
    #  Aba 12 (Diametro interno)— definir células abaixo
    #   Tags: [ABA12_{col}{row}]
    # ──────────────────────────────────────────────

    def _extract_aba12_tags(self, df: pd.DataFrame) -> dict:
        tags = {}
        
        tags["[ABA12_EQUIPAMENTOS]"] = self._cell(df, 13, 3)   # C13
        tags["[ABA12_DATA_EXECUCAO]"] = self._cell(df, 14, 3)   # C14
        tags["[ABA12_TEMPERATURA_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 3))   # C15
        tags["[ABA12_UMIDADE_AMBIENTE]"] = self._extract_numeric_value(self._cell(df, 15, 4))   # D15
        tags["[ABA12_DIAMETRO_EXTERNO]"] = self._cell(df, 21, 2)   # B21
        tags["[ABA12_DIAMETRO_PINO]"] = self._cell(df, 21, 3)   # C21
        tags["[ABA12_TIPO_PAREDE]"] = self._cell(df, 21, 4)   # D21
        
        # --- Matriz B25:B56 ---
        # Extrai os valores da coluna B, linhas 25 a 56
        for excel_row in range(25, 57):
            medicao_num = excel_row - 24
            tags[f"[ABA12_VALOR_{medicao_num}]"] = self._cell(df, excel_row, 2)
        
        return tags

    # ──────────────────────────────────────────────
    #  Dispatcher principal
    # ──────────────────────────────────────────────

    def _dispatch(self, aba_num: int, df: pd.DataFrame) -> dict:
        """Redireciona para o método de extração correto conforme o número da aba."""
        if aba_num == 2:
            return self._extract_aba2_tags(df)
        elif aba_num == 3:
            return self._extract_aba3_tags(df)
        elif aba_num == 5:
            return self._extract_aba5_tags(df)
        elif aba_num == 6:
            return self._extract_aba6_tags(df)
        elif aba_num == 7:
            return self._extract_aba7_tags(df)
        elif aba_num == 8:
            return self._extract_aba8_tags(df)
        elif aba_num == 9:
            return self._extract_aba9_tags(df)
        elif aba_num == 10:
            return self._extract_aba10_tags(df)
        elif aba_num == 11:
            return self._extract_aba11_tags(df)
        elif aba_num == 12:
            return self._extract_aba12_tags(df)
        else:
            logger.warning(f"Aba {aba_num} não possui extrator definido, pulando.")
            return {}

    # ──────────────────────────────────────────────
    #  Entry point
    # ──────────────────────────────────────────────

    def parse(self, file_path: str) -> dict:
        try:
            logger.info("-> Utilizando AseShExcelParser!")

            # header=None evita que o Pandas consuma a 1ª linha como cabeçalho
            # Usa o método centralizado da BaseExcelParser para lidar com senhas
            sheets_dict = self._read_excel_safe(file_path, sheet_name=None, header=None)
            sheet_names = list(sheets_dict.keys())

            extracted_string = "\n\n".join(full_text).strip()
            
            # Encapsula na TAG padrão caso a Factory chame o Default
            # Usa o método centralizado da BaseExcelParser para lidar com senhas
            sheets_dict = self._read_excel_safe(file_path, sheet_name=None, header=None)
            
            for sheet_name, df in sheets_dict.items():

                extracted_tags = {}

            for sheet_idx, sheet_name in enumerate(sheet_names):
                # Filtra apenas as abas alvo
                if sheet_idx not in self.TARGET_SHEET_INDICES:
                    logger.debug(
                        f"Aba '{sheet_name}' (índice {sheet_idx}) ignorada pelo parser."
                    )
                    continue

                df = sheets_dict[sheet_name]
                if df.empty:
                    logger.warning(f"Aba '{sheet_name}' está vazia, pulando.")
                    continue

                aba_num = sheet_idx + 1  # converte índice 0-based → número humano
                logger.info(f"Processando aba {aba_num}: '{sheet_name}'")

                sheet_tags = self._dispatch(aba_num, df)
                extracted_tags.update(sheet_tags)

            if not extracted_tags:
                logger.warning(
                    f"Nenhuma tag extraída de '{file_path}'. "
                    f"Verifique se as abas alvo existem."
                )

            logger.info(
                f"[ASE_SH_PARSER EXTRACTION] Concluída. {len(extracted_tags)} tags geradas."
            )

            # Chama o utilitário herdado para calcular intervalo de datas
            extracted_tags = self._add_date_range_tags(extracted_tags)
            
            return extracted_tags

        except Exception as e:
            logger.error(f"Erro no AseShExcelParser p/ {file_path}: {str(e)}")
            raise
