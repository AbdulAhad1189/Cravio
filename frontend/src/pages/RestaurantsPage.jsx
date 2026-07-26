import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { restaurantAPI } from '../api/axios';
import RestaurantCard from '../components/RestaurantCard';

const CUISINES = ['All', 'Italian', 'Japanese', 'Indian', 'American', 'Chinese', 'Mexican', 'Thai', 'Mediterranean'];

export default function RestaurantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || 'All');
  const [sort, setSort] = useState('rating');

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (cuisine && cuisine !== 'All') params.cuisine = cuisine;
      params.sort = sort;
      const res = await restaurantAPI.list(params);
      setRestaurants(res.data.restaurants || res.data || []);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [cuisine, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
    setSearchParams(search ? { search } : {});
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'var(--bg-base)', padding: '3rem 0 2rem' }}>
        <div className="container">
          <h1 style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-0.02em', margin: 0 }}>Restaurants</h1>
          <p className="text-muted mt-1 mb-3" style={{ fontSize: '0.95rem' }}>Discover and order from local favorites and top-rated chains</p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: 500, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-card)', background: '#ffffff' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <i className="bi bi-search" style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '0.9rem',
              }} />
              <input
                id="restaurants-search"
                type="text"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.8rem', height: '48px', border: 'none', boxShadow: 'none', fontSize: '0.95rem' }}
                placeholder="Search restaurants by name or city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-gold" style={{ height: '48px', borderRadius: '0 999px 999px 0', padding: '0 1.5rem' }}>Search</button>
            {search && (
              <button
                type="button"
                className="btn btn-link text-muted text-decoration-none"
                onClick={() => { setSearch(''); setSearchParams({}); setCuisine('All'); fetchRestaurants(); }}
                style={{ padding: '0 1rem', fontSize: '0.9rem', fontWeight: 600 }}
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="container" style={{ padding: '1rem' }}>
        
        {/* Filters and Sorting bar */}
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Cuisine Filters */}
          <div className="d-flex flex-wrap gap-2">
            {CUISINES.map(c => (
              <button
                key={c}
                onClick={() => setCuisine(c)}
                className={`swiggy-filter-pill ${cuisine === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>
          
          {/* Sort Selection as a filter button */}
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sort By:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="form-select shadow-sm"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '6px 36px 6px 12px',
                borderRadius: '20px',
                borderColor: 'var(--border-card)',
                width: 'auto',
                cursor: 'pointer'
              }}
            >
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
              <option value="name">A–Z</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-ring" />
          </div>
        ) : restaurants.length > 0 ? (
          <>
            <p className="text-muted fw-semibold" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} available
            </p>
            <div className="row g-4">
              {restaurants.map(r => (
                <div key={r.id} className="col-sm-6 col-lg-6">
                  <RestaurantCard restaurant={r} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <i className="bi bi-shop" style={{ fontSize: '3.5rem' }} />
            <h4 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>No restaurants found</h4>
            <p className="text-muted">We couldn't find any restaurants matching your filters. Try selecting another cuisine or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
