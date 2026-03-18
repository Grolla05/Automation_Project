/**
 * Service to interact with Flask Backend or PyWebView.
 */
import { LAYOUT_MAPPING } from "../lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Dados retornados por api.getUserInfo() */
export interface UserInfo {
  name: string;
  picture?: string;
}

/** Configurações da aplicação */
export interface AppSettings {
  theme?: "light" | "dark";
  [key: string]: unknown;
}

/** Resultado de api.processImages() */
export interface ProcessResult {
  success: boolean;
  path: string;
}

/** Resultado de api.saveSettings() */
export interface SaveSettingsResult {
  success: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000/api";

const isWebView = (): boolean => window.pywebview !== undefined;

// ─── API Object ───────────────────────────────────────────────────────────────

export const api = {
  /** Busca informações do usuário via PyWebView ou REST */
  getUserInfo: async (): Promise<UserInfo> => {
    if (isWebView() && window.pywebview!.api?.getUserInfo) {
      return await window.pywebview!.api.getUserInfo!();
    }

    try {
      const response = await fetch(`${BASE_URL}/user/info`);
      if (!response.ok) throw new Error("Erro ao buscar info do usuário");
      return (await response.json()) as UserInfo;
    } catch {
      console.warn("Backend Flask não disponível, usando mock.");
      return { name: "Engenheiro Local" };
    }
  },

  /** Processa imagens via OCR e gera documento Word */
  processImages: async (
    sector: string,
    tests: string[],
    files: File[]
  ): Promise<ProcessResult> => {
    const formData = new FormData();
    formData.append("sector", sector);
    formData.append("tests", JSON.stringify(tests));

    const mainTest = tests[0] ?? "Padrao";
    const layoutId = LAYOUT_MAPPING[mainTest] ?? btoa(`${mainTest}.docx`);

    console.log(
      `[API processImages] Ensaio principal detectado: "${mainTest}"`
    );
    console.log(
      `[API processImages] Mapping para Layout ID (Base64): "${layoutId}"`
    );

    formData.append("layout_id", layoutId);
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch(`${BASE_URL}/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Erro no processamento do servidor");
      }

      const result = (await response.json()) as {
        success: boolean;
        report_path: string;
      };

      return {
        success: result.success,
        path: result.report_path,
      };
    } catch (err) {
      console.error("Erro na comunicação com o backend:", err);
      throw err;
    }
  },

  /** Valida se o layout existe no backend antes do upload */
  checkLayout: async (tests: string[]): Promise<boolean> => {
    const mainTest = tests[0] ?? "Padrao";
    const layoutId = LAYOUT_MAPPING[mainTest] ?? btoa(`${mainTest}.docx`);

    console.log(`[API checkLayout] Validando Ensaio: "${mainTest}"`);
    console.log(
      `[API checkLayout] Enviando Layout ID (Base64) para o Backend: "${layoutId}"`
    );

    const response = await fetch(`${BASE_URL}/check_layout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tests, layout_id: layoutId }),
    });

    const result = (await response.json()) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        result.error ?? "não há layout cadastrado para este Ensaio"
      );
    }

    return result.success ?? false;
  },

  /** Faz download / abre o arquivo gerado */
  downloadReport: async (filename: string): Promise<void> => {
    if (!filename) return;

    if (isWebView() && window.pywebview!.api?.downloadReport) {
      const result = await window.pywebview!.api.downloadReport!(filename);
      if (result.success) {
        console.log("Arquivo aberto nativamente pelo SO.");
        return;
      } else {
        console.error("Erro ao abrir nativamente:", result.error);
      }
    }

    const downloadUrl = `${BASE_URL}/download/${filename}`;
    window.open(downloadUrl, "_blank");
    console.log("Iniciando download via browser de:", downloadUrl);
  },

  /** Carrega as configurações do usuário */
  getSettings: async (): Promise<AppSettings> => {
    if (isWebView() && window.pywebview!.api?.getSettings) {
      return await window.pywebview!.api.getSettings!();
    }
    try {
      const response = await fetch(`${BASE_URL}/settings`);
      return (await response.json()) as AppSettings;
    } catch {
      return { theme: "light" };
    }
  },

  /** Salva as configurações do usuário */
  saveSettings: async (settings: AppSettings): Promise<SaveSettingsResult> => {
    if (isWebView() && window.pywebview!.api?.saveSettings) {
      const res = await window.pywebview!.api.saveSettings!(settings);
      return { success: res.success };
    }
    try {
      const response = await fetch(`${BASE_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      return (await response.json()) as SaveSettingsResult;
    } catch (err) {
      console.error("Erro ao salvar settings:", err);
      return { success: false };
    }
  },
};
