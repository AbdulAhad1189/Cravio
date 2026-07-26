import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../api/axios';
import RestaurantCard from '../components/RestaurantCard';

/* ─── SVG Category Icons (matching FeastHub colors) ─── */
const CategoryIcons = {
  Pizza: { color: '#FFF0E6', iconColor: '#f04923', icon: '🍕' },
  Burgers: { color: '#FFE8E8', iconColor: '#f04923', icon: '🍔' },
  Biryani: { color: '#FFF0E6', iconColor: '#c98a2e', icon: '🍛' },
  Healthy: { color: '#E8F5E9', iconColor: '#5c7a5e', icon: '🥗' },
  Cafe: { color: '#FFF8E1', iconColor: '#8D6E63', icon: '☕' },
  Desserts: { color: '#FCE4EC', iconColor: '#f04923', icon: '🧁' },
  FineDine: { color: '#F3E5F5', iconColor: '#7B1FA2', icon: '🍽️' },
};

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    restaurantAPI.list({ limit: 8 })
      .then(res => setRestaurants(res.data.restaurants || res.data || []))
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/restaurants?search=${encodeURIComponent(search.trim())}`);
    else navigate('/restaurants');
  };

  const categories = [
    { key: 'Pizza', label: 'Pizza', cuisine: 'Italian' },
    { key: 'Burgers', label: 'Burgers', cuisine: 'American' },
    { key: 'Biryani', label: 'Biryani', cuisine: 'Indian' },
    { key: 'Healthy', label: 'Healthy', cuisine: 'Mediterranean' },
    { key: 'Cafe', label: 'Cafe', cuisine: 'Cafe' },
    { key: 'Desserts', label: 'Desserts', cuisine: 'Desserts' },
    { key: 'FineDine', label: 'Fine Dine', cuisine: 'Fine Dining' },
  ];

  const filters = ['All', 'Fast Delivery', 'New', 'Rating 4.5+'];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: '3rem' }}>

      {/* ══════════ HERO SECTION ══════════ */}
      <section style={{ padding: '3rem 0 2rem' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Left: Text + Search */}
            <div className="col-lg-6">
              {/* Hot deals badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#FFF0E6', color: '#000000',
                padding: '6px 16px', borderRadius: 999,
                fontSize: '0.8rem', fontWeight: 600, marginBottom: 20,
              }}>
                🔥 HOT DEALS NEAR YOU
              </div>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: '1.25rem',
                color: '#000000',
                letterSpacing: '-0.03em',
              }}>
                Order food<br />
                you'll{' '}
                <span style={{ color: '#f04923' }}>actually crave.</span>
              </h1>

              <p style={{
                color: '#59564d', fontSize: '1rem',
                lineHeight: 1.6, marginBottom: '1.5rem',
                maxWidth: 420,
              }}>
                From street-side biryani to wood-fired pizza — 5,000+ restaurants delivering to your door in under 30 minutes.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: '#ffffff', borderRadius: 999,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #ddd6c8',
                overflow: 'hidden', maxWidth: 520,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 0 0 16px', borderRight: '1px solid #ddd6c8' }}>
                  <i className="bi bi-geo-alt" style={{ color: '#f04923', fontSize: '1rem' }} />
                  <input
                    type="text"
                    placeholder="Enter your delivery address"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      padding: '14px 10px', fontSize: '0.85rem', width: 160,
                      color: '#000000',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 0 0 12px', flex: 1 }}>
                  <i className="bi bi-search" style={{ color: '#7a776d', fontSize: '0.9rem' }} />
                  <input
                    id="hero-search"
                    type="text"
                    placeholder="Search food or restaurant"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      padding: '14px 10px', fontSize: '0.85rem', flex: 1,
                      color: '#000000',
                    }}
                  />
                </div>
                <button type="submit" style={{
                  background: '#f04923', color: '#fff', border: 'none',
                  padding: '14px 24px', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', borderRadius: '0 999px 999px 0',
                  whiteSpace: 'nowrap',
                }}>
                  Find Food
                </button>
              </form>

              {/* Stats row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 24,
                marginTop: 28, flexWrap: 'wrap',
              }}>
                {[
                  { value: '5K+', label: 'Restaurants' },
                  { value: '1M+', label: 'Happy diners' },
                  { value: '4.8★', label: 'Avg rating' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000000' }}>{s.value}</span>
                    <span style={{ fontSize: '0.85rem', color: '#7a776d' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Food collage image */}
            <div className="col-lg-6 d-none d-lg-block">
              <div style={{ position: 'relative' }}>
                <img
                  src="/hero-food.png"
                  alt="Delicious food collage"
                  style={{
                    width: '100%', height: 420,
                    objectFit: 'cover', borderRadius: 24,
                  }}
                />
                {/* Rating badge */}
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  background: '#ffffff', borderRadius: 12,
                  padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#000000', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-star-fill" style={{ color: '#FFD700', fontSize: '0.9rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#7a776d' }}>Rated</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>4.9 · 2.3k reviews</div>
                  </div>
                </div>
                {/* Delivery badge */}
                <div style={{
                  position: 'absolute', bottom: 20, right: 40,
                  background: '#ffffff', borderRadius: 12,
                  padding: '10px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: '#FFF0E6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className="bi bi-clock" style={{ color: '#f04923', fontSize: '1rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#7a776d' }}>Delivered in</div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>22 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CATEGORIES: "What's on your mind?" ══════════ */}
      <section className="container" style={{ padding: '2rem 1rem 0' }}>
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: 4, letterSpacing: '-0.02em' }}>
              What's on your mind?
            </h3>
            <p style={{ color: '#7a776d', fontSize: '0.9rem', margin: 0 }}>Browse by cuisine and craving</p>
          </div>
          <Link to="/restaurants" style={{
            color: '#f04923', fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            See all <i className="bi bi-chevron-right" style={{ fontSize: '0.8rem' }} />
          </Link>
        </div>

        <div className="d-flex gap-3 pb-3" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map(c => {
            const cat = CategoryIcons[c.key];
            return (
              <div
                key={c.key}
                className="feast-category"
                onClick={() => navigate(`/restaurants?cuisine=${c.cuisine}`)}
              >
                <div
                  className="feast-category-icon"
                  style={{ background: cat.color }}
                >
                  <span style={{ fontSize: '1.6rem' }}>{cat.icon}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#000000' }}>
                  {c.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════ PROMO BANNER ══════════ */}
      <section className="container" style={{ padding: '2.5rem 1rem 0' }}>
        <div className="feast-promo-banner" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          <div>
            <span style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.2)',
              padding: '4px 14px', borderRadius: 999, fontSize: '0.75rem',
              fontWeight: 700, marginBottom: 16, letterSpacing: '0.05em',
            }}>
              LIMITED TIME
            </span>
            <h2 style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 900, margin: 0, lineHeight: 1.2,
            }}>
              Flat 60% OFF on your first 3 orders
            </h2>
            <div style={{ marginTop: 12, fontSize: '0.9rem', opacity: 0.9 }}>
              Use code{' '}
              <span style={{
                background: 'rgba(0,0,0,0.2)', padding: '2px 10px',
                borderRadius: 4, fontWeight: 700, letterSpacing: '0.05em',
              }}>
                CRAVIO60
              </span>
              {' '}at checkout
            </div>
          </div>
          <Link to="/restaurants" style={{
            background: '#ffffff', color: '#f04923',
            padding: '12px 28px', borderRadius: 999,
            fontWeight: 700, fontSize: '0.9rem',
            textDecoration: 'none', whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            Claim offer
          </Link>
        </div>
      </section>

      {/* ══════════ TOP RESTAURANTS ══════════ */}
      <section className="container" style={{ padding: '3rem 1rem 0' }}>
        <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-3">
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0, letterSpacing: '-0.02em' }}>
              Top restaurants near you
            </h3>
            <p style={{ color: '#7a776d', fontSize: '0.9rem', margin: 0 }}>
              Handpicked spots our customers love
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                className={`swiggy-filter-pill ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-ring" />
          </div>
        ) : restaurants.length > 0 ? (
          <div className="row g-4">
            {restaurants.map(r => (
              <div key={r.id} className="col-sm-6 col-lg-6">
                <RestaurantCard restaurant={r} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-shop" />
            <p>No restaurants found. Please check back later!</p>
          </div>
        )}
      </section>

      {/* ══════════ RESTAURANT PARTNERS SECTION ══════════ */}
      <section className="container" style={{ padding: '4rem 1rem 0' }}>
        <div style={{
          background: '#ffffff', borderRadius: 24,
          padding: 'clamp(2rem, 4vw, 3.5rem)', border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div style={{
                color: '#f04923', fontSize: '0.8rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
              }}>
                FOR RESTAURANT PARTNERS
              </div>
              <h2 style={{
                fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em',
              }}>
                Grow your restaurant with Cravio
              </h2>
              <p style={{ color: '#59564d', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.6 }}>
                List your restaurant, manage orders, and unlock analytics dashboards that show you exactly what's selling — and what's not.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <Link to="/register" className="btn-gold" style={{
                  textDecoration: 'none', padding: '12px 28px',
                }}>
                  Register your restaurant
                </Link>
                <Link to="/about" className="btn-ghost" style={{ textDecoration: 'none', padding: '12px 28px' }}>
                  Learn more
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { value: '₹4.2L', label: 'Avg monthly revenue' },
                  { value: '12k+', label: 'Partner restaurants' },
                  { value: '98%', label: 'On-time delivery' },
                  { value: '24/7', label: 'Partner support' },
                ].map(s => (
                  <div key={s.label} className="partner-stat">
                    <div className="partner-stat-value">{s.value}</div>
                    <div className="partner-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
