import React, { useState, useRef, useEffect } from 'react';

const DINER_FEATURES = [
  {
    id: 'd1',
    icon: '🔍',
    category: 'DISCOVERY & SEARCH',
    title: 'Search by Cuisine & Location',
    description: 'Filter verified restaurants strictly by your selected city, pincode, or cuisine type with complete dish pricing and menus.',
    pros: [
      'Strict city & area location filtering',
      'Full menu transparency & dish pricing',
      'Real-time location & Google Maps integration'
    ],
    accentColor: '#C27047',
  },
  {
    id: 'd2',
    icon: '📅',
    category: 'TABLE RESERVATIONS',
    title: 'Instant Table Booking',
    description: 'Reserve a table in under 30 seconds for any party size with instant restaurant notification.',
    pros: [
      '100% free table bookings with zero fee',
      'Instant SMS & email booking confirmation',
      'Flexible party sizes & guest notes'
    ],
    accentColor: '#3B4F39',
  },
  {
    id: 'd3',
    icon: '🛵',
    category: 'DELIVERY & TRACKING',
    title: 'Food Ordering & Live Status',
    description: 'Place food delivery or takeaway orders with live status tracking and real-time kitchen load indicators.',
    pros: [
      'Live kitchen crowd & wait status indicator',
      'Complete order history log & re-ordering',
      'Seamless digital cart & instant checkout'
    ],
    accentColor: '#D5865C',
  },
  {
    id: 'd4',
    icon: '⚔️',
    category: 'FOOD GAMES',
    title: 'Flavor Duel & Crave Roulette',
    description: 'Can\'t decide what to eat? Spin the Roulette wheel or battle dishes in 5-round Flavor Duel.',
    pros: [
      'City-restricted spin wheel recommendations',
      'Interactive 5-round Flavor Duel battle',
      'Personalized CraveMatch taste profile'
    ],
    accentColor: '#60705E',
  },
];

const OWNER_FEATURES = [
  {
    id: 'o1',
    icon: '🚀',
    category: 'RESTAURANT ONBOARDING',
    title: 'Fast Online Registration',
    description: 'Register your restaurant, set operating hours, upload brand logos, and go live after quick verification.',
    pros: [
      'Zero-commission restaurant listing',
      'Instant open / closed status toggle',
      'Custom business hours & profile info'
    ],
    accentColor: '#3B4F39',
  },
  {
    id: 'o2',
    icon: '📋',
    category: 'CATALOG MANAGEMENT',
    title: 'Bulk Menu Import & Swiggy Sync',
    description: 'Add items manually or upload a plain .txt file to import 100+ dishes in bulk with categories and prices.',
    pros: [
      'Single-click .txt menu bulk import',
      'Automated Swiggy catalog sync',
      'Instant price & category editing'
    ],
    accentColor: '#C27047',
  },
  {
    id: 'o3',
    icon: '📊',
    category: 'BUSINESS ANALYTICS',
    title: 'Revenue & Order Dashboard',
    description: 'Track incoming delivery orders, accept or reject reservation requests, and view monthly revenue stats.',
    pros: [
      'Real-time revenue & sales analytics',
      'Instant order status management',
      'Zero spreadsheet hassle'
    ],
    accentColor: '#D5865C',
  },
  {
    id: 'o4',
    icon: '🗺️',
    category: 'GPS & NAVIGATION',
    title: 'Exact GPS & Google Maps',
    description: 'Store precise latitude & longitude coordinates so customers navigate directly to your front doors.',
    pros: [
      'Exact GPS coordinate pin',
      'Embedded Google Maps location preview',
      'Direct route navigation for foot traffic'
    ],
    accentColor: '#60705E',
  },
];

