import api from "./client";

export interface SignupPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  theme_preference?: "light" | "dark";
}

export async function signup(payload: SignupPayload) {
  const { data } = await api.post<User>("/auth/signup", payload);
  return data;
}

export async function login(payload: LoginPayload) {
  const params = new URLSearchParams();
  params.append("username", payload.username);
  params.append("password", payload.password);
  const { data } = await api.post<{ access_token: string }>("/auth/login", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get<User>("/users/me");
  return data;
}
