# Configuração de Tags de Imagem por Layout
LAYOUT_IMAGE_CONFIG = {
    'ASE_SH': [
        '[logo_fabricante]',
        '[foto_embalagem]',
        '[foto_amostra]',
        '[foto_lacre_OCP]',
        '[foto_embalagem_transporte]',
        '[foto_embalagem_secundaria]',
        '[foto_etiqueta_amostra]'
    ],
    'DEFAULT': [
        '[IMAGEM_UPLOAD]'
    ]
}

def get_image_tags(layout_name=None, sufixo=""):
    """
    Retorna a lista de tags que sinalizam a inserção de imagens no relatório,
    baseado no layout selecionado.
    """
    normalized_name = str(layout_name).upper().replace('_LAYOUT', '') if layout_name else "DEFAULT"
    
    # Identifica se é do tipo ASE
    if "ASE_SH" in normalized_name:
        tags_base = LAYOUT_IMAGE_CONFIG['ASE_SH']
    else:
        # Busca a lista de tags para o layout ou usa o padrão
        tags_base = LAYOUT_IMAGE_CONFIG.get(normalized_name, LAYOUT_IMAGE_CONFIG['DEFAULT'])
    
    # Aplica o sufixo numérico em cada tag (ex: [IMAGEM_UPLOAD] -> [IMAGEM_UPLOAD1])
    # Mantém a tag original se não houver sufixo
    if not sufixo:
        return tags_base
        
    return [t.replace(']', f'{sufixo}]') for t in tags_base]
