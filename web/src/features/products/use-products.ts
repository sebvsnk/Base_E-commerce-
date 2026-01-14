import { useEffect, useState } from "react";
import type { Product, ProductFilters } from "../../services/products";
import { listPublicProducts } from "../../services/products";
import { getErrorMessage } from "../../utils/error";

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deep compare or just construct a dependency key
  const depKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Default limit if not set
        const f = { limit: 20, ...filters };
        const response = await listPublicProducts(f);
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
  }, [depKey]);

  return { products, loading, error };
}
