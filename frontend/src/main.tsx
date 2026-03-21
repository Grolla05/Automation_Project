import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import './i18n';
import '../src/index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster 
        position="top-right" 
        expand={true} 
        richColors 
        closeButton
        theme="system"
        toastOptions={{
          style: {
            background: 'var(--color-apple-white)',
            color: 'var(--color-apple-text)',
            borderRadius: 'var(--radius-apple)',
            border: '1px solid var(--color-apple-gray)',
            boxShadow: 'var(--shadow-apple)',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
