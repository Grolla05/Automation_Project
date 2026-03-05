/**
 * Service to interact with Flask Backend or PyWebView.
 */

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
};
