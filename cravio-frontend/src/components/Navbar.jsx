import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLocationStore, detectCurrentLocation, lookupPincode, setLocation as saveLocation } from '../lib/locationStore';

/* ── Icons ── */
const PlateIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/>
  </svg>
);
const MapPin = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const HeartIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--dark-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const CartIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--dark-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const OrdersIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--dark-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const LocateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
  </svg>
);

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

const getNavLinks = (user) => {
  if (user?.role === 'admin') {
    return [
      { to: '/', label: 'Home' },
      { to: '/admin/dashboard', label: 'Admin Panel' },
      { to: '/admin/restaurants', label: 'Restaurants' },
      { to: '/admin/users', label: 'Users' },
      { to: '/about', label: 'About' },
    ];
  }
  if (user?.role === 'owner') {
    return [
      { to: '/', label: 'Home' },
      { to: '/owner/dashboard', label: 'Dashboard' },
      { to: '/owner/menu', label: 'Menu' },
      { to: '/owner/orders', label: 'Orders' },
      { to: '/owner/reservations', label: 'Reservations' },
      { to: '/about', label: 'About' },
    ];
  }
  return [
    { to: '/', label: 'Home' },
    { to: '/restaurants', label: 'Restaurants' },
    { to: '/orders', label: 'Orders' },
    { to: '/reservations', label: 'Bookings' },
    { to: '/contact', label: 'Contact' },
    { to: '/about', label: 'About' },
  ];
};

