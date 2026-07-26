import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { restaurantAPI, reviewAPI } from '../api/axios';
import FoodCard from '../components/FoodCard';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      restaurantAPI.detail(id),
      restaurantAPI.menu(id),
      reviewAPI.list(id),
    ]).then(([rRes, mRes, revRes]) => {
      setRestaurant(rRes.data.restaurant || rRes.data);
      setMenu(mRes.data.foods || mRes.data || []);
      setReviews(revRes.data.reviews || revRes.data || []);
    }).catch(() => navigate('/restaurants'))
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewMsg('');
    try {
      await reviewAPI.create({ restaurant: id, ...reviewForm });
      setReviewMsg('Review submitted successfully!');
      const revRes = await reviewAPI.list(id);
      setReviews(revRes.data.reviews || revRes.data || []);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewMsg(err.response?.data?.error || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <div className="spinner-ring" />
      </div>
    );
  }

  if (!restaurant) return null;

  // Simple heuristic to detect veg vs non-veg from names
  const checkVeg = (foodName = '', foodDesc = '') => {
    const text = `${foodName} ${foodDesc}`.toLowerCase();
    const nonVegKeywords = [
      'chicken', 'beef', 'meat', 'fish', 'salmon', 'pork', 'mutton', 'shrimp',
      'egg', 'turkey', 'steak', 'ham', 'bacon', 'pepperoni', 'salami',
      'prawn', 'seafood', 'lamb', 'crab', 'duck', 'calamari'
    ];
    return !nonVegKeywords.some(keyword => text.includes(keyword));
  };

  // Filter menu items by Veg Only toggle
  const filteredMenu = menu.filter(food => {
    if (vegOnly) {
      return checkVeg(food.name, food.description);
    }
    return true;
  });

  // Group menu by category
  const byCategory = filteredMenu.reduce((acc, food) => {
    const cat = food.category?.name || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(food);
    return acc;
  }, {});

  // Mock delivery cost and times
  const deliveryCost = (restaurant.id && (restaurant.id.charCodeAt(0) % 2 === 0)) ? "Free Delivery" : "$2.99 Delivery Fee";

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* breadcrumbs + Swiggy Restaurant Card Header */}
      <div className="container" style={{ maxWidth: '800px', paddingTop: '2rem' }}>
        
        {/* Small Breadcrumbs path */}
        <div className="text-muted mb-3" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> /{' '}
          <Link to="/restaurants" style={{ color: 'inherit', textDecoration: 'none' }}>{restaurant.city}</Link> /{' '}
          <span className="text-dark">{restaurant.name}</span>
        </div>

        {/* Restaurant Profile Card Box */}
        <div className="p-4 mb-4" style={{
          border: '1px solid #e9e9eb',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(2, 6, 12, 0.04)',
          background: '#ffffff'
        }}>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                {restaurant.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {restaurant.cuisine}
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {restaurant.address}, {restaurant.city}
              </div>
            </div>
            
            {/* Rating Box */}
            <div className="text-center p-2" style={{ border: '1px solid #e9e9eb', borderRadius: '12px', minWidth: '76px' }}>
              <div className="fw-extrabold text-success d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '1.05rem' }}>
                <i className="bi bi-star-fill" style={{ color: 'var(--brand-emerald)', fontSize: '0.9rem' }} />
                {restaurant.rating?.toFixed(1) || '—'}
              </div>
              <div style={{ borderTop: '1px solid #e9e9eb', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '6px', paddingTop: '4px' }}>
                {restaurant.rating_count || 0} ratings
              </div>
            </div>
          </div>

          <hr style={{ borderColor: '#e9e9eb', margin: '14px 0' }} />

          {/* Time and Price Details */}
          <div className="d-flex align-items-center gap-4 fw-extrabold text-dark" style={{ fontSize: '0.85rem' }}>
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-clock-history fs-6" style={{ color: 'var(--text-secondary)' }} />
              25-30 MINS
            </span>
            <span className="d-flex align-items-center gap-2">
              <i className="bi bi-currency-dollar fs-6" style={{ color: 'var(--text-secondary)' }} />
              $15 FOR TWO
            </span>
            <span className="text-muted fw-semibold">•</span>
            <span className="text-success fw-bold">{deliveryCost}</span>
          </div>
        </div>

        {/* Action Tabs for Detail, Review, Info */}
        <div className="d-flex gap-2 mb-4 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
          {['menu', 'reviews', 'info'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'capitalize',
                color: activeTab === tab ? 'var(--brand-gold)' : 'var(--text-secondary)',
                borderBottom: `3px solid ${activeTab === tab ? 'var(--brand-gold)' : 'transparent'}`,
                transition: 'var(--transition)',
                marginBottom: '-1px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'menu' && (
          <div>
            {/* Veg Only Toggle Switch */}
            <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="fw-bold text-secondary" style={{ fontSize: '0.9rem' }}>Veg Only</span>
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="veg-switch"
                  checked={vegOnly}
                  onChange={e => setVegOnly(e.target.checked)}
                  style={{ cursor: 'pointer', transform: 'scale(1.15)', accentColor: 'var(--brand-emerald)' }}
                />
              </div>
            </div>

            {Object.keys(byCategory).length === 0 ? (
              <div className="empty-state py-5">
                <i className="bi bi-journal-richtext" style={{ fontSize: '3rem' }} />
                <h5 className="mt-3 text-dark fw-bold">No menu items found</h5>
                <p className="text-muted">No items match your vegetarian or availability filters.</p>
              </div>
            ) : (
              Object.entries(byCategory).map(([cat, foods]) => (
                <div key={cat} className="mb-5">
                  <h4 className="fw-extrabold text-dark pb-2 mb-3" style={{ fontSize: '1.2rem', letterSpacing: '-0.01em', borderBottom: '2px solid #e9e9eb' }}>
                    {cat} ({foods.length})
                  </h4>
                  <div className="d-flex flex-column">
                    {foods.map(food => (
                      <FoodCard key={food.id} food={food} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="row g-4">
            <div className="col-lg-8">
              {reviews.length === 0 ? (
                <div className="empty-state py-5">
                  <i className="bi bi-chat-square-heart" style={{ fontSize: '3rem' }} />
                  <h5 className="mt-3 text-dark fw-bold">No reviews yet</h5>
                  <p className="text-muted">Be the first to share your dining experience!</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {reviews.map((rev, i) => (
                    <div key={i} className="p-3" style={{ border: '1px solid #e9e9eb', borderRadius: '12px', background: '#ffffff' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rev.user_name || 'Anonymous'}</div>
                          <div className="mt-1"><StarRating rating={rev.rating} size="sm" /></div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {rev.comment && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '8px 0 0 0', lineHeight: 1.4 }}>{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a review (Customer only) */}
            {user?.role === 'customer' && (
              <div className="col-lg-4">
                <div className="p-3" style={{ border: '1px solid #e9e9eb', borderRadius: '16px', background: '#ffffff' }}>
                  <h5 className="fw-bold mb-3" style={{ fontSize: '1rem' }}>Write a Review</h5>
                  {reviewMsg && (
                    <div className={`ttt-alert ${reviewMsg.includes('success') ? 'ttt-alert-success' : 'ttt-alert-error'} mb-3`}>
                      {reviewMsg}
                    </div>
                  )}
                  <form onSubmit={submitReview}>
                    <div className="mb-3">
                      <label className="ttt-label" style={{ fontSize: '0.75rem' }}>Your Rating</label>
                      <StarRating
                        rating={reviewForm.rating}
                        onChange={r => setReviewForm(f => ({ ...f, rating: r }))}
                        size="lg"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="review-comment" className="ttt-label" style={{ fontSize: '0.75rem' }}>Comment</label>
                      <textarea
                        id="review-comment"
                        className="ttt-input form-control"
                        style={{ width: '100%', minHeight: 90, fontSize: '0.875rem' }}
                        placeholder="Tell us about the food quality, taste, and packaging..."
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-gold w-100" style={{ padding: '0.6rem 1rem', borderRadius: '8px' }} disabled={submittingReview}>
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="row g-3" style={{ maxWidth: '640px' }}>
            {[
              { icon: 'bi-shop', label: 'Name', value: restaurant.name },
              { icon: 'bi-geo-alt', label: 'Address', value: [restaurant.address, restaurant.city, restaurant.state].filter(Boolean).join(', ') },
              { icon: 'bi-telephone', label: 'Phone', value: restaurant.phone },
              { icon: 'bi-envelope', label: 'Email', value: restaurant.email },
              { icon: 'bi-clock', label: 'Hours', value: `${restaurant.opening_time} – ${restaurant.closing_time}` },
              { icon: 'bi-tag', label: 'Cuisine', value: restaurant.cuisine },
            ].filter(f => f.value).map(field => (
              <div key={field.label} className="col-sm-6">
                <div className="p-3" style={{ border: '1px solid #e9e9eb', borderRadius: '12px', background: '#ffffff', height: '100%' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
                    <i className={`bi ${field.icon} me-1`} />{field.label}
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>{field.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
