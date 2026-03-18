# 📄 Sistema de Automação de Relatórios OCR

Sistema Desktop desenvolvido para automação de processos de Relatórios técnicos (Ensaios de Bluetooth/Wi-Fi), utilizando Visão Computacional para extração de dados e integração com templates Microsoft Word (.docx).

---

## 🚀 Próximos Passos (To-Do List)

Aqui estão as próximas atividades planejadas para evolução da ferramenta:

### 🛠️ Estruturação e Layout

- [ ] **Padronização de Nomenclatura**: Sincronizar os nomes das opções de ensaio no Frontend com os nomes dos arquivos `.docx` na pasta `storage/layout`.
- [ ] **Protótipo de Layout Master**: Criar um arquivo `.docx` modelo contendo:
  - Tabelas estruturadas para resultados.
  - Espaços reservados (placeholders) para inserção de imagens.
  - Campos dinâmicos (ex: `[DATA]`, `[ENGENHEIRO]`, `[CONTEUDO]`).

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
  /storage       # Uploads, Layout e Exportações
  /utils         # Configurações de Log e Helpers
/frontend
  /src/screens   # Interface do Usuário
  /dist          # Build de produção
/logs            # Histórico de execução (YYYY-MM-DD.log)
```

---

## ⚙️ Como Executar

1. Certifique-se de ter o **Tesseract OCR** e o **Poppler** instalados no Windows.
2. Instale as dependências do backend: `pip install -r backend/requirements.txt`.
3. Instale as dependências do frontend: `npm install --legacy-peer-deps`.
4. Rode o software: `python backend/main.py`.

---

## 📈 Novas Features e Evolução Comercial

### 🛠️ Roadmap Backend

Aqui estão as evoluções para o núcleo Python (Flask + OCR), focadas em processamento massivo, segurança corporativa e performance de máquina nativa.

#### 🔴 Fase 1: Estabilidade Core & Prevenção de Falhas (Alta Prioridade)

- [ ] **Limpeza Segura Automática (Garbage Colletion)**: Criar um *Scheduler* (ex: APScheduler) para limpar permanentemente a pasta `/storage` em intervalos regulares, evitando lixo no HD de computadores corporativos se a janela for fechada bruscamente.
  > 🤖 **Prompt para IA:** *"Atue como Engenheiro Python Sênior. Refatore o ciclo de vida dos arquivos na minha API Flask. O objetivo é implementar uma rotina em background usando `APScheduler` para rodar a cada 30 minutos na raiz do projeto. Ela deve varrer as subpastas em `/storage` e excluir arquivos não-modificados há mais de 1 hora. Restrições: Mantenha a compatibilidade com a thread do PyWebView (não crashe a GUI). Retorne apenas o módulo de agendamento e como registrá-lo suavemente no `main.py`."*
- [ ] **Gerenciamento de Logs Otimizado (LogRotation)**: Implementar rotação nas configurações de Log para zippar ou apagar nativamente registros antigos, impedindo que os gigabytes do cliente lotem após 1 ano de uso diário de OCR.
  > 🤖 **Prompt para IA:** *"Atue como Arquiteto de Software Python. Preciso atualizar o meu `logger_config.py` para usar `RotatingFileHandler` ou `TimedRotatingFileHandler` rotacionando logs. Regras da implementação: Limite cada arquivo `.log` a 10MB com máximo de 5 backups. Se for rotacionado, aplique compressão sem parar a thread principal. Deve manter o output limpo do console enquanto direciona o volume massivo para o disco."*
- [ ] **Tratadores de Erro Globais (Global Handlers)**: Envelopar toda a aplicação para que exceções internas devolvam pacotes JSON limpos (Ex: `{"error_code": "OCR_FAIL"}`) e padronizados para o React, sem explodir a thread principal do Flask.
  > 🤖 **Prompt para IA:** *"Meu servidor Flask no `main.py` está vulnerável a quebras de exceções crônicas. Crie um Decorator de Tratamento Global (`@app.errorhandler`) ou uma Exception Class customizada que capture tudo em `/api`. Se o core de OCR ou de injeção Docx estourar uma exception (`Exception as e`), o catch deve parar o traceback de crashear a API, escrevendo o erro no Log com severidade CRITICAL, e devolvendo exatamente a interface: `{'success': false, 'error_code': 'SYS_01', 'message': 'Mensagem tratada e segura para humanos'}` com HTTP Status 500."*
- [ ] **Adoção de Type Hints e Pydantic**: Iniciar a tipagem estrita no Python 3. Interceptar todo requirimentto (`sector`, `tests`) pela porta validando-o e garantindo a saúde do payload antes da injeção cega no Word.
  > 🤖 **Prompt para IA:** *"Atue como Backend Sênior (FastAPI/Pydantic). Quero proteger os dados que chegam em `/api/process` via `Flask`. Não use `request.form.get()` diretamente. Escreva um modelo rígido no Pydantic chamado `OCRRequestPayload`. O modelo deve checar tamanho, requerer `sector` não-nulo, e transformar `tests` que chega por JSON-String em lista garantida de Strings. Por fim envolva o endpoint de forma que qualquer entrada violada dispare um abort(400) imediato e automatizado antes de iniciar a extração."*

#### 🟡 Fase 2: Motor de Performance & Processamento (Média Prioridade)

- [ ] **Multiprocessamento Paralelo (OCR Turbo)**: Utilizar `ProcessPoolExecutor` para permitir que o serviço Tesseract rode N imagens ao mesmo tempo dividindo-as nos núcleos ociosos do processador do cliente (cortando o tempo de processamento drásticamente).
  > 🤖 **Prompt para IA:** *"Examine e refatore as funções primárias de loop de arquivos dentro do `ocr_service.py`. A meta é Paralelismo Computacional para acelerar o Tesseract. Substitua loops sequenciais de imagens (`for img in images`) pela implementação do `concurrent.futures.ProcessPoolExecutor`. Restrições: O código roda ativamente no Windows local do cliente. Preserve a ordem de saída dos retornos da OCR no dicionário final (mantenha thread safe) e controle um fallback de timeout caso uma thread do pytesseract fique zoombie ou presa."*
- [ ] **Fila Assíncrona de Background (Job ID)**: Interromper o processo de "espera contínua" bloqueante do HTTP 5000. Liberar o Frontend imediatamente devolvendo um 'ID de Tarefa' e processar fotos massivas em um Worker secundário em Python.
  > 🤖 **Prompt para IA:** *"Reestruture meu fluxo de controle via Flask: A rota POST `/api/process` atualmente congela (bloqueia requisição HTTP) por até 2 minutos para fazer o OCR e retornar o caminho do final do Docx. Altere-a para arquitetura Assíncrona via Background Task. O Controller deve retornar `{'job_id': '1234', 'status': 'queued'}` instantaneamente. O Motor OCR deve seguir seu processo internamente. Em seguida crie uma rota rápida HTTP GET `/api/status/<job_id>` que consulta na memória e retorna se já terminou e entrega o path do `.docx`."*
- [ ] **Progresso Real-Time (SSE ou WebSockets)**: Abrir um canal ativo com o React para informar percentuais nativos à barra de *loading* ("Foto 2 de 5 extraída...", "Gerando Tabelas... 80%").
  > 🤖 **Prompt para IA:** *"Desejo injetar telemetria WebSocket ou SSE na minha conexão Flask-React. Quando eu chamar `/api/process`, eu preciso receber um stream de Server-Sent Events do andamento do pipeline. Refatore os services `ocr_service` e o processamento de imagens emitindo progressos do tipo `{'progress': 20, 'message': 'Processando Excel'}`. Escreva também como o React API chamaria isso consumindo um EventSource."*
- [ ] **Segurança Profunda e Validação de Arquivo (MIME Type)**: Trocar a validação ineficiente baseada no nome "arquivo.pdf" por assinaturas digitais da biblioteca de buffer, impedindo injeção de scripts no backend.
  > 🤖 **Prompt para IA:** *"Ajude a criar funções blindadas de segurança no recebimento de arquivos em upload (MIME sanitization). Ignore `file.filename.endswith()`. Escreva um interceptador utilizando bibliotecas absolutas (`python-magic` via libmagic ou nativa file header peek) que leia o Buffer em Bytes na subida primária. Se um `.pdf` for um '.exe' renomeado, estoure exceção imediata de Segurança."*

#### 🟢 Fase 3: Arquitetura Avançada & Nuvem (Última Prioridade)

- [ ] **Separação de Rotas (Blueprints ou FastAPI)**: Refatorar o robusto e inflado `main.py` ramificando seus domínios para controladores isolados, ou migrar o motor inteiramente para o **FastAPI** para ganhar suporte nativo Async e documentação interativa grátis (Swagger/OpenAPI).
  > 🤖 **Prompt para IA:** *"Atue como Arquiteto Estrutural. Desmembre meu `main.py` monolítico baseado em Flask. Remova as rotas aglomeradas soltas e utilize o conceito de `Flask Blueprints`. Crie `routes/api_routes.py`, `routes/system_routes.py`. Retorne a estrutura de como registrar esses bluepints polidamente no arquivo `app.py` matriz, instanciando os serviços (`ocr_service`, `doc_service`) de forma singleton e protegida."*
- [ ] **Desacoplamento de Entrypoint**: Separar as naturezas criando `run_desktop.py` (Desktop GUI) e um independente `run_server.py` para o dia em que o serviço flertar se transformar num modelo de negócio Nuvem/SaaS.
  > 🤖 **Prompt para IA:** *"O projeto possui injeção cruzada na `main.py` misturando Flask server puro e instância PyWebView Desktop. Quebre em três arquivos: uma inicialização core (`app.py`), um arquivo puramente SaaS (`run_server.py` port: 8080 host 0.0.0.0 sem interface webview) e um runner de empacotamento desktop (`run_desktop.py` que importa e injeta o Flask num sub-processo ou thread restrito local, abrindo o container GUI via webview)."*
- [ ] **Gerenciamento de Ambiente Condicional (.env)**: Adotar a separação rígida de configurações, blindando o software para rodar dinamicamente e remover pastas 'hard-coded' (`storage/uploads`), o que permitirá que ele se defenda caso uma permissão corporativa no Windows negue acesso raiz da aplicação.
  > 🤖 **Prompt para IA:** *"Implemente aderência aos 12 Factors App na minha aplicação! Escreva um gerenciador (`config_loader.py`) usando `.env` via `python-dotenv`. Mova variáveis absolutas do código estático (como `UPLOAD_FOLDER = 'storage/uploads'`, portas HTTP, nível de logging do ambiente LOCAL ou PROD) para este módulo agnóstico usando `os.environ.get`. Providencie constantes genéricas de fallbacks operacionais."*

### 💻 Roadmap Frontend

Aqui estão as melhorias organizadas por fase para elevar o software a um padrão comercial de alta resiliência e estabilidade.

### 🔴 Fase 1: Fundação Crítica & Prevenção de Falhas (Alta Prioridade)

- ✅ **Adoção de TypeScript**: Migrar a base de `.jsx` para `.tsx` (garantir tipagem estática, proteção contra variáveis nulas e autocompletar).
- ✅ **Tratamento Global de Erros (Error Boundaries)**: Implementar uma tela elegante de falha no React que substitua a "tela branca" em caso de quebras inesperadas no Frontend ou PyWebView.
- [ ] **Validação Estrutural Rígida (Zod + React Hook Form)**: Impedir formulários corrompidos e validar rigorosamente os formatos, tamanhos e tipos de extensões (`.xlsx`, `.pdf`) antes de enviar ao OCR.
  > 🤖 **Prompt para IA:** *"Atue como Sênior React + Hook Form. Refatore o meu `UploadLayout.jsx` combinando o poder do `react-hook-form` guiado pelo schema `Zod`. Construa um `z.object` que rejeite subir array de arquivos de tamanho > 50MB ou formato incompatível com o ensaio escolhido (Validando extensão `.xlsx` para 'ASE'). Previna o envio, mostre mensagens de bad feedback de input visual antes de chamar o service API."*
- ✅ **Roteamento Profissional (React Router / TanStack)**: Substituir o estado local de páginas (`currentScreen === 'UPLOAD'`) por rotas reais para proteger o fluxo de *Wizard* e permitir expansão limpa de novas telas.
- [ ] **Gerenciamento Robusto de Rede (TanStack Query + Axios)**: Substituir chamadas `fetch` cruas. Implementar sistema global capaz de lidar com *timeouts*, lentidões locais e tentar requisições novamente sem explodir a aplicação.
  > 🤖 **Prompt para IA:** *"Modernize o serviço da minha `api.js` utilizando Axios para requests no lugar do Fetch. E introduza de forma cirúrgica o pacote `TanStack React Query`. Eu preciso que todas as chamadas HTTP como salvar logs e carregar preferências de Usuário tenham Cache garantido, Mutating status isolados, interceptores Axio, e retentativas configuradas (`retry: 3`) contra timeouts assíncronos de porta Python morta (5000)."*

### 🟡 Fase 2: Manutenibilidade, Qualidade & UX (Média Prioridade)

- [ ] **Gerenciamento Global de Estado (Zustand ou Redux Toolkit)**: Remover o prop-drilling excessivo (ex: o vai-e-vem do `sessionData`) isolando a memória dos arquivos que o usuário escolheu em uma *store* central.
  > 🤖 **Prompt para IA:** *"Implemente a biblioteca `Zustand` no meu frontend React. Retire a variável e os setters do `sessionData` que sobem e descem do Componente Mãe em Props drilling interminável. Escreva um Memory Store limpo em `/hooks/useWizardStore.ts` com funções desacopladas para preencher arquivos e esvaziá-los, permitindo acesso universal aos componentes distantes da hierarquia."*
- [ ] **Sistema Universal de Feedbacks Visuais**: Adicionar *Toasts* (ex: `Sonner`) nativos para indicar com clareza sucessos, carregamentos e alertas no canto da tela.
  > 🤖 **Prompt para IA:** *"Utilize a biblioteca `sonner` para React. Injete o componente Provider raiz no escopo e depois, espalhe `toast.success`, `toast.error`, e `toast.promise` nas requisições principais de form envio e download (`api.js` e `UploadLayout`). Os temas das pop-ups precisam respeitar fielmente meu dark-theme index.css usando custom styling e position no canto superior direito visível."*
- [ ] **Refinamento de Design System e Acessibilidade (shadcn/ui ou Radix)**: Modernizar interações (Dropdowns, Selects, Modais) para suportarem padrões nativos de navegação via teclado (`Tab`/`Esc`) e Leitores de Tela.
  > 🤖 **Prompt para IA:** *"Revise a acessibilidade atual do meu Modal de Configurações, meus Cards Buttons e Dropdowns de `WelcomeScreen.jsx`. Baseando nas heurísticas ARIA-roles ou na substituição via blocos do pacote open-source `Radix UI Primitives`, entregue componentes refatorados que fechem nativamente suportando eventos de interrupção (tecla Esc), 'Click Outside' e leitura de leitor de tela para deficientes."*
- [ ] **Pipeline de Qualidade (Git Hooks com Husky)**: Interceptar "commits" no Git para garantir que o código foi formatado e está livre de problemas (Lint) antes de ser aceito na base central.
  > 🤖 **Prompt para IA:** *"Comande a configuração absoluta de automação de padronização pre-commit no repositório. Eu preciso implementar `Husky` integrado ao `lint-staged` no package.json. Crie o shell script de pre-commit. Quando eu der um `git commit`, o hook precisará rodar o `eslint --fix` apenas sob arquivos JS/TS afetados e interromper/abortar (prevent) a entrega local se houver quebra fatal de regras da linter que eu configurei."*

### 🟢 Fase 3: Maturidade, Performance & Expansão (Última Prioridade)

- [ ] **Bateria de Testes Automatizados (Vitest / Playwright)**: Criar robôs que testam a interface interativamente (garantindo que envios de planilhas ASE não sofram interrupções em atualizações futuras).
  > 🤖 **Prompt para IA:** *"Atue como Quality Assurance Automation Sênior. Configure arquitetura `Vitest` com `Testing Library` em vite-config. Crie meu primeiro cenário de Teste Unitário provando robustez dos métodos em `data.js` do meu app. Depois, estruture 1 suit de navegação End-To-End E2E simples escrevendo um caso via Playwright local imitando meu cliente preenchendo o Wizard de 'Setores', até upload de mock image."*
- [ ] **Telemetria / Observabilidade (Sentry)**: Capturar e relatar erros não silenciosos que possam vir a acontecer na máquina dos engenheiros diretamente para um painel web da equipe de desenvolvimento.
  > 🤖 **Prompt para IA:** *"Ensine com script exato de configuração sobre como acoplar o pacote Browser de Telemetria corporativa (`@sentry/react` e `@sentry/vite-plugin` source-mapping) ao meu ciclo de erro ErrorBoundary. Quero que qualquer tela branca nos computadores Windows nativos da empresa lance call de stack silenciosamente ao meu painel Sentry na nuvem para monitoramento oculto dos clientes, contendo metadata sobre o Device (Usuário do Windows)."*
- [ ] **Code-Splitting & Compressão Edge**: Fatiar o código compilado JS (`Lazy Loading`) para otimizar o empacotamento desktop (`PyWebView`), alcançando arranques instantâneos ao nível sistema operacional.
  > 🤖 **Prompt para IA:** *"Execute técnicas avançadas de otimização de Vite-Build do meu Frontend visando diminuição extrema do Bundle Javascript. Utilize imports assíncronos (`React.lazy()` e `<Suspense>`) no roteamento entre o Loader Screen e a Completion page do aplicativo, separando os chunks. Modifique o vite.config adicionando plugin gzip brotli ou configurando minification terser agressiva visando performance desktop idêntica aos apps nativos C++."*
- [ ] **Internacionalização (i18n)**: Extrair todos os textos do software para arquivos `.json` a fim de viabilizar versões multi-idioma (EN / ES) sob um único clique de forma nativa.
  > 🤖 **Prompt para IA:** *"Quero escalar este aplicativo frontend para mercado global. Empregue `i18next` em conjunto com o `react-i18next`. Crie a base estática de locale JSON English/Portuguese e extraia os textos essenciais do meu `App.jsx` ou Welcome string hard-coded substituindo-os pelos hooks formatados `useTranslation().t("chave_bemvindo")`. Adicione a lógica de seletor de linguagem na GUI do settings.jsx."*
