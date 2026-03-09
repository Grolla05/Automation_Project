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

    def _save_debug_image(self, img, file_path, boxes=None):
        """
        Salva a imagem com retângulos e um grid de calibração para facilitar o ajuste.
        """
        try:
            os.makedirs('storage/debug', exist_ok=True)
            base_name  = os.path.splitext(os.path.basename(file_path))[0]
            timestamp  = datetime.now().strftime("%H%M%S")
            debug_name = f"{base_name}_{timestamp}_debug.png"
            debug_path = os.path.join('storage/debug', debug_name)

            debug_img = img.convert("RGB")
            draw = ImageDraw.Draw(debug_img)
            width, height = debug_img.size

            if boxes:
                COLOR_MAP = {
                    "red":    (255,  40,  40),
                    "blue":   ( 40, 120, 255),
                    "green":  ( 40, 220,  80),
                    "orange": (255, 160,   0),
                }
                for coords, color in boxes:
                    rgb = COLOR_MAP.get(color, (255, 255, 0))
                    draw.rectangle(coords, outline=rgb, width=6)
                logger.info(f"[DEBUG] {len(boxes)} box(es) desenhada(s) com Grid de Calibração.")

            debug_img.save(debug_path)
            logger.info(f"Imagem de diagnóstico salva (Com Grid 10%): {debug_path}")
        except Exception as e:
            logger.warning(f"Não foi possível salvar imagem de diagnóstico: {str(e)}")


    def process_image(self, file_path, layout_name=None):
        """
        Processa um único arquivo de imagem aplicando CORTES (ROI) dinâmicos.
        """
        try:
            with Image.open(file_path) as img:
                custom_config = r'--oem 3 --psm 11'
                
                # Normalização para comparação robusta (ex: 'teste2_layout' -> 'TESTE2')
                normalized_name = str(layout_name).upper().replace('_LAYOUT', '') if layout_name else ""
                
                # Filtro de Região de Interesse (ROI) para TESTE1 e TESTE2
                if normalized_name in ['TESTE1', 'TESTE2']:
                    width, height = img.size
                    
                    # --- PASSO 1: LOCALIZAÇÃO DE ÂNCORAS ---
                    # Fazemos uma leitura rápida dos metadados da imagem
                    ocr_data = pytesseract.image_to_data(img, lang='eng', output_type=Output.DICT)
                    
                    # Buscamos as âncoras primárias
                    anchor_freq  = self._find_anchor(ocr_data, ["Frequency", "uency", "quency"])
                    anchor_level = self._find_anchor(ocr_data, ["Level", "Bargraph", "Marker"])
                    anchor_start = self._find_anchor(ocr_data, ["Start"])
                    anchor_stop  = self._find_anchor(ocr_data, ["Stop"])

                    # --- PASSO 2: DEFINIÇÃO DE ROIs RELATIVAS ---
                    # Se não encontrar a âncora, usamos o fallback estático anterior

                    # BOX FREQUENCY: À direita da palavra 'Frequency'
                    if anchor_freq:
                        x, y, w, h = anchor_freq['x'], anchor_freq['y'], anchor_freq['w'], anchor_freq['h']
                        # Aumentado a altura em +35px (no fundo) e largura em +20px à direita
                        freq_roi = (x + w, y - 60, x + w + 900, y + h + 60)
                    else:
                        freq_roi = (int(width * 0.35), int(height * 0.10), int(width * 0.88), int(height * 0.20))

                    # BOX LEVELS: Abaixo da palavra 'Level' ou 'Bargraph'
                    if anchor_level:
                        x, y, w, h = anchor_level['x'], anchor_level['y'], anchor_level['w'], anchor_level['h']
                        # '0' faz a box começar no limite da lateral esquerda
                        levels_roi = (0, y + h + 5, x + 550, y + h + 250)
                    else:
                        levels_roi = (0, int(height * 0.15), int(width * 0.45), int(height * 0.38))

                    # BOX START / STOP
                    if anchor_start:
                        x, y, w, h = anchor_start['x'], anchor_start['y'], anchor_start['w'], anchor_start['h']
                        # 'y + h + 10' para igualar a altura com a box orange (Stop)
                        start_roi = (x - 10, y - 5, x + w + 300, y + h + 10)
                    else:
                        start_roi = (int(width * 0), int(height * 0.75), int(width * 0.25), int(height * 0.96))

                    if anchor_stop:
                        x, y, w, h = anchor_stop['x'], anchor_stop['y'], anchor_stop['w'], anchor_stop['h']
                        stop_roi = (x + w + 5, y - 5, x + w + 250, y + h + 10)
                    else:
                        stop_roi = (int(width * 0.45), int(height * 0.88), int(width * 0.95), int(height * 0.96))

                    # Recorte das fatias
                    box_levels = img.crop(levels_roi)
                    box_freq   = img.crop(freq_roi)
                    box_start  = img.crop(start_roi)
                    box_stop   = img.crop(stop_roi)
                    
                    # OCR das Fatias
                    text_levels = pytesseract.image_to_string(self._preprocess_image(box_levels), lang='por+eng', config=custom_config)
                    text_freq   = pytesseract.image_to_string(self._preprocess_image(box_freq),   lang='por+eng', config=custom_config)
                    text_start  = pytesseract.image_to_string(self._preprocess_image(box_start),  lang='por+eng', config=custom_config)
                    text_stop   = pytesseract.image_to_string(self._preprocess_image(box_stop),   lang='por+eng', config=custom_config)
                    
                    logger.info("--- [ANCHOR TESTE2] OCR Baseado em Âncoras de Texto (Ajustado) ---")
                    
                    # Diagnóstico Visual
                    self._save_debug_image(img, file_path, boxes=[
                        (levels_roi[:2] + levels_roi[2:], "red"),
                        (freq_roi[:2]   + freq_roi[2:],   "blue"),
                        (start_roi[:2]  + start_roi[2:],  "green"),
                        (stop_roi[:2]   + stop_roi[2:],   "orange"),
                    ])
                    
                    return f"{text_freq.strip()}\n{text_levels.strip()}\n{text_start.strip()}\n{text_stop.strip()}"

                # Fluxo Padrão (Lê a Imagem Inteira)
                # Salva a imagem com uma box de contorno total como referência visual
                width, height = img.size
                self._save_debug_image(img, file_path, boxes=[([(0, 0), (width-1, height-1)], "blue")])
                img = self._preprocess_image(img)
                text = pytesseract.image_to_string(img, lang='por+eng', config=custom_config)
                return text.strip()
        except Exception as e:
            logger.error(f"Erro ao ler imagem {file_path}: {str(e)}")
            raise

    def process_pdf(self, file_path, layout_name=None):
        """
        Converte cada página de um PDF em imagem e realiza o OCR.
        """
        try:
            logger.info(f"Convertendo PDF para imagens: {file_path}")
            # Tenta converter usando o poppler_path configurado
            pages = convert_from_path(file_path, poppler_path=self.poppler_path)
            
            full_text = []
            custom_config = r'--oem 3 --psm 11'
            for i, page in enumerate(pages):
                logger.info(f"Processando página {i+1}/{len(pages)} do PDF...")
                processed_page = self._preprocess_image(page)
                text = pytesseract.image_to_string(processed_page, lang='por+eng', config=custom_config)
                
                page_content = f"--- [Arquivo: {os.path.basename(file_path)} | Página {i+1}] ---\n"
                page_content += text.strip()
                full_text.append(page_content)
                
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"Falha ao processar PDF {file_path}: {str(e)}")
            raise

    def process_batch(self, file_paths, layout_name=None):
        """
        Método Principal: Processa uma lista de caminhos de arquivos.
        
        Args:
            file_paths (list): Lista de strings com os caminhos completos.
            layout_name (str): Tipo do teste/layout para filtros visuais.
        """
        logger.info(f"Iniciando processamento em lote de {len(file_paths)} arquivos.")
        batch_results = {}

        for path in file_paths:
            file_name = os.path.basename(path)
            logger.info(f">>> Processando: {file_name}")
            
            try:
                # Verifica se o arquivo existe
                if not os.path.exists(path):
                    logger.error(f"Arquivo não encontrado: {path}")
                    batch_results[file_name] = "ERRO: Arquivo físico não encontrado no servidor."
                    continue

                # Identifica extensão
                ext = os.path.splitext(path)[1].lower()
                
                # Processamento baseado no tipo de arquivo
                if ext in ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']:
                    extracted_text = self.process_image(path, layout_name)
                elif ext == '.pdf':
                    extracted_text = self.process_pdf(path, layout_name)
                else:
                    logger.warning(f"Extensão {ext} não é suportada diretamente pelo OCRService.")
                    extracted_text = f"ERRO: Formato {ext} não suportado."

                batch_results[file_name] = extracted_text
                logger.info(f"--- Sucesso ao processar: {file_name}")
                ## Retirar depois dos testes para deixar o arquivo de log mais coeso, organizado e agradável de se analisar
                logger.info(f"--- Dados extraídos do arquivo [{file_name}]:\n{extracted_text}\n{'='*50}")

            except Exception as e:
                # Captura erro por arquivo sem interromper o lote
                logger.error(f"Erro ao processar o arquivo {file_name}: {str(e)}")
                batch_results[file_name] = f"ERRO DURANTE OCR: {str(e)}"

        logger.info("Processamento em lote finalizado.")
        return batch_results
