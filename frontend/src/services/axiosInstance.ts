import axios from "axios";
import axiosRetry from "axios-retry";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // Aumentado para 5 minutos (processamento OCR é lento)
  headers: {
    "Content-Type": "application/json",
  },
});

// Configuração de retentativas para falhas de rede ou erros 5xx (backend morto)
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => {
    console.log(`[Axios Retry] Tentativa ${retryCount} para porta 5000...`);
    return retryCount * 1000; // exponencial 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Retenta em timeouts, erros de conexão ou 500+ (backend morto/porta 5000 ocupada)
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response ? error.response.status >= 500 : true)
    );
  },
});

// Interceptor para logs e tratamento global de erros
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("[Axios Error] Timeout atingido.");
      toast.error("Tempo de conexão esgotado. Verifique o servidor.");
    }
    if (!error.response) {
      console.error("[Axios Error] Backend (Porta 5000) não está respondendo.");
      toast.error("Servidor backend não encontrado.");
    } else {
      // Erro vindo do backend com status code
      const message = error.response.data?.error || error.response.data?.message || "Erro inesperado na requisição.";
      // Evita toasts duplicados se for erro de validação (que já tratamos nos componentes)
      // Mas loga erros 500 ou outros inesperados
      if (error.response.status >= 500) {
        toast.error(`Erro no servidor: ${message}`);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
