import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reservationAPI, restaurantAPI } from '../api/axios';

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'Pending',   icon: 'bi-hourglass-split', color: 'var(--brand-gold)',    bg: 'rgba(245,158,11,0.12)'  },
  upcoming:  { label: 'Upcoming',  icon: 'bi-calendar-check',  color: 'var(--brand-violet)',  bg: 'rgba(139,92,246,0.12)'  },
  completed: { label: 'Completed', icon: 'bi-check-circle',    color: 'var(--brand-emerald)', bg: 'rgba(16,185,129,0.12)'  },
  cancelled: { label: 'Cancelled', icon: 'bi-x-circle',        color: 'var(--brand-rose)',    bg: 'rgba(239,68,68,0.12)'   },
  no_show:   { label: 'No Show',   icon: 'bi-person-slash',    color: '#6b7280',              bg: 'rgba(107,114,128,0.12)' },
};

const OWNER_TRANSITIONS = {
  pending:   ['upcoming', 'cancelled'],
  upcoming:  ['completed', 'no_show', 'cancelled'],
  completed: [],
  cancelled: ['pending'],
  no_show:   [],
};

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 20, padding: size === 'sm' ? '0.2rem 0.65rem' : '0.35rem 0.9rem',
      fontSize: size === 'sm' ? '0.73rem' : '0.82rem', fontWeight: 700,
    }}>
      <i className={`bi ${cfg.icon}`} />
      {cfg.label}
    </span>
  );
}

