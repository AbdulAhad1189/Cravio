import React, { useState, useRef, useEffect } from 'react';

const USER_FEATURES = [
  {
    id: 'u1',
    badge: 'DISCOVERY',
    title: 'Search by Cuisine & Location',
    desc: 'Filter verified restaurants by city, pincode, or cuisine. View complete menus, real prices, and dish photos before visiting.',
    proTitle: '⚡ Real-Time Accuracy',
    proDesc: 'Live menus, ratings, and exact Google Maps coordinates for 20+ major Indian cities.',
    prosList: [
      'Instant city & pincode filtering',
      'Transparent menu prices & dish photos',
      'Real-time location & Google Maps pin'
    ],
    icon: '🔍',
    color: '#D5865C',
  },
  {
    id: 'u2',
    badge: 'RESERVATIONS',
    title: 'Book a Table in 30 Seconds',
    desc: 'Select your preferred date, time, and guest count. Get instant table confirmation sent directly to the restaurant.',
    proTitle: '💵 100% Free Bookings',
    proDesc: 'Zero reservation fees, no phone calls, and no hidden platform charges.',
    prosList: [
      'Instant restaurant confirmation',
      'Zero booking & reservation fees',
      'Flexible party sizes & special notes'
    ],
    icon: '📅',
    color: '#3B4F39',
  },
  {
    id: 'u3',
    badge: 'DELIVERY & TRACKING',
    title: 'Order Food & Live Track',
    desc: 'Order your favorite dishes for home delivery or takeaway. Track order status and check kitchen crowd levels live.',
    proTitle: '⏱️ Live Kitchen Crowd Indicator',
    proDesc: 'Real-time kitchen load level and prep wait time estimation before ordering.',
    prosList: ['Live kitchen crowd & wait status', 'Complete order history & re-ordering', 'Seamless digital cart & checkout'],
    icon: '🛵',
    color: '#C27047',
  },
  {
    id: 'u4',
    badge: 'INTERACTIVE GAMES',
    title: 'Flavor Duel & Crave Roulette',
    desc: 'Can\'t decide what to eat? Spin the Crave Roulette wheel or play 5-round head-to-head Flavor Duel to find your meal.',
    proTitle: '🎲 CraveMatch Quiz',
    proDesc: 'Personalized food recommendations matched strictly to your city and taste preferences.',
    prosList: [
      '5-Round Flavor Duel food battle',
      'Roulette matched to your exact city',
      'Personalized taste personality profile'
    ],
    icon: '⚔️',
    color: '#A6B98F',
  },
];

const OWNER_FEATURES = [
  {
    id: 'o1',
    badge: 'ONBOARDING',
    title: 'Instant Online Setup & Approval',
    desc: 'Register as a restaurant owner, set operating hours, upload brand logos, and go live after quick admin verification.',
    proTitle: '📈 Zero Commission Listing',
    proDesc: 'Reach thousands of food lovers across major Indian cities without paying heavy commissions.',
    prosList: [
      '100% free business registration',
      'Instant live/offline status toggle',
      'Custom operating hours & contact info'
    ],
    icon: '🚀',
    color: '#3B4F39',
  },
  {
    id: 'o2',
    badge: 'MENU MANAGEMENT',
    title: 'Bulk Menu Import & Swiggy Sync',
    desc: 'Add dishes individually or upload a .txt file to import 100+ menu items in bulk with categories, prices, and food tags.',
    proTitle: '⚡ Single-Click Bulk Import',
    proDesc: 'Import entire menus and automatically sync live Swiggy catalogs in seconds.',
    prosList: [
      'Bulk .txt menu file upload',
      'Automated Swiggy catalog sync',
      'Instant price & category editing'
    ],
    icon: '📋',
    color: '#C27047',
  },
  {
    id: 'o3',
    badge: 'ANALYTICS & ORDERS',
    title: 'Real-Time Revenue Dashboard',
    desc: 'Track incoming delivery orders, accept or reject reservation requests, and monitor monthly sales revenue with built-in analytics.',
    proTitle: '🔔 Live Order Notifications',
    proDesc: 'Manage kitchen workflow and table seatings seamlessly from one clean dashboard.',
    prosList: [
      'Real-time revenue & sales stats',
      'One-click order status updates',
      'Zero spreadsheet management needed'
    ],
    icon: '📊',
    color: '#D5865C',
  },
  {
    id: 'o4',
    badge: 'GPS VISIBILITY',
    title: 'Real-Time Map & GPS Location',
    desc: 'Store exact latitude and longitude coordinates so customers can navigate directly to your restaurant front door via Google Maps.',
    proTitle: '📍 Direct Map Navigation',
    proDesc: 'Integrated Google Maps Embed & direct navigation bringing foot traffic to your doorstep.',
    prosList: [
      'Exact GPS latitude/longitude pin',
      'Embedded interactive map preview',
      'Direct Google Maps route navigation'
    ],
    icon: '🗺️',
    color: '#A6B98F',
  },
];

