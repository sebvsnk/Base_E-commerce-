import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { listMyOrders, type Order } from "../services/orders";
import { listAddresses, createAddress, type Address } from "../services/users";
import { formatCurrency } from "../utils/currency";

export default function ProfilePage() {
  const { user, isAuthed, logout } = useAuth();
  const location = useLocation() as any;
  const toast = location?.state?.toast as string | undefined;

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: "", city: "", state: "", zip: "", country: "Chile" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [ordersData, addressesData] = await Promise.all([
          listMyOrders(),
          listAddresses()
        ]);
        if (!cancelled) {
          setOrders(ordersData);
          setAddresses(addressesData);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error cargando datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAddress(newAddress);
      setShowAddressForm(false);
      setNewAddress({ street: "", city: "", state: "", zip: "", country: "Chile" });
      const fresh = await listAddresses();
      setAddresses(fresh);
    } catch (e: any) {
      alert(e.message || "Error al guardar dirección");
    }
  };

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

      <hr style={{ margin: "24px 0", opacity: 0.2 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Mis Direcciones</h3>
        <button className="btn btn--small" onClick={() => setShowAddressForm(!showAddressForm)}>
          {showAddressForm ? "Cancelar" : "Nueva Dirección"}
        </button>
      </div>

      {showAddressForm && (
        <form onSubmit={handleAddAddress} className="card" style={{ marginTop: 12, maxWidth: 500 }}>
          <div className="form-group">
            <label>Calle y Número</label>
            <input required value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Ciudad</label>
            <input required value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Región/Estado</label>
              <input required value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Código Postal</label>
              <input required value={newAddress.zip} onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn--primary" style={{ marginTop: 12 }}>Guardar</button>
        </form>
      )}

      <div className="grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {addresses.map(addr => (
          <div key={addr.id} className="card simple" style={{ border: addr.isDefault ? "1px solid var(--primary)" : undefined }}>
            <p><strong>{addr.street}</strong></p>
            <p className="muted">{addr.city}, {addr.state}</p>
            <p className="muted">{addr.zip}, {addr.country}</p>
            {addr.isDefault && <span style={{ fontSize: 12, color: "var(--primary)" }}>Predeterminada</span>}
          </div>
        ))}
        {!loading && addresses.length === 0 && !showAddressForm && <p className="muted">No tienes direcciones guardadas.</p>}
      </div>

      <hr style={{ margin: "24px 0", opacity: 0.2 }} />

      <h3>Mis órdenes</h3>
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
