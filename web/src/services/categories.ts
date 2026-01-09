import { apiFetch } from "./http";

export type Category = {
    id: string;
    name: string;
    slug: string;
    _count?: {
        products: number;
    };
};

export async function listCategories(): Promise<Category[]> {
    return apiFetch<Category[]>("/categories");
}
