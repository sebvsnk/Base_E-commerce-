import type { AuthUser } from "./auth-types";
import { apiFetch } from "../../services/http";

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, fullName?: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName }),
  });
}
