import { useState, useEffect } from 'react';
import { reservationAPI, restaurantAPI } from '../api/axios';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ restaurant: '', date: '', time: '', party_size: 2, notes: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([reservationAPI.list(), restaurantAPI.list()])
      .then(([rRes, restRes]) => {
        setReservations(rRes.data.reservations || rRes.data || []);
        setRestaurants(restRes.data.restaurants || restRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await reservationAPI.create(form);
      setMsg('✓ Reservation requested! The restaurant will confirm shortly.');
      const res = await reservationAPI.list();
      setReservations(res.data.reservations || res.data || []);
      setForm({ restaurant: '', date: '', time: '', party_size: 2, notes: '' });
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to create reservation.');
    }
  };

  const STATUS_COLORS = { pending: 'gold', confirmed: 'emerald', cancelled: 'rose' };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}><div className="spinner-ring" /></div>;

  return (
    <>
      <div className="page-hero" style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title mb-0">
            <i className="bi bi-calendar2 me-3" style={{ fontSize: '1.8rem' }} />Reservations
          </h1>
          <p className="section-subtitle mt-1">Book a table at your favourite restaurant</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1rem 4rem' }}>
        <div className="row g-5">
          {/* Booking Form */}
          <div className="col-lg-5">
            <div className="ttt-card" style={{ padding: '1.75rem', position: 'sticky', top: 88 }}>
              <h5 style={{ marginBottom: '1.25rem' }}>Book a Table</h5>
              {msg && (
                <div className={`ttt-alert ${msg.startsWith('✓') ? 'ttt-alert-success' : 'ttt-alert-error'} mb-3`}>
                  {msg}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="ttt-label">Restaurant</label>
                  <select className="ttt-select" style={{ width: '100%' }}
                    value={form.restaurant} onChange={e => setForm(f => ({ ...f, restaurant: e.target.value }))} required>
                    <option value="">Select a restaurant…</option>
                    {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="ttt-label">Date</label>
                    <input type="date" className="ttt-input" style={{ width: '100%' }}
                      value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]} required />
                  </div>
                  <div className="col-6">
                    <label className="ttt-label">Time</label>
                    <input type="time" className="ttt-input" style={{ width: '100%' }}
                      value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="ttt-label">Party Size</label>
                  <input type="number" min="1" max="20" className="ttt-input" style={{ width: '100%' }}
                    value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: parseInt(e.target.value) }))} required />
                </div>
                <div className="mb-4">
                  <label className="ttt-label">Special Requests (optional)</label>
                  <textarea className="ttt-input" style={{ width: '100%', minHeight: 80, resize: 'none' }}
                    placeholder="Allergies, seating preferences…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" className="btn-gold" style={{ width: '100%', padding: '0.8rem' }}>
                  <i className="bi bi-calendar-check me-2" />Request Reservation
                </button>
              </form>
            </div>
          </div>

          {/* My Reservations */}
          <div className="col-lg-7">
            <h5 style={{ marginBottom: '1rem' }}>My Reservations ({reservations.length})</h5>
            {reservations.length === 0 ? (
              <div className="empty-state">
                <i className="bi bi-calendar2" />
                <p>No reservations yet. Book your first table!</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reservations.map(r => (
                  <div key={r.id} className="ttt-card" style={{ padding: '1.25rem' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
                          {r.restaurant_name || 'Restaurant'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <i className="bi bi-calendar me-1" />
                          {new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          {' at '}{r.time}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>
                          <i className="bi bi-people me-1" />{r.party_size} guests
                        </div>
                        {r.notes && (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4, fontStyle: 'italic' }}>
                            "{r.notes}"
                          </div>
                        )}
                      </div>
                      <span className={`badge-${STATUS_COLORS[r.status] || 'gold'}`}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
