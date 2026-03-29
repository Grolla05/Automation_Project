# 🚀 Rotas do Backend - API de Automação OCR

Este diretório contém a definição das rotas (endpoints) da API Flask, organizadas utilizando o `flask-restx`. O backend é responsável pelo recebimento de arquivos, processamento de OCR/Extração e geração de relatórios Word personalizados.

---

## 🛤️ Endpoints Principais (Namespace: `/api`)

### 1. `GET /health`

Verifica a integridade do serviço.

- **Função**: Garantir que o servidor Flask está rodando e pronto para receber requisições.
- **Retorno**: `{"status": "ok", "message": "Backend Flask rodando!"}`

### 2. `POST /process`

O "coração" do sistema. Inicia o pipeline de processamento de documentos.

- **Tipo de Dados**: `multipart/form-data`
- **Payload (`request.files`)**: 
  - `files`: Lista de arquivos (PDF, Excel, Imagens).
- **Payload (`request.form`)**:
  - `tests`: Lista de ensaios selecionados.
  - `layout_id`: ID do layout em Base64.
  - `ocr_target`: Nome do arquivo principal para OCR (Capa).

#### 🛠️ Fluxo Interno do `/process`:

1. **Recebimento Bruto**: Salva os arquivos com seus nomes originais (higienizados) em `storage/uploads`.
2. **Identificação Inteligente (Match de Tags)**: 
   - Utiliza as regras de `IMAGE_TAG_RULES` em `utils/file_handler.py`.
   - Analisa o nome real do arquivo em busca de palavras-chave (ex: "logo", "amostra").
   - Mapeia cada imagem para uma Tag do Word (ex: `[foto_amostra]`), garantindo que cada tag seja usada apenas uma vez.
3. **Pipeline Assíncrono (Threading)**: 
   - Dispara o processamento em segundo plano para não travar o frontend.
   - Executa Extração Digital (PDF) -> OCR de Fallback -> Processamento de Excel.
4. **Geração de Registro**: Consolida os dados e gera o arquivo `.docx` final usando o mapeamento de tags inteligentes.

### 3. `GET /status/<job_id>`

Consulta o progresso em tempo real de um processamento específico.

- **Função**: Retorna o percentual de progresso e a mensagem atual da etapa (ex: "Analisando Capa...").

### 4. `POST /check_layout`

Validação prévia do layout no servidor.

- **Função**: Verifica se o arquivo de layout `.docx` correspondente ao ensaio selecionado existe na pasta `storage/layout/`.
- **Uso**: Chamado pelo frontend antes de permitir o upload final.

### 5. `GET /download/<filename>`

Entrega o relatório gerado ao usuário.

- **Função**: Serve o arquivo Word da pasta `storage/exports`.
- **Ação Lateral**: Aciona a limpeza automática de diretórios temporários após o download.

---

## 📂 Arquitetura de Dados

Os arquivos enviados seguem este ciclo de vida:

1. **Upload**: Enviados com nomes originais -> `storage/uploads/`.
2. **Mapeamento**: O backend traduz `minha_foto.jpg` -> `[foto_amostra]` internamente.
3. **Saída**: O relatório gerado é salvo em `storage/exports/`.

---

## 🛡️ Segurança e Validação

- **`secure_filename`**: Todos os nomes de arquivos são sanitizados para evitar ataques de travessia de diretório.
- **`validate_file_shield`**: Verifica extensões permitidas e integridade do arquivo antes de salvar.
- **`validate_payload`**: Garante que o frontend enviou todos os campos obrigatórios (Schema Marshmallow/Zod-like).
