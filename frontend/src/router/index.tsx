import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '../components/RootLayout';

// Dynamic Imports (Code Splitting)
const UpdateScreen = lazy(() => import('../screens/UpdateScreen'));
const WelcomeScreen = lazy(() => import('../screens/WelcomeScreen'));
const UploadScreen = lazy(() => import('../screens/UploadScreen'));
const LoadingScreen = lazy(() => import('../screens/LoadingScreen'));
const CompletionScreen = lazy(() => import('../screens/CompletionScreen'));

/**
 * Router centralizado da aplicação.
 *
 * Rotas:
 *   /updater   → UpdateScreen   (verificação e UI de update)
 *   /          → WelcomeScreen  (seleção de setor/ensaios)
 *   /upload    → UploadScreen   (upload de arquivos)  [guarda: session.sector]
 *   /process   → LoadingScreen  (processamento OCR)   [guarda: session.files]
 *   /result    → CompletionScreen (relatório pronto)  [guarda: session.reportPath]
 *
 * NOTA PyWebView/Flask: como este é um SPA servido via Flask + PyWebView, a
 * navegação acontece 100% no cliente. Caso o usuário acesse uma rota diretamente
 * pelo browser (ex: refresh em /upload), o Flask precisará retornar index.html
 * para todos os paths. Adicione ao Flask:
 *   @app.route('/', defaults={'path': ''})
 *   @app.route('/<path:path>')
 *   def serve(path): return send_file('dist/index.html')
 */
export const router = createBrowserRouter([
  {
    path: '/updater',
    element: <UpdateScreen />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/updater" replace />,
      },
      {
        path: 'welcome',
        element: <WelcomeScreen />,
      },
      {
        path: 'upload',
        element: <UploadScreen />,
      },
      {
        path: 'process',
        element: <LoadingScreen />,
      },
      {
        path: 'result',
        element: <CompletionScreen />,
      },
      {
        // Catch-all: qualquer rota inválida volta para a raiz
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
