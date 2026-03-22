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

O sistema foi desenhado seguindo princípios de **modularidade** e **separação de responsabilidades**, facilitando a manutenção e adição de novos tipos de ensaios.

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

## 🚀 Os 3 Pilares de Processamento

O backend decide automaticamente qual pilar usar baseado na extensão do arquivo e configuração do frontend:

### 1. Pilar OCR (Imagens e PDFs Escaneados)

Ideal para fotos de telas de equipamentos ou documentos grampeados.
**Lógica de Âncoras**: O sistema não lê a página inteira ao léu. Ele procura por palavras-chave (ex: "AWB" ou "Data") e, ao encontrar, lê exatamente a área ao lado dela.
**Pré-processamento**: A imagem é convertida para escala de cinza e o contraste é aumentado dinamicamente para garantir que o Tesseract não confunda um "8" com "B".

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

---

## 🧹 Manutenção e Ciclo de Vida

O backend é autossuficiente em sua limpeza:

**Cleanup Scheduller**: A cada hora, uma tarefa em background verifica arquivos antigos.
**Log Rotation**: Mantemos apenas os últimos 5 arquivos de log (50MB no total), garantindo histórico de erros sem comprometer o armazenamento.
**Segurança**: Todas as entradas são validadas via Pydantic (`RequestPayload`) para evitar ataques de injeção ou travamentos por dados malformados.

---

## 🛠️ Configuração Inicial

### Requisitos Técnicos

**Python 3.10+**
**Tesseract OCR**: Instalado no Windows (Caminho padrão: `C:\Program Files\Tesseract-OCR\tesseract.exe`).
**Poppler**: Necessário para converter PDFs em imagens para o OCR (Caminho configurado no `ocr_service.py`).

### Comandos

```bash
# 1. Instalar dependências (Pillow, Docx, Pandas, Flask, PyWebView)
pip install -r requirements.txt

# 2. Executar a aplicação (Inicia o Flask + Janela Desktop)
python main.py
```

---

## ❓ Solução de Problemas (FAQ)

**"Não preencheu o dado X"**: Verifique se a Regex em `utils/document_tags.py` ou o mapeamento em `services/pdfExtract_service.py` contém o rótulo exato que aparece no seu arquivo.
**"Erro de Tesseract não encontrado"**: Certifique-se de que o Tesseract está instalado no caminho `C:\Program Files\Tesseract-OCR\tesseract.exe` ou atualize a variável `self.tesseract_cmd` no `ocr_service.py`.
**"Layout não encontrado"**: Verifique se o nome do arquivo `.docx` na pasta `storage/layout` é exatamente igual ao nome do envio (ignorando o sufixo `_layout` se houver).
