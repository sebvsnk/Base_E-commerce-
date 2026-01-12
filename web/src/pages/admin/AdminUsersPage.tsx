import { getErrorMessage } from "../../utils/error";
import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import { createUser, listUsers, resetUserPassword, updateUser, type AdminUser, type Role } from "../../services/admin";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const data = await listUsers();
      setUsers(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!email.trim() || !password.trim()) {
      setError("Email y password son requeridos");
      return;
    }
    try {
      setLoading(true);
      await createUser({ email: email.trim(), password, role, fullName: fullName.trim() || undefined });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("CUSTOMER");
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error creando usuario");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleActive(u: AdminUser) {
    try {
      setLoading(true);
      await updateUser(u.id, { isActive: !u.isActive });
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error actualizando");
    } finally {
      setLoading(false);
    }
  }

  async function onChangeRole(u: AdminUser, newRole: Role) {
    try {
      setLoading(true);
      await updateUser(u.id, { role: newRole });
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error actualizando rol");
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(u: AdminUser) {
    const newPass = window.prompt(`Nueva contraseña para ${u.email} (min 6)`);
    if (!newPass) return;
    if (newPass.length < 6) {
      setError("Contraseña muy corta");
      return;
    }
    try {
      setLoading(true);
      await resetUserPassword(u.id, newPass);
      await refresh();
      alert("Contraseña actualizada");
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error reseteando contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Panel: Usuarios</h1>
      <p className="muted">Solo Admin puede crear/editar usuarios y roles.</p>

      <AdminNav />

      {error && <p className="muted" style={{ marginTop: 12 }}>Error: {error}</p>}

      <div className="card simple" style={{ marginTop: 14 }}>
        <h3>Crear usuario</h3>
        <div className="form__row">
          <label className="muted">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@correo.com" />
        </div>
        <div className="form__row">
          <label className="muted">Nombre</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre Apellido" />
        </div>
        <div className="form__row">
          <label className="muted">Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        <div className="form__row">
          <label className="muted">Rol</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="WORKER">WORKER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button className="btn btn--primary" style={{ marginTop: 12 }} disabled={loading} onClick={onCreate}>
          {loading ? "Guardando..." : "Crear"}
        </button>
      </div>

      <h3 style={{ marginTop: 18 }}>Listado</h3>
      {loading && <p className="muted">Cargando...</p>}

      <div className="cart__list" style={{ marginTop: 10 }}>
        {users.map((u) => (
          <div key={u.id} className="card simple">
            <div className="summary__row"><span>Email</span><strong>{u.email}</strong></div>
            <div className="summary__row"><span>Nombre</span><strong>{u.fullName ?? "-"}</strong></div>
            <div className="summary__row"><span>Activo</span><strong>{u.isActive ? "Sí" : "No"}</strong></div>
            <div className="summary__row"><span>Rol</span><strong>{u.role}</strong></div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button className={u.isActive ? "btn btn--danger" : "btn btn--primary"} disabled={loading} onClick={() => onToggleActive(u)}>
                {u.isActive ? "Desactivar" : "Activar"}
              </button>

              <select className="input" style={{ maxWidth: 160 }} value={u.role} disabled={loading} onChange={(e) => onChangeRole(u, e.target.value as Role)}>
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="WORKER">WORKER</option>
                <option value="ADMIN">ADMIN</option>
              </select>

              <button className="btn" disabled={loading} onClick={() => onResetPassword(u)}>
                Reset password
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
