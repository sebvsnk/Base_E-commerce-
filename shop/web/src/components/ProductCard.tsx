import type { Product } from "../services/products";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch } = useCart();

  return (
    <article className="card">
      <img className="card__img" src={product.image} alt={product.name} />
      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="muted">{product.description}</p>

        <div className="card__footer">
          <strong>{formatCurrency(product.price)}</strong>
          <button
            className="btn"
            onClick={() =>
              dispatch({
                type: "ADD_ITEM",
                payload: { id: product.id, name: product.name, price: product.price, image: product.image },
              })
            }
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
