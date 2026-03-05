# 💻 Frontend - OCR Automation Interface

Este é o frontend da aplicação de automação de laudos, desenvolvido com **React** e **Vite**, focado em uma experiência de usuário (UX) premium baseada nos princípios de design da Apple (limpo, responsivo e intuitivo).

---

## 🏗️ Arquitetura e Organização

O frontend utiliza uma abordagem baseada em **Componentes Funcionais** e **Hooks**, com gerenciamento de estado local para o fluxo de telas.

### Estrutura de Pastas
- `/src/components`: Componentes de UI reutilizáveis (Botões, Cards, etc.) estilizados com Tailwind.
- `/src/screens`: Telas principais que compõem o fluxo do software.
- `/src/services`: Camada de comunicação com o backend (API Bridge).
- `/src/hooks`: Lógica de UI extraída (ex: `useTheme` para modo escuro/claro).
- `/src/assets`: Recursos estáticos como ícones e imagens.

---

## 🎨 Design e UI
- **Tailwind CSS**: Utilizado para estilização rápida e consistente.
- **Framer Motion**: Responsável pelas transições suaves entre as telas e micro-animações.
- **Lucide React**: Biblioteca de ícones moderna e minimalista.
- **Dark Mode**: Suporte nativo a temas claro e escuro.

---

## 🔄 Fluxo do Usuário (Screens)
1. **WelcomeScreen**: Saudação e seleção do Setor/Tipo de Ensaio. Defines o layout que será usado.
2. **UploadScreen**: Área de Dropzone para upload de fotos (PNG/JPG) ou PDF.
3. **LoadingScreen**: Exibe o progresso em tempo real do processamento feito pelo Python.
4. **CompletionScreen**: Finalização com botão para abrir/baixar o laudo gerado.

---

## 🔌 Integração (API Bridge)
O arquivo `src/services/api.js` atua como uma ponte inteligente:
- **Modo Desktop**: Se rodando via `pywebview`, comunica-se diretamente com o Python.
- **Modo Web**: Utiliza `fetch` tradicional para se comunicar com a API Flask (porta 5000).

---

## 🛠️ Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (Hot Reload)
npm run dev

# Gerar build de produção (Pasta /dist)
npm run build
```
