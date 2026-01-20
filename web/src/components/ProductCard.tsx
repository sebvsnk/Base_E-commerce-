import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../services/products";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";
import QuantityControl from "./QuantityControl";

export default function ProductCard({ product }: { product: Product }) {
  const { dispatch, state } = useCart();

  const hasStock = product.stock > 0;
  const inCartQty = state.items.find((i) => i.id === product.id)?.qty ?? 0;
  
  // Logic: Can add if cart < stock
  const canAdd = hasStock && (inCartQty < product.stock);
  const remainingStock = product.stock - inCartQty;

  const handleUpdateQty = (newQty: number) => {
    if (newQty === 0) {
        dispatch({ type: "REMOVE_ITEM", payload: { id: product.id } });
    } else if (newQty > inCartQty) {
        // Adding
        if (canAdd) {
            dispatch({
                type: "ADD_ITEM",
                payload: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    stock: product.stock,
                    qty: 1
                }
            });
        }
    } else {
        // Decreasing (but not to 0)
        dispatch({
            type: "SET_QTY",
            payload: { id: product.id, qty: newQty }
        });
    }
  };

  const handleInitialAdd = () => {
    if (canAdd) {
        dispatch({
            type: "ADD_ITEM",
            payload: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                stock: product.stock,
                qty: 1
            }
        });
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
          
          {inCartQty > 0 ? (
             <div style={{ width: '100%' }}>
                <QuantityControl 
                    value={inCartQty} 
                    onChange={handleUpdateQty} 
                    min={0}
                    max={product.stock} 
                />
             </div>
          ) : (
             <button
                className="btn"
                disabled={!hasStock}
                onClick={handleInitialAdd}
                style={{ width: '100%', backgroundColor: '#9333ea', color: 'white' }}
             >
                {!hasStock ? "Agotado" : "AÑADIR"}
             </button>
          )}

        </div>
      </div>
    </article>
  );
}
