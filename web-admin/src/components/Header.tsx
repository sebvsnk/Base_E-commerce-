import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { useTheme } from "../hooks/useTheme";
import { User, Sun, Moon, LogOut } from "lucide-react";
import logo from "../assets/logoPicara_Blanco.svg";
import "./Header.css";

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="site-header__top">
        <div className="site-header__container">
          
          <Link to="/admin/products" className="brand-logo">
             <img src={logo} alt="Logo Admin" style={{ height: '50px' }} />
             <span style={{ marginLeft: '10px', color: 'white', fontWeight: 'bold' }}>ADMIN</span>
          </Link>

          <div style={{ flex: 1, display: 'flex', gap: '20px', marginLeft: '40px' }}>
              <NavLink to="/admin/products" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{color: 'white'}}>Productos</NavLink>
              <NavLink to="/admin/orders" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{color: 'white'}}>Órdenes</NavLink>
              {user?.role === "ADMIN" && (
                <>
                  <NavLink to="/admin/users" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{color: 'white'}}>Usuarios</NavLink>
                  <NavLink to="/admin/audits" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} style={{color: 'white'}}>Auditorías</NavLink>
                </>
              )}
               <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="nav-link" style={{color: '#ddd'}}>
                 Ir a Tienda ↗
               </a>
          </div>

          <div className="user-actions">
            <button 
                onClick={toggleTheme} 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0 10px' }}
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'white'}}>
                 <User size={20} />
                 <span>{user?.fullName}</span>
            </div>

             <button 
                onClick={handleLogout} 
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '15px' }}
                title="Cerrar Sesión"
            >
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
