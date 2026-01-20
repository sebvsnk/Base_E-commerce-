import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../features/cart/cart-context";
import { useAuth } from "../features/auth/auth-context";
import { useTheme } from "../hooks/useTheme";
import { Search, ShoppingCart, User, Menu, X, Sun, Moon } from "lucide-react";
import logo from "../assets/logoPicara_Blanco.svg";
import { listPublicProducts, type Product } from "../services/products";
import { listCategories, type Category } from "../services/categories";
import { useDebounce } from "use-debounce";
import { useEffect, useRef } from "react";
import "./Header.css";

export default function Header() {
  const { totalItems } = useCart();
  const { isAuthed, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    listCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm.length >= 1) { // As soon as they type 1 char? user said "segun la letra"
      listPublicProducts({ q: debouncedSearchTerm, limit: 6 })
        .then(res => {
             setResults(res.data || []);
             setShowResults(true);
        })
        .catch(console.error);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchTerm]);

  // Hide results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(false);
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
          <div className="search-bar" ref={searchContainerRef} style={{ position: 'relative' }}>
            <form onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="¿Qué estás buscando?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowResults(true); }}
              />
              <button type="submit">
                <Search size={20} />
              </button>
            </form>
            
            {showResults && results.length > 0 && (
              <div className="search-results-dropdown">
                {results.map(product => (
                  <div 
                    key={product.id} 
                    className="search-result-item"
                    onClick={() => {
                      navigate(`/product/${product.id}`);
                      setShowResults(false);
                      setSearchTerm("");
                    }}
                  >
                    <img src={product.image} alt={product.name} />
                    <div>
                      <div className="search-result-name">{product.name}</div>
                      <div className="search-result-price">${product.price.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                <div 
                  className="search-result-item view-all"
                  onClick={(e) => {
                     handleSearch(e as any);
                  }}
                >
                  Ver todos los resultados ({results.length}+)
                </div>
              </div>
            )}
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
                       // Removed Admin Panel Link
                       null
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

      {/* Mobile Sidebar */}
      <div className={`mobile-overlay ${isMenuOpen ? "open" : ""}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`mobile-sidebar ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-sidebar-header">
           <img src={logo} alt="Logo" className="side-logo" />
           <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
             <X size={24} />
           </button>
        </div>
        <div className="mobile-sidebar-content">
           <h3 className="mobile-menu-title">Categorías</h3>
           <ul className="mobile-nav-list">
             <li className="mobile-nav-item">
                <Link to="/" onClick={() => setIsMenuOpen(false)}>Ver Todo</Link>
             </li>
             {categories.map(cat => (
               <li key={cat.id} className="mobile-nav-item">
                 <Link to={`/?category=${cat.id}`} onClick={() => setIsMenuOpen(false)}>
                   {cat.name}
                 </Link>
               </li>
             ))}
           </ul>
           <div className="mobile-divider" />
           <ul className="mobile-nav-list">
             {menuItems.map((item) => (
               <li key={item.label} className="mobile-nav-item">
                 <NavLink 
                    to={item.path} 
                    className={({ isActive }) => isActive ? "active" : ""}
                    onClick={() => setIsMenuOpen(false)} 
                 >
                   {item.label}
                 </NavLink>
               </li>
             ))}
           </ul>
        </div>
      </div>

      {/* Bottom Bar (Desktop Navigation) */}
      <nav className="site-header__bottom">
        <div className="site-header__container">
          <ul className="main-nav">
             {menuItems.map((item) => (
               <li key={item.label} className="nav-item">
                 <NavLink 
                    to={item.path} 
                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
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
