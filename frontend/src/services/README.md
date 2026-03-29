# 🌐 Services Front-end - Comunicação com API OCR

Este diretório contém a camada de serviço do front-end, responsável por realizar a ponte entre a interface do usuário (React) e o servidor Flask. Utilizamos **Axios** para gerenciar as requisições HTTP e centralizar a lógica de comunicação.

---

## 🛠️ Estrutura de Arquivos

- `api.ts`: Centraliza todos os métodos de chamada aos endpoints do backend.
- `axiosInstance.ts`: Configuração base do Axios (BaseURL, Timeouts, Interceptors).

---

## 🚀 Métodos de Serviço (API Service)

### 1. `checkLayout(tests: string[])`

Chamado na etapa de upload para validar a existência do template no servidor.

- **Requisição**: `POST /api/check_layout`
- **Fluxo**: 
  - Converte o nome do ensaio selecionado para Base64 (Layout ID).
  - Envia para o backend verificar se o arquivo `.docx` correspondente existe na pasta de layouts.
- **Uso**: Impede que o usuário inicie um processamento longo se o layout necessário estiver ausente.

### 2. `processDocuments(files: File[], tests: string[], testType: string)`

O método principal que inicia o pipeline de automação.

- **Requisição**: `POST /api/process` (`Content-Type: multipart/form-data`)
- **Gestão de Arquivos**: 
  - **Upload Direto**: Com a nova lógica, os arquivos de imagem são enviados com seu **nome original** e conteúdo binário íntegro.
  - O front-end não realiza mais a renomeação para "Tags" (ex: `[foto_amostra]`), delegando essa inteligência ao backend.
- **Payload Dinâmico**:
  - Identifica automaticamente qual arquivo da lista é o PDF (Capa de Liberação) e o define como `ocr_target`.
  - Converte os metadados do ensaio para o formato esperado pelo `RequestPayload` do backend.

### 3. `getJobStatus(jobId: string)`

Consulta periódica (polling) para atualizar a barra de progresso.

- **Requisição**: `GET /api/status/<job_id>`
- **Retorno**: Um objeto contendo `status` ('processing', 'completed', 'error'), `progress` (0-100) e `message`.

### 4. `downloadReport(filename: string)`

Inicia o download do arquivo Word gerado após a conclusão do processamento.

- **Requisição**: `GET /api/download/<filename>`
- **Comportamento**: Utiliza o navegador para disparar o download binário do relatório final.

---

## 🏗️ Fluxo de Estados (Wizard)

A comunicação com esses serviços é orquestrada pelo componente de **UploadLayout** e pelo hook de estado global:

1. **Validação**: `checkLayout` confirma se o servidor está pronto.
2. **Processamento**: `processDocuments` envia o `FormData` com arquivos originais.
3. **Acompanhamento**: O front-end entra em modo de aguardo, chamando `getJobStatus` repetidamente.
4. **Finalização**: Ao atingir 100%, o link de download é disponibilizado via `downloadReport`.

---

## ⚖️ Mudanças Recentes (Importante)

- **Desacoplamento de Nomes**: O front-end agora é "burro" em relação aos nomes das imagens. Ele apenas garante que os tipos de arquivos necessários (PDF, Imagens, Excel) existam na lista antes de permitir o envio, deixando o mapeamento semântico para o backend.
