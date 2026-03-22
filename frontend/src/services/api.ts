/**
 * Service to interact with Flask Backend or PyWebView using Axios and React Query.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axiosInstance";
import { getLayoutIdForTest } from "../lib/data";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  name: string;
  picture?: string;
}

export interface AppSettings {
  theme?: "light" | "dark";
  [key: string]: unknown;
}

export interface ProcessResult {
  success: boolean;
  path: string;
}

export interface SaveSettingsResult {
  success: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const isWebView = (): boolean => window.pywebview !== undefined;

// ─── API Core Functions (Axios) ───────────────────────────────────────────────

const apiCore = {
  getUserInfo: async (): Promise<UserInfo> => {
    if (isWebView() && window.pywebview!.api?.getUserInfo) {
      return await window.pywebview!.api.getUserInfo!();
    }
    try {
      const { data } = await axiosInstance.get<UserInfo>("/user/info");
      return data;
    } catch (error) {
      console.warn("Backend Flask não disponível, usando mock.", error);
      return { name: "Engenheiro Local" };
    }
  },

  getSettings: async (): Promise<AppSettings> => {
    if (isWebView() && window.pywebview!.api?.getSettings) {
      return await window.pywebview!.api.getSettings!();
    }
    const { data } = await axiosInstance.get<AppSettings>("/settings");
    return data;
  },

  saveSettings: async (settings: AppSettings): Promise<SaveSettingsResult> => {
    if (isWebView() && window.pywebview!.api?.saveSettings) {
      const res = await window.pywebview!.api.saveSettings!(settings);
      return { success: res.success };
    }
    const { data } = await axiosInstance.post<SaveSettingsResult>("/settings", settings);
    return data;
  },

  checkLayout: async (tests: string[]): Promise<boolean> => {
    const mainTest = tests[0] ?? "Padrao";
    const layoutId = getLayoutIdForTest(mainTest);

    console.log(`[API] Validando layout para: ${mainTest}`, {
      tests,
      layout_id_b64: layoutId
    });

    try {
      const { data } = await axiosInstance.post<{ success?: boolean; error?: string }>("/check_layout", {
        tests,
        layout_id: layoutId,
      });

      console.log("[API] Resposta check_layout:", data);

      if (data.error) throw new Error(data.error);
      return data.success ?? false;
    } catch (error: any) {
      console.error("[API] Erro em check_layout:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const message = error.response?.data?.error || error.message || "Erro ao validar layout";
      toast.error(message);
      throw error;
    }
  },

  processImages: async (
    sector: string,
    tests: string[],
    files: File[],
    onProgress?: (progress: number, message: string) => void
  ): Promise<ProcessResult> => {
    const formData = new FormData();
    formData.append("sector", sector);
    formData.append("tests", JSON.stringify(tests));

    const mainTest = tests[0] ?? "Padrao";
    const layoutId = getLayoutIdForTest(mainTest);
    formData.append("layout_id", layoutId);
    
    files.forEach((file) => {
      formData.append("files", file);
      if (file.type === "application/pdf" && file.name.toLowerCase().includes("capa")) {
        formData.append("ocr_target", file.name);
      }
    });

    // 1. Envia a requisição inicial e recebe o job_id
    const startResponse = await axiosInstance.post<{ job_id: string; status: string }>(
      "/process", 
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    const { job_id } = startResponse.data;
    if (!job_id) throw new Error("Falha ao iniciar processamento (Job ID não recebido).");

    // 2. Inicia o Polling de status
    while (true) {
      try {
        const statusResponse = await axiosInstance.get<{
          status: string;
          progress: number;
          message: string;
          report_path?: string;
          error?: string;
        }>(`/status/${job_id}`);

        const data = statusResponse.data;

        if (onProgress) {
          onProgress(data.progress || 0, data.message || "Processando...");
        }

        if (data.status === 'completed') {
          return {
            success: true,
            path: data.report_path || "",
          };
        }

        if (data.status === 'error') {
          throw new Error(data.error || "Erro desconhecido no processamento.");
        }

        // Espera 1.5s antes da próxima consulta para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error("Erro no polling de status:", error);
        throw error;
      }
    }
  },

  downloadReport: async (filename: string): Promise<void> => {
    if (!filename) return;

    try {
      if (isWebView() && window.pywebview!.api?.downloadReport) {
        const result = await window.pywebview!.api.downloadReport!(filename);
        if (result.success) {
          toast.success('Download concluído!');
          return;
        }
      }

      const downloadUrl = `${axiosInstance.defaults.baseURL}/download/${filename}`;
      window.open(downloadUrl, "_blank");
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Falha ao baixar o relatório.');
    }
  },
};

// ─── React Query Hooks (The Surgical Insertion) ────────────────────────────────

export const useUserInfo = () => {
  return useQuery({
    queryKey: ["user-info"],
    queryFn: apiCore.getUserInfo,
    staleTime: 1000 * 60 * 5, // Cache por 5 min
    retry: 3,
  });
};

export const useSettings = () => {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: apiCore.getSettings,
    staleTime: Infinity, // Só recarrega se for invalidado (mutação)
    retry: 3,
  });
};

export const useSaveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiCore.saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });
};

export const useProcessImages = () => {
  return useMutation({
    mutationFn: (variables: { sector: string; tests: string[]; files: File[] }) =>
      apiCore.processImages(variables.sector, variables.tests, variables.files),
  });
};

export const api = apiCore; // Export core por retrocompatibilidade
