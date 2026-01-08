import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { listMyOrders, type Order } from "../services/orders";
import { formatCurrency } from "../utils/currency";

export default function ProfilePage() {
  const { user, isAuthed, logout } = useAuth();
  const location = useLocation() as any;
  const toast = location?.state?.toast as string | undefined;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await listMyOrders();
        if (!cancelled) setOrders(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error cargando órdenes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  if (!isAuthed) {
    return (
      <section>
        <h1>Perfil</h1>
        <p className="muted">Debes iniciar sesión.</p>
        <Link className="btn btn--primary" to="/login">Ir a Login</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Mi perfil</h1>
      <p className="muted">
        {user?.email} — <strong>{user?.role}</strong>
      </p>

      {toast && <p className="muted">{toast}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        <button className="btn" onClick={logout}>Cerrar sesión</button>
        {(user?.role === "ADMIN" || user?.role === "WORKER") && (
          <Link className="btn btn--primary" to="/admin/products">Panel Admin</Link>
        )}
      </div>

      <h3 style={{ marginTop: 18 }}>Mis órdenes</h3>
      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="muted">Error: {error}</p>}

      {!loading && orders.length === 0 && <p className="muted">Aún no tienes órdenes.</p>}

      <div className="cart__list" style={{ marginTop: 10 }}>
        {orders.map((o) => (
          <div key={o.id} className="card simple">
            <div className="summary__row"><span>ID</span><strong>{o.id}</strong></div>
            <div className="summary__row"><span>Estado</span><strong>{o.status}</strong></div>
            <div className="summary__row"><span>Total</span><strong>{formatCurrency(o.total)}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
}
