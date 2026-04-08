from abc import ABC, abstractmethod
from datetime import datetime
import re

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
        """
        if not value or value == "N/A":
            return "N/A"
        
        # Regex para encontrar um padrão numérico (ex: 25, 25.5, 25,5)
        match = re.search(r"(\d+[\.,]?\d*)", value)
        if match:
            return match.group(1).replace(",", ".")  # Normaliza para ponto se necessário
        
        return value
