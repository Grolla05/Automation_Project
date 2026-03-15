# 💻 Frontend - OCR Automation Interface

Este é o frontend da aplicação de automação de laudos, desenvolvido com **React** e **Vite**, focado em uma experiência de usuário (UX) premium baseada nos princípios de design da Apple (limpo, responsivo e intuitivo).

---

## 🏗️ Arquitetura e Organização

O frontend utiliza uma abordagem baseada em **Componentes Funcionais** e **Hooks**, com gerenciamento de estado local para o fluxo de telas. Além disso, as telas são divididas utilizando os princípios de Container / Apresentação (Layouts) para melhor escalabilidade visual.

### Estrutura de Pastas

- `/src/components`: Componentes de UI reutilizáveis (Botões, Cards, modais de config) formados com Tailwind. Também abrigam componentes complexos de layout (ex. `UploadLayout.jsx`).
- `/src/screens`: Telas principais e containers lógicos que compõem o fluxo da aplicação.
- `/src/services`: Camada de comunicação com o backend (API HTTP Bridge).
- `/src/hooks`: Funções Hooks de UI isoladas e reutilizáveis (ex: gerência de modo Noturno).
- `/src/assets`: Recursos estáticos gráficos como ícones globais e logos.
- `/src/lib`: Funções utilitárias e constantes estáticas do programa (ex: `data.js` que gerencia a árvore de Setores (P5, P4, P3) e a estrutura Base64 nativa de diretórios atrelados dos relatórios).

---

## 🎨 Design e UI

- **Tailwind CSS**: Utilizado para estilização rápida, responsiva e com excelente coesão de espaçamentos.
- **Framer Motion**: Responsável pelas transições suaves de saída/entrada entre as telas e micro-animações.
- **Lucide React**: Biblioteca de pacote de ícones modernos e minimalistas (SVG).
- **Dark Mode**: Suporte inteligente à paleta de cores escurecidas adaptada no núcleo do Tailwind (Variáveis Custom).

---

## 🔄 Fluxo do Usuário (Screens)

1. **WelcomeScreen**: Saudação e visualização modular hierárquica (Setor > Tipo de Ensaio > Sub-Ensaio). Define qual é o arquivo target que vai ser acionado pelo Backend (gerenciado via encoding na lib de dados).
2. **UploadScreen / UploadLayout**: Um Wrapper lógico ultra-validado responsável por segregar as necessidades de arquivos Baseando-se no que foi escolhido no WelcomeScreen. Exige com precisão imagens (PNG/JPG), PDF e Planilhas (XLSX, XLS). **Regras ativas:** Se o ensaio for ASE, a tela proíbe PDF/Fotos e só aceita e libera o processamento com *1 Única Planilha*.
3. **LoadingScreen**: Exibe de forma fluída e animada que o pacote está sendo escaneado ou parseado no Python e injetado nos layouts pré-definidos da nuvem.
4. **CompletionScreen**: Finalização com botão interativo para abrir o laudo pronto (com tags preenchidas) nativamente no MS Word.

---

## 🔌 Integração (API Bridge)

O arquivo `src/services/api.js` atua como a interface de ponteamento entre Node.js/React e Python:

- **Requisições Fetch API**: Dispara requisições e capturas de layout via requisição multiparcelada (`FormData`) em HTTP tradicional na porta `5000`.

---

## 🛠️ Comandos Disponíveis

```bash
# Instalar dependências da Interface Gráfica
npm install

# Rodar em modo desenvolvimento (Hot Reload + Preview Instantâneo)
npm run dev

# Gerar build empacotada e minificada de produção para a raiz (/dist) do projeto Python consumir
npm run build
```
