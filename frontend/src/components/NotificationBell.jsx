import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TYPE_ICONS = {
  reservation_reminder: 'bi-alarm',
  reservation_status:   'bi-calendar-check',
  reservation_new:      'bi-calendar-plus',
  general:              'bi-bell',
};

const TYPE_COLORS = {
  reservation_reminder: 'var(--brand-gold)',
  reservation_status:   'var(--brand-violet)',
  reservation_new:      'var(--brand-emerald)',
  general:              'var(--text-muted)',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const fetch = () => {
    if (!user) return;
    notificationAPI.list()
      .then(res => {
        setNotifications(res.data.notifications || []);
        setUnread(res.data.unread_count || 0);
      })
      .catch(() => {});
  };

  // Poll every 60 seconds
  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {}
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetch(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: '0.25rem 0.5rem',
          color: open ? 'var(--brand-gold)' : 'var(--text-secondary)',
          fontSize: '1.25rem', transition: 'color 0.2s',
        }}
        aria-label="Notifications"
      >
        <i className={`bi ${unread > 0 ? 'bi-bell-fill' : 'bi-bell'}`} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'var(--brand-rose)', color: '#fff',
            borderRadius: '50%', width: 17, height: 17,
            fontSize: '0.62rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-primary)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 340, maxHeight: 440, overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border-card)',
          borderRadius: 14, border: '1px solid rgba(0,0,0,0.1)',
          zIndex: 9999,
        }}>
          {/* Header */}
          <div style={{
            padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: '1px solid var(--border-card)',
            position: 'sticky', top: 0, background: 'var(--bg-card)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Notifications {unread > 0 && <span style={{ color: 'var(--brand-gold)' }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--brand-gold)', fontSize: '0.75rem', fontWeight: 600,
              }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <i className="bi bi-bell-slash" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
              No notifications yet
            </div>
          ) : (
            notifications.map(n => {
              const color = TYPE_COLORS[n.type] || 'var(--text-muted)';
              const icon  = TYPE_ICONS[n.type] || 'bi-bell';
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    padding: '0.875rem 1rem',
                    borderBottom: '1px solid var(--border-card)',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    background: n.is_read ? 'transparent' : 'rgba(201,138,46,0.06)',
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: `${color}18`, border: `1px solid ${color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`bi ${icon}`} style={{ color, fontSize: '0.9rem' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.82rem', marginBottom: 2 }}>
                      {n.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--brand-gold)', flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