export default function FeaturesCarousel() {
  const [activeTab, setActiveTab] = useState('diners');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  const currentFeatures = activeTab === 'diners' ? USER_FEATURES : OWNER_FEATURES;

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      handleScroll('right');
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, activeTab, activeCardIndex]);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = 340;
      const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
      
      let newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -cardWidth : cardWidth);
      
      if (newScrollLeft > maxScroll + 50) {
        newScrollLeft = 0;
      } else if (newScrollLeft < 0) {
        newScrollLeft = maxScroll;
      }

      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });

      const newIndex = Math.round(newScrollLeft / cardWidth) % currentFeatures.length;
      setActiveCardIndex(newIndex);
    }
  };

  const scrollToCard = (index) => {
    if (scrollRef.current) {
      const cardWidth = 340;
      scrollRef.current.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
      setActiveCardIndex(index);
    }
  };

  return (
    <section id="features" style={styles.section}>
      <div className="container-cravio">
        
        {/* Section Header & Tab Selector */}
        <div style={styles.headerWrap}>
          <div>
            <span style={styles.sectionTag}>CRAVIO PLATFORM FEATURES</span>
            <h2 style={styles.sectionTitle}>What You Can Do On Cravio</h2>
            <p style={styles.sectionSub}>
              Explore the key features and exclusive benefits designed for both food lovers and restaurant owners.
            </p>
          </div>

          {/* Toggle Switch between Diners and Owners */}
          <div style={styles.tabToggleWrap}>
            <button
              onClick={() => { setActiveTab('diners'); setActiveCardIndex(0); if (scrollRef.current) scrollRef.current.scrollLeft = 0; }}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'diners' ? '#3B4F39' : 'transparent',
                color: activeTab === 'diners' ? '#FFFFFF' : '#707572',
                boxShadow: activeTab === 'diners' ? '0 2px 8px rgba(59,79,57,0.2)' : 'none',
              }}
            >
              🍽️ For Diners / Users
            </button>
            <button
              onClick={() => { setActiveTab('owners'); setActiveCardIndex(0); if (scrollRef.current) scrollRef.current.scrollLeft = 0; }}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === 'owners' ? '#3B4F39' : 'transparent',
                color: activeTab === 'owners' ? '#FFFFFF' : '#707572',
                boxShadow: activeTab === 'owners' ? '0 2px 8px rgba(59,79,57,0.2)' : 'none',
              }}
            >
              🏢 For Restaurant Owners
            </button>
          </div>
        </div>

        {/* Carousel Controls Header */}
        <div style={styles.carouselHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.counterText}>
              Feature List ({activeTab === 'diners' ? 'For Diners' : 'For Restaurant Owners'}) — {currentFeatures.length} Key Highlights
            </span>
            <span style={styles.autoBadge}>
              {isPaused ? '⏸️ Paused' : '▶ Auto-Sliding'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Pagination Dots */}
            <div style={{ display: 'flex', gap: '6px', marginRight: '8px' }}>
              {currentFeatures.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToCard(idx)}
                  style={{
                    width: activeCardIndex === idx ? '20px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: activeCardIndex === idx ? '#3B4F39' : '#D0C9BE',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Scroll Arrows */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleScroll('left')} style={styles.arrowBtn} title="Scroll Left">
                ‹
              </button>
              <button onClick={() => handleScroll('right')} style={styles.arrowBtn} title="Scroll Right">
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Sliding Container */}
        <div
          ref={scrollRef}
          style={styles.scrollContainer}
          className="cravio-features-scroll"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {currentFeatures.map((item) => (
            <div key={item.id} style={styles.card}>
              
              {/* Badge & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ ...styles.cardBadge, color: item.color, backgroundColor: `${item.color}15` }}>
                  {item.badge}
                </span>
                <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
              </div>

              {/* Title & Description */}
              <h3 style={styles.cardTitle}>{item.title}</h3>
              <p style={styles.cardDesc}>{item.desc}</p>

              {/* PRO Highlight Box */}
              <div style={styles.proBox}>
                <div style={styles.proHeader}>
                  <span style={styles.proTag}>PRO BENEFIT</span>
                  <span style={styles.proTitle}>{item.proTitle}</span>
                </div>
                <p style={styles.proDesc}>{item.proDesc}</p>
              </div>

              {/* Key Pros Checklist */}
              <div style={styles.prosListWrap}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3B4F39', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  KEY ADVANTAGES:
                </div>
                {item.prosList.map((proItem, idx) => (
                  <div key={idx} style={styles.proItemRow}>
                    <span style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.85rem' }}>✓</span>
                    <span style={styles.proItemText}>{proItem}</span>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>

      <style>{`
        .cravio-features-scroll::-webkit-scrollbar {
          display: none;
        }
        .cravio-features-scroll {
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
    padding: '72px 0 64px',
    borderTop: '1px solid #EAE6DF',
    borderBottom: '1px solid #EAE6DF',
  },
  headerWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '24px',
    marginBottom: '32px',
  },
  sectionTag: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '1.4px',
    color: '#C27047',
    display: 'inline-block',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 8px',
  },
  sectionSub: {
    color: '#707572',
    fontSize: '0.95rem',
    maxWidth: '540px',
    lineHeight: 1.55,
    margin: 0,
  },
  tabToggleWrap: {
    display: 'inline-flex',
    padding: '4px',
    backgroundColor: '#EAE5DB',
    borderRadius: '30px',
    gap: '4px',
  },
  tabBtn: {
    border: 'none',
    borderRadius: '24px',
    padding: '10px 20px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', sans-serif",
  },
  carouselHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  counterText: {
    fontSize: '0.82rem',
    color: '#707572',
    fontWeight: 600,
  },
  autoBadge: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#3B4F39',
    backgroundColor: '#EAF0E9',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  arrowBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid #EAE6DF',
    backgroundColor: '#FFFFFF',
    color: '#1C1E1D',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    transition: 'all 0.15s ease',
  },
  scrollContainer: {
    display: 'flex',
    gap: '20px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    paddingBottom: '16px',
  },
  card: {
    flex: '0 0 320px',
    scrollSnapAlign: 'start',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #EAE6DF',
    padding: '26px 22px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardBadge: {
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '1px',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  cardTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#1C1E1D',
    margin: '0 0 10px',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#707572',
    lineHeight: 1.6,
    marginBottom: '16px',
  },
  proBox: {
    backgroundColor: '#F8F6F0',
    borderLeft: '3px solid #3B4F39',
    borderRadius: '0 10px 10px 0',
    padding: '12px 14px',
    marginBottom: '14px',
  },
  proHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  proTag: {
    fontSize: '0.62rem',
    fontWeight: 800,
    letterSpacing: '0.8px',
    color: '#3B4F39',
    backgroundColor: '#EAF0E9',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  proTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#1C1E1D',
  },
  proDesc: {
    fontSize: '0.78rem',
    color: '#555A57',
    margin: 0,
    lineHeight: 1.45,
  },
  prosListWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: 'auto',
    padding: '10px 12px',
    backgroundColor: '#FAF9F6',
    borderRadius: '8px',
    border: '1px solid #EAE6DF',
  },
  proItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  proItemText: {
    fontSize: '0.78rem',
    color: '#333735',
    fontWeight: 500,
  },
};
