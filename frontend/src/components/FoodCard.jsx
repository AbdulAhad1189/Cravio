import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FoodCard({ food }) {
  const { name, id, image, price, description, category } = food;
  const { cart, addItem, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  // Check if item is already in the cart and find its quantity
  const cartItem = cart?.items?.find(item => item.food_id === id);
  const quantity = cartItem ? cartItem.quantity : 0;

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

  const isVegetarian = checkVeg(name, description);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') return;

    setAdding(true);
    try {
      await addItem(id, 1);
    } catch (err) {
      // Cart from different restaurant error
      if (err.response?.data?.error?.includes('different restaurant') ||
          err.response?.status === 400) {
        if (window.confirm('Your cart has items from another restaurant. Clear cart and add this item?')) {
          try {
            const { cartAPI } = await import('../api/axios');
            await cartAPI.clear();
            await addItem(id, 1);
          } catch {}
        }
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDecrease = async () => {
    setAdding(true);
    try {
      if (quantity === 1) {
        await removeItem(id);
      } else {
        await updateItem(id, quantity - 1);
      }
    } catch {}
    setAdding(false);
  };

  const handleIncrease = async () => {
    setAdding(true);
    try {
      await updateItem(id, quantity + 1);
    } catch {}
    setAdding(false);
  };

  return (
    <div className="d-flex justify-content-between align-items-start py-4" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'transparent' }}>
      {/* Left Column: Details */}
      <div style={{ flex: 1, paddingRight: '20px' }}>
        {/* Veg/Non-veg Dot */}
        <span className={isVegetarian ? "veg-icon" : "nonveg-icon"} title={isVegetarian ? "Vegetarian" : "Non-vegetarian"} />
        
        {/* Item Name */}
        <h5 style={{ margin: '6px 0 2px 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {name}
        </h5>

        {/* Price */}
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
          ${price?.toFixed(2)}
        </div>

        {/* Category (optional, small text) */}
        {category && (
          <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
            {category.name}
          </span>
        )}

        {/* Description */}
        {description && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.825rem',
            lineHeight: '1.4',
            margin: '8px 0 0 0',
            maxWidth: '90%',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Right Column: Image and Floating Button */}
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <img
          src={image || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200'}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', display: 'block' }}
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200'; }}
        />
        
        {/* Floating Add/Qty Button overlay at the bottom-center of image */}
        {(!user || user.role === 'customer') && (
          <div>
            {quantity === 0 ? (
              <button
                className="swiggy-add-btn shadow-sm"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? '...' : 'ADD'}
              </button>
            ) : (
              <div className="swiggy-qty-btn shadow-sm">
                <button onClick={handleDecrease} disabled={adding}>-</button>
                <span style={{ fontSize: '0.85rem' }}>{quantity}</span>
                <button onClick={handleIncrease} disabled={adding}>+</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
