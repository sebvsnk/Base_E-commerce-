export type Role = "ADMIN" | "WORKER" | "CUSTOMER";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName?: string | null;
};
