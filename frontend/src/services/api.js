/**
 * Service to interact with Flask Backend or PyWebView.
 */
import { LAYOUT_MAPPING } from "../lib/data";

const BASE_URL = "http://localhost:5000/api";

const isWebView = () => window.pywebview !== undefined;

export const api = {
  getUserInfo: async () => {
    // Try PyWebView first if available
    if (isWebView() && window.pywebview.api?.getUserInfo) {
      return await window.pywebview.api.getUserInfo();
    }

    // Fallback to Flask REST API
    try {
      const response = await fetch(`${BASE_URL}/user/info`);
      if (!response.ok) throw new Error("Erro ao buscar info do usuário");
      return await response.json();
    } catch {
      console.warn("Backend Flask não disponível, usando mock.");
      return { name: "Engenheiro Local" };
    }
  },

  // Process images through OCR and generate Word doc
  processImages: async (sector, tests, files) => {
    // Standard Flask Multipart Upload (Works for both Browser and WebView)
    const formData = new FormData();
    formData.append("sector", sector);
    formData.append("tests", JSON.stringify(tests));

    const mainTest = tests[0] || "Padrao";
    const layoutId = LAYOUT_MAPPING[mainTest] || btoa(`${mainTest}.docx`);

    console.log(
      `[API processImages] Ensaio principal detectado: "${mainTest}"`,
    );
    console.log(
      `[API processImages] Mapping para Layout ID (Base64): "${layoutId}"`,
    );

    formData.append("layout_id", layoutId);

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(`${BASE_URL}/process`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro no processamento do servidor");
      }

      const result = await response.json();
      return {
        success: result.success,
        path: result.report_path,
      };
    } catch (err) {
      console.error("Erro na comunicação com o backend:", err);
      throw err;
    }
  },

  // Check if layout exists before uploading
  checkLayout: async (tests) => {
    const mainTest = tests[0] || "Padrao";
    const layoutId = LAYOUT_MAPPING[mainTest] || btoa(`${mainTest}.docx`);

    console.log(`[API checkLayout] Validando Ensaio: "${mainTest}"`);
    console.log(
      `[API checkLayout] Enviando Layout ID (Base64) para o Backend: "${layoutId}"`,
    );

    const response = await fetch(`${BASE_URL}/check_layout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tests, layout_id: layoutId }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(
        result.error || "não há layout cadastrado para este Ensaio",
      );
    }
    return result.success;
  },

  // Download or Open the generated file
  downloadReport: async (filename) => {
    if (!filename) return;

    // Se estiver no WebView, usamos o método nativo do Python para abrir o arquivo
    if (isWebView() && window.pywebview.api?.downloadReport) {
      const result = await window.pywebview.api.downloadReport(filename);
      if (result.success) {
        console.log("Arquivo aberto nativamente pelo SO.");
        return;
      } else {
        console.error("Erro ao abrir nativamente:", result.error);
      }
    }

    // Fallback para download via navegador (caso não esteja no WebView ou falhe)
    const downloadUrl = `${BASE_URL}/download/${filename}`;
    window.open(downloadUrl, "_blank");
    console.log("Iniciando download via browser de:", downloadUrl);
  },

  getSettings: async () => {
    if (isWebView() && window.pywebview.api?.getSettings) {
      return await window.pywebview.api.getSettings();
    }
    try {
      const response = await fetch(`${BASE_URL}/settings`);
      return await response.json();
    } catch {
      return { theme: "light" };
    }
  },

  saveSettings: async (settings) => {
    if (isWebView() && window.pywebview.api?.saveSettings) {
      return await window.pywebview.api.saveSettings(settings);
    }
    try {
      const response = await fetch(`${BASE_URL}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      return await response.json();
    } catch (err) {
      console.error("Erro ao salvar settings:", err);
      return { success: false };
    }
  },
};
