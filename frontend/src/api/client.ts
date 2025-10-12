import axios from "axios";
import { isUnauthorizedError, notifyUnauthorized } from "./interceptors";

const envBaseUrl =
  typeof import.meta !== "undefined"
    ? ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? undefined)
    : undefined;

const baseURL = envBaseUrl || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL,
  withCredentials: false
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isUnauthorizedError(error)) {
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);
