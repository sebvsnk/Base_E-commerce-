import ProductCard from "../components/ProductCard";
import { useProducts } from "../features/products/use-products";

export default function HomePage() {
  const { products, loading, error } = useProducts();

  return (
    <section>
      <h1>Productos</h1>
      <p className="muted">Carrito + checkout invitado (OTP) + roles (Admin/Worker/Customer).</p>

      {loading && <p className="muted">Cargando productos...</p>}
      {error && <p className="muted">{error}</p>}

      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
