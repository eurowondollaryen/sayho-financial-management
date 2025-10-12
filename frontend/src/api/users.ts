import api from "./client";
import type { User } from "./auth";

export interface UpdateUserPayload {
  name?: string;
  theme_preference?: "light" | "dark";
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
}

export async function updateCurrentUser(payload: UpdateUserPayload) {
  const { data } = await api.patch<User>("/users/me", payload);
  return data;
}

export async function updatePassword(payload: UpdatePasswordPayload) {
  await api.patch("/users/me/password", payload);
}
