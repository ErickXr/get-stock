import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:5000", // Porta padrão do backend Flask
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem("token");
  if (token && token !== "null" && token !== "undefined") {
    // Remove aspas se o token vier como string JSON e remove espaços
    token = token.replace(/"/g, '').trim();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});