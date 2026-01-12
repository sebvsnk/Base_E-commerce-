import { getErrorMessage } from "../../utils/error";
import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import { listAudits, type AuditLog } from "../../services/admin";

export default function AdminAuditsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(50);

  async function refresh(newLimit = limit) {
    try {
      setLoading(true);
      setError(null);
      const data = await listAudits(newLimit);
      setLogs(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error cargando auditorías");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h1>Panel: Auditorías</h1>
      <p className="muted">Solo Admin. Historial de acciones (productos, usuarios, órdenes).</p>

      <AdminNav />

      <div className="card simple" style={{ marginTop: 14 }}>
        <label className="muted">Cantidad</label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            className="input"
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ maxWidth: 140 }}
          />
          <button className="btn btn--primary" disabled={loading} onClick={() => refresh(limit)}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {error && <p className="muted" style={{ marginTop: 12 }}>Error: {error}</p>}

      <div className="cart__list" style={{ marginTop: 12 }}>
        {logs.map((l) => (
          <div key={l.id} className="card simple">
            <div className="summary__row"><span>Fecha</span><strong>{new Date(l.createdAt).toLocaleString()}</strong></div>
            <div className="summary__row"><span>Actor</span><strong>{l.actor?.email} ({l.actor?.role})</strong></div>
            <div className="summary__row"><span>Acción</span><strong>{l.action}</strong></div>
            <div className="summary__row"><span>Entidad</span><strong>{l.entity}{l.entityId ? `#${l.entityId}` : ""}</strong></div>
            {l.meta ? (
              <details style={{ marginTop: 10 }}>
                <summary className="muted">Ver meta</summary>
                <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{JSON.stringify(l.meta, null, 2)}</pre>
              </details>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
