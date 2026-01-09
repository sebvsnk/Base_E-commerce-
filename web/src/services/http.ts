import { loadAuth } from "../features/auth/auth-storage";

// Prefer VITE_API_URL from .env, otherwise default to "/api".
// With the Vite dev proxy configured, "/api" is forwarded to the backend.
const API_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "/api";

function baseUrl() {
  return API_URL.replace(/\/$/, "");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const { token } = loadAuth();

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  // some endpoints may return empty
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return (undefined as unknown) as T;
  return res.json() as Promise<T>;
}
