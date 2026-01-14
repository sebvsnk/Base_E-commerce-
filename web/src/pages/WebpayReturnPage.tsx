import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useCart } from "../features/cart/cart-context";

export default function WebpayReturnPage() {
    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const msg = searchParams.get("msg");

    const { dispatch } = useCart();

    useEffect(() => {
        if (status === "success") {
            dispatch({ type: "CLEAR" });
        }
    }, [status, dispatch]);

    return (
        <section style={{ textAlign: "center", padding: "40px 0" }}>
            {status === "success" ? (
                <div className="card">
                    <h1 style={{ color: "green", marginBottom: "0.5rem" }}>¡Compra Exitosa!</h1>
                    <p className="muted">Gracias por tu preferencia.</p>
                    
                    <div style={{ margin: "2rem 0", padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px" }}>
                        <h3 style={{ margin: 0, color: "#555" }}>Tu ID de Seguimiento</h3>
                        <p style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0.5rem 0", color: "#333" }}>{orderId}</p>
                        <span style={{ 
                            display: "inline-block", 
                            padding: "4px 12px", 
                            borderRadius: "16px", 
                            background: "#dcfce7", 
                            color: "#166534", 
                            fontSize: "0.9rem",
                            fontWeight: 600
                        }}>
                            Estado: PAGADO
                        </span>
                    </div>

                    <p>Hemos enviado los detalles a tu correo electrónico.</p>
                    
                    <div style={{ marginTop: "2rem" }}>
                        <Link to="/profile" className="btn btn--primary">
                            Ver mis compras
                        </Link>
                        <br />
                        <Link to="/" style={{ display: "inline-block", marginTop: "1rem", color: "#666" }}>
                            Volver a la tienda
                        </Link>
                    </div>
                </div>
            ) : status === "aborted" ? (
                <>
                    <h1 style={{ color: "orange" }}>Pago Anulado</h1>
                    <p>Has cancelado el proceso de pago.</p>
                    <Link to="/cart" className="btn" style={{ marginTop: 20, display: "inline-block" }}>
                        Volver al Carrito
                    </Link>
                </>
            ) : (
                <>
                    <h1 style={{ color: "red" }}>Pago Fallido</h1>
                    <p>Ocurrió un error al procesar tu pago.</p>
                    {msg && <p className="muted">Detalle: {msg}</p>}
                    <Link to="/cart" className="btn" style={{ marginTop: 20, display: "inline-block" }}>
                        Intentar nuevamente
                    </Link>
                </>
            )}
        </section>
    );
}
