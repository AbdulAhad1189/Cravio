import React, { useState, useRef, useEffect } from 'react';

const DINER_FEATURES = [
  {
    id: 'd1',
    icon: '🔍',
    category: 'DISCOVERY & SEARCH',
    title: 'Cuisine & Location Search',
    description: 'Explore restaurants filtered strictly by your selected city, pincode, or cuisine type with complete dish pricing and menus.',
    pros: [
      'Strict city & area location filtering',
      'Full menu transparency before visiting',
      'Real-time location & Google Maps pin'
    ],
    accentColor: '#D5865C',
  },
  {
    id: 'd2',
    icon: '📅',
    category: 'TABLE RESERVATIONS',
    title: 'Instant Table Booking',
    description: 'Reserve a table in under 30 seconds for any party size with instant restaurant notification.',
    pros: [
      '100% free table bookings (zero fee)',
      'Instant SMS & booking confirmation',
      'Custom guest count & special notes'
    ],
    accentColor: '#3B4F39',
  },
  {
    id: 'd3',
    icon: '🛵',
    category: 'DELIVERY & TRACKING',
    title: 'Food Ordering & Live Status',
    description: 'Place food delivery or takeaway orders with live tracking and real-time kitchen status updates.',
    pros: [
      'Live kitchen crowd & wait status',
      'Complete order history log',
      'Seamless digital cart & checkout'
    ],
    accentColor: '#C27047',
  },
  {
    id: 'd4',
    icon: '⚔️',
    category: 'FOOD GAMES',
    title: 'Flavor Duel & Crave Roulette',
    description: 'Can\'t decide what to eat? Spin the Roulette wheel or battle dishes in 5-round Flavor Duel.',
    pros: [
      'City-restricted spin wheel recommendations',
      'Interactive 5-round Flavor Duel',
      'Personalized CraveMatch taste profile'
    ],
    accentColor: '#A6B98F',
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
      'Custom business hours & profile'
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
      'Instant price & item edits'
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
      'Embedded Google Maps location',
      'Direct navigation for foot traffic'
    ],
    accentColor: '#A6B98F',
  },
];

export default function FeaturesCarousel() {
  const [roleTab, setRoleTab] = useState('diners'); // 'diners' | 'owners'
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sliderRef = useRef(null);

  const featureList = roleTab === 'diners' ? DINER_FEATURES : OWNER_FEATURES;

  // Auto-sliding effect every 4 seconds
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      slideNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered, roleTab, activeIndex]);

  const slideNext = () => {
    if (sliderRef.current) {
      const cardWidth = 330;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      let targetScroll = sliderRef.current.scrollLeft + cardWidth;
      
      if (targetScroll > maxScroll + 40) {
        targetScroll = 0;
      }

      sliderRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setActiveIndex(Math.round(targetScroll / cardWidth) % featureList.length);
    }
  };

  const slidePrev = () => {
    if (sliderRef.current) {
      const cardWidth = 330;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      let targetScroll = sliderRef.current.scrollLeft - cardWidth;
      
      if (targetScroll < 0) {
        targetScroll = maxScroll;
      }

      sliderRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
      setActiveIndex(Math.round(targetScroll / cardWidth) % featureList.length);
    }
  };

  const jumpToSlide = (idx) => {
    if (sliderRef.current) {
      const cardWidth = 330;
      sliderRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
      setActiveIndex(idx);
    }
  };

  return (
    <section id="features" style={styles.section}>
      <div className="container-cravio">
        
        {/* Section Title & Role Switcher */}
        <div style={styles.topHeader}>
          <div>
            <span style={styles.badgeLabel}>PLATFORM CAPABILITIES</span>
            <h2 style={styles.mainTitle}>What You Can Do On Cravio</h2>
            <p style={styles.subTitle}>
              A complete list of features and advantages built for food lovers and restaurant owners.
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
              🍽️ Diners & Foodies
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
              🏢 Restaurant Owners
            </button>
          </div>
        </div>

        {/* Carousel Status Bar & Navigation Arrows */}
        <div style={styles.controlRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.featureCounter}>
              Listing {featureList.length} Features ({roleTab === 'diners' ? 'Diner Features' : 'Owner Features'})
            </span>
            <span style={styles.autoStatusPill}>
              {isHovered ? '⏸️ Paused' : '▶ Auto-Sliding'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Pagination Dots */}
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
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Scroll Control Arrows */}
            <button onClick={slidePrev} style={styles.navArrow} title="Previous Feature">
              ‹
            </button>
            <button onClick={slideNext} style={styles.navArrow} title="Next Feature">
              ›
            </button>
          </div>
        </div>

        {/* Sliding Feature Cards List (No Redirection Links) */}
        <div
          ref={sliderRef}
          style={styles.sliderTrack}
          className="cravio-features-slider"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {featureList.map((item) => (
            <div key={item.id} style={styles.featureCard}>
              
              {/* Top Row: Category & Icon */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ ...styles.categoryBadge, color: item.accentColor, backgroundColor: `${item.accentColor}15` }}>
                  {item.category}
                </span>
                <span style={{ fontSize: '1.75rem' }}>{item.icon}</span>
              </div>

              {/* Feature Title & Description */}
              <h3 style={styles.featureTitle}>{item.title}</h3>
              <p style={styles.featureDesc}>{item.description}</p>

              {/* Key Advantages / Pros List */}
              <div style={styles.prosListContainer}>
                <div style={styles.prosListHeader}>KEY PROS & ADVANTAGES:</div>
                {item.pros.map((proText, pIdx) => (
                  <div key={pIdx} style={styles.proRow}>
                    <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.85rem' }}>✓</span>
                    <span style={styles.proText}>{proText}</span>
                  </div>
                ))}
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
    padding: '68px 0 60px',
    borderTop: '1px solid #EAE6DF',
    borderBottom: '1px solid #EAE6DF',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '28px',
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
    marginBottom: '16px',
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
    gap: '20px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    paddingBottom: '12px',
  },
  featureCard: {
    flex: '0 0 310px',
    scrollSnapAlign: 'start',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #EAE6DF',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 3px 12px rgba(0,0,0,0.03)',
  },
  categoryBadge: {
    fontSize: '0.66rem',
    fontWeight: 700,
    letterSpacing: '0.8px',
    padding: '4px 8px',
    borderRadius: '5px',
  },
  featureTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 8px',
  },
  featureDesc: {
    fontSize: '0.84rem',
    color: '#707572',
    lineHeight: 1.55,
    marginBottom: '16px',
  },
  prosListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: 'auto',
    padding: '10px 12px',
    backgroundColor: '#FAF9F6',
    borderRadius: '8px',
    border: '1px solid #EAE6DF',
  },
  prosListHeader: {
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#3B4F39',
    marginBottom: '4px',
    letterSpacing: '0.5px',
  },
  proRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  proText: {
    fontSize: '0.78rem',
    color: '#333735',
    fontWeight: 500,
  },
};
