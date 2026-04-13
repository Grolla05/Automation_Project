from abc import ABC, abstractmethod
from datetime import datetime
import re
import msoffcrypto
import io
import pandas as pd
from config_loader import config

class BaseExcelParser(ABC):
    """
    Interface base para todos os extratores de dados de Excel.
    Qualquer novo ensaio com regras específicas de tabelas/planilhas deve herdar desta classe.
    """
    
    @abstractmethod
    def parse(self, file_path: str) -> dict:
        """
        Lê a planilha localizada em `file_path`, processa as abas necessárias
        e retorna um dicionário JSON contendo as Tags e seus valores (ex: {"[DADOS_CAPTURADOS]": "Aprovado"})
        """
        pass

    def _read_excel_safe(self, file_path: str, sheet_name=None, header=None) -> pd.DataFrame or dict:
        """
        Lê um arquivo Excel tratando criptografia/senha se configurado.
        Tenta ler sem senha primeiro, depois tenta as senhas da configuração.
        """
        passwords = config.ASE_EXCEL_PASSWORDS
        
        # 1. Tenta ler sem senha primeiro
        try:
            return pd.read_excel(file_path, sheet_name=sheet_name, header=header)
        except Exception:
            # Se falhou (provavelmente criptografado), tentamos as senhas
            pass

        # 2. Tenta as senhas configuradas
        if passwords:
            for pwd in passwords:
                try:
                    decrypted_workbook = io.BytesIO()
                    with open(file_path, "rb") as f:
                        office_file = msoffcrypto.OfficeFile(f)
                        office_file.load_key(password=pwd)
                        office_file.decrypt(decrypted_workbook)
                    
                    decrypted_workbook.seek(0)
                    return pd.read_excel(decrypted_workbook, sheet_name=sheet_name, header=header)
                except Exception:
                    # Senha errada ou outro erro, tenta a próxima
                    continue
        
        # 3. Se chegou aqui, falhou em todas as tentativas
        raise Exception(
            f"Não foi possível abrir o arquivo Excel '{file_path}'. "
            f"O arquivo parece estar protegido e nenhuma das {len(passwords)} senhas fornecidas funcionou."
        )

    def _add_date_range_tags(self, tags: dict) -> dict:
        """
        Analisa todas as tags que terminam em _DATA_EXECUCAO] (independente da aba)
        e calcula a menor e maior data encontrada, adicionando as tags:
        [data_ensaio_inicial] e [data_ensaio_final].
        """
        dates = []
        # Procura por qualquer tag que contenha DATA_EXECUCAO
        # Ex: [ABA3_DATA_EXECUCAO], [ABA5_DATA_EXECUCAO], etc.
        for tag_name, val in tags.items():
            if "_DATA_EXECUCAO" in tag_name:
                dt = self._parse_date(val)
                if dt:
                    dates.append(dt)

        if dates:
            min_date = min(dates)
            max_date = max(dates)
            
            tags["[data_ensaio_inicial]"] = min_date.strftime("%d/%m/%Y")
            tags["[data_ensaio_final]"] = max_date.strftime("%d/%m/%Y")
        else:
            tags["[data_ensaio_inicial]"] = "N/A"
            tags["[data_ensaio_final]"] = "N/A"
            
        return tags

    def _parse_date(self, date_str: str):
        """Tenta converter uma string para objeto datetime."""
        if not date_str or date_str == "N/A":
            return None
        
        # Formatos comuns que podem vir do Excel/Pandas
        # Se vier como datetime do pandas, já pode estar formatado ou ser objeto
        for fmt in ("%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                # Se for string, tenta o parse
                if isinstance(date_str, str):
                    # Tira possíveis horas se for apenas data
                    clean_str = date_str.split(" ")[0] if " " in date_str else date_str
                    # Tenta formatar se bater com o padrão
                    return datetime.strptime(clean_str, fmt)
            except (ValueError, TypeError):
                continue
        return None

    def _extract_numeric_value(self, value: str) -> str:
        """
        Extrai apenas o valor numérico de uma string (ex: 'Temperatura (C°): 25' -> '25').
        Suporta números inteiros e decimais (com ponto ou vírgula).
        Arredonda para 2 casas decimais se for um número válido.
        """
        if not value or value == "N/A":
            return "N/A"
        
        # Regex para encontrar um padrão numérico (ex: 25, 25.5, 25,5)
        match = re.search(r"(\d+[\.,]?\d*)", value)
        if match:
            num_str = match.group(1).replace(",", ".")  # Normaliza para ponto se necessário
            try:
                # Tenta converter para float e arredondar
                val_float = float(num_str)
                # Se for um inteiro (ex: 25.0), formatamos como 25, senão com 2 casas
                if val_float.is_integer():
                    return str(int(val_float))
                return f"{val_float:.2f}"
            except ValueError:
                return num_str
        
        return value
