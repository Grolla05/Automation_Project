import re

def extract_advanced_metrics(text):
    """
    Tenta capturar métricas específicas do OCR baseadas em padrões de relatórios de espectro (como o TESTE2).
    """
    mapped_data = {}
    
    # -------------------------------------------------------------------------
    # FREQUÊNCIA
    # Tolerância a:
    #   - Palavra cortada: "uency", "quency", "Frequency", "Freauency", etc.
    #   - Números com muitas casas decimais: 10.5180000
    #   - Espaços entre o número e a unidade
    # Ex OCR real: "uency 10.5180000 MHz"
    # -------------------------------------------------------------------------
    freq_match = re.search(
        r'(?:fr?e?[qg]?[ue]+ency|uency|quency)?\s*[^\d]{0,10}([\d]+[.,][\d]+)\s*(MHz|kHz|Hz|GHz)?',
        text,
        re.IGNORECASE
    )
    if freq_match:
        # Normaliza separador decimal (vírgula -> ponto) e formata com 4 casas
        raw_val = freq_match.group(1).replace(',', '.')
        try:
            freq_val = f"{float(raw_val):.4f}"
        except ValueError:
            freq_val = raw_val
        mapped_data['[FREQ_EXTRAIDA]'] = freq_val
    else:
        mapped_data['[FREQ_EXTRAIDA]'] = "N/A"

    # -------------------------------------------------------------------------
    # MAX PEAK
    # -------------------------------------------------------------------------
    mp_match = re.search(r'Max\s*Peak[^\d]*([\d]+[.,][\d]+)', text, re.IGNORECASE)
    if mp_match:
        mapped_data['[MAX_PEAK_EXTRAIDO]'] = mp_match.group(1).replace(',', '.')
    else:
        mapped_data['[MAX_PEAK_EXTRAIDO]'] = "N/A"

    # -------------------------------------------------------------------------
    # QUASIPEAK — Estratégia dupla:
    #
    # 1ª) Busca pelo RÓTULO (padrão ideal): "Quasipeak", "Ouasipeak", etc.
    # 2ª) POSICIONAL (fallback para TESTE2): o OCR não imprime o rótulo.
    #     O Quasipeak é o 1º número decimal solto que aparece APÓS o bloco
    #     do Max Peak e ANTES do bloco do CISPR Average no texto.
    # -------------------------------------------------------------------------
    qp_match = re.search(
        r'[QqOo0]uasi[\s-]*[Pp]eak[^\d]*([\d]+[.,][\d]+)',
        text,
        re.IGNORECASE
    )
    if qp_match:
        mapped_data['[QUASIPEAK_EXTRAIDO]'] = qp_match.group(1).replace(',', '.')
    else:
        # --- Fallback Posicional ---
        # Encontra a posição do fim do bloco Max Peak no texto
        mp_pos_match = re.search(r'Max\s*Peak[^\d]*[\d]+[.,][\d]+', text, re.IGNORECASE)
        # Encontra a posição de início do bloco CISPR Average no texto
        cispr_pos_match = re.search(r'CISPR\s*Average', text, re.IGNORECASE)

        if mp_pos_match and cispr_pos_match:
            # Fatia o texto entre os dois blocos
            start_pos = mp_pos_match.end()
            end_pos   = cispr_pos_match.start()
            segment   = text[start_pos:end_pos]

            # Captura o primeiro número decimal no segmento (ignora lixo de OCR)
            qp_positional = re.search(r'\b([\d]{2,}[.,][\d]+)\b', segment)
            if qp_positional:
                mapped_data['[QUASIPEAK_EXTRAIDO]'] = qp_positional.group(1).replace(',', '.')
            else:
                mapped_data['[QUASIPEAK_EXTRAIDO]'] = "N/A"
        else:
            mapped_data['[QUASIPEAK_EXTRAIDO]'] = "N/A"

    # -------------------------------------------------------------------------
    # CISPR AVERAGE
    # -------------------------------------------------------------------------
    cispr_match = re.search(r'Average[^\d]*([\d]+[.,][\d]+)', text, re.IGNORECASE)
    if cispr_match:
        mapped_data['[CISPR_AVERAGE_EXTRAIDA]'] = cispr_match.group(1).replace(',', '.')
    else:
        mapped_data['[CISPR_AVERAGE_EXTRAIDA]'] = "N/A"

    # -------------------------------------------------------------------------
    # START FREQUENCY
    # -------------------------------------------------------------------------
    start_match = re.search(r'Start[^\d]*([\d]+[.,][\d]+)\s*(kHz|MHz|Hz)?', text, re.IGNORECASE)
    if start_match:
        mapped_data['[FREQ_START_EXTRAIDO]'] = start_match.group(1).replace(',', '.')
    else:
        mapped_data['[FREQ_START_EXTRAIDO]'] = "N/A"

    # -------------------------------------------------------------------------
    # STOP FREQUENCY
    # -------------------------------------------------------------------------
    stop_match = re.search(r'Stop[^\d]*([\d]+[.,][\d]+)\s*(MHz|kHz|Hz)?', text, re.IGNORECASE)
    if stop_match:
        mapped_data['[FREQ_STOP_EXTRAIDO]'] = stop_match.group(1).replace(',', '.')
    else:
        mapped_data['[FREQ_STOP_EXTRAIDO]'] = "N/A"

    return mapped_data

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
    'AGULHA_HIPODERMICA': [
        '[logo_fabricante]',
        '[foto_embalagem]',
        '[foto_amostra]',
        '[foto_lacre_OCP]',
        '[foto_embalagem_transporte]',
        '[foto_embalagem_secundaria]',
        '[foto_etiqueta_amostra]'
    ],
    'TESTE1': [
        '[IMAGEM_UPLOAD]', 
        '[IMAGEM_UPLOAD_ANEXADA]'
    ],
    'TESTE2': [
        '[IMAGEM_UPLOAD]', 
        '[IMAGEM_UPLOAD_ANEXADA]',
    ],
    'DEFAULT': [
        '[IMAGEM_UPLOAD]', 
        '[IMAGEM_UPLOAD_ANEXADA]'
    ]
}

def get_image_tags(layout_name=None, sufixo=""):
    """
    Retorna a lista de tags que sinalizam a inserção de imagens no relatório,
    baseado no layout selecionado.
    """
    normalized_name = str(layout_name).upper().replace('_LAYOUT', '') if layout_name else "DEFAULT"
    
    # Busca a lista de tags para o layout ou usa o padrão
    tags_base = LAYOUT_IMAGE_CONFIG.get(normalized_name, LAYOUT_IMAGE_CONFIG['DEFAULT'])
    
    # Aplica o sufixo numérico em cada tag (ex: [IMAGEM_UPLOAD] -> [IMAGEM_UPLOAD1])
    # Mantém a tag original se não houver sufixo
    if not sufixo:
        return tags_base
        
    return [t.replace(']', f'{sufixo}]') for t in tags_base]
