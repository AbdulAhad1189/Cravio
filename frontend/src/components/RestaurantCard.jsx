import { Link } from 'react-router-dom';

export default function RestaurantCard({ restaurant }) {
  const { id, name, cuisine, city, image, rating, price_range } = restaurant;

  // Mock offers
  const offers = [
    "50% OFF up to ₹100",
    "FREE delivery",
    "Buy 1 Get 1",
    "15% OFF",
    "₹125 OFF ABOVE ₹199",
    "Flat 20% OFF",
  ];
  const promo = offers[id % offers.length];

  // Mock delivery time
  const deliveryTimes = ['25 min', '35 min', '20 min', '40 min', '30 min'];
  const deliveryTime = deliveryTimes[id % deliveryTimes.length];

  // Mock price for two
  const pricesForTwo = ['₹200 for two', '₹450 for two', '₹350 for two', '₹500 for two', '₹300 for two'];
  const priceForTwo = pricesForTwo[id % pricesForTwo.length];

  return (
    <Link
      to={`/restaurants/${id}`}
      className="feast-card animate-fadeInUp h-100 text-decoration-none"
      style={{ display: 'block', color: 'inherit' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={image || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600`}
          alt={name}
          className="feast-card-img"
          style={{ transition: 'transform 0.3s ease' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'; }}
        />
        {/* Promo badge */}
        <div className="feast-card-promo">{promo}</div>
      </div>

      {/* Card body */}
      <div className="feast-card-body">
        {/* Name + Rating row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h5 style={{
            margin: 0, fontSize: '1.05rem', fontWeight: 800,
            color: '#000000', flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </h5>
          {rating && (
            <span className="feast-card-rating" style={{ flexShrink: 0, marginLeft: 8 }}>
              ★ {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Cuisine */}
        <div style={{ color: '#59564d', fontSize: '0.85rem', fontWeight: 500, marginBottom: 10 }}>
          {cuisine || 'Restaurant'}
        </div>

        {/* Delivery + Price row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: '#7a776d', fontSize: '0.82rem', fontWeight: 500,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-clock" style={{ fontSize: '0.8rem' }} />
            {deliveryTime}
          </span>
          <span>{priceForTwo}</span>
        </div>
      </div>
    </Link>
  );
}
