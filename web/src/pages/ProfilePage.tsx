import { getErrorMessage } from "../utils/error";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { cancelMyOrder, listMyOrders, type Order } from "../services/orders";
import { listAddresses, createAddress, updateAddress, type Address } from "../services/users";
import { formatCurrency } from "../utils/currency";

interface City {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  cities: City[];
}

export default function ProfilePage() {
  const { user, isAuthed, logout } = useAuth();
  const location = useLocation() as { state?: { toast?: string } };
  const toast = location?.state?.toast;

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Locations for address form
  const [regions, setRegions] = useState<Region[]>([]);
  
  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  
  const [newStreet, setNewStreet] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isAuthed) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [ordersData, addressesData, locationsRes] = await Promise.all([
          listMyOrders(),
          listAddresses(),
          fetch("/api/locations").then(res => res.json())
        ]);
        
        if (!cancelled) {
          setOrders(ordersData);
          setAddresses(addressesData);
          if (Array.isArray(locationsRes)) {
            setRegions(locationsRes);
             // Flatten cities for easier lookup if needed, though filtering determines display
             // specific logic can stay in render
          }
        }
      } catch (e: unknown) {
        if (!cancelled) setError(getErrorMessage(e) || "Error cargando datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCityId || !newStreet) return;

    try {
      setSavingAddress(true);
      
      if (editingAddr) {
        // Edit existing
        const updated = await updateAddress(editingAddr.id, {
            street: newStreet,
            cityId: selectedCityId,
            label: newLabel,
            contactPhone: newContactPhone,
        });
        setAddresses(addresses.map(a => a.id === editingAddr.id ? updated : a));
      } else {
        // Create new
        const created = await createAddress({
            street: newStreet,
            cityId: selectedCityId,
            zip: "0000000",
            label: newLabel,
            contactPhone: newContactPhone,
            isDefault: addresses.length === 0 
        });
        setAddresses([...addresses, created]);
      }
      
      setShowAddressForm(false);
      setEditingAddr(null);
      // Reset form
      setNewStreet("");
      setNewLabel("");
      setNewContactPhone("");
      setSelectedRegionId("");
      setSelectedCityId("");
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSavingAddress(false);
    }
  }

  function formatPhone(val: string) {
      const raw = val.replace(/\D/g, "").slice(0, 9);
      if (raw.length > 5) {
           return `${raw.slice(0, 1)} ${raw.slice(1, 5)} ${raw.slice(5)}`;
      } else if (raw.length > 1) {
           return `${raw.slice(0, 1)} ${raw.slice(1)}`;
      }
      return raw;
  }

  function handleEdit(addr: Address) {
      setEditingAddr(addr);
      setNewStreet(addr.street);
      setNewLabel(addr.label || "");
      setNewContactPhone(formatPhone(addr.contactPhone || ""));
      
      // Find region
      const region = regions.find(r => r.cities.some(c => c.id === addr.cityId));
      if (region) {
          setSelectedRegionId(region.id);
          setSelectedCityId(addr.cityId);
      }
      setShowAddressForm(true);
  }

  function handleCancelForm() {
      setShowAddressForm(false);
      setEditingAddr(null);
      setNewStreet("");
      setNewLabel("");
      setNewContactPhone("");
      setSelectedRegionId("");
      setSelectedCityId("");
  }

  // Filter cities based on selected region
  const availableCities = regions.find(r => r.id === selectedRegionId)?.cities || [];

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
      </div>

      <hr style={{ margin: "24px 0", opacity: 0.2 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Mis Direcciones</h3>
        <button className="btn btn--sm" onClick={() => {
            if (showAddressForm) handleCancelForm();
            else setShowAddressForm(true);
        }}>
          {showAddressForm ? "Cancelar" : "Nueva Dirección"}
        </button>
      </div>

      {showAddressForm && (
        <div className="card simple" style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 15 }}>{editingAddr ? "Editar Dirección" : "Nueva Dirección"}</h4>
            <form onSubmit={handleSaveAddress}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                   <div>
                       <label style={{ display: "block", marginBottom: 5 }}>Región</label>
                       <select 
                         style={{ 
                           width: "100%", 
                           padding: 10,
                           borderRadius: 10,
                           border: "1px solid var(--border-overlay)",
                           backgroundColor: "var(--input-bg)",
                           color: "var(--text-main)"
                         }}
                         value={selectedRegionId} 
                         onChange={e => {
                             setSelectedRegionId(e.target.value);
                             setSelectedCityId("");
                         }}
                         required
                       >
                           <option value="">Selecciona Región</option>
                           {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                       </select>
                   </div>
                   <div>
                       <label style={{ display: "block", marginBottom: 5 }}>Comuna</label>
                       <select 
                         style={{ 
                           width: "100%", 
                           padding: 10,
                           borderRadius: 10,
                           border: "1px solid var(--border-overlay)",
                           backgroundColor: "var(--input-bg)",
                           color: "var(--text-main)"
                         }}
                         value={selectedCityId} 
                         onChange={e => setSelectedCityId(e.target.value)}
                         disabled={!selectedRegionId}
                         required
                       >
                           <option value="">Selecciona Comuna</option>
                           {availableCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                   </div>
                </div>
                
                <div style={{ marginTop: 10 }}>
                    <label style={{ display: "block", marginBottom: 5 }}>Calle y Número</label>
                    <input 
                      style={{ 
                         width: "100%", 
                         padding: 10,
                         borderRadius: 10,
                         border: "1px solid var(--border-overlay)",
                         backgroundColor: "var(--input-bg)",
                         color: "var(--text-main)"
                      }} 
                      type="text" 
                      value={newStreet} 
                      onChange={e => setNewStreet(e.target.value)} 
                      placeholder="Ej: Av. Libertador 1234"
                      required
                    />
                </div>

                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                        <label style={{ display: "block", marginBottom: 5 }}>Etiqueta (Opcional)</label>
                        <input 
                          style={{ 
                             width: "100%", 
                             padding: 10,
                             borderRadius: 10,
                             border: "1px solid var(--border-overlay)",
                             backgroundColor: "var(--input-bg)",
                             color: "var(--text-main)"
                          }} 
                          type="text" 
                          value={newLabel} 
                          onChange={e => setNewLabel(e.target.value)} 
                          placeholder="Ej: Casa, Trabajo..."
                        />
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: 5 }}>Teléfono de Contacto</label>
                        <input 
                          style={{ 
                             width: "100%", 
                             padding: 10,
                             borderRadius: 10,
                             border: "1px solid var(--border-overlay)",
                             backgroundColor: "var(--input-bg)",
                             color: "var(--text-main)"
                          }} 
                          type="text" 
                          value={newContactPhone} 
                          onChange={e => setNewContactPhone(formatPhone(e.target.value))} 
                          placeholder="9 1234 5678"
                        />
                    </div>
                </div>
                
                <button type="submit" className="btn btn--primary" style={{ marginTop: 15 }} disabled={savingAddress}>
                    {savingAddress ? "Guardando..." : (editingAddr ? "Actualizar Dirección" : "Guardar Dirección")}
                </button>
            </form>
        </div>
      )}

      <div className="grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
        {addresses.map(addr => {
           // Lookup city name
           let cityName = "Desconocida";
           for (const r of regions) {
               const c = r.cities.find(ct => ct.id === addr.cityId);
               if (c) { cityName = c.name; break; } 
           }

           return (
              <div key={addr.id} className="card simple" style={{ border: addr.isDefault ? "1px solid var(--primary)" : undefined, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <button 
                        onClick={() => handleEdit(addr)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em' }}
                        title="Editar"
                    >
                        ✏️
                    </button>
                </div>

                {addr.label && <p style={{ fontSize: '0.9em', color: 'var(--primary)', fontWeight: 'bold', marginBottom: 5 }}>{addr.label}</p>}
                <p><strong>{addr.street}</strong></p>
                <p className="muted">{cityName}</p>
                {addr.contactPhone && <p className="muted" style={{ fontSize: '0.9em' }}>📞 {addr.contactPhone}</p>}
                {addr.isDefault && <span style={{ fontSize: 12, color: "var(--primary)" }}>Predeterminada</span>}
              </div>
           );
        })}
        {!loading && addresses.length === 0 && <p className="muted">No tienes direcciones guardadas.</p>}
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

            {o.status === "PENDING" && (
              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  className="btn btn--danger"
                  disabled={loading}
                  onClick={async () => {
                    setError(null);
                    try {
                      setLoading(true);
                      await cancelMyOrder(o.id);
                      const refreshed = await listMyOrders();
                      setOrders(refreshed);
                    } catch (e: unknown) {
                      setError(getErrorMessage(e) || "Error cancelando la orden");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Cancelar orden
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
