import os
import shutil
import logging

logger = logging.getLogger("OCR_Automation")

class FileHandler:
    def __init__(self):
        self.upload_dir = 'storage/uploads'
        self.export_dir = 'storage/exports'
        self.allowed_extensions = {'.png', '.jpg', '.jpeg', '.pdf', '.bmp'}

    def ensure_directories(self):
        """Garante que a estrutura de pastas storage/ existe."""
        for directory in [self.upload_dir, self.export_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory)
                logger.info(f"Diretório criado: {directory}")

    def is_allowed(self, filename):
        """Verifica se a extensão do arquivo é suportada."""
        ext = os.path.splitext(filename)[1].lower()
        return ext in self.allowed_extensions

    def get_upload_files(self):
        """Retorna a lista de caminhos completos dos arquivos para processar."""
        files = [
            os.path.join(self.upload_dir, f) 
            for f in os.listdir(self.upload_dir) 
            if self.is_allowed(f)
        ]
        return files

    def clear_uploads(self):
        """Limpa a pasta de uploads após o processamento (opcional)."""
        try:
            for filename in os.listdir(self.upload_dir):
                file_path = os.path.join(self.upload_dir, filename)
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            logger.info("Pasta de uploads limpa com sucesso.")
        except Exception as e:
            logger.error(f"Erro ao limpar uploads: {e}")