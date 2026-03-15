from .default_parser import DefaultExcelParser
from .ase_parser import AseExcelParser

def get_parser_for_layout(layout_name: str):
    """
    Retorna a instância correta do extrator de Excel baseado no Ensaio/Layout.
    Isso escala permitindo adicionar dezenas de extratores sem poluir o ExcelService.
    """
    if not layout_name:
        return DefaultExcelParser()
        
    layout_name = layout_name.upper()

    # Mapeamento do nome do Ensaio / Layout -> Classe Especializada
    if 'ASE' in layout_name or 'TESTE' in layout_name:
        return AseExcelParser()

    # Padrão Fallback
    return DefaultExcelParser()
