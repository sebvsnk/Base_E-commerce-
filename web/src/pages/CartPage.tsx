import { Link, useNavigate } from "react-router-dom";
import QuantityControl from "../components/QuantityControl";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";

export default function CartPage() {
  const { state, dispatch, totalPrice } = useCart();
  const navigate = useNavigate();

  if (state.items.length === 0) {
    return (
      <section>
        <h1>Carrito</h1>
        <p className="muted">Tu carrito está vacío.</p>
        <Link className="btn" to="/">Ir a productos</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Carrito</h1>

      <div className="cart">
        <div className="cart__list">
          {state.items.map((item) => (
            <div key={item.id} className="cart__row">
              <img className="cart__img" src={item.image} alt={item.name} />
              <div className="cart__info">
                <strong>{item.name}</strong>
                <div className="muted">{formatCurrency(item.price)}</div>
                {typeof item.stock === "number" && (
                  <div className="muted" style={{ fontSize: "0.9em" }}>
                    Stock disponible: {item.stock}
                  </div>
                )}

                <div className="cart__actions">
                  <QuantityControl
                    value={item.qty}
                    min={0}
                    max={typeof item.stock === "number" ? Math.max(1, item.stock) : 999}
                    onChange={(next) => {
                      if (next === 0) {
                        dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } });
                      } else {
                        dispatch({ type: "SET_QTY", payload: { id: item.id, qty: next } });
                      }
                    }}
                  />
                  <button
                    className="btn btn--danger btn--ghost"
                    onClick={() => dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } })}
                  >
                    Quitar
                  </button>
                </div>
              </div>

              <div className="cart__subtotal">
                {formatCurrency(item.qty * item.price)}
              </div>
            </div>
          ))}
        </div>

        <aside className="cart__summary">
          <h3>Resumen</h3>
          <div className="summary__row">
            <span>Total</span>
            <strong>{formatCurrency(totalPrice)}</strong>
          </div>

          <button className="btn btn--primary" onClick={() => navigate("/checkout")}>
            Ir a pagar
          </button>

          <button className="btn btn--ghost" onClick={() => dispatch({ type: "CLEAR" })}>
            Vaciar carrito
          </button>
        </aside>
      </div>
    </section>
  );
}
