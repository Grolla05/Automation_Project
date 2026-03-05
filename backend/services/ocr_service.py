import os
import logging
from PIL import Image, ImageOps, ImageEnhance
import pytesseract
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
        - Conversão para Grayscale (Escala de Cinza)
        - Aumento de Contraste
        """
        try:
            # Converte para escala de cinza
            grayscale_img = ImageOps.grayscale(image)
            
            # Melhora o contraste (fator 2.0 para realçar caracteres)
            enhancer = ImageEnhance.Contrast(grayscale_img)
            processed_img = enhancer.enhance(2.0)
            
            return processed_img
        except Exception as e:
            logger.error(f"Erro no pré-processamento da imagem: {str(e)}")
            return image

    def process_image(self, file_path):
        """
        Processa um único arquivo de imagem.
        Utilizado para compatibilidade e testes individuais.
        """
        try:
            with Image.open(file_path) as img:
                img = self._preprocess_image(img)
                # OCR com suporte a Português e Inglês
                text = pytesseract.image_to_string(img, lang='por+eng')
                return text.strip()
        except Exception as e:
            logger.error(f"Erro ao ler imagem {file_path}: {str(e)}")
            raise

    def process_pdf(self, file_path):
        """
        Converte cada página de um PDF em imagem e realiza o OCR.
        """
        try:
            logger.info(f"Convertendo PDF para imagens: {file_path}")
            # Tenta converter usando o poppler_path configurado
            pages = convert_from_path(file_path, poppler_path=self.poppler_path)
            
            full_text = []
            for i, page in enumerate(pages):
                logger.info(f"Processando página {i+1}/{len(pages)} do PDF...")
                processed_page = self._preprocess_image(page)
                text = pytesseract.image_to_string(processed_page, lang='por+eng')
                
                page_content = f"--- [Arquivo: {os.path.basename(file_path)} | Página {i+1}] ---\n"
                page_content += text.strip()
                full_text.append(page_content)
                
            return "\n\n".join(full_text)
        except Exception as e:
            logger.error(f"Falha ao processar PDF {file_path}: {str(e)}")
            raise

    def process_batch(self, file_paths):
        """
        Método Principal: Processa uma lista de caminhos de arquivos.
        
        Args:
            file_paths (list): Lista de strings com os caminhos completos dos arquivos.
            
        Returns:
            dict: Dicionário onde a chave é o nome do arquivo e o valor é o texto extraído.
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
                    extracted_text = self.process_image(path)
                elif ext == '.pdf':
                    extracted_text = self.process_pdf(path)
                else:
                    logger.warning(f"Extensão {ext} não é suportada diretamente pelo OCRService.")
                    extracted_text = f"ERRO: Formato {ext} não suportado."

                batch_results[file_name] = extracted_text
                logger.info(f"--- Sucesso ao processar: {file_name}")

            except Exception as e:
                # Captura erro por arquivo sem interromper o lote
                logger.error(f"Erro ao processar o arquivo {file_name}: {str(e)}")
                batch_results[file_name] = f"ERRO DURANTE OCR: {str(e)}"

        logger.info("Processamento em lote finalizado.")
        return batch_results
