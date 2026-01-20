import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLinkClick = () => {
    // Cerrar sidebar en móvil al hacer clic en un enlace
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    handleLinkClick();
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div className="admin-sidebar-overlay" onClick={onClose}></div>
      )}
      
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar__header">
          <h2>Tienda Virtual</h2>
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {user?.email?.[0].toUpperCase() || "A"}
            </div>
            <div>
              <div className="admin-sidebar__username">{user?.email || "Admin"}</div>
              <div className="admin-sidebar__role">Administrador</div>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <Link 
          to="/admin/dashboard" 
          className={`admin-sidebar__link ${isActive("/admin/dashboard") ? "active" : ""}`}
          onClick={handleLinkClick}
        >
          <span className="admin-sidebar__icon">📊</span>
          Dashboard
        </Link>

        <Link 
            to="/admin/products"
            className={`admin-sidebar__link ${isActive("/admin/products") ? "active" : ""}`}
            onClick={handleLinkClick}
          >
            <span className="admin-sidebar__icon">📦</span>
            Productos
          </Link>

          <Link 
            to="/admin/orders" 
            className={`admin-sidebar__link ${isActive("/admin/orders") ? "active" : ""}`}
            onClick={handleLinkClick}
          >
            <span className="admin-sidebar__icon">🛒</span>
            Pedidos
          </Link>

          {user?.role === "ADMIN" && (
            <>
              <Link 
                to="/admin/users" 
                className={`admin-sidebar__link ${isActive("/admin/users") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <span className="admin-sidebar__icon">👥</span>
                Usuarios
              </Link>

              <Link 
                to="/admin/audits" 
                className={`admin-sidebar__link ${isActive("/admin/audits") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <span className="admin-sidebar__icon">📋</span>
                Auditorías
              </Link>

              <Link 
                to="/admin/multimedia" 
                className={`admin-sidebar__link ${isActive("/admin/multimedia") ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <span className="admin-sidebar__icon">🎨</span>
                Multimedia
              </Link>
            </>
          )}

          <button 
            onClick={handleLogout} 
            className="admin-sidebar__link admin-sidebar__logout"
          >
            <span className="admin-sidebar__icon">🚪</span>
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar sesión? Perderás acceso al panel de administración."
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        type="warning"
      />
    </>
  );
}
