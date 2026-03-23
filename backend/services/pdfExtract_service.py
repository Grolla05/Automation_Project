import pdfplumber
import os
import re
from utils.logger_config import setup_logger

# Inicializa o logger para uso no serviço
logger = setup_logger()

class PDFExtractService:
    """
    Serviço especializado com lógica de Checkbox Inteligente para TÜV Rheinland.
    Identifica marcações (X, ☑) e extrai o texto imediatamente à direita da marcação.
    """

    def __init__(self):
        # Mapeamento: "Texto no PDF" -> "Tag no Template Word"
        self.field_map = {
            "Data de recebido": "[data_recebimento]",
            "Liberada": "[data_liberada]",
            "NF": "[NF_numero]",
            "AWB": "[AWB_codigo]",
            "Volume": "[volume_total]",
            "Etiqueta embalagem": "[etiqueta_embalagem]",
            "Etiqueta amostras": "[etiqueta_amostra]",
            "Ensaios direto": "[ensaio_direto]",
            "Proposta": "[proposta_numero]",
            "Projeto": "[projeto_codigo]",
            "Data aceite": "[data_aceite]",
            "Material Entregue Pela Empresa": "[material_status]",
            "OCP": "[OCP_codigo]",
            "Código SAP": "[SAP_solicitante]",
            "Solicitante": "[nome_solicitante]",
            "Código SAP": "[SAP_fabricante]",
            "Fabricante": "[nome_fabricante]",
            "Documento de ensaio anexo": "[doc_anexo_status]",
            "Teste": "[teste_retorno]",
        }
        
        # Caracteres que representam uma checkbox marcada
        self.check_markers = ["x", "X", "☑", "✅"]

    def _clean_text(self, text):
        if not text: return ""
        # Remove ícones de checkbox vazia e pontuação grudada
        text = re.sub(r'[☐:]', '', text)
        return " ".join(text.split())

    def extract_data(self, file_path):
        if not os.path.exists(file_path):
            logger.error(f"Arquivo não encontrado: {file_path}")
            return {}

        final_mapped_results = {}
        try:
            with pdfplumber.open(file_path) as pdf:
                page = pdf.pages[0]
                words = page.extract_words(x_tolerance=3, y_tolerance=3)
                
                logger.info(f"Iniciando extração inteligente (Checkboxes) do PDF: {os.path.basename(file_path)}")

                for pdf_label, doc_tag in self.field_map.items():
                    # 1. Busca primeiro se existe uma marcação de checkbox (X) na linha do label
                    value = self._find_checkbox_value(words, pdf_label)
                    
                    # 2. Se não encontrou checkbox, tenta a busca tradicional (texto à direita)
                    if not value:
                        value = self._find_value_near_label(words, pdf_label)
                    
                    cleaned_value = self._clean_text(value) if value else "Não encontrado"
                    final_mapped_results[doc_tag] = cleaned_value
                    
                # Log de resumo para depuração
                found_fields = [k for k, v in final_mapped_results.items() if v != "Não encontrado"]
                logger.info(f"[PDF] Extração digital concluída: {len(found_fields)} de {len(self.field_map)} campos identificados.")
                
                return final_mapped_results

        except Exception as e:
            logger.error(f"Erro na extração inteligente: {str(e)}")
            return {"error": str(e)}

    def _find_checkbox_value(self, words, label):
        """
        Localiza o texto associado à checkbox marcada (X) na mesma linha do label.
        Ex: OCP [X] A/P [ ] N/A -> Retorna "A/P"
        """
        label_instances = self._get_label_instances(words, label)
        if not label_instances: return None

        target_label = label_instances[-1]
        y_center = (target_label['top'] + target_label['bottom']) / 2
        
        # Busca todas as palavras na mesma linha após o label
        line_words = [w for w in words if abs(((w['top']+w['bottom'])/2) - y_center) < 5 and w['x0'] > target_label['x1']]
        line_words.sort(key=lambda x: x['x0'])

        for i, word in enumerate(line_words):
            # Se a palavra é um marcador (X), o valor é a próxima palavra
            if word['text'].upper() in self.check_markers:
                if i + 1 < len(line_words):
                    return line_words[i+1]['text']
        
        return None

    def _find_value_near_label(self, words, label):
        label_instances = self._get_label_instances(words, label)
        if not label_instances: return None

        target_label = label_instances[-1]
        y_center = (target_label['top'] + target_label['bottom']) / 2
        x_end = target_label['x1']

        nearby_values = []
        for word in words:
            word_y_center = (word['top'] + word['bottom']) / 2
            if abs(word_y_center - y_center) < 5 and word['x0'] > x_end:
                nearby_values.append(word)

        nearby_values.sort(key=lambda x: x['x0'])
        
        value_words = []
        last_x = x_end
        for v in nearby_values:
            if v['x0'] - last_x < 150:
                value_words.append(v['text'])
                last_x = v['x1']
            else:
                break

        return " ".join(value_words) if value_words else None

    def _get_label_instances(self, words, label):
        """Helper para localizar coordenadas do label no conjunto de palavras."""
        parts = label.lower().split()
        instances = []
        for i, word in enumerate(words):
            if word['text'].lower().replace(':', '') == parts[0]:
                match = True
                for j, part in enumerate(parts[1:]):
                    if i+j+1 >= len(words) or words[i+j+1]['text'].lower().replace(':', '') != part:
                        match = False
                        break
                if match:
                    instances.append(words[i + len(parts) - 1])
        return instances

if __name__ == "__main__":
    extractor = PDFExtractService()
    test_path = "storage/uploads/capa.pdf"
    if os.path.exists(test_path):
        print(extractor.extract_data(test_path))
