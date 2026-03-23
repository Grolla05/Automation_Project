import { RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { router } from './router';

/**
 * Raiz da aplicação.
 * Responsabilidades:
 *  - Captura exceções de render com ErrorBoundary (nível de app)
 *  - Inicializa o React Router via RouterProvider
 */
function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
