import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";

export default function AdminNav() {
  const { user } = useAuth();

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Link className="btn" to="/">Ir a tienda</Link>
      <Link className="btn btn--ghost" to="/admin/products">Productos</Link>
      <Link className="btn btn--ghost" to="/admin/orders">Órdenes</Link>
      {user?.role === "ADMIN" && (
        <>
          <Link className="btn btn--ghost" to="/admin/users">Usuarios</Link>
          <Link className="btn btn--ghost" to="/admin/audits">Auditorías</Link>
        </>
      )}
    </div>
  );
}
