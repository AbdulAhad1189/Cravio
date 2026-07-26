import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../api/axios';

export default function CartPage() {
  const { cart, cartLoading, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [deliveryAddr, setDeliveryAddr] = useState('');

  const items = cart?.items || [];
  const total = cart?.total || 0;
  const restaurantName = cart?.restaurant?.name;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!deliveryAddr.trim()) { setError('Please enter a delivery address.'); return; }
    setError('');
    setCheckoutLoading(true);
    try {
      const res = await orderAPI.place({ delivery_address: deliveryAddr });
      navigate(`/orders/${res.data.order?.id || ''}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cartLoading) {
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
            <i className="bi bi-bag me-3" style={{ fontSize: '1.8rem' }} />Your Cart
          </h1>
          {restaurantName && (
            <p className="section-subtitle mt-1">From <strong style={{ color: 'var(--brand-gold)' }}>{restaurantName}</strong></p>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
        {items.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-bag" />
            <h4 style={{ marginBottom: '0.5rem' }}>Your cart is empty</h4>
            <p style={{ marginBottom: '1.5rem' }}>Add items from a restaurant to get started.</p>
            <Link to="/restaurants" className="btn-gold" style={{ textDecoration: 'none' }}>
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Items */}
            <div className="col-lg-7">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ margin: 0 }}>Items ({items.length})</h5>
                <button
                  onClick={() => { if (window.confirm('Clear your cart?')) clearCart(); }}
                  className="btn-danger-outline"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                >
                  <i className="bi bi-trash me-1" />Clear Cart
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {items.map(item => (
                  <div key={item.food_id} className="ttt-card" style={{ padding: '1rem' }}>
                    <div className="d-flex gap-3 align-items-center">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100'}
                        alt={item.name}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100'; }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                        <div style={{ color: 'var(--brand-gold)', fontWeight: 700, fontSize: '0.95rem' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          ${item.price?.toFixed(2)} each
                        </div>
                      </div>
                      {/* Qty Controls */}
                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => item.quantity > 1 ? updateItem(item.food_id, item.quantity - 1) : removeItem(item.food_id)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-card)',
                            background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <i className="bi bi-dash" />
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.food_id, item.quantity + 1)}
                          style={{
                            width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-card)',
                            background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <i className="bi bi-plus" />
                        </button>
                        <button
                          onClick={() => removeItem(item.food_id)}
                          style={{ background: 'none', border: 'none', color: 'var(--brand-rose)', cursor: 'pointer', padding: '0 4px' }}
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout */}
            <div className="col-lg-5">
              <div className="ttt-card" style={{ padding: '1.5rem', position: 'sticky', top: 88 }}>
                <h5 style={{ marginBottom: '1.25rem' }}>Order Summary</h5>

                {items.map(item => (
                  <div key={item.food_id} className="d-flex justify-content-between mb-2" style={{ fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}

                <hr style={{ borderColor: 'var(--border-card)', margin: '1rem 0' }} />
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal</span><span>${total.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span>Delivery Fee</span><span style={{ color: 'var(--brand-emerald)' }}>Free</span>
                </div>
                <div className="d-flex justify-content-between" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--brand-gold)' }}>${total.toFixed(2)}</span>
                </div>

                <hr style={{ borderColor: 'var(--border-card)', margin: '1rem 0' }} />

                <form onSubmit={handleCheckout}>
                  {error && <div className="ttt-alert ttt-alert-error mb-3">{error}</div>}
                  <div className="mb-3">
                    <label htmlFor="delivery-address" className="ttt-label">Delivery Address</label>
                    <textarea
                      id="delivery-address"
                      className="ttt-input"
                      style={{ width: '100%', minHeight: 80, resize: 'none' }}
                      placeholder="Enter full delivery address…"
                      value={deliveryAddr}
                      onChange={e => setDeliveryAddr(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    id="checkout-btn"
                    type="submit"
                    className="btn-gold"
                    style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : <i className="bi bi-lightning me-2" />}
                    {checkoutLoading ? 'Placing Order…' : 'Place Order'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
