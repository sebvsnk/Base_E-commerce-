export type Role = "ADMIN" | "WORKER" | "CUSTOMER";

export type AuthUser = {
  id: string;
  run?: string | null;
  email: string;
  role: Role;
  fullName?: string | null;
};
