import { getErrorMessage } from "../utils/error";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { resendGuestOtp, verifyGuestOtp } from "../services/orders";
import { useCart } from "../features/cart/cart-context";

function getGuestTokenKey(orderId: string) {
  return `guest_order_token:${orderId}`;
}

export default function GuestVerifyPage() {
  const { orderId = "" } = useParams();
  const [params] = useSearchParams();
  const email = useMemo(() => params.get("email") ?? "", [params]);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const navigate = useNavigate();
  const { dispatch } = useCart();

  async function onVerify() {
    setError(null);
    setInfo(null);
    if (!orderId || !email) {
      setError("Falta orderId o email.");
      return;
    }
    if (code.trim().length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const { token } = await verifyGuestOtp(orderId, email, code.trim());
      sessionStorage.setItem(getGuestTokenKey(orderId), token);
      // ya verificado: limpiamos carrito
      dispatch({ type: "CLEAR" });
      navigate(`/guest/order/${orderId}`);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Código inválido");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    if (!orderId || !email) {
      setError("Falta orderId o email.");
      return;
    }
    try {
      setLoading(true);
      const r = await resendGuestOtp(orderId, email);
      setInfo(r.message);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "No se pudo reenviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Verifica tu compra</h1>
      <p className="muted">Te enviamos un código (OTP) a <strong>{email || "tu email"}</strong>. Expira en 10 minutos.</p>

      <div className="card simple form">
        <div className="form__row">
          <label className="muted" htmlFor="code">Código</label>
          <input
            id="code"
            className="input"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>

        {error && <p className="muted" style={{ marginTop: 12 }}>Error: {error}</p>}
        {info && <p className="muted" style={{ marginTop: 12 }}>{info}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn btn--primary" disabled={loading} onClick={onVerify}>
            {loading ? "Procesando..." : "Verificar"}
          </button>
          <button className="btn" disabled={loading} onClick={onResend}>
            Reenviar código
          </button>
          <Link className="btn btn--ghost" to="/cart">Volver</Link>
        </div>
      </div>
    </section>
  );
}
