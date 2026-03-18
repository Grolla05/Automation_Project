/**
 * Service to interact with Flask Backend or PyWebView using Axios and React Query.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "./axiosInstance";
import { LAYOUT_MAPPING } from "../lib/data";
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
    const layoutId = LAYOUT_MAPPING[mainTest] ?? btoa(`${mainTest}.docx`);
try {
      const { data } = await axiosInstance.post<{ success?: boolean; error?: string }>("/check_layout", {
        tests,
        layout_id: layoutId,
      });

      if (data.error) throw new Error(data.error);
      return data.success ?? false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao validar layout";
      toast.error(message);
      throw error;
    }
  },

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

    formData.append("layout_id", layoutId);
    
    files.forEach((file) => {
      formData.append("files", file);
      if (file.type === "application/pdf" && file.name.toLowerCase().includes("capa")) {
        formData.append("ocr_target", file.name);
      }
    });

    const promise = axiosInstance.post<{
      success: boolean;
      report_path: string;
    }>("/process", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast.promise(promise, {
      loading: 'Processando documentos e extraindo dados...',
      success: (response) => {
        return 'Processamento concluído com sucesso!';
      },
      error: (err) => {
        return err.response?.data?.error || 'Erro ao processar arquivos.';
      },
    });

    const { data } = await promise;

    return {
      success: data.success,
      path: data.report_path,
    };
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