const SIDEBAR_EXTRA = [
  { to: '/contact', label: '📞  Contact' },
  { to: '/about', label: 'ℹ️  About' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [locDropOpen, setLocDropOpen]     = useState(false);
  const [locLoading, setLocLoading]       = useState(false);
  const [locError, setLocError]           = useState('');
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  // Pincode input inside location dropdown
  const [locPincode, setLocPincode]       = useState('');
  const [locPincodeLoading, setLocPincodeLoading] = useState(false);

  // Central location store
  const { location: savedLoc, setLocation: saveLocStore, clearLocation: clearLocStore, hasLocation } = useLocationStore();
  // Display label for the pill
  const locationLabel = savedLoc?.display || 'Set Location';

  const userMenuRef = useRef(null);
  const locRef      = useRef(null);

  // Fetch active order count for badge
  useEffect(() => {
    if (user?.role !== 'customer') return;
    api.get('/orders/my/')
      .then(res => {
        const orders = Array.isArray(res.data) ? res.data : (res.data.results || []);
        const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
        setActiveOrderCount(active.length);
      })
      .catch(() => {});
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (locRef.current && !locRef.current.contains(e.target)) setLocDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close sidebar / menus on route change
  useEffect(() => { setSidebarOpen(false); setUserMenuOpen(false); setLocDropOpen(false); }, [location]);

  // Lock body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const navLinks = getNavLinks(user);
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const handleLogout = () => { logout(); setUserMenuOpen(false); navigate('/'); };

  // Seed location from profile if not already set
  useEffect(() => {
    if (user?.city && !savedLoc?.city) {
      saveLocStore({ city: user.city, state: user.state || '' });
    }
  }, [user]);

  const handleUseLocation = () => {
    setLocError('');
    detectCurrentLocation(
      (loc) => { setLocDropOpen(false); navigate(`/restaurants?city=${encodeURIComponent(loc.city || loc.state)}`); },
      (err) => setLocError(err),
      setLocLoading
    );
  };

  const handlePincodeLookup = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocPincode(pin);
    if (pin.length === 6) {
      setLocPincodeLoading(true);
      const result = await lookupPincode(pin);
      setLocPincodeLoading(false);
      if (result) {
        saveLocStore({ city: result.city, state: result.state, pincode: pin });
        setLocDropOpen(false);
        navigate(`/restaurants?city=${encodeURIComponent(result.city)}`);
      }
    }
  };

  const handleStateSelect = (state) => {
    saveLocStore({ state, city: '' });
    setLocDropOpen(false);
    navigate(`/restaurants?city=${encodeURIComponent(state)}`);
  };

  const getDashboardTo = () => {
    if (!user) return null;
    if (user.role === 'owner') return '/owner/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/orders';
  };

  return (
    <>
      {/* ════════════ NAVBAR ════════════ */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 900, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 12px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>

          {/* Hamburger — LEFT side, opens sidebar */}
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="Open menu">
            <MenuIcon />
          </button>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlateIcon /></div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--dark)' }}>Cravio</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.4px', marginTop: 1 }}>Good Food. Great Times.</div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="desktop-nav" style={{ display: 'flex', gap: 26, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            {navLinks.map(link => {
              const active = isActive(link.to);
              return (
                <Link key={link.to} to={link.to} style={{ textDecoration: 'none', fontSize: '0.9rem', fontWeight: active ? 600 : 400, color: active ? 'var(--dark)' : 'var(--dark-soft)', paddingBottom: 2, borderBottom: active ? '2px solid var(--dark)' : '2px solid transparent', transition: 'color 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--olive)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--dark-soft)'; }}
                >{link.label}</Link>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

            {/* Location pill */}
            <div ref={locRef} className="desktop-nav" style={{ position: 'relative' }}>
              <button onClick={() => setLocDropOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: hasLocation ? 'var(--olive-pale)' : 'var(--cream-dark)', border: `1px solid ${hasLocation ? 'var(--olive)' : 'var(--border)'}`, borderRadius: 20, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 500, color: hasLocation ? 'var(--olive)' : 'var(--dark-soft)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                <span style={{ color: 'var(--olive)' }}><MapPin /></span>
                <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{locationLabel}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>▼</span>
              </button>

              {locDropOpen && (
                <div style={{ position: 'absolute', right: 0, top: 38, width: 300, background: 'white', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', zIndex: 300, overflow: 'hidden' }}>

                  {/* Current saved location */}
                  {hasLocation && (
                    <div style={{ padding: '10px 14px', background: 'var(--olive-pale)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--olive)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={12} /> {savedLoc.display}
                      </span>
                      <button onClick={() => { clearLocStore(); setLocDropOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 6px' }}>
                        Clear
                      </button>
                    </div>
                  )}

                  {/* GPS button */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <button onClick={handleUseLocation} disabled={locLoading} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: locLoading ? 'var(--cream-dark)' : 'var(--olive-pale)', border: '1px solid var(--olive)', borderRadius: 8, padding: '8px 12px', cursor: locLoading ? 'wait' : 'pointer', color: 'var(--olive)', fontWeight: 600, fontSize: '0.83rem' }}>
                      <LocateIcon />{locLoading ? 'Detecting…' : 'Use my current location'}
                    </button>
                    {locError && <p style={{ color: '#c0392b', fontSize: '0.75rem', margin: '6px 0 0' }}>{locError}</p>}
                  </div>

                  {/* Pincode lookup */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                    <input
                      placeholder="Enter pincode (e.g. 560001)"
                      value={locPincode}
                      onChange={handlePincodeLookup}
                      maxLength={6}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {locPincodeLoading && <span style={{ position: 'absolute', right: 22, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--olive)' }}>fetching…</span>}
                  </div>

                  {/* State list */}
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {INDIAN_STATES.map(s => {
                      const active = savedLoc?.state === s || savedLoc?.city === s;
                      return (
                        <button key={s} onClick={() => handleStateSelect(s)}
                          style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: active ? 'var(--olive-pale)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: active ? 'var(--olive)' : 'var(--dark)', fontWeight: active ? 600 : 400 }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--cream)'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <MapPin size={11} /> {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Heart / Wishlist */}
            <button
              onClick={() => {
                if (!user) navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                else navigate('/profile');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
              title={user ? 'My Wishlist' : 'Login to wishlist'}
            ><HeartIcon /></button>

            {user ? (
              <>
                {user.role === 'customer' && (
                  <>
                    {/* Orders icon with active badge */}
                    <Link to="/orders" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none', padding: 4 }} title="My Orders">
                      <OrdersIcon />
                      {activeOrderCount > 0 && (
                        <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--terracotta)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                          {activeOrderCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/cart" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', padding: 4 }} title="Cart"><CartIcon /></Link>
                  </>
                )}
                {/* Avatar dropdown */}
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button onClick={() => setUserMenuOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--olive)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </button>
                  {userMenuOpen && (
                    <div style={{ position: 'absolute', right: 0, top: 42, background: 'white', border: '1px solid var(--border)', borderRadius: 12, minWidth: 188, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 300, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark)' }}>{user.first_name} {user.last_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>
                        <span style={{ marginTop: 5, display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, background: user.role === 'admin' ? 'var(--terracotta-pale)' : user.role === 'owner' ? 'var(--olive-pale)' : 'var(--cream-dark)', color: user.role === 'admin' ? 'var(--terracotta)' : user.role === 'owner' ? 'var(--olive)' : 'var(--dark)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{user.role}</span>
                      </div>
                      {getDashboardTo() && <Link to={getDashboardTo()} onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', textDecoration: 'none', color: 'var(--dark)', fontSize: '0.88rem' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>{user.role === 'admin' ? '⚙️' : user.role === 'owner' ? '🏪' : '📦'} {user.role === 'admin' ? 'Admin Panel' : user.role === 'owner' ? 'My Dashboard' : 'My Orders'}</Link>}
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', textDecoration: 'none', color: 'var(--dark)', fontSize: '0.88rem' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>👤 Profile</Link>
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '0.88rem' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>🚪 Logout</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Login button — same olive style */
              <Link to="/login" style={{ textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, background: 'var(--olive)', color: 'white', padding: '7px 18px', borderRadius: 8, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--olive-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--olive)'}
              >Login</Link>
            )}

          </div>
        </div>
      </nav>

      {/* ════════════ LEFT SIDEBAR OVERLAY ════════════ */}
      {/* Dark backdrop — scrollable page stays behind */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Sidebar panel — slides in from left */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 300,
        background: 'white',
        zIndex: 1200,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: sidebarOpen ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlateIcon /></div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)' }}>Cravio</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
            <CloseIcon />
          </button>
        </div>

        {/* User info if logged in */}
        {user && (
          <div style={{ padding: '16px 20px', background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--olive)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
              {user.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dark)' }}>{user.first_name} {user.last_name}</div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, background: user.role === 'admin' ? 'var(--terracotta-pale)' : user.role === 'owner' ? 'var(--olive-pale)' : 'var(--cream-dark)', color: user.role === 'admin' ? 'var(--terracotta)' : user.role === 'owner' ? 'var(--olive)' : 'var(--dark)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{user.role}</span>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {navLinks.map(link => {
            const active = isActive(link.to);
            return (
              <Link key={link.to} to={link.to} style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', fontSize: '0.92rem', fontWeight: active ? 600 : 400, color: active ? 'var(--olive)' : 'var(--dark-soft)', background: active ? 'var(--olive-pale)' : 'transparent', borderLeft: active ? '3px solid var(--olive)' : '3px solid transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--olive)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dark-soft)'; }}}
              >{link.label}</Link>
            );
          })}

          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          {/* Extra links — Contact, etc. */}
          <Link to="/contact" style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', fontSize: '0.92rem', color: 'var(--dark-soft)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--olive)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dark-soft)'; }}
          >📞 Contact</Link>

          {/* Dashboard link if logged in */}
          {user && getDashboardTo() && (
            <Link to={getDashboardTo()} style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', fontSize: '0.92rem', color: 'var(--dark-soft)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--olive)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dark-soft)'; }}
            >{user.role === 'admin' ? '⚙️ Admin Panel' : user.role === 'owner' ? '🏪 My Dashboard' : '📦 My Orders'}</Link>
          )}
          {user && <Link to="/profile" style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', fontSize: '0.92rem', color: 'var(--dark-soft)', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--olive)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dark-soft)'; }}>👤 Profile</Link>}
          {user && user.role === 'customer' && <Link to="/orders" style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', fontSize: '0.92rem', color: 'var(--dark-soft)', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--olive)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dark-soft)'; }}>📋 My Orders</Link>}
          {user && user.role === 'customer' && <Link to="/cart" style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', fontSize: '0.92rem', color: 'var(--dark-soft)', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--olive)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--dark-soft)'; }}>🛒 Cart</Link>}
        </nav>

        {/* Bottom auth buttons */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          {user ? (
            <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c0392b', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
              🚪 Logout
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--olive)', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>Login</Link>
              <Link to="/register" style={{ flex: 1, textAlign: 'center', padding: '10px', border: '1.5px solid var(--olive)', color: 'var(--olive)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
