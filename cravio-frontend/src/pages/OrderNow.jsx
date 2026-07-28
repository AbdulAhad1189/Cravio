import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLocationStore, detectCurrentLocation, lookupPincode } from '../lib/locationStore';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry','Jammu & Kashmir','Ladakh',
];

const DELIVERY_INSTRUCTIONS = [
  { id: 'avoid_call', label: 'Avoid calling', icon: '🚫📞', desc: 'Driver will notify via message' },
  { id: 'leave_door', label: 'Leave at door', icon: '🚪', desc: 'No-contact delivery' },
  { id: 'dont_ring', label: 'Don\'t ring bell', icon: '🔕', desc: 'Useful for sleeping babies/pets' },
  { id: 'leave_guard', label: 'Leave with guard', icon: '👮', desc: 'Security gate drop-off' },
];

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when food arrives',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
  },
  {
    id: 'upi',
    label: 'UPI',
    desc: 'Pay via GPay, PhonePe, Paytm',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    desc: 'Visa, Mastercard, RuPay',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
];

export default function OrderNow() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { location: savedLoc, setLocation: saveLocStore } = useLocationStore();

  const restaurantId = searchParams.get('restaurant');

  // Restaurant & Menu States
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [quantities, setQuantities] = useState({}); // { [foodId]: qty }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Diner Details State
  const [dinerName, setDinerName] = useState('');
  const [dinerPhone, setDinerPhone] = useState('');

  // Delivery Address States
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home'); // Home, Work, Other
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Delivery Instructions State
  const [selectedInstructions, setSelectedInstructions] = useState([]);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', name: '', expiry: '', cvv: '' });

  // Additional Delivery Notes
  const [notes, setNotes] = useState('');

  // Populate user data if logged in
  useEffect(() => {
    if (user) {
      setDinerName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '');
      setDinerPhone(user.phone || '');
    }
  }, [user]);

  // Sync address fields with central location store
  useEffect(() => {
    if (savedLoc?.city) setCity(savedLoc.city);
    else if (user?.city) setCity(user.city);
    if (savedLoc?.state) setState(savedLoc.state);
    else if (user?.state) setState(user.state);
    if (savedLoc?.pincode) setPincode(savedLoc.pincode);
  }, [savedLoc, user]);

  // Load Restaurant, Menu Items and Cart Items for initial quantities
  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.get(`/restaurants/${restaurantId}/`),
      api.get(`/foods/?restaurant=${restaurantId}`),
      api.get('/cart/'),
    ])
      .then(([rRes, fRes, cRes]) => {
        setRestaurant(rRes.data);
        const list = Array.isArray(fRes.data) ? fRes.data : (fRes.data.results || []);
        setMenuItems(list);

        // Pre-fill quantities from Cart if they are from the same restaurant
        const cartList = Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []);
        const initialQtys = {};
        cartList.forEach((cItem) => {
          if (cItem.restaurant_id === Number(restaurantId)) {
            initialQtys[cItem.food] = cItem.quantity;
          }
        });
        setQuantities(initialQtys);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(pin);
    if (pin.length === 6) {
      setPincodeLoading(true);
      const result = await lookupPincode(pin);
      setPincodeLoading(false);
      if (result) {
        setCity(result.city);
        setState(result.state);
        if (!streetAddress) setStreetAddress(`${result.area}, ${result.city}`);
        saveLocStore({ city: result.city, state: result.state, pincode: pin });
      }
    }
  };

  const handleUseCurrentLocation = () => {
    detectCurrentLocation(
      (loc) => {
        setCity(loc.city);
        setState(loc.state);
        setPincode(loc.pincode || '');
      },
      (err) => alert(err),
      setGeoLoading
    );
  };

  const handleInstructionToggle = (id) => {
    setSelectedInstructions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Stepper logic to directly alter food item quantities on the page
  const updateItemQty = (foodId, increment) => {
    setQuantities((prev) => {
      const current = prev[foodId] || 0;
      const next = current + increment;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[foodId];
        return copy;
      }
      return { ...prev, [foodId]: next };
    });
  };

  // Calculations
  const selectedList = Object.entries(quantities).map(([idStr, qty]) => {
    const food = menuItems.find((f) => f.id === Number(idStr));
    return food ? { ...food, qty } : null;
  }).filter(Boolean);

  const subtotal = selectedList.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.qty, 0);
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const gst = subtotal * 0.05;
  const total = subtotal + deliveryFee + gst;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (selectedList.length === 0) {
      alert('Please add at least one item to your order.');
      return;
    }
    if (!dinerName.trim() || !dinerPhone.trim()) {
      alert('Please fill in your contact name and phone number.');
      return;
    }
    if (!streetAddress.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      alert('Please enter your complete delivery address.');
      return;
    }

    setSubmitting(true);

    // Format address and include instructions, tag and phone
    const formattedInstructions = selectedInstructions
      .map((iId) => DELIVERY_INSTRUCTIONS.find((inst) => inst.id === iId)?.label)
      .filter(Boolean)
      .join(', ');

    const fullAddress = [
      `Diner: ${dinerName} (${dinerPhone})`,
      `Label: ${addressLabel}`,
      `Address: ${streetAddress}`,
      `${city}, ${state} - ${pincode}`,
      formattedInstructions ? `Delivery Instructions: [${formattedInstructions}]` : '',
    ].filter(Boolean).join('\n');

    const paymentDetails = `Payment: ${paymentMethod.toUpperCase()}${
      paymentMethod === 'upi' ? ` (UPI ID: ${upiId})` : paymentMethod === 'card' ? ` (Card Name: ${cardDetails.name})` : ''
    }`;

    const orderPayload = {
      restaurant: Number(restaurantId),
      delivery_address: `${fullAddress}\n${paymentDetails}`,
      notes: notes,
      total_amount: total.toFixed(2),
      items: selectedList.map((item) => ({
        food: item.id,
        quantity: item.qty,
        price: parseFloat(item.price),
      })),
    };

    try {
      await api.post('/orders/', orderPayload);
      navigate('/orders');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to place delivery order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Gathering Cravio details...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Restaurant not found</h2>
        <Link to="/restaurants" className="btn-olive" style={{ marginTop: 20 }}>Browse Restaurants</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--cream)', minHeight: '90vh', padding: '40px 0' }}>
      <div className="container-cravio">

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--olive)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>🛵 Direct Delivery</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', fontWeight: 700, margin: '8px 0 4px', color: 'var(--dark)' }}>
              Order from {restaurant.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              {restaurant.cuisine} · {restaurant.city}, {restaurant.state}
            </p>
          </div>
          <Link to={`/restaurants/${restaurantId}`} style={{ color: 'var(--olive)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Restaurant
          </Link>
        </div>

        {/* Grid Layout: Form on left, menu and summary on right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '30px', alignItems: 'start' }}>

          {/* Left Column: Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Step 1: Contact Details */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 28 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: '1.3rem' }}>👤</span> Contact Details
              </h3>
              <div className="form-cravio" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-soft)', marginBottom: 6, display: 'block' }}>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={dinerName}
                    onChange={(e) => setDinerName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-soft)', marginBottom: 6, display: 'block' }}>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit number"
                    value={dinerPhone}
                    onChange={(e) => setDinerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Delivery Address */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <span style={{ fontSize: '1.3rem' }}>📍</span> Delivery Address
                </h3>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={geoLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                    background: 'white', border: '1.5px solid var(--olive)', color: 'var(--olive)',
                    cursor: geoLoading ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: 600,
                    opacity: geoLoading ? 0.7 : 1, transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!geoLoading) e.currentTarget.style.background = 'var(--olive-pale)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  📡 {geoLoading ? 'Detecting…' : 'Use Current Location'}
                </button>
              </div>

              <div className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: 16 }}>
                  <div>
                    <label>Pincode *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="Pincode"
                        value={pincode}
                        onChange={handlePincodeChange}
                        maxLength={6}
                        required
                      />
                      {pincodeLoading && (
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--olive)' }}>
                          loading…
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label>City *</label>
                    <input
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>State *</label>
                    <select value={state} onChange={(e) => setState(e.target.value)} required>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label>Flat / Street / Landmark / Locality *</label>
                  <textarea
                    rows={2}
                    placeholder="Enter complete building no, flat details, street, and landmark details"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    required
                  />
                </div>

                {/* Address Label Tags */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dark-soft)', marginBottom: 8, display: 'block' }}>Save address as</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Home', 'Work', 'Other'].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddressLabel(lbl)}
                        style={{
                          padding: '6px 16px', borderRadius: 8, border: `1.5px solid ${addressLabel === lbl ? 'var(--olive)' : 'var(--border)'}`,
                          background: addressLabel === lbl ? 'var(--olive-pale)' : 'white',
                          color: addressLabel === lbl ? 'var(--olive)' : 'var(--dark-soft)',
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {lbl === 'Home' ? '🏠 ' : lbl === 'Work' ? '💼 ' : '📌 '}{lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Zomato/Swiggy style delivery instructions */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 28 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '1.3rem' }}>🚴</span> Delivery Instructions
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 20 }}>
                Help the delivery rider complete a smooth, seamless delivery.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                {DELIVERY_INSTRUCTIONS.map((inst) => {
                  const isSelected = selectedInstructions.includes(inst.id);
                  return (
                    <div
                      key={inst.id}
                      onClick={() => handleInstructionToggle(inst.id)}
                      style={{
                        padding: 14, borderRadius: 10, border: `2px solid ${isSelected ? 'var(--olive)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--olive-pale)' : 'white', cursor: 'pointer',
                        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 6,
                        boxShadow: isSelected ? '0 4px 10px rgba(59,79,57,0.06)' : 'none'
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--olive-light)'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>{inst.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)' }}>{inst.label}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{inst.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Payment Details */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 28 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: '1.3rem' }}>💳</span> Payment Method
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <div key={pm.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyItems: 'center', gap: 14, padding: '16px 20px',
                          borderRadius: 12, border: `1.5px solid ${isSelected ? 'var(--olive)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--olive-pale)' : 'white', cursor: 'pointer', transition: 'all 0.18s'
                        }}
                      >
                        <div style={{ color: isSelected ? 'var(--olive)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{pm.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dark)' }}>{pm.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pm.desc}</div>
                        </div>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--olive)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isSelected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--olive)' }} />}
                        </div>
                      </div>

                      {/* Payment Sub-forms */}
                      {isSelected && pm.id === 'upi' && (
                        <div className="form-cravio" style={{ padding: '16px 20px 8px', border: '1.5px solid var(--olive)', borderTop: 'none', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -4, background: 'var(--cream)' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block' }}>Enter UPI ID *</label>
                          <input
                            type="text"
                            placeholder="username@bankname"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      {isSelected && pm.id === 'card' && (
                        <div className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 20px 8px', border: '1.5px solid var(--olive)', borderTop: 'none', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -4, background: 'var(--cream)' }}>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Card Number *</label>
                            <input
                              type="text"
                              placeholder="1234 5678 9101 1121"
                              value={cardDetails.number}
                              onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Cardholder Name *</label>
                            <input
                              type="text"
                              placeholder="Name on card"
                              value={cardDetails.name}
                              onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                              required
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>Expiry Date *</label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardDetails.expiry}
                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>CVV *</label>
                              <input
                                type="password"
                                placeholder="***"
                                value={cardDetails.cvv}
                                onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                maxLength={3}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & instructions */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 28 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ fontSize: '1.3rem' }}>📝</span> Delivery Notes
              </h3>
              <div className="form-cravio">
                <textarea
                  rows={2}
                  placeholder="e.g. Please drop it with the receptionist, or call after arriving"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* Right Column: Menu and Order Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: '90px' }}>

            {/* Menu Picker & Live quantities */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 24, maxHeight: 380, overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Select Menu Items</h3>
              {menuItems.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No menu items available.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {menuItems.map((food) => {
                    const qty = quantities[food.id] || 0;
                    return (
                      <div key={food.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, paddingRight: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.75rem' }}>{food.is_veg ? '🟢' : '🔴'}</span>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--dark)' }}>{food.name}</span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--olive)', fontWeight: 700 }}>₹{parseFloat(food.price).toFixed(0)}</span>
                        </div>

                        {/* Direct Stepper */}
                        {qty > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--olive)', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700 }}>
                            <button onClick={() => updateItemQty(food.id, -1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 4px', fontSize: '0.9rem', fontWeight: 'bold' }}>−</button>
                            <span>{qty}</span>
                            <button onClick={() => updateItemQty(food.id, 1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 4px', fontSize: '0.9rem', fontWeight: 'bold' }}>+</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateItemQty(food.id, 1)}
                            style={{
                              border: '1.5px solid var(--olive)', background: 'white', color: 'var(--olive)',
                              padding: '5px 16px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Order Summary */}
            <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--border)', padding: 28 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Bill Details</h3>

              {selectedList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '20px 0' }}>
                  No items selected yet. Choose from the menu list above.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Selected items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    {selectedList.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--dark-soft)' }}>
                          {item.name} <strong style={{ color: 'var(--dark)' }}>x{item.qty}</strong>
                        </span>
                        <span style={{ fontWeight: 600 }}>₹{(parseFloat(item.price) * item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Delivery Partner Fee</span>
                    <span>₹{deliveryFee.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <span>GST & Restaurant Charges (5%)</span>
                    <span>₹{gst.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', paddingTop: 4 }}>
                    <span>Grand Total</span>
                    <span style={{ color: 'var(--olive)' }}>₹{total.toFixed(0)}</span>
                  </div>

                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || selectedList.length === 0}
                    className="btn-olive"
                    style={{
                      width: '100%', padding: '13px', borderRadius: 9, fontSize: '0.98rem', fontWeight: 700,
                      marginTop: 18, opacity: submitting || selectedList.length === 0 ? 0.75 : 1,
                      cursor: submitting || selectedList.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Placing Order…' : `Place Delivery Order · ₹${total.toFixed(0)} →`}
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
