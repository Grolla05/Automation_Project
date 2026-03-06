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

def get_text_tags(nome_arquivo, texto_extraido, layout_name=None):
    """
    Retorna o dicionário de mapeamento de tags de texto para substituição no layout Word.
    """
    # 1. Tags Padrões (Aplicáveis a todos os layouts)
    tags = {
        '[NOME_ARQUIVO_UPLOAD]': nome_arquivo,
        '[DADOS_CAPTURADOS_ARQUIVO_UPLOAD]': texto_extraido,
        '[INSERIR_DADO_FOTO]': texto_extraido,
        '[DADO_EXTRAIDO_1]': texto_extraido,
        '{{CONTEUDO}}': texto_extraido
    }
    
    # Normalização para comparação robusta
    normalized_name = str(layout_name).upper().replace('_LAYOUT', '') if layout_name else ""

    # 2. Despachante de Regra por Layout
    if normalized_name == 'TESTE1':
        # Para TESTE1, o comportamento padrão atual atende, mas aqui futuramente você adiciona regras específicas.
        pass
        
    elif normalized_name == 'TESTE2':
        # Teste 2 / Analisador de Espectro necessita das tags estraídas avançadas.
        advanced_tags = extract_advanced_metrics(texto_extraido)
        tags.update(advanced_tags)
        
    else:
        # Fallback genérico para os demais layouts
        pass
    
    return tags

def get_image_tags():
    """
    Retorna a lista de tags que sinalizam a inserção de imagens no relatório.
    """
    return [
        '[IMAGEM_UPLOAD]',
        '[IMAGEM_UPLOAD_ANEXADA]'
    ]
