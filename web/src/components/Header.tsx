import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../features/cart/cart-context";
import { useAuth } from "../features/auth/auth-context";
import { useTheme } from "../hooks/useTheme";
import { Search, ShoppingCart, User, Menu, X, Sun, Moon } from "lucide-react";
import logo from "../assets/logoPicara_Blanco.svg";
import "./Header.css";

export default function Header() {
  const { totalItems } = useCart();
  const { isAuthed, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to home with search query or specific search page
    // For now, let's just assume we want to filter logically or just log it
    console.log("Searching for:", searchTerm);
    // You might want to navigate to /?q=searchTerm
    navigate(`/?q=${encodeURIComponent(searchTerm)}`);
  };

  const menuItems = [
    { label: "INICIO", path: "/" },
    { label: "Para Ellas", path: "/tag/for-her" },
    { label: "Para Ellos", path: "/tag/for-him" },
    { label: "Accesorios", path: "/tag/accessories" },
  ];

  return (
    <header className="site-header">
      {/* Top Bar (Orange) */}
      <div className="site-header__top">
        <div className="site-header__container">
          
          {/* Logo */}
          <Link to="/" className="brand-logo">
             <img src={logo} alt="Logo Marca" style={{ height: '77px' }} />
          </Link>

          {/* Search Bar */}
          <div className="search-bar">
            <form onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="¿Qué estás buscando?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit">
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* User Actions & Mobile Toggle */}
          <div className="user-actions">
            
            <button 
                onClick={toggleTheme} 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Login / Profile */}
            {isAuthed ? (
               <div className="user-dropdown-container" style={{ position: 'relative' }}>
                <button 
                  className="user-link" 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                  <User size={20} />
                  <span>{user?.fullName || "Mi Cuenta"}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="user-dropdown-menu">
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                      Mi Perfil
                    </Link>
                    
                    {user?.role === "CUSTOMER" && (
                       <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                         Ver estado de mi pedido
                       </Link>
                    )}
                    
                    {(user?.role === "ADMIN" || user?.role === "WORKER") && (
                       <Link to="/admin/products" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                         Panel Admin
                       </Link>
                    )}
                    
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', fontWeight: 'bold' }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="user-link">
                <User size={20} />
                <span>INICIAR SESIÓN / REGISTRAR</span>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="user-link">
              <div className="cart-icon-wrapper">
                <ShoppingCart size={24} />
                {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
              </div>
            </Link>

             {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar (Navigation) */}
      <nav className={`site-header__bottom ${isMenuOpen ? "is-open" : ""}`}>
        <div className="site-header__container" style={{ display: 'block' }}> {/* Override flex for Nav container behavior */}
          <ul className="main-nav">
             {menuItems.map((item) => (
               <li key={item.label} className="nav-item">
                 <NavLink 
                    to={item.path} 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                    onClick={() => setIsMenuOpen(false)} // Close on click
                 >
                   {item.label}
                 </NavLink>
               </li>
             ))}


          </ul>
        </div>
      </nav>
    </header>
  );
}
