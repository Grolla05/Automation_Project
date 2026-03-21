# 💻 Frontend - OCR Automation Interface

Este é o frontend da aplicação de automação de laudos técnicos, desenvolvido com as tecnologias mais modernas do ecossistema JavaScript (**React 19** e **Vite 7**). O foco principal é proporcionar uma experiência de usuário (UX) premium: limpa, responsiva, acessível e altamente intuitiva para engenheiros e técnicos.

---

## 🚀 Stack Tecnológica

A aplicação utiliza um conjunto de ferramentas de ponta para garantir performance e manutenibilidade:

- **React 19 + TypeScript**: Base da aplicação com tipagem estática e as últimas funcionalidades do ecossistema.
- **Vite 7**: Ferramenta de build e servidor de desenvolvimento alternativo ao Webpack, extremamente rápido.
- **TanStack React Query (v5)**: Gerenciamento inteligente de estado assíncrono, cacheamento e sincronização de dados com o backend.
- **Tailwind CSS v4**: Estilização baseada em utilitários com o novo motor de alto desempenho.
- **Framer Motion 12**: Biblioteca de animações potente para transições fluidas e micro-interações.
- **Radix UI**: Primitivos de componentes acessíveis (WAI-ARIA) que servem como base para o nosso Design System.
- **Playwright**: Framework moderno para testes de ponta a ponta (E2E).
- **Vitest**: Runner de testes unitários ultrarrápido integrado ao ecossistema Vite.
- **i18next**: Sistema robusto de internacionalização para suporte multi-idioma.
- **Sentry**: Monitoramento de erros em tempo real para garantir estabilidade em produção.
- **Axios + Axios-Retry**: Cliente HTTP com políticas automáticas de tentativa em caso de falha de conexão.

---

## 🏗️ Arquitetura e Organização

O projeto segue uma estrutura modular e organizada por responsabilidades:

- `src/components/`: Componentes de interface reutilizáveis.
- `src/components/ui/`: Componentes atômicos do Design System (Botões, Cards, Inputs).
- `src/screens/`: Telas principais que compõem o fluxo do "Wizard" (Seleção, Upload, Processamento, Resultado).
- `src/services/`: Camada de comunicação com a API (Axios, React Query hooks).
- `src/hooks/`: Hooks customizados para lógica compartilhada.
- `src/context/`: Provedores de estado global.
- `src/lib/`: Lógica de dados, constantes de setores e mapeamentos de layouts.
- `src/locales/`: Arquivos de tradução (JSON) para Português e Inglês.
- `src/router/`: Configuração das rotas da aplicação.
- `src/schemas/`: Esquemas de validação de dados usando **Zod**.
- `e2e/`: Testes automatizados que simulam a navegação real do usuário no navegador.

---

## 🎨 Design e UI

- **Tailwind CSS**: Utilizado para estilização rápida, responsiva e com excelente coesão de espaçamentos.
- **Framer Motion**: Responsável pelas transições suaves de saída/entrada entre as telas e micro-animações.
- **Lucide React**: Biblioteca de pacote de ícones modernos e minimalistas (SVG).
- **Dark Mode**: Suporte inteligente à paleta de cores escurecidas adaptada no núcleo do Tailwind (Variáveis Custom).

---

## 🛠️ Automação e Qualidade de Código

Para garantir a padronização do código e evitar commits com erros fatais, o projeto utiliza:

- **ESLint 9**: Linter configurado para as melhores práticas de React e TypeScript.
- **Husky 9**: Hooks de Git integrados ao repositório.
- **lint-staged**: Executa verificações automáticas apenas nos arquivos afetados antes de cada commit.
  - *Ação:* Roda `eslint --fix` automaticamente em arquivos JS/TS preparados.
  - *Segurança:* Impede o commit se houver quebras de regras críticas do linter.

---

## 🔄 Fluxo de Funcionamento (Wizard)

A interface guia o usuário através de 4 etapas principais:

1. **Seleção (WelcomeScreen)**: O usuário escolhe o **Setor** (ex: P3, P5), o **Tipo de Ensaio** (ex: ASE, EMC) e seleciona quais ensaios específicos deseja realizar. A lógica de filtragem é instantânea.
2. **Envio de Arquivos (UploadScreen)**: Interface inteligente que solicita arquivos específicos baseada na seleção anterior. Valida formatos (PDF, Excel, Images) e nomes de arquivos obrigatórios.
3. **Processamento (LoadingScreen)**: Exibe o progresso real da extração de dados via OCR e processamento de IA no backend.
4. **Resultado (CompletionScreen)**: Permite o download imediato ou abertura do relatório `.docx` finalizado.

---

## 🔄 Fluxo do Usuário (Screens)

1. **WelcomeScreen**: Seleção hierárquica (Setor > Tipo de Ensaio). Define o layout target.
2. **UploadScreen**: Interface validada para upload de fotos, PDFs ou planilhas.
   - *Regra Especial:* Ensaios ASE aceitam apenas 1 planilha.
3. **LoadingScreen**: Feedback visual animado durante o processamento de OCR e geração de laudos no Python.
4. **CompletionScreen**: Finalização com download/abertura direta do arquivo `.docx` gerado.

---

## 🧪 Testes e Qualidade

Como parte de uma cultura de **QA Sênior**, o projeto possui uma camada de testes rigorosa:

### Testes Unitários (Vitest)

Focados em testar a lógica pura e os componentes de forma isolada.

- Localização: `src/**/*.test.ts`
- Comando: `npm test`

### Testes E2E (Playwright)

Simulam um usuário real preenchendo o Wizard e subindo arquivos. Garantem que o fluxo principal está funcionando do início ao fim.

- Localização: `e2e/`
- Comando: `npm run test:e2e`

### Cobertura de Código

Gera relatórios de quais partes do código estão sendo testadas.

- Comando: `npm run test:coverage`

---

## 🌍 Internacionalização (i18n)

A aplicação é totalmente bilingue.

- **Idiomas suportados**: Português (pt-BR) e Inglês (en-US).
- **Troca de Idioma**: Pode ser feita através do modal de configurações. O sistema detecta automaticamente o idioma do navegador do usuário.

---

## 🛠️ Guia do Desenvolvedor: Como Rodar o Projeto

### Pré-requisitos

- **Node.js**: Versão 18 ou superior.
- **NPM**: Gerenciador de pacotes (vem com o Node).

### Passo a Passo

1. **Instalação**:
    Abra o terminal na pasta `frontend` e execute:

    ```bash
    npm install
    ```

2. **Desenvolvimento**:
    Para iniciar o servidor de desenvolvimento com atualização em tempo real:

    ```bash
    npm run dev
    ```

    Acesse no navegador: `http://localhost:5173`

3. **Executar Testes**:

    ```bash
    # Testes unitários (Lógica de dados)
    npm test
    
    # Testes de navegação (E2E)
    npm run test:e2e
    ```

4. **Gerar Versão de Produção**:
    Para criar uma versão otimizada para o cliente final:

    ```bash
    npm run build
    ```

---

## 🛡️ Configurações e Segurança

- **Resiliência**: O sistema tenta reconectar com o backend automaticamente se houver uma falha momentânea de rede.
- **Validação**: Nenhum dado inválido é enviado ao servidor graças à validação prévia com **Zod** no frontend.
- **Monitoramento**: Erros críticos são reportados silenciosamente ao **Sentry** para que a equipe de engenharia possa corrigir antes mesmo do usuário notar.