export default function FeaturesCarousel() {
  const [roleTab, setRoleTab] = useState('diners');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);

  const featureList = roleTab === 'diners' ? DINER_FEATURES : OWNER_FEATURES;

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      slideNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered, roleTab, activeIndex]);

  const slideNext = () => {
    if (sliderRef.current) {
      const itemWidth = 360;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      let targetScroll = sliderRef.current.scrollLeft + itemWidth;
      
      if (targetScroll > maxScroll + 40) {
        targetScroll = 0;
      }

      sliderRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setActiveIndex(Math.round(targetScroll / itemWidth) % featureList.length);
    }
  };

  const slidePrev = () => {
    if (sliderRef.current) {
      const itemWidth = 360;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      let targetScroll = sliderRef.current.scrollLeft - itemWidth;
      
      if (targetScroll < 0) {
        targetScroll = maxScroll;
      }

      sliderRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setActiveIndex(Math.round(targetScroll / itemWidth) % featureList.length);
    }
  };

  const jumpToSlide = (idx) => {
    if (sliderRef.current) {
      const itemWidth = 360;
      sliderRef.current.scrollTo({ left: idx * itemWidth, behavior: 'smooth' });
      setActiveIndex(idx);
    }
  };

  return (
    <section id="features" style={styles.section}>
      <div className="container-cravio">
        
        {/* Header & Role Switcher */}
        <div style={styles.topHeader}>
          <div>
            <span style={styles.badgeLabel}>WHAT YOU CAN DO ON CRAVIO</span>
            <h2 style={styles.mainTitle}>Platform Feature List</h2>
            <p style={styles.subTitle}>
              A comprehensive list of features and key advantages for diners and restaurant owners.
            </p>
          </div>

          {/* Diners / Owners Switcher */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => { setRoleTab('diners'); setActiveIndex(0); if (sliderRef.current) sliderRef.current.scrollLeft = 0; }}
              style={{
                ...styles.tabButton,
                backgroundColor: roleTab === 'diners' ? '#3B4F39' : 'transparent',
                color: roleTab === 'diners' ? '#FFFFFF' : '#686D6A',
                boxShadow: roleTab === 'diners' ? '0 2px 8px rgba(59,79,57,0.2)' : 'none',
              }}
            >
              🍽️ For Diners / Users
            </button>
            <button
              onClick={() => { setRoleTab('owners'); setActiveIndex(0); if (sliderRef.current) sliderRef.current.scrollLeft = 0; }}
              style={{
                ...styles.tabButton,
                backgroundColor: roleTab === 'owners' ? '#3B4F39' : 'transparent',
                color: roleTab === 'owners' ? '#FFFFFF' : '#686D6A',
                boxShadow: roleTab === 'owners' ? '0 2px 8px rgba(59,79,57,0.2)' : 'none',
              }}
            >
              🏢 For Restaurant Owners
            </button>
          </div>
        </div>

        {/* Carousel Control Bar */}
        <div style={styles.controlRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.featureCounter}>
              Showing {featureList.length} Features ({roleTab === 'diners' ? 'User Features' : 'Owner Features'})
            </span>
            <span style={styles.autoStatusPill}>
              {isHovered ? '⏸️ Paused' : '▶ Auto-Sliding List'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: '6px', marginRight: '6px' }}>
              {featureList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToSlide(idx)}
                  style={{
                    width: activeIndex === idx ? '18px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: activeIndex === idx ? '#3B4F39' : '#D2CBBF',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                  title={`Feature ${idx + 1}`}
                />
              ))}
            </div>

            {/* Arrows */}
            <button onClick={slidePrev} style={styles.navArrow} title="Previous Feature">
              ‹
            </button>
            <button onClick={slideNext} style={styles.navArrow} title="Next Feature">
              ›
            </button>
          </div>
        </div>

        {/* Sliding List View (Clean List items, No Card Boxes, No Redirection Links) */}
        <div
          ref={sliderRef}
          style={styles.sliderTrack}
          className="cravio-features-slider"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {featureList.map((item) => (
            <div key={item.id} style={styles.listItem}>
              
              {/* Feature Header */}
              <div style={styles.itemHeaderRow}>
                <span style={{ fontSize: '1.6rem', marginRight: '10px' }}>{item.icon}</span>
                <div>
                  <span style={{ ...styles.categoryText, color: item.accentColor }}>{item.category}</span>
                  <h3 style={styles.itemTitle}>{item.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p style={styles.itemDesc}>{item.description}</p>

              <div style={styles.divider} />

              {/* Pros List */}
              <div style={styles.prosSection}>
                <span style={styles.prosHeader}>KEY ADVANTAGES:</span>
                <ul style={styles.prosList}>
                  {item.pros.map((proText, pIdx) => (
                    <li key={pIdx} style={styles.proListItem}>
                      <span style={styles.checkIcon}>✓</span>
                      <span>{proText}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ))}
        </div>

      </div>

      <style>{`
        .cravio-features-slider::-webkit-scrollbar {
          display: none;
        }
        .cravio-features-slider {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

const styles = {
  section: {
    backgroundColor: '#FAF7F2',
    padding: '64px 0 56px',
    borderTop: '1px solid #EAE6DF',
    borderBottom: '1px solid #EAE6DF',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '26px',
  },
  badgeLabel: {
    fontSize: '0.74rem',
    fontWeight: 700,
    letterSpacing: '1.2px',
    color: '#C27047',
    display: 'inline-block',
    marginBottom: '6px',
  },
  mainTitle: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
    fontSize: '2.1rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 6px',
  },
  subTitle: {
    color: '#707572',
    fontSize: '0.92rem',
    maxWidth: '520px',
    lineHeight: 1.5,
    margin: 0,
  },
  tabContainer: {
    display: 'inline-flex',
    padding: '4px',
    backgroundColor: '#EAE5DB',
    borderRadius: '28px',
    gap: '4px',
  },
  tabButton: {
    border: 'none',
    borderRadius: '22px',
    padding: '9px 18px',
    fontSize: '0.84rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  featureCounter: {
    fontSize: '0.82rem',
    color: '#707572',
    fontWeight: 600,
  },
  autoStatusPill: {
    fontSize: '0.68rem',
    fontWeight: 600,
    color: '#3B4F39',
    backgroundColor: '#EAF0E9',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  navArrow: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '1px solid #EAE6DF',
    backgroundColor: '#FFFFFF',
    color: '#1C1E1D',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
    transition: 'all 0.15s ease',
  },
  sliderTrack: {
    display: 'flex',
    gap: '24px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    paddingBottom: '12px',
  },
  listItem: {
    flex: '0 0 340px',
    scrollSnapAlign: 'start',
    backgroundColor: '#FAF7F2',
    borderLeft: '3px solid #3B4F39',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  itemHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  categoryText: {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.8px',
    display: 'block',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.12rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '2px 0 0',
  },
  itemDesc: {
    fontSize: '0.84rem',
    color: '#707572',
    lineHeight: 1.55,
    margin: '0 0 12px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#EAE6DF',
    margin: '0 0 12px',
  },
  prosSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  prosHeader: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#3B4F39',
    letterSpacing: '0.6px',
    marginBottom: '4px',
  },
  prosList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  proListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.78rem',
    color: '#333735',
    fontWeight: 500,
  },
  checkIcon: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
};
