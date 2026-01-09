import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../features/products/use-products";
import { listCategories, type Category } from "../services/categories";

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const { products, loading, error } = useProducts(selectedCategory);

  useEffect(() => {
    listCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <section>
      <h1>Productos</h1>
      <p className="muted">Carrito + checkout invitado (OTP) + roles (Admin/Worker/Customer).</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          className={`btn ${!selectedCategory ? "btn--primary" : ""}`}
          onClick={() => setSelectedCategory(undefined)}
        >
          Todos
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`btn ${selectedCategory === c.id ? "btn--primary" : ""}`}
            onClick={() => setSelectedCategory(c.id)}
          >
            {c.name} ({c._count?.products ?? 0})
          </button>
        ))}
      </div>

      {loading && <p className="muted">Cargando productos...</p>}
      {error && <p className="muted">{error}</p>}

      <div className="grid">
        {products?.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
