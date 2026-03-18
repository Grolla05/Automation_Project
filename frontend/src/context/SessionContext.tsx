import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { UserInfo } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionState {
  /** Dados do usuário autenticado */
  userData: UserInfo;
  /** Setor selecionado na WelcomeScreen */
  sector: string;
  /** Tipo de ensaio selecionado (ex: "RF", "ASE") */
  testType: string;
  /** Lista de ensaios selecionados */
  tests: string[];
  /** Arquivos carregados pelo usuário */
  files: File[];
  /** Caminho do relatório gerado no backend */
  reportPath: string | null;
}

interface SessionContextValue {
  session: SessionState;
  setUserData: (userData: UserInfo) => void;
  setSelection: (sector: string, testType: string, tests: string[]) => void;
  setFiles: (files: File[]) => void;
  setReportPath: (path: string) => void;
  resetSession: () => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SESSION: SessionState = {
  userData: { name: 'Técnico' },
  sector: '',
  testType: '',
  tests: [],
  files: [],
  reportPath: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [session, setSession] = useState<SessionState>(DEFAULT_SESSION);

  const setUserData = useCallback((userData: UserInfo) => {
    setSession((prev) => ({ ...prev, userData }));
  }, []);

  const setSelection = useCallback(
    (sector: string, testType: string, tests: string[]) => {
      setSession((prev) => ({
        ...prev,
        sector,
        testType,
        tests,
        // Reset downstream data when selection changes
        files: [],
        reportPath: null,
      }));
    },
    []
  );

  const setFiles = useCallback((files: File[]) => {
    setSession((prev) => ({ ...prev, files, reportPath: null }));
  }, []);

  const setReportPath = useCallback((path: string) => {
    setSession((prev) => ({ ...prev, reportPath: path }));
  }, []);

  const resetSession = useCallback(() => {
    setSession((prev) => ({
      ...DEFAULT_SESSION,
      // Preserve user data across resets
      userData: prev.userData,
    }));
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setUserData,
        setSelection,
        setFiles,
        setReportPath,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Acessa o contexto de sessão.
 * Lança erro se usado fora do `<SessionProvider>`.
 */
export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }
  return ctx;
};
