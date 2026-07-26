import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { restaurantAPI, foodAPI, orderAPI, reservationAPI } from '../api/axios';

const TABS = ['overview', 'menu', 'orders', 'reservations', 'settings'];

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodForm, setFoodForm] = useState({ name: '', description: '', price: '', category_name: '' });
  const [foodMsg, setFoodMsg] = useState('');
  const [restForm, setRestForm] = useState(null);
  const [restMsg, setRestMsg] = useState('');

  useEffect(() => {
    Promise.all([
      restaurantAPI.mine(),
      orderAPI.list(),
      reservationAPI.list(),
    ]).then(([rRes, oRes, resRes]) => {
      const r = rRes.data.restaurant || rRes.data;
      setRestaurant(r);
      setRestForm(r ? { name: r.name, cuisine: r.cuisine, city: r.city, address: r.address, phone: r.phone, opening_time: r.opening_time, closing_time: r.closing_time, description: r.description } : null);
      setOrders(oRes.data.orders || oRes.data || []);
      setReservations(resRes.data.reservations || resRes.data || []);
      if (r?.id) {
        return restaurantAPI.menu(r.id).then(mRes => setFoods(mRes.data.foods || mRes.data || []));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const addFood = async (e) => {
    e.preventDefault(); setFoodMsg('');
    try {
      const fd = new FormData();
      Object.entries(foodForm).forEach(([k, v]) => fd.append(k, v));
      if (restaurant?.id) fd.append('restaurant', restaurant.id);
      await foodAPI.create(fd);
      setFoodMsg('✓ Food item added!');
      const mRes = await restaurantAPI.menu(restaurant.id);
      setFoods(mRes.data.foods || mRes.data || []);
      setFoodForm({ name: '', description: '', price: '', category_name: '' });
    } catch (err) { setFoodMsg(err.response?.data?.error || 'Failed to add item.'); }
  };

  const deleteFood = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await foodAPI.delete(id); setFoods(f => f.filter(x => x.id !== id)); }
    catch { alert('Failed to delete.'); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
    } catch { alert('Failed to update status.'); }
  };

  const updateReservationStatus = async (id, status) => {
    try {
      await reservationAPI.updateStatus(id, status);
      setReservations(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    } catch { alert('Failed to update status.'); }
  };

  const saveRestaurant = async (e) => {
    e.preventDefault(); setRestMsg('');
    try {
      const fd = new FormData();
      Object.entries(restForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      const res = restaurant
        ? await restaurantAPI.update(restaurant.id, fd)
        : await restaurantAPI.create(fd);
      setRestaurant(res.data.restaurant || res.data);
      setRestMsg('✓ Restaurant saved!');
    } catch (err) { setRestMsg(err.response?.data?.error || 'Failed to save.'); }
  };

  const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length;
  const pendingRes = reservations.filter(r => r.status === 'pending').length;
  const revenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}><div className="spinner-ring" /></div>;

  return (
    <>
      <div className="page-hero" style={{ padding: '2rem 0 1.5rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title mb-0">Owner Dashboard</h1>
          <p className="section-subtitle mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`sidebar-link w-100 border-0 ${tab === t ? 'active' : ''}`}
              style={{ textAlign: 'left', textTransform: 'capitalize', background: 'none', cursor: 'pointer' }}>
              <i className={`bi bi-${t === 'overview' ? 'grid' : t === 'menu' ? 'journal-richtext' : t === 'orders' ? 'bag' : t === 'reservations' ? 'calendar2' : 'gear'}`} />
              {t}
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {/* Overview */}
          {tab === 'overview' && (
            <div>
              <div className="row g-3 mb-4">
                {[
                  { label: 'Revenue', value: `$${revenue.toFixed(0)}`, icon: 'bi-currency-dollar', color: 'var(--brand-gold)' },
                  { label: 'Active Orders', value: pendingOrders, icon: 'bi-bag', color: 'var(--brand-violet)' },
                  { label: 'Menu Items', value: foods.length, icon: 'bi-journal-richtext', color: 'var(--brand-emerald)' },
                  { label: 'Pending Reservations', value: pendingRes, icon: 'bi-calendar2', color: 'var(--brand-rose)' },
                ].map(s => (
                  <div key={s.label} className="col-sm-6 col-xl-3">
                    <div className="stat-card">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <div className="stat-label">{s.label}</div>
                          <div className="stat-value">{s.value}</div>
                        </div>
                        <i className={`bi ${s.icon}`} style={{ fontSize: '1.8rem', color: s.color, opacity: 0.7 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!restaurant && (
                <div className="ttt-alert ttt-alert-warning">
                  <i className="bi bi-exclamation-triangle me-2" />
                  You don't have a restaurant yet. Go to <strong>Settings</strong> to create one.
                </div>
              )}

              {restaurant && !restaurant.is_approved && (
                <div className="ttt-alert ttt-alert-warning">
                  <i className="bi bi-hourglass me-2" />
                  Your restaurant is <strong>pending approval</strong>. It will be visible once an admin approves it.
                </div>
              )}
            </div>
          )}

          {/* Menu */}
          {tab === 'menu' && (
            <div className="row g-4">
              <div className="col-lg-7">
                <h5 className="mb-3">Menu Items ({foods.length})</h5>
                {foods.length === 0 ? (
                  <div className="empty-state"><i className="bi bi-journal-richtext" /><p>No items yet.</p></div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {foods.map(food => (
                      <div key={food.id} className="ttt-card d-flex align-items-center gap-3" style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{food.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{food.category?.name}</div>
                        </div>
                        <div style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>${food.price?.toFixed(2)}</div>
                        <span className={`badge-${food.is_available ? 'emerald' : 'rose'}`} style={{ fontSize: '0.7rem' }}>
                          {food.is_available ? 'Available' : 'Unavailable'}
                        </span>
                        <button onClick={() => deleteFood(food.id)} style={{ background: 'none', border: 'none', color: 'var(--brand-rose)', cursor: 'pointer' }}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-lg-5">
                <div className="ttt-card" style={{ padding: '1.5rem' }}>
                  <h6 className="mb-3">Add New Item</h6>
                  {foodMsg && <div className={`ttt-alert ${foodMsg.startsWith('✓') ? 'ttt-alert-success' : 'ttt-alert-error'} mb-3`}>{foodMsg}</div>}
                  <form onSubmit={addFood}>
                    {[['name', 'Name', 'text'], ['price', 'Price', 'number'], ['category_name', 'Category', 'text']].map(([field, label, type]) => (
                      <div key={field} className="mb-3">
                        <label className="ttt-label">{label}</label>
                        <input type={type} className="ttt-input" style={{ width: '100%' }}
                          value={foodForm[field]} onChange={e => setFoodForm(f => ({ ...f, [field]: e.target.value }))} required={field !== 'category_name'} />
                      </div>
                    ))}
                    <div className="mb-3">
                      <label className="ttt-label">Description</label>
                      <textarea className="ttt-input" style={{ width: '100%', minHeight: 70, resize: 'none' }}
                        value={foodForm.description} onChange={e => setFoodForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Add Item</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === 'orders' && (
            <div>
              <h5 className="mb-3">Orders ({orders.length})</h5>
              {orders.length === 0 ? <div className="empty-state"><i className="bi bi-bag" /><p>No orders yet.</p></div> : (
                <table className="ttt-table">
                  <thead><tr><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>{o.customer_name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {o.items?.map(i => `${i.name} ×${i.quantity}`).join(', ').slice(0, 40)}
                        </td>
                        <td style={{ color: 'var(--brand-gold)', fontWeight: 700 }}>${o.total?.toFixed(2)}</td>
                        <td><span className={`badge-${o.status === 'delivered' ? 'emerald' : o.status === 'cancelled' ? 'rose' : 'gold'}`}>{o.status}</span></td>
                        <td>
                          <select className="ttt-select" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                            value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                            {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Reservations */}
          {tab === 'reservations' && (
            <div>
              <h5 className="mb-3">Reservations ({reservations.length})</h5>
              {reservations.length === 0 ? <div className="empty-state"><i className="bi bi-calendar2" /><p>No reservations yet.</p></div> : (
                <table className="ttt-table">
                  <thead><tr><th>Guest</th><th>Date & Time</th><th>Party</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {reservations.map(r => (
                      <tr key={r.id}>
                        <td>{r.customer_name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(r.date).toLocaleDateString()} {r.time}
                        </td>
                        <td>{r.party_size} guests</td>
                        <td><span className={`badge-${r.status === 'confirmed' ? 'emerald' : r.status === 'cancelled' ? 'rose' : 'gold'}`}>{r.status}</span></td>
                        <td>
                          <div className="d-flex gap-2">
                            {r.status === 'pending' && <>
                              <button onClick={() => updateReservationStatus(r.id, 'confirmed')} className="btn-gold" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Confirm</button>
                              <button onClick={() => updateReservationStatus(r.id, 'cancelled')} className="btn-danger-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Decline</button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div style={{ maxWidth: 600 }}>
              <h5 className="mb-4">{restaurant ? 'Restaurant Settings' : 'Create Your Restaurant'}</h5>
              {restMsg && <div className={`ttt-alert ${restMsg.startsWith('✓') ? 'ttt-alert-success' : 'ttt-alert-error'} mb-3`}>{restMsg}</div>}
              {restForm !== null && (
                <form onSubmit={saveRestaurant}>
                  <div className="row g-3">
                    {[
                      { field: 'name', label: 'Restaurant Name', full: true },
                      { field: 'cuisine', label: 'Cuisine Type' },
                      { field: 'city', label: 'City' },
                      { field: 'address', label: 'Address', full: true },
                      { field: 'phone', label: 'Phone' },
                      { field: 'opening_time', label: 'Opening Time', type: 'time' },
                      { field: 'closing_time', label: 'Closing Time', type: 'time' },
                    ].map(({ field, label, full, type }) => (
                      <div key={field} className={full ? 'col-12' : 'col-sm-6'}>
                        <label className="ttt-label">{label}</label>
                        <input type={type || 'text'} className="ttt-input" style={{ width: '100%' }}
                          value={restForm[field] || ''} onChange={e => setRestForm(f => ({ ...f, [field]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="col-12">
                      <label className="ttt-label">Description</label>
                      <textarea className="ttt-input" style={{ width: '100%', minHeight: 90 }}
                        value={restForm.description || ''} onChange={e => setRestForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                  </div>
                  <button type="submit" className="btn-gold mt-4" style={{ padding: '0.75rem 2rem' }}>
                    {restaurant ? 'Save Changes' : 'Create Restaurant'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
