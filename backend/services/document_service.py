import os
import logging
from docx import Document
from utils.logger_config import setup_logger

logger = setup_logger()

class DocumentService:
    """
    Serviço para geração de documentos Word (.docx) utilizando layouts pré-definidos.
    """
    
    def __init__(self):
        self.output_dir = 'storage/exports'
        self.layout_dir = 'storage/layouts'
        
        # Garante que as pastas existam
        for directory in [self.output_dir, self.layout_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)

    def generate_report(self, text_content, filename="relatorio_ocr.docx", layout_name=None):
        """
        Cria um arquivo Word baseado em um layout ou um documento novo.
        
        Args:
            text_content (str): Texto extraído pelo OCR.
            filename (str): Nome do arquivo de saída.
            layout_name (str): Nome do arquivo de layout (ex: "Bluetooth Low Energy").
        """
        try:
            doc = None
            
            # 1. Tenta carregar o layout se fornecido
            if layout_name:
                # Normaliza o nome para buscar o arquivo .docx
                layout_filename = f"{layout_name}.docx"
                layout_path = os.path.join(self.layout_dir, layout_filename)
                
                if os.path.exists(layout_path):
                    logger.info(f"Usando layout customizado: {layout_path}")
                    doc = Document(layout_path)
                else:
                    logger.warning(f"Layout '{layout_filename}' não encontrado em {self.layout_dir}. Criando documento padrão.")
            
            # 2. Se não houver layout, cria um documento do zero
            if doc is None:
                doc = Document()
                doc.add_heading('Relatório Automático de OCR', 0)
            
            # 3. Inserção dos dados
            # Se for layout, podemos buscar por um placeholder como {{CONTEUDO}} ou apenas adicionar ao fim
            # Por enquanto, seguindo seu pedido: "insira o que o OCR extraiu no layout"
            
            # Verifica se existe o placeholder {{CONTEUDO}} no documento
            replaced = False
            for paragraph in doc.paragraphs:
                if '{{CONTEUDO}}' in paragraph.text:
                    paragraph.text = paragraph.text.replace('{{CONTEUDO}}', text_content)
                    replaced = True
            
            # Se não encontrar placeholder, adiciona ao final do documento
            if not replaced:
                if len(doc.paragraphs) > 0:
                    doc.add_page_break()
                doc.add_heading('Dados Extraídos (OCR)', level=1)
                doc.add_paragraph(text_content)
            
            # 4. Salva o resultado
            output_path = os.path.join(self.output_dir, filename)
            doc.save(output_path)
            
            logger.info(f"Documento gerado com sucesso em: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Erro ao gerar documento Word: {str(e)}")
            raise
