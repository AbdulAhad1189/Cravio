import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending: 'var(--brand-gold)',
  confirmed: 'var(--brand-violet)',
  preparing: 'var(--brand-gold)',
  ready: 'var(--brand-emerald)',
  delivered: 'var(--brand-emerald)',
  cancelled: 'var(--brand-rose)',
};

const STATUS_ICONS = {
  pending: 'bi-hourglass',
  confirmed: 'bi-check-circle',
  preparing: 'bi-fire',
  ready: 'bi-bag-check',
  delivered: 'bi-check-all',
  cancelled: 'bi-x-circle',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { orderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.list()
      .then(res => {
        const list = res.data.orders || res.data || [];
        setOrders(list);
        if (orderId) {
          const found = list.find(o => o.id === orderId);
          setSelected(found || null);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-ring" />
      </div>
    );
  }

  return (
    <>
      <div className="page-hero" style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title mb-0">
            <i className="bi bi-clock-history me-3" style={{ fontSize: '1.8rem' }} />My Orders
          </h1>
          <p className="section-subtitle mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-bag" />
            <h4 style={{ marginBottom: '0.5rem' }}>No orders yet</h4>
            <p style={{ marginBottom: '1.5rem' }}>Place your first order from one of our restaurants!</p>
            <Link to="/restaurants" className="btn-gold" style={{ textDecoration: 'none' }}>Browse Restaurants</Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Order List */}
            <div className={selected ? 'col-lg-5' : 'col-12'}>
              <div className="d-flex flex-column gap-3">
                {orders.map(order => {
                  const color = STATUS_COLORS[order.status] || 'var(--text-muted)';
                  const icon = STATUS_ICONS[order.status] || 'bi-circle';
                  return (
                    <div
                      key={order.id}
                      className="ttt-card"
                      style={{
                        padding: '1.25rem', cursor: 'pointer',
                        border: selected?.id === order.id ? '1.5px solid var(--brand-gold)' : undefined,
                      }}
                      onClick={() => setSelected(s => s?.id === order.id ? null : order)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
                            {order.restaurant_name || 'Order'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-end">
                          <div style={{ color: 'var(--brand-gold)', fontWeight: 800 }}>
                            ${order.total?.toFixed(2)}
                          </div>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, color,
                            display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 4,
                          }}>
                            <i className={`bi ${icon}`} />{order.status}
                          </span>
                        </div>
                      </div>

                      {order.items && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
                          {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Detail */}
            {selected && (
              <div className="col-lg-7">
                <div className="ttt-card" style={{ padding: '1.5rem', position: 'sticky', top: 88 }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 style={{ margin: 0 }}>Order Details</h5>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                      <i className="bi bi-x" />
                    </button>
                  </div>

                  <div className="d-flex gap-3 flex-wrap mb-4">
                    {[
                      { label: 'Status', value: selected.status, color: STATUS_COLORS[selected.status] },
                      { label: 'Total', value: `$${selected.total?.toFixed(2)}` },
                      { label: 'Items', value: selected.items?.length || 0 },
                    ].map(s => (
                      <div key={s.label} className="stat-card" style={{ flex: 1, minWidth: 100, padding: '1rem' }}>
                        <div className="stat-label">{s.label}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: s.color || 'var(--text-primary)', marginTop: 4 }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <h6 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Items
                  </h6>
                  {selected.items?.map((item, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}

                  {selected.delivery_address && (
                    <>
                      <hr style={{ borderColor: 'var(--border-card)', margin: '1rem 0' }} />
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <i className="bi bi-geo-alt me-2" style={{ color: 'var(--brand-gold)' }} />
                        {selected.delivery_address}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
