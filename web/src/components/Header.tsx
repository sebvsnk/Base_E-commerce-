import { Link, NavLink } from "react-router-dom";
import { useCart } from "../features/cart/cart-context";
import { useAuth } from "../features/auth/auth-context";

export default function Header() {
  const { totalItems } = useCart();
  const { isAuthed, user } = useAuth();

  return (
    <header className="header">
      <div className="header__inner container">
        <Link to="/" className="brand">Shop</Link>

        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav__link active" : "nav__link")}>
            Productos
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => (isActive ? "nav__link active" : "nav__link")}>
            Carrito <span className="badge">{totalItems}</span>
          </NavLink>

          {isAuthed ? (
            <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav__link active" : "nav__link")}>
              {user?.role === "ADMIN" ? "Admin" : "Perfil"}
            </NavLink>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? "nav__link active" : "nav__link")}>
              Entrar
            </NavLink>
          )}

          {(user?.role === "ADMIN" || user?.role === "WORKER") && (
            <>
              <NavLink to="/admin/products" className={({ isActive }) => (isActive ? "nav__link active" : "nav__link")}>
                Panel
              </NavLink>
              <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? "nav__link active" : "nav__link")}>
                Órdenes
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
