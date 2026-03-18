/**
 * Declarações globais para APIs injetadas pelo PyWebView
 * e outros ambientes externos ao React.
 */

/** Resposta genérica de sucesso/erro do backend Python */
interface PyWebViewResult {
  success: boolean;
  error?: string;
}

/** API exposta pelo Python via pywebview.api */
interface PyWebViewApi {
  getUserInfo?: () => Promise<UserInfo>;
  downloadReport?: (filename: string) => Promise<PyWebViewResult>;
  getSettings?: () => Promise<AppSettings>;
  saveSettings?: (settings: AppSettings) => Promise<PyWebViewResult>;
}

/** Dados do usuário */
interface UserInfo {
  name: string;
  picture?: string;
}

/** Configurações persistidas da aplicação */
interface AppSettings {
  theme?: "light" | "dark";
  [key: string]: unknown;
}

declare global {
  interface Window {
    pywebview?: {
      api: PyWebViewApi;
    };
  }
}

export {};
