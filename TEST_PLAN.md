# 🧪 Plano de Testes: Sistema de Auto-Update (V2)

Este documento descreve os cenários de teste necessários para validar a integridade, segurança e funcionalidade do sistema de atualização automática.

---

## 🏗️ Ambiente de Teste

- **OS**: Windows 10/11 (Ambiente alvo).
- **Rede**: Conexão estável e simulação de queda de conexão.
- **Ferramentas**: Git CLI, Python 3.10+, Browser (GitHub Dashboard).

---

## 📋 Cenários de Teste

### 1. Teste de Inicialização e Comparação (Bootstrapping)

- **Objetivo**: Validar se o Launcher identifica corretamente a necessidade de update.
- **Passos**:
    1. Alterar o campo `version` no `version.json` local para `1.0.0`.
    2. Garantir que no GitHub o `version.json` esteja como `1.0.1`.
    3. Executar o `launcher/main.py`.
- **Resultado Esperado**: O software principal deve abrir e o App React deve redirecionar para a tela `/updater`.

### 2. Teste de Fluxo Completo (Ato de Atualizar)

- **Objetivo**: Validar o download, encerramento de processo, extração e reinicialização.
- **Passos**:
    1. Na tela de Update, clicar em **"Atualizar Agora"**.
    2. Observar a barra de progresso.
    3. Verificar se o processo `Automation_App.exe` (ou o script backend) foi encerrado.
- **Resultado Esperado**: O Launcher baixa o ZIP, extrai os arquivos, atualiza o `version.json` local e reabre o app na tela de Welcome já na nova versão.

### 3. Teste de Resiliência: Arquivo em Uso (Windows Lock)

- **Objetivo**: Garantir que arquivos travados não corrompam a instalação.
- **Passos**:
    1. Abrir um dos arquivos da pasta raiz (ex: um arquivo de log) em um editor de texto que trave o arquivo.
    2. Iniciar o processo de atualização.
- **Resultado Esperado**: O Launcher deve tentar remover o arquivo e, se falhar, reportar o erro no `update_progress.json` sem deletar o restante do software funcional.

### 4. Teste de DevOps: Geração de Tag e Release

- **Objetivo**: Validar que o "Um Clique" realmente gera os artefatos.
- **Passos**:
    1. Criar uma Tag de teste: `git tag v9.9.9 && git push origin v9.9.9`.
    2. Acompanhar a aba **Actions** no GitHub.
- **Resultado Esperado**:
  - Build deve completar com sucesso no Windows.
  - Uma nova Release `v9.9.9` deve aparecer com o arquivo `Automation_App.zip` anexado.
  - O `version.json` no branch principal deve ser alterado para `9.9.9` automaticamente.

### 5. Teste de Segurança: Queda de Internet

- **Objetivo**: Validar o comportamento do sistema sem conexão.
- **Passos**:
    1. Iniciar o Launcher sem conexão com a internet.
    2. Tentar realizar um update e desligar o Wi-Fi no meio do download.
- **Resultado Esperado**:
  - O Launcher deve falhar graciosamente, manter os arquivos originais e permitir que o usuário use a versão atual (Failsafe).
  - O arquivo `update.lock` deve ser limpo para não travar o sistema no próximo boot.

---

## 📊 Matriz de Aceite (Checklist Final)

| ID | Requisito | Status | Observação |
|:---|:---|:---:|:---|
| 01 | O App fecha sozinho ao clicar em atualizar? | [ ] | |
| 02 | O arquivo ZIP é deletado após a extração? | [ ] | |
| 03 | A versão local no final do processo é a mesma da Tag? | [ ] | |
| 04 | O progresso na tela do React condiz com a realidade? | [ ] | |
| 05 | O Launcher reinicia o app sem intervenção humana? | [ ] | |

---

## 🧰 Comandos Úteis para Depuração

- **Verificar Trava**: `ls update.lock` (Se existir, o update está em curso).
- **Verificar Progresso**: `cat update_progress.json` (Ver percentual e status atual).
- **Simular Versão Antiga**: Editar manualmente o `version.json` para um número menor.
