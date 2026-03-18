import { RouterProvider } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import ErrorBoundary from './components/ErrorBoundary';
import { router } from './router';

/**
 * Raiz da aplicação.
 * Responsabilidades:
 *  - Provê o SessionContext a toda a árvore
 *  - Captura exceções de render com ErrorBoundary (nível de app)
 *  - Inicializa o React Router via RouterProvider
 */
function App() {
  return (
    <SessionProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </SessionProvider>
  );
}

export default App;
