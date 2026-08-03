import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RestaurantCard from '../components/RestaurantCard';
import api from '../api/axios';

const CUISINES = ['All', 'North Indian', 'Italian', 'Chinese', 'Cafe', 'Biryani', 'Pizza', 'Desserts', 'South Indian', 'Continental', 'Mughlai'];

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [cuisine, setCuisine] = useState(searchParams.get('cuisine') || '');
  const [city, setCity] = useState('');
  const fetchRestaurants = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('status', 'approved');
    if (search) params.set('search', search);
    if (cuisine) params.set('cuisine', cuisine);
    if (city) params.set('city', city);

    api.get(`/restaurants/?${params.toString()}`)
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) setRestaurants(data);
        else if (Array.isArray(data.results)) setRestaurants(data.results);
        else setRestaurants([]);
      })
      .catch(() => setRestaurants([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRestaurants(); }, [cuisine, city]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '80vh', padding: '40px 0' }}>
      <div className="container-cravio">
        <h1 className="section-title" style={{ marginBottom: '8px' }}>Browse Restaurants</h1>
        <p className="section-subtitle" style={{ marginBottom: '28px' }}>Discover the best dining experiences near you</p>

        {/* Search + Filters */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--border)', padding: '20px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2', minWidth: '200px' }} className="form-cravio">
              <label>Search</label>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Restaurant name or cuisine..." />
            </div>
            <div style={{ flex: '1', minWidth: '140px' }} className="form-cravio">
              <label>City</label>
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Enter city..." />
            </div>
            <button type="submit" className="btn-olive" style={{ padding: '10px 24px', height: '42px' }}>Search</button>
          </form>
        </div>

        {/* Cuisine Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => setCuisine(c === 'All' ? '' : c)}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                border: `1.5px solid ${(cuisine === c || (c === 'All' && !cuisine)) ? 'var(--olive)' : 'var(--border)'}`,
                background: (cuisine === c || (c === 'All' && !cuisine)) ? 'var(--olive)' : 'white',
                color: (cuisine === c || (c === 'All' && !cuisine)) ? 'white' : 'var(--dark)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍽️</div>
            <p>Loading restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📍</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--dark)' }}>
              {(search || city) ? `No restaurants found for "${search || city}"` : 'No restaurants found'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 16px' }}>
              We couldn't find any matching restaurants in this location or category. Please check the spelling or try searching for major cities like Bengaluru, Mumbai, Delhi, Hyderabad, or Jaipur.
            </p>
            <button
              onClick={() => { setSearch(''); setCity(''); setCuisine(''); fetchRestaurants(); }}
              className="btn-olive"
              style={{ padding: '8px 20px', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>{restaurants.length} restaurants found</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '22px' }}>
              {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
