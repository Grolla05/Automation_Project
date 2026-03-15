from abc import ABC, abstractmethod

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
