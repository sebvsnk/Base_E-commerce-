import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav";
import { listAdminOrders, updateOrderStatus, type AdminOrder, type OrderStatus } from "../../services/orders";
import { formatCurrency } from "../../utils/currency";

function statusLabel(s: OrderStatus) {
  if (s === "PENDING") return "Pendiente";
  if (s === "PAID") return "Pagado";
  return "Cancelado";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando órdenes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((o) =>
      [o.id, o.customerEmail, o.user?.email ?? "", o.status].some((v) => v.toLowerCase().includes(needle))
    );
  }, [orders, q]);

  async function setStatus(orderId: string, status: OrderStatus) {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, status);
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Error actualizando estado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Panel: Órdenes</h1>
      <p className="muted">Admin y Worker pueden ver órdenes y cambiar su estado.</p>

      <AdminNav />

      <div className="card simple" style={{ marginTop: 14 }}>
        <label className="muted">Buscar (id, email, estado)</label>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="orderId / email / pending..." />
      </div>

      {error && <p className="muted" style={{ marginTop: 12 }}>Error: {error}</p>}
      {loading && <p className="muted" style={{ marginTop: 12 }}>Cargando...</p>}

      <div className="cart__list" style={{ marginTop: 12 }}>
        {filtered.map((o) => (
          <div key={o.id} className="card simple">
            <div className="summary__row"><span>Orden</span><strong>{o.id}</strong></div>
            <div className="summary__row"><span>Email</span><strong>{o.customerEmail}</strong></div>
            <div className="summary__row"><span>Usuario</span><strong>{o.user?.email ?? "Invitado"}</strong></div>
            <div className="summary__row"><span>Total</span><strong>{formatCurrency(o.total)}</strong></div>
            <div className="summary__row"><span>Estado</span><strong>{statusLabel(o.status)}</strong></div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button className="btn" disabled={loading} onClick={() => setStatus(o.id, "PENDING")}>Pendiente</button>
              <button className="btn btn--primary" disabled={loading} onClick={() => setStatus(o.id, "PAID")}>Pagado</button>
              <button className="btn btn--danger" disabled={loading} onClick={() => setStatus(o.id, "CANCELLED")}>Cancelado</button>
            </div>

            {o.items?.length ? (
              <div style={{ marginTop: 12 }}>
                <div className="muted" style={{ marginBottom: 8 }}>Items</div>
                {o.items.map((it: any, idx: number) => (
                  <div key={idx} className="summary__row">
                    <span>{it.product?.name ?? it.productId} x {it.qty}</span>
                    <strong>{formatCurrency(it.qty * it.priceSnapshot)}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
