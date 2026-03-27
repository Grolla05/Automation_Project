import os
import shutil
import logging
import re
from typing import List, Dict
from werkzeug.utils import secure_filename

logger = logging.getLogger("OCR_Automation")

# Mapeamento de Palavras-Chave para Tags do Backend
# IMPORTANTE: A ordem importa! Coloque os termos mais específicos primeiro.
IMAGE_TAG_RULES = {
    'foto_embalagem_transporte': ('[foto_embalagem_transporte]', ['transporte', 'shipping', 'externa']),
    'foto_embalagem_secundaria': ('[foto_embalagem_secundaria]', ['secundaria', 'interna']),
    'foto_embalagem': ('[foto_embalagem]', ['embalagem', 'caixa', 'pacote', 'box']),
    'logo_fabricante': ('[logo_fabricante]', ['logo', 'logotipo', 'marca']),
    'foto_lacre_OCP': ('[foto_lacre_OCP]', ['lacre', 'ocp', 'selo']),
    'foto_etiqueta_amostra': ('[foto_etiqueta_amostra]', ['etiqueta', 'label', 'tag', 'infos']),
    'foto_amostra': ('[foto_amostra]', ['amostra', 'item', 'sample', 'foto_amostra']),
}

class FileHandler:
    def __init__(self):
        self.upload_dir = 'storage/uploads'
        self.export_dir = 'storage/exports'
        self.allowed_extensions = {'.png', '.jpg', '.jpeg', '.pdf', '.bmp', '.webp'}

    def identify_image_tag(self, filename: str, used_tags: set) -> str:
        """
        Analisa o nome real do arquivo e tenta encontrar a melhor Tag correspondente.
        Leva em conta as tags que já foram usadas para evitar duplicatas.
        """
        name_clean = os.path.splitext(filename.lower())[0]
        name_clean = re.sub(r'[^a-z0-9]', '_', name_clean)

        for tag_key, (tag_value, keywords) in IMAGE_TAG_RULES.items():
            # Se a tag já foi "consumida" por outro arquivo, pula para a próxima regra
            if tag_value in used_tags:
                continue

            for kw in keywords:
                if kw in name_clean:
                    logger.info(f"Tag identificada: {filename} -> {tag_value} (KW: {kw})")
                    return tag_value

        return secure_filename(filename)

    def map_files_to_tags(self, file_paths: List[str]) -> Dict[str, str]:
        """
        Recebe uma lista de caminhos e retorna um mapeamento único.
        Garante que cada Tag de regra seja usada apenas uma vez por job.
        """
        mapping = {}
        used_tags = set()
        
        # Ordenar caminhos para garantir consistência (opcional)
        sorted_paths = sorted(file_paths)

        for path in sorted_paths:
            filename = os.path.basename(path)
            ext = os.path.splitext(filename)[1].lower()
            
            if ext in {'.png', '.jpg', '.jpeg', '.webp', '.bmp'}:
                tag = self.identify_image_tag(filename, used_tags)
                mapping[filename] = tag
                
                # Se identificamos uma tag do dicionário, marcamos como usada
                if tag.startswith('['):
                    used_tags.add(tag)
            else:
                mapping[filename] = filename
                
        return mapping

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