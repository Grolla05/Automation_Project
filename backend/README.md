# ⚙️ Backend - OCR, Excel Extract & Document Engine

O coração inteligente do sistema atua como um hub de processamento que lê PDFs/Imagens (via Reconhecimento Óptico de Caracteres), Planilhas (via Excel / Pandas Parsers) e formata todos esses dados brutos, injetando em layouts .docx do Word em menos de 10 segundos.

---

## 🏗️ Arquitetura Híbrida

O backend foi desenhado e modernizado utilizando padrões **Strategy** e **Factory**, possuindo inteligência para mapear fluxos de dados diferentes. Ele é aberto e isolado por módulos.

### Estrutura de Pastas

- `/services`: Contém o cérebro das lógicas de negócio e as camadas separadas por finalidade.
  - `ocr_service.py`: Focado em Inteligência Artificial, Pytesseract, ImageOps e PDF-to-Image. Faz Cortes localizados e filtra poluição visual.
  - `excel_service.py`: Cérebro orquestrador (Maestro) das planilhas.
  - `/excel_parsers`: Módulo (Factory) de altíssima modularidade. (Possui seu próprio README 📚 para ensinar novos engenheiros).
  - `document_service.py`: Pega as _Tags extraídas_ e injeta na Lógica do pacote Python-Docx diretamente nas Tabelas/Textos com Grifo amarelo.

- `/utils`: Utilitários gerais do sistema (ex. Limpeza de HD e configurações nativas do Servidor e da Janela pywebview).
  - `document_tags.py`: O local sagrado onde Respostas Brutas do OCR ganham vida através de Regex, transformando palavras perdidas e ruidosas em Variáveis seguras e prontas: `[FREQ_EXTRAIDA]`, `[MAX_PEAK]`.

- `/storage`: O Banco de arquivos de Persistência Virtual (Garantem que um relatório de ontem não quebre o de amanhã).
  - `/uploads`: Armazena temporariamente os RTs anexados, planilhas e imagens no momento de execução.
  - `/layout`: Diretório base de modularidade dos `.docx`. Agora estruturado por Setor e SubSetor (Ex: `storage/layout/P5/MED_layout.docx`). Adicionar novos templates significa apenas jogar o arquivo do Word na pasta certa - sem necessidade de programar o caminho dele!
  - `/exports`: Repositório de entrega visual (Relatórios concluídos prontos pro download do cliente).

---

## 🌐 Módulos Principais

### 1. Sistema Hibrido OCR/Excel

Ao submeter arquivos, um motor em `main.py` age como funil separador:

- Identifica se o input é **XLS, XLSX**: Dispara a engine veloz do Pandas passando pelas fábricas customizáveis (Excel Parsers). Para ensaios como o ASE, exigimos estritamente apenas a planilha. Os dados do Excel são lidos via coordenadas estritas (Ex: `df.iloc[7, 6]`), evitando a desestruturação do layout da planilha quando ocorrem colunas vazias.
- Identifica se o input é **PDF, JPG, PNG**: Processa via **Tesseract**, converte e lê as caixas numéricas limitando as **Âncoras** nas fotos (Processo de ROI - Região de Interesse).
- Uma interligação universal unifica as respostas de ambas as caixas e as mescla no Dicionário Master da Requisição enviando os dados ofuscados via Base64 na rede para manter a segurança do file system isolado da interface de usuário.

### 2. Desktop Bridge (Servidor Visual Privado)

- **Flask API**: Cria portas HTTP (`5000`) para conectar chamadas POST da porta `5173` no React enquanto em programação, ou serve arquivos minificados em `/dist` direto para a GPU na interface local do usuário.
- **PyWebView**: Roda sobre C# WinForms/Chromium no Windows nativo como janela "EXE", simulando uma UX em Desktop pesado de engenharia limpa.
- O App inicia um Thread do servidor em segundo plano, evitando travamentos na Interface de Upload.

---

## ⚙️ Instalação / Comandos

Recomendações técnicas base: `Python 3.10+`.

Certifique-se que você tenha o arquivo executável nativo do `Tesseract OCR` e do `.bin` do utilitário `Poppler` (para manuseio livre de PDF no windows) devidamente referenciados por variável global ou pelo caminho fixo dentro de `ocr_service.py`.

```bash
# Instalador de dependências robustas (Pillow, Docx, Pandas, Flask)
pip install -r requirements.txt

# Executar do projeto / Startup
python main.py
```
