import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../../services/products";
import { createProduct, disableProduct, listAdminProducts, updateProduct } from "../../services/products";
import { formatCurrency } from "../../utils/currency";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState(0);

  async function refresh() {
    try {
      setLoading(true);
      const data = await listAdminProducts();
      setProducts(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    setError(null);
    if (!name.trim()) {
      setError("Nombre requerido");
      return;
    }
    if (!image.trim()) {
      setError("Imagen URL requerida");
      return;
    }
    if (price <= 0) {
      setError("Precio debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);
      await createProduct({ name: name.trim(), description: description.trim(), image: image.trim(), price });
      setName("");
      setDescription("");
      setImage("");
      setPrice(0);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Error creando producto");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleActive(p: Product) {
    setError(null);
    try {
      setLoading(true);
      if (p.isActive) {
        await disableProduct(p.id);
      } else {
        await updateProduct(p.id, { isActive: true });
      }
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Error actualizando");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Admin: Productos</h1>
      <p className="muted">Admin y Worker pueden gestionar productos.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="btn" to="/">Ir a tienda</Link>
        <Link className="btn btn--ghost" to="/profile">Perfil</Link>
      </div>

      {error && <p className="muted" style={{ marginTop: 12 }}>Error: {error}</p>}

      <div className="card simple" style={{ marginTop: 14 }}>
        <h3>Crear producto</h3>
        <div className="form__row">
          <label className="muted">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form__row">
          <label className="muted">Descripción</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form__row">
          <label className="muted">Imagen (URL)</label>
          <input className="input" value={image} onChange={(e) => setImage(e.target.value)} />
        </div>
        <div className="form__row">
          <label className="muted">Precio</label>
          <input
            className="input"
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={0}
          />
        </div>
        <button className="btn btn--primary" style={{ marginTop: 12 }} disabled={loading} onClick={onCreate}>
          {loading ? "Guardando..." : "Crear"}
        </button>
      </div>

      <h3 style={{ marginTop: 18 }}>Listado</h3>
      {loading && <p className="muted">Cargando...</p>}

      <div className="cart__list" style={{ marginTop: 10 }}>
        {products.map((p) => (
          <div key={p.id} className="card simple">
            <div className="summary__row"><span>Nombre</span><strong>{p.name}</strong></div>
            <div className="summary__row"><span>Precio</span><strong>{formatCurrency(p.price)}</strong></div>
            <div className="summary__row"><span>Activo</span><strong>{p.isActive ? "Sí" : "No"}</strong></div>
            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <button className={p.isActive ? "btn btn--danger" : "btn btn--primary"} disabled={loading} onClick={() => onToggleActive(p)}>
                {p.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
