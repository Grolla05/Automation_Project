import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  /** Árvore de componentes a ser protegida */
  children: ReactNode;
  /** Fallback UI customizado (opcional) */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  errorId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: '',
    };
  }

  /** Atualiza o estado para renderizar o fallback na próxima chamada */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  /** Captura informações detalhadas do stack e gera log estruturado */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log estruturado para o console (capturável pelo PyWebView / Sentry etc.)
    console.group(`🔴 [ErrorBoundary] Exceção não tratada — ${this.state.errorId}`);
    console.error('Mensagem:', error.message);
    console.error('Stack do Erro:', error.stack);
    console.error('Stack do Componente:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      errorId: '',
    });
  };

  private toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails, errorId } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) return children;

    // Fallback customizado passado via prop
    if (fallback) return fallback;

    // ── Fallback UI padrão ─── Apple Style ────────────────────────────────────
    return (
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-apple-bg px-4">
        {/* Decorative background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-red-500/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[15%] -right-[10%] w-[50%] h-[50%] bg-red-400/10 blur-[120px] rounded-full" />
        </div>

        {/* Card */}
        <div className="relative z-10 w-full max-w-lg bg-apple-white border border-apple-gray/20 dark:border-white/5 rounded-[24px] shadow-2xl overflow-hidden">

          {/* Red accent bar */}
          <div className="h-1 w-full bg-linear-to-r from-red-400 via-red-500 to-red-400" />

          <div className="p-8 flex flex-col items-center text-center">

            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 shadow-sm ring-4 ring-red-100 dark:ring-red-500/10">
              <AlertTriangle
                size={40}
                className="text-red-500"
                strokeWidth={1.5}
              />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-apple-text tracking-tight mb-2">
              Algo deu errado
            </h1>
            <p className="text-apple-secondary text-sm mb-1">
              A aplicação encontrou um erro inesperado e não pôde continuar.
            </p>

            {/* Error ID badge */}
            <span className="inline-block mt-2 mb-6 px-3 py-1 rounded-full bg-red-500/10 text-red-500 font-mono text-xs font-semibold tracking-widest">
              {errorId}
            </span>

            {/* Error message preview */}
            {error && (
              <div className="w-full bg-apple-bg border border-apple-gray/30 rounded-xl px-4 py-3 mb-4 text-left">
                <p className="font-mono text-xs text-red-500 break-all leading-relaxed">
                  {error.message || 'Erro desconhecido'}
                </p>
              </div>
            )}

            {/* Toggle details */}
            <button
              onClick={this.toggleDetails}
              className="flex items-center space-x-1.5 text-apple-secondary text-xs font-medium mb-6 hover:text-apple-text transition-colors cursor-pointer"
            >
              {showDetails
                ? <><ChevronUp size={14} /><span>Ocultar detalhes técnicos</span></>
                : <><ChevronDown size={14} /><span>Ver detalhes técnicos</span></>
              }
            </button>

            {/* Stack trace collapsible */}
            {showDetails && errorInfo && (
              <div className="w-full bg-apple-bg border border-apple-gray/30 rounded-xl p-4 mb-6 text-left max-h-48 overflow-y-auto custom-scrollbar">
                <p className="font-mono text-[10px] text-apple-secondary whitespace-pre-wrap break-all leading-relaxed">
                  {errorInfo.componentStack?.trim()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Tentar novamente — reseta o estado do boundary */}
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-apple-blue text-white rounded-apple font-semibold text-sm hover:bg-[#005bb5] transition-all duration-300 shadow-[0_4px_14px_0_rgba(0,113,227,0.39)] hover:shadow-[0_6px_20px_rgba(0,113,227,0.45)] hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Tentar Novamente</span>
              </button>

              {/* Recarregar a página */}
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-apple-white text-apple-text border border-apple-gray rounded-apple font-semibold text-sm hover:bg-apple-bg transition-all duration-300 shadow-sm hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span>Recarregar Aplicação</span>
              </button>
            </div>

            {/* Footer hint */}
            <p className="mt-6 text-[10px] text-apple-secondary/50 font-medium tracking-wider uppercase">
              Código de erro copiado para o console de diagnóstico
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
