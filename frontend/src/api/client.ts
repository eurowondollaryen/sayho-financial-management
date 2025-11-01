import axios from "axios";
import { isUnauthorizedError, notifyUnauthorized } from "./interceptors";

type TokenProvider = () => string | null | Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function registerTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

const baseURL = "http://localhost:8000";

export const api = axios.create({
  baseURL,
  withCredentials: false
});

api.interceptors.request.use(async (config) => {
  if (tokenProvider) {
    const token = await tokenProvider();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isUnauthorizedError(error)) {
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