export default function OwnerReservationDashboard() {
  const { restaurantId } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRest, setSelectedRest] = useState(restaurantId || '');
  const [activeTab, setActiveTab] = useState('all');
  const [reservations, setReservations] = useState([]);
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  // Load owner restaurants
  useEffect(() => {
    restaurantAPI.mine()
      .then(res => {
        const list = res.data.restaurants || (res.data.restaurant ? [res.data.restaurant] : []);
        setRestaurants(Array.isArray(list) ? list : []);
        if (!selectedRest && list.length > 0) {
          setSelectedRest(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchReservations = useCallback(() => {
    if (!selectedRest) { setLoading(false); return; }
    setLoading(true);
    const params = { restaurant_id: selectedRest };
    if (activeTab !== 'all') params.status = activeTab;
    reservationAPI.list(params)
      .then(res => {
        setReservations(res.data.reservations || []);
        setCounts(res.data.counts || {});
      })
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, [selectedRest, activeTab]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const changeStatus = async (id, newStatus) => {
    setUpdating(id);
    try {
      await reservationAPI.updateStatus(id, newStatus);
      // Optimistic update
      setReservations(rs => rs.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selected?.id === id) setSelected(s => ({ ...s, status: newStatus }));
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(null);
      fetchReservations(); // refresh counts
    }
  };

  // Filter by search
  const filtered = reservations.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.date?.includes(q) ||
      r.notes?.toLowerCase().includes(q)
    );
  });

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Header */}
      <div className="page-hero" style={{ padding: '2rem 0 1.5rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div>
              <h1 className="section-title mb-0" style={{ fontSize: '1.6rem' }}>
                <i className="bi bi-calendar2-week me-2" />Reservation Dashboard
              </h1>
              <p className="section-subtitle mt-1 mb-0">Manage all customer bookings in one place</p>
            </div>
            {restaurants.length > 1 && (
              <select
                className="ttt-select ms-auto"
                value={selectedRest}
                onChange={e => { setSelectedRest(e.target.value); setSelected(null); }}
                style={{ minWidth: 200 }}
              >
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
        {/* Stat Cards */}
        <div className="row g-3 mb-4">
          {[
            { key: 'all',       label: 'Total',     icon: 'bi-grid',           color: 'var(--text-primary)',  count: totalCount },
            ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon, color: v.color, count: counts[k] || 0 })),
          ].map(s => (
            <div key={s.key} className="col-6 col-sm-4 col-lg-2">
              <button
                onClick={() => { setActiveTab(s.key); setSelected(null); }}
                style={{
                  width: '100%', background: 'var(--bg-card)',
                  border: activeTab === s.key ? `1.5px solid ${s.color}` : '1px solid var(--border-card)',
                  borderRadius: 12, padding: '1rem 0.75rem', cursor: 'pointer',
                  textAlign: 'center', transition: 'all 0.2s',
                  boxShadow: activeTab === s.key ? `0 0 0 3px ${s.color}18` : 'none',
                }}
              >
                <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: '1.3rem', display: 'block', marginBottom: 6 }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </button>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* Reservation List */}
          <div className={selected ? 'col-lg-6' : 'col-12'}>
            {/* Search */}
            <div className="mb-3" style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text" className="ttt-input" placeholder="Search guest name, date, notes…"
                style={{ width: '100%', paddingLeft: 36 }}
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="d-flex justify-content-center py-5"><div className="spinner-ring" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <i className={`bi ${activeTab !== 'all' ? STATUS_CONFIG[activeTab]?.icon : 'bi-calendar2'}`} />
                <p>No {activeTab !== 'all' ? STATUS_CONFIG[activeTab]?.label.toLowerCase() : ''} reservations found.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {filtered.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelected(s => s?.id === r.id ? null : r)}
                    className="ttt-card"
                    style={{
                      padding: '1rem 1.25rem', cursor: 'pointer',
                      border: selected?.id === r.id ? '1.5px solid var(--brand-gold)' : '1px solid var(--border-card)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--gradient-gold)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem', color: '#000', flexShrink: 0,
                      }}>
                        {r.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>
                          {r.user?.name || '—'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          <i className="bi bi-calendar me-1" />{r.date} at {r.time}
                          <span className="mx-2">·</span>
                          <i className="bi bi-people me-1" />{r.party_size} guests
                        </div>
                      </div>

                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="col-lg-6">
              <div className="ttt-card" style={{ padding: '1.5rem', position: 'sticky', top: 88 }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 style={{ margin: 0 }}>Booking Details</h5>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>
                    <i className="bi bi-x" />
                  </button>
                </div>

                {/* Guest Info */}
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--gradient-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.4rem', color: '#000',
                  }}>
                    {selected.user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selected.user?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{selected.user?.email}</div>
                    {selected.user?.phone && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <i className="bi bi-telephone me-1" />{selected.user?.phone}
                      </div>
                    )}
                  </div>
                  <div className="ms-auto">
                    <StatusBadge status={selected.status} size="md" />
                  </div>
                </div>

                {/* Details grid */}
                <div className="row g-3 mb-4">
                  {[
                    { icon: 'bi-calendar', label: 'Date', value: selected.date },
                    { icon: 'bi-clock', label: 'Time', value: selected.time },
                    { icon: 'bi-people', label: 'Party Size', value: `${selected.party_size} guests` },
                    { icon: 'bi-clock-history', label: 'Booked', value: selected.created_at ? new Date(selected.created_at).toLocaleString() : '—' },
                  ].map(d => (
                    <div key={d.label} className="col-6">
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.75rem' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                          <i className={`bi ${d.icon} me-1`} />{d.label}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {selected.notes && (
                  <div className="mb-3" style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.875rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Notes
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{selected.notes}</div>
                  </div>
                )}
                {selected.special_requests && (
                  <div className="mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.875rem' }}>
                    <div style={{ color: 'var(--brand-gold)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      <i className="bi bi-exclamation-circle me-1" />Special Requests
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{selected.special_requests}</div>
                  </div>
                )}

                {/* Action buttons */}
                {OWNER_TRANSITIONS[selected.status]?.length > 0 && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                      Update Status
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {OWNER_TRANSITIONS[selected.status].map(ns => {
                        const cfg = STATUS_CONFIG[ns];
                        return (
                          <button
                            key={ns}
                            disabled={updating === selected.id}
                            onClick={() => changeStatus(selected.id, ns)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem',
                              background: cfg.bg, color: cfg.color,
                              border: `1.5px solid ${cfg.color}55`, cursor: 'pointer',
                              opacity: updating === selected.id ? 0.6 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            <i className={`bi ${cfg.icon}`} />
                            {updating === selected.id ? 'Updating…' : `Mark as ${cfg.label}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {OWNER_TRANSITIONS[selected.status]?.length === 0 && (
                  <div className="ttt-alert ttt-alert-success" style={{ marginTop: '0.5rem' }}>
                    This reservation is <strong>{STATUS_CONFIG[selected.status]?.label}</strong> — no further action needed.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
