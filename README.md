# 📄 Automação OCR & Document Hub - Hub de Inteligência Técnica

O **Automation Project** é uma plataforma desktop de automação industrial que converte arquivos estruturados e não estruturados (PDFs, Imagens, Excel) em relatórios técnicos profissionais formatados em Word (.docx).

Utiliza as tecnologias mais modernas de visão computacional e extração digital para garantir precisão e velocidade na geração de laudos laboratoriais.

---

## 🏗️ 1. Arquitetura Geral do Projeto

O sistema é dividido em duas grandes camadas que se comunicam via API REST local:

```mermaid
graph TD
    subgraph "Camada de Interface (Frontend)"
        FE[React UI] --> |POST /api/process| API
        FE --> |GET /api/status| API
        FE --> |Download| EXP[Exports Folder]
    end

    subgraph "Camada de Inteligência (Backend)"
        API[Flask API] --> |Async Job| BP[Background Pipeline]
        BP --> |Validação| SS[Security Shield]
        
        subgraph "Motores de Extração"
            SS --> OCR[Tesseract OCR]
            SS --> PDF[Digital PDF Extractor]
            SS --> EXCEL[Pandas Excel Parser]
        end
        
        OCR --> |Data| DG[Doc Generator]
        PDF --> |Data| DG
        EXCEL --> |Data| DG
        
        DG --> |Injeção| LAY[Layout Templates]
        DG --> |Salva| EXP
    end
```

### Principais Componentes

- **Backend (Python/Flask)**: Orquestrador da lógica de negócio e motores de processamento.
- **Frontend (React/Vite)**: Interface moderna com feedback em tempo real do processamento.
- **Desktop Bridge (PyWebView)**: Envelopa a aplicação web em uma janela nativa do Windows.

---

## ⚙️ 2. Como Configurar o Ambiente de Desenvolvimento

Siga os passos abaixo para preparar sua máquina para contribuir com o projeto:

### 2.1 Backend (Python 3.10+)

1. Navegue para a pasta `backend/`.
2. Crie e ative o ambiente virtual:

    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

3. Instale as dependências:

    ```bash
    pip install -r requirements.txt
    ```

4. **Pré-requisitos Externos (Obrigatório)**:

    - Instale o **Tesseract OCR** em `C:\Program Files\Tesseract-OCR\`.
    - Instale o **Poppler** (necessário para PDFs) em `C:\poppler\`.
5. Inicie o servidor e a UI Desktop:

    ```bash
    python main.py
    ```

### 2.2 Frontend (Node.js 18+)

1. Navegue para a pasta `frontend/`.
2. Instale as dependências com suporte a pacotes legados (se necessário):

    ```bash
    npm install --legacy-peer-deps
    ```

3. Inicie o servidor de desenvolvimento do Vite:

    ```bash
    npm run dev
    ```

    *Acesse em `http://localhost:5173` para ver as mudanças em tempo real.*

---

## 🛠️ 3. Tecnologias e Bibliotecas Core

| Camada | Tecnologia | Função Principal |
| :--- | :--- | :--- |
| **UI** | React / Tailwind | Interface reativa e estilização moderna. |
| **API** | Flask / RESTX | Endpoints de processamento e documentação Swagger. |
| **OCR** | Tesseract / Pillow | Leitura de imagens e PDFs escaneados. |
| **PDF** | Pdfminer.six | Extração direta de texto e metadados de PDFs digitais. |
| **Doc** | Python-docx | Criação e manipulação de arquivos Word complexos. |
| **Excel** | Pandas / Openpyxl | Mineração de dados em planilhas de grande volume. |
| **Segurança** | Libmagic | Validação binária de tipos de arquivos (MIME Check). |

---

## 📂 4. Mapa Detalhado do Repositório

- **`/backend`**: Hub inteligente de processamento.
  - Veja o **[⚙️ Manual do Backend](backend/README.md)** para detalhes sobre a lógica de extração.
- **`/frontend`**: Interface moderna e painel de controle.
- **`/storage`**: O diretório de persistência local:
  - `/layout`: Onde residem os modelos `.docx` (Mala Direta).
  - `/uploads`: Pasta temporária para arquivos recebidos.
  - `/exports`: Onde os relatórios prontos são armazenados para download.
- **`/docs`**: Manuais de usuário e diagramas de arquitetura.

---

## 🚀 5. Empacotamento e Execução do Usuário Final (.exe)

Para gerar o executável autônomo e utilizá-lo como um aplicativo desktop (sem terminal), siga os passos abaixo:

### 5.1 Pré-requisitos para o Build

1. Certifique-se de que o **Frontend** foi compilado:

   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

2. Instale o **PyInstaller** e as dependências do projeto no seu ambiente Python local:

   ```bash
   pip install pyinstaller pywebview flask flask-cors python-dotenv
   ```

### 5.2 Gerando o Aplicativo (.exe)

Execute o comando abaixo na raiz do projeto para criar o pacote. O script está configurado para mover o resultado automaticamente para a pasta `Desktop/` do projeto:

```bash
pyinstaller Automation_Project.spec --clean --noconfirm
```

### 5.3 Como rodar a aplicação

Após o processo acima, você não precisará mais abrir o terminal para rodar o software:

1. Vá até a pasta **`Desktop/`** localizada na raiz deste projeto.
2. Localize o arquivo **`Automation_Project.exe`** (no Windows) ou o executável correspondente.
3. Dê um **clique duplo** no ícone para iniciar a interface desktop.
4. O aplicativo abrirá uma janela nativa contendo toda a inteligência de OCR e automação.

---
*Este projeto visa reduzir o tempo de geração de laudos técnicos de 40 minutos para menos de 10 segundos.*
