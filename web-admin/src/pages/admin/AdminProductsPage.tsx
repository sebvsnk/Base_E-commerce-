import { getErrorMessage } from "../../utils/error";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../services/products";
import { disableProduct, listAdminProducts, updateProduct, deleteProduct } from "../../services/products";
import { formatCurrency } from "../../utils/currency";
import * as XLSX from 'xlsx';
import './AdminProductsPage.css';

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [filterBrand, setFilterBrand] = useState<string>("all");

  async function refresh() {
    try {
      setLoading(true);
      const data = await listAdminProducts();
      setProducts(data.data);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onToggleActive(p: Product) {
    if(!window.confirm(`¿${p.isActive ? 'Desactivar' : 'Activar'} producto "${p.name}"?`)) return;
    try {
        if (p.isActive) {
            await disableProduct(p.id);
        } else {
            await updateProduct(p.id, { isActive: true });
        }
        await refresh();
    } catch (e: unknown) {
        alert(getErrorMessage(e) || "Error actualizando");
    }
  }

  async function onDelete(p: Product) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteProduct(p.id);
      await refresh();
    } catch (e: unknown) {
      alert(getErrorMessage(e) || "Error eliminando producto");
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const data = filteredProducts.map(p => ({
      ID: p.id,
      Nombre: p.name,
      SKU: p.sku || "",
      Precio: p.price,
      Stock: p.stock,
      Activo: p.isActive ? "Sí" : "No",
      "Fecha Creación": p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    XLSX.writeFile(workbook, `productos_${new Date().toISOString().split('T')[0]}.${format}`);
  };

  // Filter products based on selected filters
  const filteredProducts = products.filter(p => {
    // Filter by status
    if (filterStatus === "published" && !p.isActive) return false;
    if (filterStatus === "draft" && p.isActive) return false;
    
    // Filter by stock
    if (filterStock === "low" && p.stock > 10) return false;
    if (filterStock === "high" && p.stock <= 10) return false;
    if (filterStock === "out" && p.stock > 0) return false;
    if (filterStock === "in" && p.stock === 0) return false;
    
    // Filter by brand
    if (filterBrand !== "all" && p.brand !== filterBrand) return false;
    
    return true;
  });

  // Get unique brands
  const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="admin-page__title">PRODUCTOS</h1>
        
        <div className="admin-page__actions">
          <button className="btn" style={{ background: "#28a745", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "500" }} onClick={() => navigate("/admin/products/new")}>
            (+) Nuevo Producto
          </button>
          
          <div style={{ position: "relative" }}>
            <button 
                className="btn" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                style={{ 
                  fontSize: "0.9rem", 
                  padding: "8px 16px", 
                  background: "#ffffff",
                  color: "#2c3e50",
                  border: "1px solid #d0d0d0",
                  borderRadius: "6px",
                  fontWeight: "500"
                }}
            >
                Exportar ▼
            </button>
            {showExportMenu && (
                <div style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 10,
                    backgroundColor: "#ffffff",
                    border: "1px solid #d0d0d0",
                    borderRadius: "6px",
                    marginTop: "5px",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: "120px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                }}>
                    <button 
                        className="btn" 
                        style={{ 
                          border: "none", 
                          borderRadius: "6px 6px 0 0", 
                          textAlign: "left", 
                          width: "100%", 
                          background: "transparent", 
                          color: "#2c3e50",
                          padding: "10px 16px",
                          fontWeight: "500"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={() => { handleExport("csv"); setShowExportMenu(false); }}
                    >
                        CSV
                    </button>
                    <button 
                        className="btn" 
                        style={{ 
                          border: "none", 
                          borderRadius: "0 0 6px 6px", 
                          textAlign: "left", 
                          width: "100%", 
                          background: "transparent", 
                          borderTop: "1px solid #e0e0e0", 
                          color: "#2c3e50",
                          padding: "10px 16px",
                          fontWeight: "500"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={() => { handleExport("xlsx"); setShowExportMenu(false); }}
                    >
                        XLSX
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-page__content">
        {/* Filters */}
        <div className="admin-filters">
          <select 
            className="input" 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
              <option value="all">Estado: Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
          </select>
          
          <select 
            className="input" 
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
          >
              <option value="all">Stock: Todos</option>
              <option value="in">En stock</option>
              <option value="low">Stock bajo (&lt;10)</option>
              <option value="high">Stock alto (&gt;10)</option>
              <option value="out">Sin stock</option>
          </select>
          
          <select 
            className="input" 
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
          >
              <option value="all">Marca: Todas</option>
              {brands.map(brand => (
                <option key={brand || "null"} value={brand || ""}>{brand || "Sin marca"}</option>
              ))}
          </select>

          {(filterStatus !== "all" || filterStock !== "all" || filterBrand !== "all") && (
            <button 
              className="btn" 
              style={{ fontSize: "0.9rem", padding: "6px 12px" }}
              onClick={() => {
                setFilterStatus("all");
                setFilterStock("all");
                setFilterBrand("all");
              }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <span>Todos ({products.length})</span> | 
          <span>Publicados ({products.filter(p => p.isActive).length})</span> | 
          <span>Mostrando: {filteredProducts.length}</span>
        </div>

        {error && <div className="muted" style={{ color: "#ef4444", marginBottom: "1rem" }}>Error: {error}</div>}
        
        {loading ? <p className="muted">Cargando...</p> : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ width: "40px" }}>
                            <input 
                                type="checkbox" 
                                onChange={handleSelectAll} 
                                checked={products.length > 0 && selectedIds.size === products.length} 
                            />
                        </th>
                        <th style={{ width: "60px" }}>Av</th>
                        <th>Nombre</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th>Marcas</th>
                        <th>Status</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((p) => {
                        const isSelected = selectedIds.has(p.id);
                        return (
                            <tr key={p.id}>
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => handleSelectOne(p.id)}
                                    />
                                </td>
                                <td>
                                    <img 
                                        src={p.image} 
                                        alt={p.name} 
                                        className="admin-product-image"
                                    />
                                </td>
                                <td>
                                    <div className="admin-product-name">{p.name}</div>
                                    <div className="admin-product-status">
                                        {p.isActive ? "Publicado" : "Borrador"} {p.sku && `| SKU: ${p.sku}`}
                                    </div>
                                </td>
                                <td>
                                    {p.stock > 0 ? (
                                        <span style={{ color: "#4ade80" }}>En stock ({p.stock})</span>
                                    ) : (
                                        <span style={{ color: "#ef4444" }}>Agotado</span>
                                    )}
                                </td>
                                <td>
                                    {formatCurrency(p.price)}
                                </td>
                                <td>
                                    {p.brand || "-"}
                                </td>
                                <td>
                                    <span className={`admin-status-badge ${p.isActive ? "admin-status-badge--success" : "admin-status-badge--danger"}`}>
                                        {p.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-action-buttons">
                                        <button 
                                            className={`admin-btn-icon ${p.isActive ? "admin-btn-icon--success" : "admin-btn-icon--warning"}`}
                                            onClick={() => onToggleActive(p)}
                                            title={p.isActive ? "Ocultar (Borrador)" : "Publicar"}
                                        >
                                            {p.isActive ? "👁️" : "👁️‍🗨️"}
                                        </button>
                                        <button 
                                            className="admin-btn-icon admin-btn-icon--info" 
                                            onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            className="admin-btn-icon admin-btn-icon--danger"
                                            onClick={() => onDelete(p)}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
