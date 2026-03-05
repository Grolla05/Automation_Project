# 📄 Sistema de Automação de Laudos OCR

Sistema Desktop desenvolvido para automação de processos de laudos técnicos (Ensaios de Bluetooth/Wi-Fi), utilizando Visão Computacional para extração de dados e integração com templates Microsoft Word (.docx).

---

## 🚀 Próximos Passos (To-Do List)

Aqui estão as próximas atividades planejadas para evolução da ferramenta:

### 🛠️ Estruturação e Layout

- [ ] **Padronização de Nomenclatura**: Sincronizar os nomes das opções de ensaio no Frontend com os nomes dos arquivos `.docx` na pasta `storage/layouts`.
- [ ] **Protótipo de Layout Master**: Criar um arquivo `.docx` modelo contendo:
  - Tabelas estruturadas para resultados.
  - Espaços reservados (placeholders) para inserção de imagens.
  - Campos dinâmicos (ex: `{{DATA}}`, `{{ENGENHEIRO}}`, `{{CONTEUDO}}`).

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
  /storage       # Uploads, Layouts e Exportações
  /utils         # Configurações de Log e Helpers
/frontend
  /src/screens   # Interface do Usuário
  /dist          # Build de produção
/logs            # Histórico de execução (YYYY-MM-DD.log)
```

---

## ⚙️ Como Executar

1. Certifique-se de ter o **Tesseract OCR** e o **Poppler** instalados no Windows.
2. Instale as dependências: `pip install -r backend/requirements.txt`.
3. Rode o software: `python backend/main.py`.

---

_Desenvolvido com foco em precisão técnica e agilidade no fluxo de engenharia._

---

## ✅ Checklist de Implementação

- [ ] **Sincronização**: Bate de nomes entre Frontend e Layouts (.docx)
- [ ] **Validação**: Verificação de nomes das fotos subidas vs esperado
- [ ] **Design**: Criação do Layout com tabelas e quadros de imagem
- [ ] **Inteligência**: Mapeamento de OCR por arquivo de foto individual
- [ ] **Automação**: Injeção automática de dados no layout alvo

