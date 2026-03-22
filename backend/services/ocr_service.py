import os
import logging
from datetime import datetime
from PIL import Image, ImageOps, ImageEnhance, ImageDraw
import pytesseract
from pytesseract import Output
from pdf2image import convert_from_path
from utils.logger_config import setup_logger

# Inicializa o logger para uso no serviço
logger = setup_logger()

class OCRService:
    """
    Serviço especializado em Reconhecimento Óptico de Caracteres (OCR).
    Suporta imagens (PNG, JPG, BMP) e arquivos PDF.
    """

    def __init__(self):
        # --- CONFIGURAÇÕES WINDOWS ---
        # Ajuste o caminho para o executável do Tesseract no seu ambiente
        # Exemplo padrão: r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        self.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Ajuste o caminho para a pasta 'bin' do Poppler (necessário para pdf2image no Windows)
        # Exemplo: r'C:\poppler\bin'
        self.poppler_path = r'C:\poppler\Release-25.12.0-0\poppler-25.12.0\Library\bin'
        
        # Configura o engine do Tesseract
        if os.path.exists(self.tesseract_cmd):
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd
        else:
            logger.warning(f"Aviso: Tesseract não encontrado em {self.tesseract_cmd}. "
                           "Verifique o caminho ou certifique-se de que está no PATH do sistema.")

    def _preprocess_image(self, image):
        """
        Aplica técnicas de pré-processamento para melhorar a precisão do OCR.
        - Redimensionamento (Scale Up)
        - Conversão para Grayscale (Escala de Cinza)
        - Aumento de Contraste
        """
        try:
            # Redimensiona a imagem (dobra o tamanho). Ajuda o Tesseract a ler letras finas ou pequenas.
            width, height = image.size
            if hasattr(Image, 'Resampling'):
                resampler = Image.Resampling.LANCZOS
            else:
                resampler = Image.LANCZOS # Compatibilidade com PIL mais antigo
            
            scaled_img = image.resize((width * 2, height * 2), resampler)
            
            # Converte para escala de cinza
            grayscale_img = ImageOps.grayscale(scaled_img)
            
            # Melhora o contraste (fator 2.0 para realçar caracteres)
            enhancer = ImageEnhance.Contrast(grayscale_img)
            processed_img = enhancer.enhance(2.0)
            
            return processed_img
        except Exception as e:
            logger.error(f"Erro no pré-processamento da imagem: {str(e)}")
            return image

    def _find_anchor(self, data, patterns):
        """
        Busca as coordenadas de uma palavra (âncora) no dicionário de dados do OCR.
        Retorna (x, y, w, h) ou None.
        """
        import re
        if not data or 'text' not in data:
            return None
            
        for i, text in enumerate(data['text']):
            # Limpa o texto e compara (ignorando maiúsculas/minúsculas)
            clean_text = text.strip()
            for pattern in patterns:
                if re.search(pattern, clean_text, re.IGNORECASE) and len(clean_text) > 2:
                    return {
                        'x': data['left'][i],
                        'y': data['top'][i],
                        'w': data['width'][i],
                        'h': data['height'][i]
                    }
        return None

    def _save_debug_pdf_regions(self, page_img, file_path, page_num, anchor_boxes=None, value_boxes=None):
        """
        Versão especializada do debug para as ROIs de PDF.
        Desenha as áreas de busca de âncoras e as áreas de extração de valores detectadas.
        """
        try:
            os.makedirs('storage/debug', exist_ok=True)
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            timestamp = datetime.now().strftime("%H%M%S")
            debug_name = f"{base_name}_pg{page_num}_{timestamp}_debug.png"
            debug_path = os.path.join('storage/debug', debug_name)

            debug_img = page_img.convert("RGB")
            draw = ImageDraw.Draw(debug_img)

            # Desenha Caixas de Busca de Âncora (Azul - Estático/Busca)
            if anchor_boxes:
                for coords in anchor_boxes:
                    draw.rectangle(coords, outline=(40, 120, 255), width=4) # Azul

            # Desenha Caixas de Valores Extraídos (Verde - Dinâmico/Resultado)
            if value_boxes:
                for coords in value_boxes:
                    draw.rectangle(coords, outline=(40, 220, 80), width=6) # Verde

            debug_img.save(debug_path)
            logger.info(f"[DEBUG PDF] Mapeamento de regiões salvo: {debug_path}")
        except Exception as e:
            logger.warning(f"Erro ao salvar debug do PDF: {str(e)}")

    def process_pdf(self, file_path, layout_name=None):
        """
        Converte cada página de um PDF em imagem e realiza o OCR.
        Yields progress and returns full text.
        """
        try:
            logger.info(f"Convertendo PDF para imagens: {file_path}")
            yield {"progress": 10, "message": f"Convertendo {os.path.basename(file_path)}"}
                
            pages = convert_from_path(file_path, poppler_path=self.poppler_path)
            
            full_text = []
            custom_config = r'--oem 3 --psm 6'
            
            ANCHOR_SEARCH_AREAS = {
                "Data Recebimento":    {"roi": [0.05, 0.00, 0.35, 0.15], "patterns": ["Data", "recebimento"]},
                "Liberada":            {"roi": [0.25, 0.00, 0.55, 0.15], "patterns": ["Liberada"]},
                "AWB":                 {"roi": [0.05, 0.12, 0.45, 0.25], "patterns": ["AWB"]},
                "Volume":              {"roi": [0.35, 0.12, 0.65, 0.25], "patterns": ["Volume"]},
                "Etiqueta Embalagem":  {"roi": [0.05, 0.22, 0.55, 0.35], "patterns": ["Etiqueta", "embalagem"]},
                "Etiqueta Amostras":   {"roi": [0.45, 0.22, 0.95, 0.35], "patterns": ["Etiqueta", "amostras"]},
                "Ensaios Direto":      {"roi": [0.05, 0.32, 0.55, 0.45], "patterns": ["Ensaios", "direto"]},
                "Ordem de Venda":      {"roi": [0.45, 0.32, 0.95, 0.45], "patterns": ["Ordem", "venda"]},
                "Projeto":             {"roi": [0.05, 0.42, 0.95, 0.55], "patterns": ["Projeto"]},
                "Data Aceite":         {"roi": [0.05, 0.52, 0.45, 0.65], "patterns": ["Data", "aceite"]},
                "Solicitante":         {"roi": [0.35, 0.52, 0.95, 0.65], "patterns": ["Solicitante"]},
                "Código SAP":          {"roi": [0.05, 0.62, 0.55, 0.75], "patterns": ["Código", "SAP"]},
                "Fabricante":          {"roi": [0.45, 0.62, 0.95, 0.75], "patterns": ["Fabricante"]},
                "Teste":               {"roi": [0.05, 0.72, 0.95, 0.85], "patterns": ["Teste"]},
            }

            for i, page in enumerate(pages):
                yield {"progress": 20 + int((i/len(pages))*40), "message": f"OCR Página {i+1}/{len(pages)}"}
                
                width, height = page.size
                page_results = [f"--- [Página {i+1}] ---"]
                anchor_debug_areas = []
                value_debug_areas = []

                if i == 0:
                    ocr_data = pytesseract.image_to_data(page, lang='por+eng', output_type=Output.DICT)
                    for label, config in ANCHOR_SEARCH_AREAS.items():
                        c = config["roi"]
                        anchor_debug_areas.append((int(c[0]*width), int(c[1]*height), int(c[2]*width), int(c[3]*height)))
                        anchor_pos = self._find_anchor(ocr_data, config["patterns"])
                        if anchor_pos:
                            x, y, w, h = anchor_pos['x'], anchor_pos['y'], anchor_pos['w'], anchor_pos['h']
                            dynamic_value_roi = (x + w + 5, y - 10, x + w + 500, y + h + 10)
                            value_debug_areas.append(dynamic_value_roi)
                            value_img = page.crop(dynamic_value_roi)
                            value_text = pytesseract.image_to_string(self._preprocess_image(value_img), lang='por+eng', config=r'--oem 3 --psm 7').strip()
                            if value_text:
                                page_results.append(f"{label}: {value_text}")
                        else:
                            coords = config["roi"]
                            left, top, right, bottom = int(coords[0]*width), int(coords[1]*height), int(coords[2]*width), int(coords[3]*height)
                            fallback_img = page.crop((left, top, right, bottom))
                            text = pytesseract.image_to_string(self._preprocess_image(fallback_img), lang='por+eng', config=custom_config).strip()
                            if text:
                                page_results.append(f"{label} (Estático): {text}")
                    self._save_debug_pdf_regions(page, file_path, i+1, anchor_debug_areas, value_debug_areas)

                full_page_text = pytesseract.image_to_string(self._preprocess_image(page), lang='por+eng', config=r'--oem 3 --psm 11')
                page_results.append("\n[Texto Completo]:")
                page_results.append(full_page_text.strip())
                full_text.append("\n".join(page_results))
                
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"Falha ao processar PDF {file_path}: {str(e)}")
            raise

    def process_batch(self, file_paths, layout_name=None):
        """
        Método Principal: Processa uma lista de caminhos de arquivos.
        Yields progress messages.
        """
        if not file_paths:
            return {}

        batch_results = {}
        for i, path in enumerate(file_paths):
            file_name = os.path.basename(path)
            yield {"progress": 10 + int((i/len(file_paths))*80), "message": f"Iniciando OCR: {file_name}"}
            
            try:
                if not os.path.exists(path):
                    batch_results[file_name] = "ERRO: Arquivo não encontrado."
                    continue

                ext = os.path.splitext(path)[1].lower()
                if ext == '.pdf':
                    # Usamos yield from para repassar o progresso do PDF
                    # Para pegar o retorno, usamos a sintaxe do Python 3.3+
                    extracted_text = yield from self.process_pdf(path, layout_name)
                else:
                    extracted_text = f"ERRO: Formato {ext} não suportado."

                batch_results[file_name] = extracted_text
            except Exception as e:
                logger.error(f"Erro ao processar o arquivo {file_name}: {str(e)}")
                batch_results[file_name] = f"ERRO: {str(e)}"

        return batch_results
