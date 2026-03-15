# 🏭 Módulo `excel_parsers`: Fábrica e Estratégia (Patterns)

Este módulo foi projetado para aplicar **Design Patterns** (Strategy e Factory) modernos corporativos, tornando nosso código de processamento de planilhas altamente manutenível, coeso e 100% isolado por Escopo de Trabalho/Tipo de Ensaio.

Em resumo: É aqui onde a "Inteligência" customizada de captura do Excel usando **Pandas** ganha vida e repassa o resultado pronto para o injetor de Palavras do MS Word (.docx).

---

## 🧭 O Que é essa Estrutura?

Sempre que um novo Setor/Ensaio for adicionado à plataforma pela empresa, o layout do Excel entregue pelo corpo técnico ou robôs pode ser totalmente diferente. Algumas vezes as colunas cruciais de resultado vão estar na "Linha 9 / Coluna B", já outras vezes na "Aba X / Relatório Z".

Para evitar a construção de **Códigos Espaguete** (`if/elif/else` gigantes no meio da lógica principal do `excel_service.py`), cada ensaio/layout processa o MS Excel de maneira reclusiva: O ExcelService só precisa saber que, não importa o layout inserido pelo Frontend, uma _"Caixa Preta Subordinada"_ vai pegar o Excel físico e devolver sempre um _Dicionário Estático_ formatado no final.

Isso é regido pela nossa Interface Central (`base_parser.py`) usando `@abstractmethod`.

---

## 📂 Arquivos Chave da Interface

- **`base_parser.py`**: A regra suprema (Contrato). Manda que não importa quantas classes sejam criadas (AseParser, EmcParser, Teste1Parser), todas precisam obrigatoriamente ter uma função que se chame `def parse(self, file_path: str) -> dict`. E precisam devolver um dicionário tipado `{"[TAG_DOCUMENTO]": "VALOR"}`.
- **`__init__.py`**: (Roteador Factory). É o Orquestrador Central. É ele quem recebe o _"Layout Detectado"_ e escolhe qual a Instância Especialista correta.
- **`default_parser.py`**: Nossa tática defensiva. Se houver falha de mapeamento do Frontend, e for jogada uma planilha de layout inexistente e sem programação designada específica, para que a aplicação não quebre, ele entra em campo. Sua técnica varre a planilha cegamente limpando células vazias (`df.dropna()`) e escrevendo um textual literal cru sob a antiga TAG Genérica: `[DADOS_CAPTURADOS_ARQUIVO_UPLOAD]`.

---

## 💻 Minilab Prático: Passo-a-Passo de Implementação de Um Novo Ensaio

Aqui a verdadeira explicação minuciosa surge para facilitar a vida do Desenvolvedor de Manutenção. **O que fazer se for listado à plataforma amanhã um "Ensaio XYZ"?**

### PASSO 1 - Desenhe o Parser Focado

Crie na mesma raiz desta pasta (`/backend/services/excel_parsers`) o arquivo respectivo: `xyz_parser.py`.
Você irá usar **Pandas (`df`)** para aplicar lógicas exclusivas de localização das células das abas daquela respectiva tabela X.

```python
import pandas as pd
from .base_parser import BaseExcelParser
from utils.logger_config import setup_logger

logger = setup_logger()

# 1. HERDE de BaseExcelParser
class XyzExcelParser(BaseExcelParser):
    
    # 2. DEFINA a função "parse" recebendo do núcleo principal a rota 'file_path' do .xlsx
    def parse(self, file_path: str) -> dict:
        try:
            # 3. Leia o arquivo com Pandas. 
            # DICA DE OURO: Use header=None para que o Pandas não engula a primeira linha (A1) como cabeçalho de coluna
            sheets_dict = pd.read_excel(file_path, sheet_name=None, header=None)
            
            # ATENÇÃO CRÍTICA À EXTRAÇÃO POR COORDENADAS ESTÁTICAS:
            # - Não use "df.dropna(how='all')" se for usar indexação absoluta (iloc)! 
            # - Apagar colunas ou linhas vazias muda o esqueleto da planilha. Uma métrica na Coluna G vai virar 
            #   Coluna A se as anteriores (A-F) estiverem vazias e forem apagadas pelo dropna.
            
            # Mapeamento Espacial (iloc[linha, coluna]):
            # Tudo começa do Zero!
            # Colunas: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, etc...
            # Linhas:  1=0, 2=1, 3=2, 4=3, 8=7, 10=9, etc...
            # Exemplo: Célula G8 -> df.iloc[7, 6]
            
            # Para o exemplo, vamos imaginar que a lógica encontre a Variância em B2 e o Resultado em F6:
            # Adicionalmente, sempre circunde em Try/Except para evitar estourar o backend se a planilha estiver cortada
            try:
                val_variancia = str(sheets_dict['Resultados'].iloc[1, 1])  # Linha 2(1), Coluna B(1)
                val_res_medio = str(sheets_dict['Resultados'].iloc[5, 5])  # Linha 6(5), Coluna F(5)
            except IndexError:
                val_variancia = "N/A"
                val_res_medio = "N/A"
            
            # 4. INSTANCIE A LIGAÇÃO COM O WORD (.docx)
            # O dicionário retornado diz como se espelhar com as [] inseridas no MS Word.
            
            tags_finais = {
                "[XYZ_VARIANCIA_EXTRAIDA]": val_variancia,
                "[XYZ_RESSONANCIA_MEDIA]": val_res_medio
            }

            return tags_finais
            
        except Exception as e:
            logger.error(f"Erro brutal ao processar Planilha via XyzParser -> {str(e)}")
            raise

```

### PASSO 2 - Inscreva seu Parser na Factory Routing (`__init__.py`)

No arquivo `__init__.py` (Que gerencia tudo que exporta), adicione a instrução de Instância a partir do import:

```python
# 1. Faça o import que você acabou de criar!
from .xyz_parser import XyzExcelParser

def get_parser_for_layout(layout_name: str):
    
    # [Outras lógicas do __init__ ficariam acima desta]
    ...
    
    layout_name = layout_name.upper()

    # 2. SE o Layout escolhido pelo operador do Computador conter "XYZ" na raiz da String, Chame sua classe!
    if 'XYZ' in layout_name:
        return XyzExcelParser()

    # Padrão Fallback
    return DefaultExcelParser()
```

Pronto 🎉!
Uma simples mudança e todo o sistema (Que envolve o **DocumentServer** (`python-docx`), e o loop do **ExcelServer**) estará magicamente compatível com os blocos novos recebendo a classe dinamicamente e injetando as chaves numéricas criadas lá e grifando de amarelo de maneira limpa no novo Relatório, num processo fechado que minimiza o aparecimento de Bugs Indiretamente cruzados no ambiente de Automação!
