import { getErrorMessage } from "../utils/error";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [run, setRun] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Email inválido");
      return;
    }
    if (password.length < 6) {
      setError("Password mínimo 6 caracteres");
      return;
    }
    if (mode === "register" && !run.trim()) {
      setError("RUN requerido para registro");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(run.trim(), email.trim(), password, fullName.trim() || undefined);
      }
      navigate("/profile");
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>{mode === "login" ? "Login" : "Crear cuenta"}</h1>
      <p className="muted">Admin/Worker/Customer usan login. Invitado compra con OTP.</p>

      <form className="card simple form" onSubmit={onSubmit}>
        {mode === "register" && (
          <>
            <div className="form__row">
              <label className="muted" htmlFor="run">RUN (ej: 12345678-9)</label>
              <input id="run" className="input" value={run} onChange={(e) => setRun(e.target.value)} placeholder="12345678-9" />
            </div>
            <div className="form__row">
              <label className="muted" htmlFor="fullName">Nombre</label>
              <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          </>
        )}

        <div className="form__row">
          <label className="muted" htmlFor="email">Email</label>
          <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@shop.cl" />
        </div>

        <div className="form__row">
          <label className="muted" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="muted" style={{ marginTop: 12 }}>Error: {error}</p>}

        <button className="btn btn--primary" style={{ marginTop: 12 }} disabled={loading}>
          {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Registrarme"}
        </button>

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn"
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          >
            {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
          </button>
          <Link className="btn btn--ghost" to="/">Volver</Link>
        </div>
      </form>
    </section>
  );
}
