import { apiFetch } from "./http";

export type Role = "ADMIN" | "WORKER" | "CUSTOMER";

export type AdminUser = {
  run: string;
  email: string;
  role: Role;
  isActive: boolean;
  fullName: string | null;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorRun: string;
  actor: { run: string; email: string; role: Role };
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export async function listUsers() {
  return apiFetch<AdminUser[]>("/admin/users");
}

export async function createUser(input: { run: string; email: string; password: string; role: Role; fullName?: string }) {
  return apiFetch<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(input) });
}

export async function updateUser(run: string, input: Partial<Pick<AdminUser, "role" | "isActive" | "fullName">>) {
  return apiFetch<AdminUser>(`/admin/users/${run}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function resetUserPassword(run: string, password: string) {
  return apiFetch<{ ok: true }>(`/admin/users/${run}/reset-password`, { method: "POST", body: JSON.stringify({ password }) });
}

export async function listAudits(limit = 50) {
  return apiFetch<AuditLog[]>(`/admin/audits?limit=${limit}`);
}
