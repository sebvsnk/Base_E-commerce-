import { apiFetch } from "./http";
import type { PaginatedResponse } from "./types";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  categoryId?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export async function listPublicProducts(categoryId?: string, page = 1, limit = 20) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (categoryId) query.append("categoryId", categoryId);

  return apiFetch<PaginatedResponse<Product>>(`/products?${query.toString()}`);
}

export async function listAdminProducts(page = 1, limit = 20) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch<PaginatedResponse<Product>>(`/products/admin/all?${query.toString()}`);
}

export async function createProduct(input: Pick<Product, "name" | "description" | "price" | "image">) {
  return apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(input) });
}

export async function updateProduct(id: string, input: Partial<Pick<Product, "name" | "description" | "price" | "image" | "isActive">>) {
  return apiFetch<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function disableProduct(id: string) {
  return apiFetch<Product>(`/products/${id}/disable`, { method: "POST" });
}
