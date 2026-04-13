# 🚀 Documentação da Feature: Auto-Update System (V2 - Modular)

Esta documentação detalha a nova funcionalidade de atualização automática implementada no projeto. O objetivo é permitir que o software se mantenha atualizado em todos os clientes de forma transparente, utilizando o GitHub como servidor de versionamento, build machine e hospedagem de binários.

## 📌 Visão Geral da Arquitetura

O sistema agora é composto por três camadas que se comunicam para realizar a atualização de forma robusta e modular:

1. **Lançador (\`launcher/main.py\`)**: Orquestrador de processos que gerencia o ciclo de vida da aplicação e executa a substituição dos arquivos físicos via ZIP.
2. **Frontend (React)**: Responsável pela interface do usuário (UI/UX), persistência de estado (Zustand) e lógica de verificação de versões.
3. **Backend (Flask)**: Serve de ponte entre o Frontend e o Lançador, fornecendo status de progresso e sinalizando o início do update.

---

## ⚙️ Configurações Necessárias no GitHub (Obrigatório)

Para que o sistema de automação funcione, **um administrador do repositório** deve realizar as seguintes configurações na interface do GitHub:

### 1. Permissões do Workflow

Sem esta configuração, o GitHub Actions não conseguirá atualizar o \`version.json\` nem criar as *Releases*.
- No repositório, vá em **Settings** > **Actions** > **General**.
- Role até **Workflow permissions**.
- Selecione **Read and write permissions**.
- Marque **Allow GitHub Actions to create and approve pull requests**.
- Clique em **Save**.

### 2. Sincronização de Branches

- O workflow de Release está configurado para o branch \`TUV-main\`. Caso o nome do branch principal mude, atualize o arquivo \`.github/workflows/release.yml\` na linha 53 e 55.

---

## 🔄 Fluxo de Funcionamento

### 1. Inicialização (Bootstrapping)

- O usuário executa o \`Launcher.exe\` (gerado a partir de \`launcher/main.py\`).
- O Lançador verifica novas versões comparando o \`version.json\` local com o remoto via GitHub Raw content.

### 2. O Processo de Update Atômico (ZIP)

- Quando o usuário clica em **"Atualizar"**:
    1. O processo principal é encerrado (\`process.terminate\`).
    2. O Lançador baixa o \`Automation_App.zip\` das *Releases* do GitHub.
    3. O ZIP é extraído em uma pasta temporária e os arquivos são movidos para a raiz com tratamento de erros de permissão do Windows.
    4. A nova aplicação é reiniciada automaticamente.

---

## 🛠 Componentes do Sistema

- **\`launcher/main.py\`**: Maestro que evita erros de "Arquivo em Uso" no Windows.
- **\`.github/workflows/release.yml\`**: Automatiza o build nativo em ambiente Windows e publica o ZIP na aba de Releases.
- **\`version.json\`**: Arquivo mestre que controla a versão atual.

---

## 📦 Guia de Operação (Lançando uma Versão)

O processo de deploy foi simplificado para **"Um Clique"** via Git Tags:

1. Finalize suas alterações e teste localmente.
2. No terminal (ou via Git UI), crie uma nova tag seguindo o padrão \`vX.X.X\`:
   \`\`\`bash
   git add .
   git commit -m "feat: descrição da nova versão"
   git tag v1.1.0
   git push origin v1.1.0
   \`\`\`
3. **Acompanhamento**: Vá na aba **Actions** do seu repositório para ver o progresso do Build. Em ~5 minutos, o executável estará pronto e o update estará disponível para todos os usuários.

---

## ⚠️ Diretrizes de Segurança e Resiliência

- **Failsafe**: Se o download ou extração falhar, o Launcher reverte para a versão atual e gera um log no arquivo \`update_progress.json\`.
- **Offline**: O Launcher sempre prioriza carregar a aplicação local se não houver conexão com a internet.
