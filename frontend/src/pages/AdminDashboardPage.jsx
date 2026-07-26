import { useState, useEffect } from 'react';
import { adminAPI } from '../api/axios';

const TABS = ['overview', 'restaurants', 'users'];

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.stats(), adminAPI.restaurants(), adminAPI.users()])
      .then(([sRes, rRes, uRes]) => {
        setStats(sRes.data);
        setRestaurants(rRes.data.restaurants || rRes.data || []);
        setUsers(uRes.data.users || uRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approveRestaurant = async (id, approve) => {
    try {
      await adminAPI.approveRestaurant(id, approve);
      setRestaurants(rs => rs.map(r => r.id === id ? { ...r, is_approved: approve } : r));
    } catch { alert('Action failed.'); }
  };

  const toggleUser = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch { alert('Action failed.'); }
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}><div className="spinner-ring" /></div>;

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: 'bi-people', color: 'var(--brand-violet)' },
    { label: 'Restaurants', value: stats?.total_restaurants || 0, icon: 'bi-shop', color: 'var(--brand-gold)' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: 'bi-bag', color: 'var(--brand-emerald)' },
    { label: 'Revenue', value: `$${(stats?.total_revenue || 0).toFixed(0)}`, icon: 'bi-currency-dollar', color: 'var(--brand-gold)' },
  ];

  return (
    <>
      <div className="page-hero" style={{ padding: '2rem 0 1.5rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title mb-0">
            <i className="bi bi-shield-check me-3" style={{ fontSize: '1.8rem' }} />Admin Dashboard
          </h1>
          <p className="section-subtitle mt-1">Platform management & oversight</p>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="sidebar">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`sidebar-link w-100 border-0 ${tab === t ? 'active' : ''}`}
              style={{ textAlign: 'left', textTransform: 'capitalize', background: 'none', cursor: 'pointer' }}>
              <i className={`bi bi-${t === 'overview' ? 'grid' : t === 'restaurants' ? 'shop' : 'people'}`} />
              {t}
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {/* Overview */}
          {tab === 'overview' && (
            <div>
              <div className="row g-3 mb-4">
                {statCards.map(s => (
                  <div key={s.label} className="col-sm-6 col-xl-3">
                    <div className="stat-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="stat-label">{s.label}</div>
                          <div className="stat-value">{s.value}</div>
                        </div>
                        <i className={`bi ${s.icon}`} style={{ fontSize: '2rem', color: s.color, opacity: 0.6 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="ttt-card" style={{ padding: '1.5rem' }}>
                    <h6 className="mb-3" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                      Pending Restaurant Approvals
                    </h6>
                    {restaurants.filter(r => !r.is_approved).length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending approvals 🎉</p>
                    ) : (
                      restaurants.filter(r => !r.is_approved).slice(0, 5).map(r => (
                        <div key={r.id} className="d-flex justify-content-between align-items-center mb-2">
                          <span style={{ fontSize: '0.875rem' }}>{r.name}</span>
                          <button onClick={() => approveRestaurant(r.id, true)} className="btn-gold" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                            Approve
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="ttt-card" style={{ padding: '1.5rem' }}>
                    <h6 className="mb-3" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                      Quick Stats
                    </h6>
                    {[
                      { label: 'Approved Restaurants', value: restaurants.filter(r => r.is_approved).length },
                      { label: 'Pending Approval', value: restaurants.filter(r => !r.is_approved).length },
                      { label: 'Active Users', value: users.filter(u => u.is_active).length },
                      { label: 'Suspended Users', value: users.filter(u => !u.is_active).length },
                    ].map(s => (
                      <div key={s.label} className="d-flex justify-content-between mb-2" style={{ fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                        <span style={{ fontWeight: 700 }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Restaurants */}
          {tab === 'restaurants' && (
            <div>
              <h5 className="mb-3">All Restaurants ({restaurants.length})</h5>
              <table className="ttt-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Cuisine</th><th>City</th><th>Owner</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.cuisine}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.city}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.owner_name || '—'}</td>
                      <td>
                        <span className={`badge-${r.is_approved ? 'emerald' : 'gold'}`}>
                          {r.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => approveRestaurant(r.id, !r.is_approved)}
                          className={r.is_approved ? 'btn-danger-outline' : 'btn-gold'}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          {r.is_approved ? 'Revoke' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <h5 className="mb-3">All Users ({users.length})</h5>
              <table className="ttt-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                      <td>
                        <span className={`badge-${u.role === 'admin' ? 'rose' : u.role === 'owner' ? 'violet' : 'emerald'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <span className={`badge-${u.is_active ? 'emerald' : 'rose'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => toggleUser(u.id)}
                          className={u.is_active ? 'btn-danger-outline' : 'btn-ghost'}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
