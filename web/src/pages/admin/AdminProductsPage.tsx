import { getErrorMessage } from "../../utils/error";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../services/products";
import { disableProduct, listAdminProducts, updateProduct, deleteProduct } from "../../services/products";
import { formatCurrency } from "../../utils/currency";

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<Record<string, number>>({});

  async function refresh() {
    try {
      setLoading(true);
      const data = await listAdminProducts();
      setProducts(data.data);
      setEditStock(Object.fromEntries(data.data.map((p) => [p.id, p.stock ?? 0])));
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onSaveStock(p: Product) {
    setError(null);
    const nextStock = editStock[p.id];
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setError("Stock inválido");
      return;
    }

    try {
      setLoading(true);
      await updateProduct(p.id, { stock: Math.trunc(nextStock) });
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error actualizando stock");
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
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error actualizando");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(p: Product) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await deleteProduct(p.id);
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error eliminando producto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Admin: Productos</h1>
        <button className="btn btn--primary" onClick={() => navigate("/admin/products/new")}>
           + Nuevo Producto
        </button>
      </div>
      
      <p className="muted">Gestión de inventario y catálogo.</p>

      {error && <div className="muted" style={{ color: "#ef4444", marginBottom: "1rem" }}>Error: {error}</div>}
      
      {loading ? <p className="muted">Cargando...</p> : (
        <div className="grid">
            {products.map((p) => (
            <div key={p.id} className="card">
                <div style={{ position: "relative", height: "180px" }}>
                    <img 
                        src={p.image} 
                        className="card__img" 
                        alt={p.name} 
                        style={{ height: "100%", width: "100%", objectFit: "contain", opacity: p.isActive ? 1 : 0.6, backgroundColor: "white" }} 
                    />
                    {!p.isActive && (
                        <div style={{ 
                            position: "absolute", inset: 0, 
                            display: "flex", alignItems: "center", justifyContent: "center", 
                            background: "rgba(0,0,0,0.6)", fontWeight: "bold" 
                        }}>
                            INACTIVO
                        </div>
                    )}
                </div>
                
                <div className="card__body">
                    <h3 className="card__title">{p.name}</h3>
                    {p.brand && <div style={{ fontSize: "0.85rem", color: "#aaa", marginBottom: "5px" }}>{p.brand}</div>}
                    
                    <div style={{ display: "flex", justifyContent: "space-between", margin: "10px 0", fontWeight: "bold" }}>
                        <span>{formatCurrency(p.price)}</span>
                        <span>Stock: {p.stock}</span>
                    </div>

                    <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", marginTop: "10px" }}>
                        <div style={{ marginBottom: "5px", fontSize: "0.85rem" }}>Ajustar Stock:</div>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <input
                                className="input"
                                type="number"
                                min={0}
                                style={{ width: "100%" }}
                                value={editStock[p.id] ?? p.stock ?? 0}
                                onChange={(e) =>
                                setEditStock((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
                                }))
                                }
                            />
                            <button className="btn" onClick={() => onSaveStock(p)}>Ok</button>
                        </div>
                    </div>

                    <div className="card__footer" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <button 
                            className={`btn ${p.isActive ? "btn--danger" : "btn--primary"}`} 
                            disabled={loading} 
                            onClick={() => onToggleActive(p)}
                            title={p.isActive ? "Desactivar" : "Activar"}
                        >
                            {p.isActive ? "Desac." : "Act."}
                        </button>
                        <button 
                            className="btn" 
                            disabled={loading} 
                            onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                        >
                            Editar
                        </button>
                         <button 
                            className="btn btn--danger" 
                            disabled={loading} 
                            onClick={() => onDelete(p)}
                        >
                            X
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}
    </section>
  );
}
