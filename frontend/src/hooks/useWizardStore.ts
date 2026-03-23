import { create } from 'zustand';
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

interface WizardStore extends SessionState {
  // Actions
  setUserData: (userData: UserInfo) => void;
  setSelection: (sector: string, testType: string, tests: string[]) => void;
  setFiles: (files: File[]) => void;
  addFiles: (newFiles: File[]) => void;
  removeFile: (fileName: string) => void;
  clearFiles: () => void;
  setReportPath: (path: string | null) => void;
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

// ─── Store ──────────────────────────────────────────────────────────────────

export const useWizardStore = create<WizardStore>((set) => ({
  ...DEFAULT_SESSION,

  setUserData: (userData) => set({ userData }),

  setSelection: (sector, testType, tests) =>
    set({
      sector,
      testType,
      tests,
      // Reset downstream data when selection changes
      files: [],
      reportPath: null,
    }),

  setFiles: (files) => set({ files, reportPath: null }),

  addFiles: (newFiles) =>
    set((state) => ({
      files: [...state.files, ...newFiles],
      reportPath: null,
    })),

  removeFile: (fileName) =>
    set((state) => ({
      files: state.files.filter((f) => f.name !== fileName),
      reportPath: null,
    })),

  clearFiles: () => set({ files: [], reportPath: null }),

  setReportPath: (path) => set({ reportPath: path }),

  resetSession: () =>
    set((state) => ({
      ...DEFAULT_SESSION,
      userData: state.userData, // Preserve user data
    })),
}));
