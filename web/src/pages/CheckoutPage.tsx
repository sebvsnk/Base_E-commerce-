import { getErrorMessage } from "../utils/error";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../features/auth/auth-context";
import { createAuthedOrder, createGuestOrder } from "../services/orders";

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export default function CheckoutPage() {
  const { totalPrice, state, dispatch } = useCart();
  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  const items = useMemo(
    () => state.items.map((i) => ({ productId: i.id, qty: i.qty })),
    [state.items]
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);
    if (state.items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    try {
      setLoading(true);

      if (isAuthed) {
        const order = await createAuthedOrder(items);
        dispatch({ type: "CLEAR" });
        navigate("/profile", { state: { toast: `Orden creada: ${order.id}` } });
        return;
      }

      if (!isValidEmail(email)) {
        setError("Escribe un email válido.");
        return;
      }

      const resp = await createGuestOrder(email.trim(), items);
      // guardamos el email para la pantalla OTP
      navigate(`/guest/verify/${resp.orderId}?email=${encodeURIComponent(email.trim())}`);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error al crear la orden");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Checkout</h1>
      <p className="muted">
        Si estás logueado crea tu orden directo. Si eres invitado, te enviamos un código (OTP) a tu email para ver el estado de tu compra.
      </p>

      <div className="card simple">
        <div className="summary__row">
          <span>Items</span>
          <strong>{state.items.reduce((acc, i) => acc + i.qty, 0)}</strong>
        </div>
        <div className="summary__row">
          <span>Total a pagar</span>
          <strong>{formatCurrency(totalPrice)}</strong>
        </div>

        {!isAuthed && (
          <div style={{ marginTop: 12 }}>
            <label className="muted" htmlFor="email">Email (para OTP)</label>
            <input
              id="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>
        )}

        {error && <p style={{ marginTop: 12 }} className="muted">Error: {error}</p>}

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Link className="btn btn--ghost" to="/cart">Volver al carrito</Link>
            <button className="btn btn--primary" disabled={loading} onClick={onConfirm}>
              {loading ? "Procesando..." : "Confirmar (Orden Simple)"}
            </button>
          </div>

          <hr style={{ width: "100%", opacity: 0.2 }} />

          <button
            className="btn"
            style={{ background: "#d6001c", color: "white", borderColor: "#d6001c" }}
            disabled={loading}
            onClick={async () => {
              // 1. Create Order first (same logic as onConfirm but returns order)
              setError(null);
              if (state.items.length === 0) return setError("Carrito vacío");

              try {
                setLoading(true);
                let orderId;

                if (isAuthed) {
                  const order = await createAuthedOrder(items);
                  orderId = order.id;
                } else {
                  if (!isValidEmail(email)) throw new Error("Email inválido");
                  const resp = await createGuestOrder(email.trim(), items);
                  orderId = resp.orderId;
                }

                // 2. Init Webpay
                const res = await fetch("/api/webpay/create", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(isAuthed ? { "Authorization": `Bearer ${localStorage.getItem("token")}` } : {})
                  },
                  body: JSON.stringify({ orderId })
                });

                if (!res.ok) throw new Error("Error iniciando Webpay");
                const data = await res.json();

                // 3. Redirect
                window.location.href = `${data.url}?token_ws=${data.token}`;

              } catch (e: unknown) {
                setError(getErrorMessage(e) || "Error");
                setLoading(false);
              }
            }}
          >
            Pagar con Webpay
          </button>
        </div>
      </div>
    </section>
  );
}
