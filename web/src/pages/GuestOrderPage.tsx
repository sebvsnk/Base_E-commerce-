import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import { getGuestOrder, type Order } from "../services/orders";

function getGuestTokenKey(orderId: string) {
  return `guest_order_token:${orderId}`;
}

export default function GuestOrderPage() {
  const { orderId = "" } = useParams();
  const guestToken = useMemo(() => (orderId ? sessionStorage.getItem(getGuestTokenKey(orderId)) : null), [orderId]);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        if (!orderId || !guestToken) {
          setError("Falta token de invitado. Verifica el OTP de nuevo.");
          return;
        }
        const data = await getGuestOrder(orderId, guestToken);
        if (!cancelled) setOrder(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error cargando orden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, guestToken]);

  return (
    <section>
      <h1>Estado de tu compra</h1>
      <p className="muted">Orden: <strong>{orderId}</strong></p>

      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="muted">Error: {error}</p>}

      {order && (
        <div className="card simple">
          <div className="summary__row"><span>Estado</span><strong>{order.status}</strong></div>
          <div className="summary__row"><span>Total</span><strong>{formatCurrency(order.total)}</strong></div>
          <div className="summary__row"><span>Email</span><strong>{order.customerEmail}</strong></div>

          <h3 style={{ marginTop: 14 }}>Items</h3>
          <div className="cart__list" style={{ marginTop: 10 }}>
            {order.items.map((it, idx) => (
              <div key={idx} className="cart__row" style={{ gridTemplateColumns: "90px 1fr 90px" }}>
                <img className="cart__img" src={it.product.image} alt={it.product.name} />
                <div>
                  <strong>{it.product.name}</strong>
                  <div className="muted">{formatCurrency(it.priceSnapshot)} x {it.qty}</div>
                </div>
                <div className="cart__subtotal">{formatCurrency(it.priceSnapshot * it.qty)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <Link className="btn" to="/">Volver a la tienda</Link>
          </div>
        </div>
      )}
    </section>
  );
}
