import type { AuthUser } from "./auth-types";
import { apiFetch } from "../../services/http";

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string, lastName: string, phone: string) {
  return apiFetch<{ token: string; user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name, lastName, phone }),
  });
}
