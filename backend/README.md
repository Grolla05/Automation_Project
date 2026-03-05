# ⚙️ Backend - OCR & Document Engine

O coração do sistema, responsável pelo processamento de imagens, extração de texto via OCR e geração de documentos Word usando layouts inteligentes.

---

## 🏗️ Arquitetura e Organização

O backend foi construído em **Python** seguindo uma arquitetura de serviços modular.

### Estrutura de Pastas
- `/services`: Contém a lógica de negócio (OCR e Manipulação de Word).
- `/utils`: Utilitários como configuração de logs e manipuladores de arquivos.
- `/storage`: Sistema de persistência local.
  - `/uploads`: Armazena temporariamente os arquivos enviados pelo frontend.
  - `/layouts`: Local onde os templates `.docx` devem ser colocados.
  - `/exports`: Onde os relatórios finais são salvos.
- `main.py`: Ponto de entrada que integra o Servidor Flask com a Interface Desktop (PyWebView).

---

## 🧠 Serviços Principais

### 1. OCRService (`ocr_service.py`)
- **Tecnologia**: Tesseract OCR + Pillow + pdf2image.
- **Processamento**: Converte imagens para escala de cinza e aumenta o contraste antes da extração.
- **PDF**: Converte páginas de PDF em imagens para processamento individual.

### 2. DocumentService (`document_service.py`)
- **Tecnologia**: python-docx.
- **Layouts**: Carrega templates da pasta `/layouts`.
- **Injeção**: Procura pelo placeholder `{{CONTEUDO}}` no Word e o substitui pelo texto extraído.

---

## 🌐 API & Desktop Bridge
- **Flask**: Proporciona endpoints REST para upload e download de arquivos.
- **PyWebView**: Encapsula o frontend em uma janela nativa do Windows e expõe funções Python diretamente para o JavaScript.
- **Threading**: O Flask roda em uma thread paralela para não travar a interface visual.

---

## 📝 Sistema de Logs
Logs organizados em `logs/YYYY-MM-DD.log` com níveis de prioridade:
- `INFO`: Fluxo normal de processamento.
- `WARNING`: Problemas não fatais (ex: template não encontrado).
- `ERROR`: Falhas críticas no OCR ou na geração do arquivo.

---

## ⚙️ Requisitos de Sistema
- **Tesseract OCR**: Deve estar instalado no Windows.
- **Poppler**: Necessário para processamento de arquivos PDF.
- **Python 3.10+**: Linguagem base.
```bash
pip install -r requirements.txt
```
