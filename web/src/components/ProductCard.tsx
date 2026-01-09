import type { Product } from "../services/products";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch } = useCart();
  const hasStock = product.stock > 0;

  return (
    <article className="card">
      <div style={{ position: "relative" }}>
        <img className="card__img" src={product.image} alt={product.name} style={{ opacity: hasStock ? 1 : 0.6 }} />
        {!hasStock && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            background: "red", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 12
          }}>
            Agotado
          </span>
        )}
      </div>

      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="muted" style={{ fontSize: "0.9em", marginBottom: 8 }}>
          {hasStock ? `${product.stock} disponibles` : "Sin stock"}
        </p>
        <p className="muted">{product.description}</p>

        <div className="card__footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button
            className="btn"
            disabled={!hasStock}
            onClick={() =>
              dispatch({
                type: "ADD_ITEM",
                payload: { id: product.id, name: product.name, price: product.price, image: product.image },
              })
            }
          >
            {hasStock ? "Agregar" : "Agotado"}
          </button>
        </div>
      </div>
    </article>
  );
}
