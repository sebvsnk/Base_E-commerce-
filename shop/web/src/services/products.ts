import { apiFetch } from "./http";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt?: string;
};

export async function listPublicProducts() {
  return apiFetch<Product[]>("/products");
}

export async function listAdminProducts() {
  return apiFetch<Product[]>("/products/admin/all");
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
