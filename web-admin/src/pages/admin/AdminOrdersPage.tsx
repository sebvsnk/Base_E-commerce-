import { getErrorMessage } from "../../utils/error";
import { useEffect, useMemo, useState } from "react";
import AdminNav from "./AdminNav";
import { listAdminOrders, updateOrderStatus, type AdminOrder, type OrderStatus } from "../../services/orders";
import { formatCurrency } from "../../utils/currency";
import "./AdminOrdersPage.css";

function statusLabel(s: OrderStatus) {
  if (s === "PENDING") return "Pendiente";
  if (s === "PAID") return "Pagado";
  return "Cancelado";
}

function getStatusBadgeClass(status: OrderStatus) {
  if (status === "PENDING") return "status-badge status-badge--pending";
  if (status === "PAID") return "status-badge status-badge--paid";
  return "status-badge status-badge--cancelled";
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getTimelineSteps(status: OrderStatus) {
  const steps = [
    { key: "PENDING", label: "Pendiente", icon: "⏳" },
    { key: "PAID", label: "Pagado", icon: "✓" },
    { key: "DELIVERED", label: "Entregado", icon: "📦" }
  ];

  let activeIndex = 0;
  if (status === "PENDING") activeIndex = 0;
  else if (status === "PAID") activeIndex = 1;
  else if (status === "CANCELLED") {
    // Si está cancelado, mostrar estado especial
    return [
      { key: "PENDING", label: "Pendiente", icon: "⏳", completed: true },
      { key: "CANCELLED", label: "Cancelado", icon: "✕", active: true }
    ];
  }

  return steps.map((step, idx) => ({
    ...step,
    completed: idx < activeIndex,
    active: idx === activeIndex
  }));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminOrders();
      setOrders(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error cargando órdenes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let result = orders;

    // Filtrar por búsqueda de texto
    if (needle) {
      result = result.filter((o) =>
        [o.id, o.customerEmail, o.user?.email ?? "", o.status].some((v) => v.toLowerCase().includes(needle))
      );
    }

    // Filtrar por estado
    if (filterStatus !== "ALL") {
      result = result.filter((o) => o.status === filterStatus);
    }

    return result;
  }, [orders, q, filterStatus]);

  async function setStatus(orderId: string, status: OrderStatus) {
    try {
      setUpdatingOrder(orderId);
      await updateOrderStatus(orderId, status);
      await refresh();
    } catch (e: unknown) {
      setError(getErrorMessage(e) || "Error actualizando estado");
    } finally {
      setUpdatingOrder(null);
    }
  }

  const isUpdating = (orderId: string) => updatingOrder === orderId;

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const isExpanded = (orderId: string) => expandedOrders.has(orderId);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === "PENDING").length;
    const paid = orders.filter(o => o.status === "PAID").length;
    const cancelled = orders.filter(o => o.status === "CANCELLED").length;
    const successRate = orders.length > 0 
      ? ((paid / orders.length) * 100).toFixed(1)
      : "0.0";

    return { pending, paid, cancelled, successRate, total: orders.length };
  }, [orders]);

  return (
    <section className="orders-page" data-theme="light" style={{ minHeight: '100vh', background: '#ffffff' }}>
      <h1>Órdenes</h1>
      <p className="muted">Gestiona y monitorea todas las órdenes del sistema</p>

      {/* Estadísticas Rápidas */}
      <div className="order-details-grid" style={{ marginTop: 20 }}>
        <div className="order-detail-item">
          <div className="order-detail-label">📦 Total Órdenes</div>
          <div className="order-detail-value order-detail-value--large">
            {stats.total}
          </div>
        </div>
        <div className="order-detail-item">
          <div className="order-detail-label">⏳ Pendientes</div>
          <div className="order-detail-value order-detail-value--large">{stats.pending}</div>
        </div>
        <div className="order-detail-item">
          <div className="order-detail-label">✓ Pagadas</div>
          <div className="order-detail-value order-detail-value--large">{stats.paid}</div>
        </div>
        <div className="order-detail-item">
          <div className="order-detail-label">✕ Canceladas</div>
          <div className="order-detail-value order-detail-value--large">{stats.cancelled}</div>
        </div>
        <div className="order-detail-item">
          <div className="order-detail-label">✅ Compras Finalizadas</div>
          <div className="order-detail-value order-detail-value--large">
            {stats.successRate}%
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card simple orders-search">
        <label className="muted">🔍 Buscar por ID, email o estado</label>
        <input 
          className="input" 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          placeholder="Ej: orden123, cliente@email.com, pending..." 
        />
        
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="muted">Filtrar por estado:</label>
          <select 
            className="input" 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="PAID">Pagadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
          <span className="muted">({filtered.length} resultados)</span>
        </div>
      </div>

      {error && (
        <div className="orders-error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {loading && !orders.length ? (
        <div className="orders-loading">
          <div>⏳ Cargando órdenes...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">📋</div>
          <p>No se encontraron órdenes</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filtered.map((o) => {
            const timelineSteps = getTimelineSteps(o.status);
            const shippingAddress = o.shippingAddress as any;

            return (
              <div key={o.id} className="order-card">
                {/* Header */}
                <div className="order-header">
                  <div>
                    <div className="order-id">📋 Orden #{o.id}</div>
                    <div className="order-date">📅 {formatDate(o.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={getStatusBadgeClass(o.status)}>
                      {statusLabel(o.status)}
                    </span>
                    <button 
                      className="btn btn--ghost" 
                      onClick={() => toggleExpanded(o.id)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      {isExpanded(o.id) ? '▲ Ocultar' : '▼ Ver más'}
                    </button>
                  </div>
                </div>

                {/* Timeline de Estado */}
                <div className="status-timeline">
                  {timelineSteps.map((step, idx) => (
                    <div 
                      key={step.key} 
                      className={`timeline-step ${step.completed ? 'timeline-step--completed' : ''} ${step.active ? 'timeline-step--active' : ''}`}
                    >
                      {idx > 0 && <div className="timeline-connector" />}
                      <div className="timeline-step-icon">{step.icon}</div>
                      <div className="timeline-step-label">{step.label}</div>
                    </div>
                  ))}
                </div>

                {/* Customer Info */}
                <div className="order-customer">
                  <div className="customer-email">
                    <span className="customer-email-icon">✉️</span>
                    <strong>{o.customerEmail}</strong>
                  </div>
                  <div className="customer-type">
                    {o.user ? (
                      <>
                        👤 Usuario registrado: {o.user.email}
                        <span className="customer-type-badge">
                          {o.user.role}
                        </span>
                      </>
                    ) : (
                      <>
                        👥 Invitado
                        <span className="customer-type-badge customer-type-badge--guest">
                          GUEST
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="order-details-grid">
                  <div className="order-detail-item">
                    <div className="order-detail-label">💰 Total</div>
                    <div className="order-detail-value order-detail-value--large">
                      {formatCurrency(o.total)}
                    </div>
                  </div>
                  
                  <div className="order-detail-item">
                    <div className="order-detail-label">📦 Items</div>
                    <div className="order-detail-value">
                      {o.items?.length ?? 0} productos
                    </div>
                  </div>

                  {o.user?.run && (
                    <div className="order-detail-item">
                      <div className="order-detail-label">🆔 RUN</div>
                      <div className="order-detail-value">{o.user.run}</div>
                    </div>
                  )}
                </div>

                {/* Webpay Info */}
                {isExpanded(o.id) && o.webpayToken && (
                  <div className={`payment-info ${o.paymentStatus === 'AUTHORIZED' ? 'payment-info--authorized' : o.paymentStatus === 'FAILED' ? 'payment-info--failed' : ''}`}>
                    💳 Webpay: {o.webpayToken}
                    {o.paymentStatus && ` - ${o.paymentStatus}`}
                  </div>
                )}

                {/* Shipping Address */}
                {isExpanded(o.id) && shippingAddress && (
                  <div className="shipping-address">
                    <div className="shipping-address-title">📍 Dirección de Envío</div>
                    <div className="shipping-address-content">
                      {shippingAddress.street && <div>{shippingAddress.street}</div>}
                      {shippingAddress.city && <div>{shippingAddress.city}</div>}
                      {shippingAddress.zip && <div>CP: {shippingAddress.zip}</div>}
                      {shippingAddress.contactPhone && <div>📞 {shippingAddress.contactPhone}</div>}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {isExpanded(o.id) && o.items?.length > 0 && (
                  <div className="order-items">
                    <div className="order-items-title">🛍️ Productos del Pedido</div>
                    {o.items.map((it, idx: number) => (
                      <div key={idx} className="order-item">
                        <span className="order-item-name">
                          {it.product?.name ?? it.productId}
                        </span>
                        <span className="order-item-qty">x {it.qty}</span>
                        <span className="order-item-price">
                          {formatCurrency(it.qty * it.priceSnapshot)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="order-actions">
                  <div className="order-actions-title">⚡ Cambiar Estado</div>
                  <button 
                    className="btn" 
                    disabled={isUpdating(o.id) || o.status === "PENDING"} 
                    onClick={() => setStatus(o.id, "PENDING")}
                  >
                    ⏳ Pendiente
                  </button>
                  <button 
                    className="btn btn--primary" 
                    disabled={isUpdating(o.id) || o.status === "PAID"} 
                    onClick={() => setStatus(o.id, "PAID")}
                  >
                    ✓ Pagado
                  </button>
                  <button 
                    className="btn btn--danger" 
                    disabled={isUpdating(o.id) || o.status === "CANCELLED"} 
                    onClick={() => setStatus(o.id, "CANCELLED")}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
