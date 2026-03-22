# ⚙️ Manual do Backend - OCR, Excel & Document Engine

Este documento serve como o roteiro completo de funcionamento do **coração inteligente** do projeto. O backend é um hub de processamento que transforma dados brutos de arquivos (PDFs, Imagens, Planilhas) em relatórios profissionais formatados em Word (.docx) em segundos.

---

## 🌟 Visão Geral (Para Todos)

Imagine que o backend é um **assistente de laboratório digital**. Ele recebe pilhas de papéis (fotos/PDFs) e planilhas complexas, lê tudo o que é importante, filtra o ruído e preenche um formulário oficial exatamente como um humano faria, mas sem erros e muito mais rápido.

### O Fluxo de 3 Passos:

1. **Entrada**: Você envia arquivos de ensaios (fotos de equipamentos, PDFs da TÜV, planilhas do Excel).
2. **Processamento**: O sistema identifica cada arquivo e usa a "ferramenta certa" (OCR para fotos, Leitura Digital para PDFs, Pandas para Excel).
3. **Saída**: Ele pega um template do Word, substitui as "etiquetas" (ex: `[data_recebimento]`) pelos dados reais e te entrega o relatório pronto.

---

## 🏗️ Arquitetura e Organização (Para Técnicos)

O sistema foi redesenhado para suportar **processamento em background (Async)**, garantindo que a interface do usuário nunca trave durante tarefas pesadas de OCR ou análise de dados.

### 🔄 Fluxo Assíncrono de Jobs

1. **POST `/api/process`**: Recebe os arquivos, valida a segurança e enfileira um **Job ID** único, retornando imediatamente para o frontend.
2. **Background Thread**: Uma thread separada assume o processamento (Extração -> OCR -> Excel -> Word).
3. **GET `/api/status/<job_id>`**: O frontend monitora o progresso (0-100%) e o status (queued, processing, completed, error).

### 📂 Mapa de Pastas

*   **`main.py`**: O orquestrador. Inicia o servidor Flask, configura a janela desktop (PyWebView) e gerencia as rotas da API.
*   **`/services`**: A inteligência de negócio.
    *   `ocr_service.py`: Especialista em "ver" imagens. Usa **Tesseract** e lógica de **Âncoras/ROI** (Região de Interesse) para ler dados em locais específicos do papel.
    *   `pdfExtract_service.py`: Especialista em "ler" PDFs digitais. Possui lógica de **Checkbox Inteligente** para identificar marcações (X, ☑) em formulários.
    *   `excel_service.py` & `/excel_parsers`: Fábrica de processamento de planilhas. Usa o padrão **Factory** para aplicar o script correto para cada tipo de ensaio (ex: ASE).
    *   `document_service.py`: O editor de textos. Usa a biblioteca `python-docx` para injetar dados em templates Word, preservando formatação e aplicando grifos amarelos.
    **`/utils`**: Ferramentas de suporte.
    *   `document_tags.py`: Onde as Expressões Regulares (Regex) moram. Elas limpam o texto "sujo" do OCR e extraem métricas como `Max Peak` e `Quasipeak`.
    *   `cleanup.py` & `scheduler.py`: A faxina automática. Deleta arquivos de upload e exportação antigos para não encher o disco.
    *   `logger_config.py`: Central de logs com rotação automática (10MB) para facilitar o debug sem ocupar espaço infinito.
    **`/storage`**: Onde os arquivos vivem.
    *   `/uploads`: Pastagem temporária de arquivos recebidos.
    *   `/layout`: Onde ficam os modelos `.docx`. **Adicionar um novo layout aqui habilita um novo tipo de relatório no sistema.**
    *   `/exports`: Onde os relatórios prontos são guardados antes do download.

---

## 🛡️ Segurança Blindada (MIME Sanitization)

Diferente de sistemas comuns que olham apenas a extensão do arquivo, nosso backend possui um **interceptador de subida primária**:

1. **Header Peek**: Lê os primeiros 2048 bytes do buffer do arquivo recebido sem corromper o stream.
2. **Magic Numbers**: Usa `python-magic` (libmagic) para identificar o tipo real do arquivo (assinatura binária).
3. **Bloqueio Imediato**: Se um usuário tentar subir um executável (`MZ header`) oculto em um PDF, o sistema estoura uma `SecurityException` e retorna **HTTP 403**.
4. **Validação Cruzada**: Garante que o conteúdo (MIME) condiz com a extensão declarada pelo usuário.

---

## 🚀 Os 4 Pilares de Processamento

### 1. Pilar OCR (Imagens e PDFs Escaneados)

