import { apiFetch } from "./http";
import type { PaginatedResponse } from "./types";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  stock: number;
  categoryId?: string | null;
  brand?: string | null;
  sku?: string | null;
  weight?: number | null;
  isActive: boolean;
  tags?: string[];
  createdAt?: string;
};

export type ProductFilters = {
  categoryId?: string;
  tag?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
};

export async function listBrands(categoryId?: string, tag?: string) {
  const q = new URLSearchParams();
  if (categoryId) q.append("categoryId", categoryId);
  if (tag) q.append("tag", tag);
  return apiFetch<string[]>(`/products/brands?${q.toString()}`);
}

export async function listPublicProducts(filters: ProductFilters = {}) {
  const query = new URLSearchParams();
  if (filters.page) query.append("page", String(filters.page));
  if (filters.limit) query.append("limit", String(filters.limit));
  if (filters.categoryId) query.append("categoryId", filters.categoryId);
  if (filters.tag) query.append("tag", filters.tag);
  
  if (filters.brand) query.append("brand", filters.brand);
  if (filters.minPrice !== undefined) query.append("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) query.append("maxPrice", String(filters.maxPrice));
  if (filters.sort) query.append("sort", filters.sort);

  return apiFetch<PaginatedResponse<Product>>(`/products?${query.toString()}`);
}

export async function listAdminProducts(page = 1, limit = 20) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch<PaginatedResponse<Product>>(`/products/admin/all?${query.toString()}`);
}

export async function createProduct(input: Partial<Pick<Product, "name" | "description" | "price" | "image" | "stock" | "brand" | "sku" | "weight" | "categoryId" | "tags">>) {
  return apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(input) });
}

export async function updateProduct(
  id: string,
  input: Partial<Pick<Product, "name" | "description" | "price" | "image" | "stock" | "isActive" | "brand" | "sku" | "weight" | "categoryId" | "tags">>
) {
  return apiFetch<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function disableProduct(id: string) {
  return apiFetch<Product>(`/products/${id}/disable`, { method: "POST" });
}

export async function deleteProduct(id: string) {
  return apiFetch<{ success: boolean; id: string }>(`/products/${id}`, { method: "DELETE" });
}


export async function getProduct(id: string) {
  return apiFetch<Product>(`/products/${id}`);
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  return apiFetch<{ url: string }>("/upload", {
    method: "POST",
    body: formData,
  });
}

