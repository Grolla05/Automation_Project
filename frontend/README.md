# 💻 Frontend - OCR Automation Interface

Este é o frontend da aplicação de automação de laudos, desenvolvido com **React** e **Vite**, focado em uma experiência de usuário (UX) premium baseada nos princípios de design da Apple (limpo, responsivo e intuitivo).

---

## 🚀 Stack Tecnológica

- **React 18 + TypeScript**: Base da aplicação.
- **TanStack React Query (v5)**: Gerenciamento de estado assíncrono, cache e sincronização de dados.
- **Axios + Axios-Retry**: Cliente HTTP com interceptores e política de retentativa automática (3x) para lidar com falhas de conexão no backend (Porta 5000).
- **Tailwind CSS**: Estilização moderna e utilitária.
- **Framer Motion**: Micro-animações e transições de tela.
- **Lucide React**: Biblioteca de ícones minimalistas.

---

## 🏗️ Arquitetura e Organização

A aplicação segue uma estrutura modular para facilitar a manutenção e escalabilidade.

### Estrutura de Pastas e Arquivos Chave

- `src/components/`: Componentes de UI reutilizáveis (Botões, Cards, Modais).
- `src/components/ui/`: Componentes básicos do Design System.
- `src/screens/`: Containers de tela que representam o fluxo do usuário (Welcome, Upload, Loading, Completion).
- `src/services/`: Camada de comunicação de rede.
- `src/services/axiosInstance.ts`: Configuração central do Axios com interceptores de erro e lógica de retry.
- `src/services/api.ts`: Centralização das chamadas de API e Hooks do React Query (`useUserInfo`, `useSettings`, `useProcessImages`).
- `src/hooks/`: Hooks customizados (ex: `useTheme` para Dark Mode).
- `src/context/`: Contextos globais (ex: `SessionContext`).
- `src/lib/`: Constantes, mapeamentos de layout e configurações locais em JSON.
- `src/router/`: Configuração das rotas da aplicação.
- `src/schemas/`: Validações de formulários e esquemas de dados (Zod/Upload).

---

## 🎨 Design e UI

- **Tailwind CSS**: Utilizado para estilização rápida, responsiva e com excelente coesão de espaçamentos.
- **Framer Motion**: Responsável pelas transições suaves de saída/entrada entre as telas e micro-animações.
- **Lucide React**: Biblioteca de pacote de ícones modernos e minimalistas (SVG).
- **Dark Mode**: Suporte inteligente à paleta de cores escurecidas adaptada no núcleo do Tailwind (Variáveis Custom).

---

## 🔄 Fluxo do Usuário (Screens)

1. **WelcomeScreen**: Seleção hierárquica (Setor > Tipo de Ensaio). Define o layout target.
2. **UploadScreen**: Interface validada para upload de fotos, PDFs ou planilhas.
   - *Regra Especial:* Ensaios ASE aceitam apenas 1 planilha.
3. **LoadingScreen**: Feedback visual animado durante o processamento de OCR e geração de laudos no Python.
4. **CompletionScreen**: Finalização com download/abertura direta do arquivo `.docx` gerado.

---

## 🛠️ Configuração de Rede (Resiliência)

Para lidar com a volatilidade do backend Python (Flask), a aplicação implementa:

- **Retry (3x)**: Tentativas automáticas em erros de rede ou status 5xx.
- **Interceptors**: Logs centralizados de falhas de comunicação no console de desenvolvimento.
- **Cache**: React Query mantém os dados de configurações e usuário em cache, reduzindo o tráfego de rede.

---

## 💻 Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (Hot Reload)
npm run dev

# Gerar build de produção para o diretório /dist
npm run build
```
