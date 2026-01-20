import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../services/products";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";
import QuantityControl from "./QuantityControl";

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch, state } = useCart();
  const [qtyToAdd, setQtyToAdd] = useState(1);

  const hasStock = product.stock > 0;
  const inCartQty = state.items.find((i) => i.id === product.id)?.qty ?? 0;
  
  // Logic: Can add if cart + qtyToAdd <= stock
  const canAdd = hasStock && (inCartQty + qtyToAdd <= product.stock);
  const remainingStock = product.stock - inCartQty;

  const handleAdd = () => {
     if (canAdd) {
        dispatch({
          type: "ADD_ITEM",
          payload: { 
            id: product.id, 
            name: product.name, 
            price: product.price, 
            image: product.image, 
            stock: product.stock,
            qty: qtyToAdd 
          },
        });
        setQtyToAdd(1); // Reset to 1 after adding
     }
  };

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
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
      </Link>

      <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        {/* Brand */}
        {product.brand && (
           <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>
             {product.brand}
           </div>
        )}

        {/* Name */}
        <h3 className="card__title" style={{ fontSize: '1rem', fontWeight: 'normal', color: '#666', margin: 0 }}>
          {product.name}
        </h3>

        {/* Price */}
        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#d32f2f", marginTop: "8px" }}>
          {formatCurrency(product.price)}
        </div>

        {/* Stock info */}
        <p className="muted" style={{ fontSize: "0.8em", marginBottom: 8 }}>
          {hasStock ? "Stock" : "Agotado"}
        </p>

        <div className="card__footer" style={{ marginTop: 'auto', flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
          
          {hasStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Cantidad:</span>
              <QuantityControl 
                value={qtyToAdd} 
                onChange={setQtyToAdd} 
                max={remainingStock} 
              />
            </div>
          )}

          <button
            className="btn"
            disabled={!hasStock || !canAdd}
            onClick={handleAdd}
            style={{ width: '100%', backgroundColor: '#9e04ac', color: 'white' }}
          >
            {!hasStock ? "Agotado" : !canAdd ? "Máximo alcanzado" : "AÑADIR AL CARRITO"}
          </button>
        </div>
      </div>
    </article>
  );
}
