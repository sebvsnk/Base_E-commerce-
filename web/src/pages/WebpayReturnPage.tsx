import { useEffect, useState } from "react";
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
            dispatch({ type: "CLEAR_CART" });
        }
    }, [status, dispatch]);

    return (
        <section style={{ textAlign: "center", padding: "40px 0" }}>
            {status === "success" ? (
                <>
                    <h1 style={{ color: "green" }}>¡Pago Exitoso!</h1>
                    <p>Tu orden <strong>{orderId}</strong> ha sido pagada correctamente.</p>
                    <p>Te hemos enviado un correo con los detalles.</p>
                    <Link to="/profile" className="btn btn--primary" style={{ marginTop: 20, display: "inline-block" }}>
                        Ver mis órdenes
                    </Link>
                </>
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
