# 📄 Sistema de Automação de Relatórios OCR

Sistema Desktop desenvolvido para automação de processos de Relatórios técnicos (Ensaios de Bluetooth/Wi-Fi), utilizando Visão Computacional para extração de dados e integração com templates Microsoft Word (.docx).

---

## 🚀 Próximos Passos (To-Do List)

Aqui estão as próximas atividades planejadas para evolução da ferramenta:

### 🛠️ Estruturação e Layout

- [ ] **Padronização de Nomenclatura**: Sincronizar os nomes das opções de ensaio no Frontend com os nomes dos arquivos `.docx` na pasta `storage/layout`.
- [ ] **Protótipo de Layout Master**: Criar um arquivo `.docx` modelo contendo:
  - Tabelas estruturadas para resultados.
  - Espaços reservados (placeholders) para inserção de imagens.
  - Campos dinâmicos (ex: `[DATA]`, `[ENGENHEIRO]`, `[CONTEUDO]`).

### 🔍 Validação e Inteligência

- [ ] **Verificação de Nomes de Arquivos**: Implementar lógica para validar se os arquivos subidos (fotos/pdfs) seguem um padrão esperado pelo layout selecionado (ex: `ensaio_potencia.png` para a tabela de potência).
- [ ] **Lógica de Mapeamento**: Desenvolver o mapeamento inteligente onde o sistema identifica a qual célula da tabela pertence o dado extraído de cada foto específica.

### 🤖 Automação Avançada

- [ ] **Inserção Automática Multimodal**: Evoluir o `DocumentService` para não apenas inserir texto, mas também alocar fotos automaticamente nos quadros correspondentes do layout.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + Tailwind CSS + Framer Motion
- **Backend**: Python + Flask
- **OCR**: Tesseract (pytesseract) + Pillow
- **Documentos**: python-docx
- **Desktop Bridge**: PyWebView

---

## 📂 Estrutura de Pastas

```text
/backend
  /services      # Lógica de OCR e Word
  /storage       # Uploads, Layout e Exportações
  /utils         # Configurações de Log e Helpers
/frontend
  /src/screens   # Interface do Usuário
  /dist          # Build de produção
/logs            # Histórico de execução (YYYY-MM-DD.log)
```

---

## ⚙️ Como Executar

1. Entre na pasta backend do projeto e certifique-se de que as dependências estão instaladas
pip install -r backend/requirements.txt

2. Entre na pasta frontend do projeto e instale as dependencias
npm i --legacy-peer-deps

3. Rode o comando de empacotamento
pyinstaller --noconfirm --onefile --windowed \
--name "Automation_Project" \
--distpath "desktop" \
--add-data "backend/storage;storage" \
--add-data "frontend/dist;frontend/dist" \
--hidden-import "clr" \
backend/run_desktop.py

---
