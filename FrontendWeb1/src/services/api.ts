import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8081/api", // <-- ton backend Spring Boot
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Default instance sets application/json; multipart needs boundary from the browser.
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers as {
        delete?: (n: string) => void;
      } & Record<string, unknown>;
      if (typeof h.delete === "function") {
        h.delete("Content-Type");
        h.delete("content-type");
      } else {
        delete h["Content-Type"];
        delete h["content-type"];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Token expiré ou invalide
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);