import { useState, useEffect } from "react";
import { getDashboardMetrics, type DashboardData } from "../../services/dashboard";
import { getErrorMessage } from "../../utils/error";
import "./AdminDashboardPage.css";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await getDashboardMetrics();
      setData(dashboardData);
    } catch (e) {
      setError(getErrorMessage(e) || "Error cargando métricas");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP"
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__header">
          <h1>Cargando métricas...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__header">
          <h1>Error</h1>
          <p className="admin-dashboard__subtitle" style={{ color: "#dc2626" }}>{error}</p>
          <button 
            onClick={loadDashboard}
            style={{ 
              marginTop: "1rem", 
              padding: "0.75rem 1.5rem", 
              background: "#00a99d", 
              color: "white", 
              border: "none", 
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, topProducts, lowProducts, mostViewedProducts } = data;
  const revenueWithoutIVA = metrics.totalRevenue / 1.19;
  const ivaAmount = metrics.totalRevenue - revenueWithoutIVA;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Dashboard - Métricas</h1>
          <p className="admin-dashboard__subtitle">Resumen de ventas y rendimiento</p>
        </div>
        <button 
          onClick={loadDashboard}
          disabled={loading}
          style={{ 
            padding: "0.75rem 1.5rem", 
            background: loading ? "#ccc" : "#00a99d", 
            color: "white", 
            border: "none", 
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = "#008b82";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = "#00a99d";
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>🔄</span>
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Métricas principales */}
      <div className="metrics-grid">
        <div className="metric-card metric-card--primary">
          <div className="metric-card__icon">💰</div>
          <div className="metric-card__content">
            <h3>Ingresos Totales</h3>
            <p className="metric-card__value">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="metric-card__label">Con IVA incluido</p>
          </div>
        </div>

        <div className="metric-card metric-card--success">
          <div className="metric-card__icon">📦</div>
          <div className="metric-card__content">
            <h3>Productos Vendidos</h3>
            <p className="metric-card__value">{metrics.totalSales}</p>
            <p className="metric-card__label">Unidades totales</p>
          </div>
        </div>

        <div className="metric-card metric-card--info">
          <div className="metric-card__icon">🛒</div>
          <div className="metric-card__content">
            <h3>Pedidos Completados</h3>
            <p className="metric-card__value">{metrics.totalOrders}</p>
            <p className="metric-card__label">Órdenes procesadas</p>
          </div>
        </div>

        <div className="metric-card metric-card--warning">
          <div className="metric-card__icon">📊</div>
          <div className="metric-card__content">
            <h3>Ticket Promedio</h3>
            <p className="metric-card__value">{formatCurrency(metrics.avgOrderValue)}</p>
            <p className="metric-card__label">Por pedido</p>
          </div>
        </div>
      </div>

      {/* Desglose de IVA */}
      <div className="iva-section">
        <div className="iva-card">
          <h3>Desglose de Impuestos</h3>
          <div className="iva-breakdown">
            <div className="iva-item">
              <span className="iva-label">Ingresos sin IVA:</span>
              <span className="iva-value">{formatCurrency(revenueWithoutIVA)}</span>
            </div>
            <div className="iva-item iva-item--highlight">
              <span className="iva-label">IVA (19%):</span>
              <span className="iva-value">{formatCurrency(ivaAmount)}</span>
            </div>
            <div className="iva-item iva-item--total">
              <span className="iva-label">Total con IVA:</span>
              <span className="iva-value">{formatCurrency(metrics.totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Productos más vendidos y menos vendidos */}
      <div className="products-section">
        <div className="products-card">
          <h3>🔥 Productos Más Vendidos</h3>
          <div className="products-list">
            {topProducts.map((product, index) => (
              <div key={product.id} className="product-item">
                <div className="product-rank">#{index + 1}</div>
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-stats">
                    {product.sales} unidades - {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div className="product-bar">
                  <div 
                    className="product-bar-fill product-bar-fill--success" 
                    style={{ width: `${(product.sales / topProducts[0]?.sales || 1) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="products-card">
          <h3>📉 Productos Menos Vendidos</h3>
          <div className="products-list">
            {lowProducts.map((product, index) => (
              <div key={product.id} className="product-item">
                <div className="product-rank product-rank--low">#{index + 1}</div>
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-stats">
                    {product.sales} unidades - {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div className="product-bar">
                  <div 
                    className="product-bar-fill product-bar-fill--warning" 
                    style={{ width: `${(product.sales / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Productos más visitados */}
      <div className="products-section">
        <div className="products-card" style={{ gridColumn: "1 / -1" }}>
          <h3>👀 Productos Más Visitados</h3>
          <div className="products-list">
            {mostViewedProducts && mostViewedProducts.length > 0 ? (
              mostViewedProducts.map((product, index) => (
                <div key={product.id} className="product-item">
                  <div className="product-rank">#{index + 1}</div>
                  <div className="product-info">
                    <p className="product-name">{product.name}</p>
                    <p className="product-stats">
                      {product.views} {product.views === 1 ? 'visita' : 'visitas'}
                    </p>
                  </div>
                  <div className="product-bar">
                    <div 
                      className="product-bar-fill" 
                      style={{ 
                        width: `${(product.views / (mostViewedProducts[0]?.views || 1)) * 100}%`,
                        backgroundColor: '#3b82f6'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                No hay datos de visitas disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="additional-metrics">
        <div className="small-metric-card">
          <h4>Tasa de Conversión</h4>
          <p className="small-metric-value">{metrics.conversionRate.toFixed(1)}%</p>
        </div>
        <div className="small-metric-card">
          <h4>Clientes Nuevos</h4>
          <p className="small-metric-value">{metrics.newCustomers}</p>
        </div>
        <div className="small-metric-card">
          <h4>Productos en Stock</h4>
          <p className="small-metric-value">{metrics.productsInStock}</p>
        </div>
        <div className="small-metric-card">
          <h4>Stock Bajo</h4>
          <p className="small-metric-value">{metrics.lowStockProducts}</p>
        </div>
      </div>
    </div>
  );
}
