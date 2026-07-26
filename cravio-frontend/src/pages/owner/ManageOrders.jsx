import React, { useState, useEffect } from 'react';
import OwnerSidebar from '../../components/OwnerSidebar';
import api from '../../api/axios';

const STATUS_OPTIONS = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/orders/restaurant/')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      const res = await api.patch(`/orders/${orderId}/`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o));
    } catch { alert('Failed to update status.'); }
  };

  const statusClass = (s) => `status-${s?.toLowerCase()}`;
  const filtered = filter ? orders.filter(o => o.status === filter) : orders;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <OwnerSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: '24px' }}>Manage Orders</h1>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <button onClick={() => setFilter('')} style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${!filter ? 'var(--olive)' : 'var(--border)'}`, background: !filter ? 'var(--olive)' : 'white', color: !filter ? 'white' : 'var(--dark)', cursor: 'pointer', fontSize: '0.83rem' }}>
            All ({orders.length})
          </button>
          {STATUS_OPTIONS.map(s => {
            const count = orders.filter(o => o.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${filter === s ? 'var(--olive)' : 'var(--border)'}`, background: filter === s ? 'var(--olive)' : 'white', color: filter === s ? 'white' : 'var(--dark)', cursor: 'pointer', fontSize: '0.83rem', textTransform: 'capitalize' }}>
                {s} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
            <p>No orders {filter ? `with status "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(order => (
              <div key={order.id} className="card-cravio" style={{ padding: '18px 22px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700 }}>Order #{order.id}</span>
                      <span className={statusClass(order.status)} style={{ textTransform: 'capitalize' }}>{order.status}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>👤 {order.customer_name || 'Customer'} · {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--olive)' }}>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {order.items?.map(item => (
                    <span key={item.id} style={{ fontSize: '0.8rem', background: 'var(--cream)', padding: '2px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>{item.food_name} × {item.quantity}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {order.delivery_address}</span>
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {order.status === 'pending' && (<><button onClick={() => updateStatus(order.id, 'accepted')} style={{ padding: '5px 12px', background: '#d4edda', border: 'none', borderRadius: '6px', color: '#155724', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✓ Accept</button><button onClick={() => updateStatus(order.id, 'cancelled')} style={{ padding: '5px 12px', background: '#f8d7da', border: 'none', borderRadius: '6px', color: '#721c24', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✗ Reject</button></>)}
                      {order.status === 'accepted' && <button onClick={() => updateStatus(order.id, 'preparing')} style={{ padding: '5px 12px', background: '#cce5ff', border: 'none', borderRadius: '6px', color: '#004085', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>🍳 Preparing</button>}
                      {order.status === 'preparing' && <button onClick={() => updateStatus(order.id, 'ready')} style={{ padding: '5px 12px', background: 'var(--olive-pale)', border: 'none', borderRadius: '6px', color: 'var(--olive)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✅ Ready</button>}
                      {order.status === 'ready' && <button onClick={() => updateStatus(order.id, 'delivered')} style={{ padding: '5px 12px', background: '#d4edda', border: 'none', borderRadius: '6px', color: '#155724', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>🚚 Delivered</button>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
