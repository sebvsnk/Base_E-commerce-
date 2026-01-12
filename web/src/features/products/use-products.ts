import { useEffect, useState } from "react";
import type { Product } from "../../services/products";
import { listPublicProducts } from "../../services/products";
import { getErrorMessage } from "../../utils/error";

export function useProducts(categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await listPublicProducts(categoryId);
        if (!cancelled) setProducts(response.data ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e) || "Error cargando productos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return { products, loading, error };
}
