import re

def get_text_tags(nome_arquivo, texto_extraido, layout_name=None, sufixo=""):
    """
    Retorna o dicionário de mapeamento de tags de texto para substituição no layout Word.
    """
    # 1. Tags Padrões (Aplicáveis a todos os layouts)
    tags = {
        f'[NOME_ARQUIVO_UPLOAD{sufixo}]': nome_arquivo,
        f'[DADOS_CAPTURADOS_ARQUIVO_UPLOAD{sufixo}]': texto_extraido,
        f'[INSERIR_DADO_FOTO{sufixo}]': texto_extraido,
        f'[DADO_EXTRAIDO_1{sufixo}]': texto_extraido,
        '{{CONTEUDO}}': texto_extraido
    }
    
    # Normalização para comparação robusta
    normalized_name = str(layout_name).upper().replace('_LAYOUT', '') if layout_name else ""

    # 2. Despachante de Regra por Layout
    if 'TESTE1' in normalized_name or 'TESTE2' in normalized_name:
        # Testes 1 e 2 / Analisador de Espectro necessitam das tags extraídas avançadas.
        advanced_tags = extract_advanced_metrics(texto_extraido)
        
        # Limpa as variáveis padrões que despejam o texto bruto inteiro do OCR
        # Assim, garantimos que nenhum texto "a mais" (sujeira) vaze para o Word
        tags[f'[DADOS_CAPTURADOS_ARQUIVO_UPLOAD{sufixo}]'] = ""
        tags[f'[INSERIR_DADO_FOTO{sufixo}]'] = ""
        tags[f'[DADO_EXTRAIDO_1{sufixo}]'] = ""
        tags['{{CONTEUDO}}'] = ""
        
        # Insere as tags mesclando com o sufixo numérico de arquivo (ex: [FREQ_EXTRAIDA1])
        if sufixo:
            for k, v in advanced_tags.items():
                tags[k.replace(']', f'{sufixo}]')] = v
        else:
            tags.update(advanced_tags)
        
    else:
        # Fallback genérico para os demais layouts
        pass
    
    return tags

# Configuração de Tags de Imagem por Layout
LAYOUT_IMAGE_CONFIG = {
    'ASE': [
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
    if "ASE" in normalized_name or "AGULHA_HIPODERMICA" in normalized_name:
        tags_base = LAYOUT_IMAGE_CONFIG['ASE']
    else:
        # Busca a lista de tags para o layout ou usa o padrão
        tags_base = LAYOUT_IMAGE_CONFIG.get(normalized_name, LAYOUT_IMAGE_CONFIG['DEFAULT'])
    
    # Aplica o sufixo numérico em cada tag (ex: [IMAGEM_UPLOAD] -> [IMAGEM_UPLOAD1])
    # Mantém a tag original se não houver sufixo
    if not sufixo:
        return tags_base
        
    return [t.replace(']', f'{sufixo}]') for t in tags_base]
