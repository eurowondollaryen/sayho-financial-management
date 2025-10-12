import { AxiosError } from "axios";

let unauthorizedHandler: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401;
  }
  return false;
}