Ideal para fotos de telas de equipamentos ou documentos grampeados.
**Lógica de Âncoras**: O sistema não lê a página inteira ao léu. Ele procura por palavras-chave (ex: "AWB" ou "Data") e, ao encontrar, lê exatamente a área ao lado dela.
**Pré-processamento**: A imagem é convertida para escala de cinza e o contraste é aumentado dinamicamente para garantir que o Tesseract não confunda um "8" com "B". Usa **Tesseract OCR** com pré-processamento de imagem (Escala de cinza e Contraste).
**Lógica de Âncoras**: Busca palavras-chave e lê coordenadas relativas (ROI).

### 2. Pilar PDF Digital (Extração Direta)

Ideal para relatórios gerados por software (como TÜV Rheinland).
**Checkbox Inteligente**: Identifica se um campo foi marcado com "X". Se o sistema vê um `[X]` ao lado de "Reprovado", ele sabe que o status do ensaio é "Reprovado".
**Extração de Coordenadas**: Lê o texto direto da estrutura do PDF, o que é 100% preciso e mais rápido que o OCR.

### 3. Pilar Excel (Data Mining)

Ideal para grandes volumes de dados de ensaios (ex: ASE).
**Factory Pattern**: Se o layout for "ASE", ele dispara o `ase_parser.py`. Se for desconhecido, usa o `default_parser.py`.
**Leitura Estrita**: Diferente de um humano que pode se perder em colunas, o sistema vai direto na célula (ex: Linha 10, Coluna 5) para garantir que o dado pego é o correto.

---

## 📝 O Motor de Geração de Documentos

A mágica final acontece no `DocumentService`. Ele funciona como um sistema de "Mala Direta" turbinado:

1. **Tags Especiais**: No seu arquivo Word, você coloca tags como `[data_recebimento]`, `[OCP_codigo]`, `[IMAGEM_UPLOAD1]`.
2. **Mapeamento Unificado**: O backend cria um dicionário gigante com todas as descobertas dos 3 pilares acima.
3. **Injeção e Grifo**: O sistema percorre o Word, substitui as tags pelos valores reais e aplica um **grifo amarelo**. Isso permite que o engenheiro revise rapidamente o que foi preenchido de forma automática.
4. **Inserção de Imagens**: Se houver tags de imagem, o sistema redimensiona as fotos de upload e as insere diretamente no corpo do documento.
  **AseExcelParser**: Script especializado que lê frequências, picos e curvas de ensaios específicos.
  **Fallback Factory**: Se o layout não tiver um parser customizado, utiliza o processamento genérico.

---

### 4. Pilar Document (Mala Direta Turbinada)

Injeção de dados em templates Word com **preservação de estilos**.
**Grifos Dinâmicos**: Marca em amarelo campos preenchidos automaticamente para revisão fácil do engenheiro.

---

## 🧹 Infraestrutura e Manutenção

*   **Cleanup Scheduler**: Tarefa em background que roda a cada 30 minutos limpando `/uploads` e `/exports`, mantendo o sistema leve.
*   **Integração Windows**:
    *   Busca nome e foto de perfil do usuário logado via **PowerShell/Registry**.
    *   Comando `os.startfile` para abrir relatórios diretamente no Word físico após processamento.
*   **Logs Inteligentes**: Logs rotativos de 10MB que são comprimidos em `.gz` para economizar espaço em disco.

---

## 🛠️ Instalação e Execução

### Requisitos Técnicos

  **Python 3.10+** (Recomendado ambiente virtual `venv`)
  **Tesseract OCR** instalado no Windows.
  **Poppler** para conversão de PDF.

### Comandos

```bash
# 1. Instalar dependências (Incluindo proteção de segurança)
pip install -r requirements.txt

# 2. Iniciar o Hub de Automação
python main.py
```

---

## ❓ FAQ Técnico

  **"Não preencheu o dado X"**: Verifique se a Regex em `utils/document_tags.py` ou o mapeamento em `services/pdfExtract_service.py` contém o rótulo exato que aparece no seu arquivo.
  **"Erro de Tesseract não encontrado"**: Certifique-se de que o Tesseract está instalado no caminho `C:\Program Files\Tesseract-OCR\tesseract.exe` ou atualize a variável `self.tesseract_cmd` no `ocr_service.py`.
  **"Layout não encontrado"**: Verifique se o nome do arquivo `.docx` na pasta `storage/layout` é exatamente igual ao nome do envio (ignorando o sufixo `_layout` se houver).
  **"Erro SEC_01"**: O arquivo foi bloqueado pelo interceptador de segurança (possível arquivo binário malicioso ou extensão incorreta).
  **"Erro SYS_01"**: Erro genérico tratado pelo Global Exception Handler; verifique o log `.log` mais recente em `/logs` para o traceback completo.
  **"Status 404 no Job"**: O ID do job é mantido em memória e pode ser perdido após reiniciar o backend.
