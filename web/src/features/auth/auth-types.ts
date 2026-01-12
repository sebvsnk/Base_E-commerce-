export type Role = "ADMIN" | "WORKER" | "CUSTOMER";

export type AuthUser = {
  run: string;
  email: string;
  role: Role;
  fullName?: string | null;
};
