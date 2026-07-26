import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../api/axios';

export default function ManageRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // default to pending tab
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Confirmation modal state
  const [confirm, setConfirm] = useState(null); // { id, name, action: 'approved'|'rejected', reason: '' }

  const fetchRestaurants = () => {
    setLoading(true);
    api.get('/restaurants/')
      .then(res => setRestaurants(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const doUpdateStatus = async () => {
    if (!confirm) return;
    try {
      const payload = { status: confirm.action };
      if (confirm.reason) payload.rejection_reason = confirm.reason;
      const res = await api.patch(`/restaurants/${confirm.id}/approval/`, payload);
      const updated = res.data.restaurant;
      setRestaurants(prev => prev.map(r => r.id === confirm.id ? { ...r, status: updated.status } : r));
      showMsg(
        confirm.action === 'approved'
          ? `✅ "${confirm.name}" has been approved and is now live!`
          : `❌ "${confirm.name}" has been rejected.`,
        confirm.action === 'approved' ? 'success' : 'error'
      );
    } catch (err) {
      showMsg(err?.response?.data?.detail || 'Failed to update restaurant status.', 'error');
    } finally {
      setConfirm(null);
    }
  };

  const filtered = filter ? restaurants.filter(r => r.status === filter) : restaurants;

  const statusBadge = (status) => {
    const map = {
      approved: { bg: '#d4edda', color: '#155724', label: '✅ Approved' },
      pending:  { bg: '#fff3cd', color: '#856404', label: '⏳ Pending' },
      rejected: { bg: '#f8d7da', color: '#721c24', label: '❌ Rejected' },
    };
    const s = map[status] || { bg: '#eee', color: '#333', label: status };
    return (
      <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 20, background: s.bg, color: s.color, fontWeight: 500 }}>
        {s.label}
      </span>
    );
  };

  const tabCounts = { all: restaurants.length, pending: 0, approved: 0, rejected: 0 };
  restaurants.forEach(r => { if (tabCounts[r.status] !== undefined) tabCounts[r.status]++; });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, padding: '36px 40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
            Manage Restaurants
          </h1>
          {tabCounts.pending > 0 && (
            <span style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', borderRadius: 20, padding: '3px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
              ⏳ {tabCounts.pending} pending
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
          Review, approve or reject restaurant registrations.
        </p>

        {/* Status message */}
        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? '#d4edda' : '#fef2f2',
            border: `1px solid ${msg.type === 'success' ? '#c3e6cb' : '#fca5a5'}`,
            borderRadius: 8, padding: '10px 16px', marginBottom: 20,
            color: msg.type === 'success' ? '#155724' : '#c0392b', fontSize: '0.9rem',
          }}>
            {msg.text}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            ['pending',  `⏳ Pending (${tabCounts.pending})`],
            ['approved', `✅ Approved (${tabCounts.approved})`],
            ['rejected', `❌ Rejected (${tabCounts.rejected})`],
            ['',         `All (${tabCounts.all})`],
          ].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: '0.85rem', cursor: 'pointer',
              border: `1.5px solid ${filter === val ? 'var(--olive)' : 'var(--border)'}`,
              background: filter === val ? 'var(--olive)' : 'white',
              color: filter === val ? 'white' : 'var(--dark)',
              fontWeight: filter === val ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'white', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🏪</div>
            <p>No {filter || ''} restaurants found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(r => (
              <div key={r.id} className="card-cravio" style={{ padding: '20px 24px', background: 'white' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Image */}
                  <div style={{ width: 72, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--cream-dark)', flexShrink: 0 }}>
                    {r.image
                      ? <img src={r.image.startsWith('http') ? r.image : `http://localhost:8000${r.image}`} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🍴</div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{r.name}</h3>
                      {statusBadge(r.status)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span>🍽️ {r.cuisine}</span>
                      <span>📍 {r.city}{r.state ? `, ${r.state}` : ''}{r.pincode ? ` - ${r.pincode}` : ''}</span>
                      <span>👤 {r.owner_name}</span>
                      <span>📞 {r.phone || '—'}</span>
                      <span>🕐 {r.opening_time?.slice(0,5)} – {r.closing_time?.slice(0,5)}</span>
                    </div>
                    {r.address && (
                      <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 4, marginBottom: 0 }}>📌 {r.address}</p>
                    )}
                    {r.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0, fontStyle: 'italic' }}>"{r.description}"</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => setConfirm({ id: r.id, name: r.name, action: 'approved', reason: '' })}
                        style={{ padding: '7px 18px', background: '#d4edda', border: '1px solid #a8d5b5', borderRadius: 8, color: '#155724', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        ✓ Approve
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => setConfirm({ id: r.id, name: r.name, action: 'rejected', reason: '' })}
                        style={{ padding: '7px 18px', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 8, color: '#721c24', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        ✗ Reject
                      </button>
                    )}
                    {r.status === 'approved' && (
                      <span style={{ fontSize: '0.75rem', color: '#155724' }}>
                        Live since {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Confirmation Modal ── */}
      {confirm && (
        <>
          <div
            onClick={() => setConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white', borderRadius: 16, padding: '32px',
            width: '100%', maxWidth: 460,
            zIndex: 1001, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: 12 }}>
              {confirm.action === 'approved' ? '✅' : '❌'}
            </div>
            <h3 style={{ textAlign: 'center', fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
              {confirm.action === 'approved' ? 'Approve Restaurant?' : 'Reject Restaurant?'}
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              {confirm.action === 'approved'
                ? <>Are you sure you want to approve <strong>"{confirm.name}"</strong>? It will go live immediately on the platform.</>
                : <>Are you sure you want to reject <strong>"{confirm.name}"</strong>? The owner will be notified.</>
              }
            </p>

            {/* Reason field for rejection */}
            {confirm.action === 'rejected' && (
              <div className="form-cravio" style={{ marginBottom: 20 }}>
                <label>Reason for rejection (optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Incomplete information, duplicate listing..."
                  value={confirm.reason}
                  onChange={e => setConfirm(c => ({ ...c, reason: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={doUpdateStatus}
                style={{
                  flex: 1, padding: '11px',
                  background: confirm.action === 'approved' ? '#2d6a4f' : '#c0392b',
                  color: 'white', border: 'none', borderRadius: 9,
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                }}
              >
                {confirm.action === 'approved' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{ flex: 1, padding: '11px', background: 'var(--cream)', border: '1.5px solid var(--border)', borderRadius: 9, fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', color: 'var(--dark)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
