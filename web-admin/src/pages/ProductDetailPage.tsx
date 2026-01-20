
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct, type Product } from "../services/products";
import { useCart } from "../features/cart/cart-context";
import { formatCurrency } from "../utils/currency";
import QuantityControl from "../components/QuantityControl";
import { getErrorMessage } from "../utils/error";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cart logic
  const { dispatch, state } = useCart();
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then(p => {
          setProduct(p);
          setSelectedImage(p.image);
      })
      .catch((err) => setError(getErrorMessage(err) || "Error cargando producto"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container" style={{ marginTop: 40 }}>Cargando...</div>;
  if (error || !product) return <div className="container" style={{ marginTop: 40 }}>Error: {error ?? "Producto no encontrado"}</div>;

  const hasStock = product.stock > 0;
  const inCartQty = state.items.find((i) => i.id === product.id)?.qty ?? 0;
  const canAdd = hasStock && (inCartQty + qtyToAdd <= product.stock);
  const remainingStock = product.stock - inCartQty;
  const gallery = (product.images && product.images.length > 0) ? product.images : [product.image];

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
          qty: qtyToAdd,
        },
      });
      setQtyToAdd(1);
      alert("Producto agregado al carrito");
    }
  };

  return (
    <div className="container" style={{ marginTop: 40, paddingBottom: 60 }}>
       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
          {/* Left: Gallery & Image */}
          <div style={{ display: "flex", gap: "20px" }}>
              {/* Thumbnails */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "80px" }}>
                  {gallery.map((img, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        style={{ 
                            width: "80px", 
                            height: "80px",
                            cursor: "pointer", 
                            border: selectedImage === img ? "2px solid #372c72" : "1px solid #ddd", 
                            borderRadius: "8px",
                            overflow: 'hidden',
                        }}
                      >
                        <img src={img} alt={`Thumb ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                  ))}
              </div>

              {/* Main Image */}
              <div style={{ flex: 1, border: '1px solid var(--border-overlay)', borderRadius: '16px', padding: '20px', backgroundColor: 'white', display: 'flex', justifyContent: 'center', minHeight: '400px', alignItems: 'center' }}>
                 <img 
                   src={selectedImage || product.image} 
                   alt={product.name} 
                   style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} 
                 />
              </div>
          </div>

          {/* Right: Details */}
          <div>
             {product.brand && (
                <div style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                  {product.brand}
                </div>
             )}
             
             <h1 style={{ fontSize: '2rem', marginBottom: '16px', lineHeight: 1.2 }}>{product.name}</h1>
             
             <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4a148c', marginBottom: '10px' }}>
               {formatCurrency(product.price)}
             </div>

             <div style={{ marginBottom: '20px', color: '#666' }}>
                {product.sku ? `SKU: ${product.sku}` : ''} 
                {product.categoryId ? ` | Cat: ${product.categoryId}` : ''}
             </div>
             
             <div style={{ marginBottom: '30px', padding: '15px', background: 'var(--card-bg)', borderRadius: '8px' }}>
                <p style={{ margin: 0 }}>{product.description}</p>
             </div>

             <div style={{ marginBottom: '20px' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Disponibilidad:</strong>
                {hasStock ? (
                   <span style={{ color: 'green', fontWeight: 'bold' }}>
                     <span style={{ marginRight: 6 }}>✓</span> Stock en tienda
                   </span>
                ) : (
                   <span style={{ color: 'red', fontWeight: 'bold' }}>Agotado</span>
                )}
             </div>

             {hasStock && (
                <div style={{ marginBottom: '30px' }}>
                   <label style={{ display: 'block', marginBottom: '8px' }}>Cantidad:</label>
                   <QuantityControl value={qtyToAdd} onChange={setQtyToAdd} max={remainingStock} />
                </div>
             )}

             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn btn--primary" 
                  disabled={!hasStock || !canAdd}
                  onClick={handleAdd}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    fontSize: '1.1rem', 
                    borderRadius: '50px',
                    backgroundColor: '#372c72',
                    border: 'none',
                    color: 'white'
                  }}
                >
                  {hasStock ? "AÑADIR AL CARRITO" : "AGOTADO"}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
}
