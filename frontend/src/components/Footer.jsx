import { Link } from 'react-router-dom';

/* Fork-knife icon SVG for footer */
const ForkIcon = () => (
  <div style={{
    width: 32, height: 32, borderRadius: 8,
    background: '#f04923', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  </div>
);

export default function Footer() {
  const mutedColor = '#7a776d';
  const headingColor = '#ffffff';
  const brandRed = '#f04923';

  return (
    <footer>
      <div className="container">
        <div className="row g-4 pb-4">
          {/* Brand */}
          <div className="col-lg-3">
            <div className="footer-brand mb-3">
              <ForkIcon />
              <span>Cravio</span>
            </div>
            <p style={{ color: mutedColor, fontSize: '0.85rem', maxWidth: 220, lineHeight: 1.6 }}>
              Food you crave, delivered fast.
            </p>
            <div className="d-flex gap-3 mt-3">
              {['twitter', 'instagram', 'facebook', 'youtube'].map(s => (
                <a key={s} href="#" style={{ color: mutedColor, fontSize: '1.1rem' }}
                  className="footer-social">
                  <i className={`bi bi-${s}`} />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div className="col-6 col-lg-2">
            <h6 style={{ color: headingColor, fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
              Company
            </h6>
            {[
              { to: '/about', label: 'About' },
              { to: '/contact', label: 'Careers' },
              { to: '/contact', label: 'Press' },
            ].map(({ to, label }) => (
              <Link key={label} to={to}
                style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '0.6rem', textDecoration: 'none' }}
                className="footer-link">
                {label}
              </Link>
            ))}
          </div>

          {/* For you */}
          <div className="col-6 col-lg-2">
            <h6 style={{ color: headingColor, fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
              For you
            </h6>
            {[
              { to: '/restaurants', label: 'Restaurants' },
              { to: '/restaurants?cuisine=all', label: 'Cuisines' },
              { to: '/restaurants?offers=1', label: 'Offers' },
            ].map(({ to, label }) => (
              <Link key={label} to={to}
                style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '0.6rem', textDecoration: 'none' }}
                className="footer-link">
                {label}
              </Link>
            ))}
          </div>

          {/* Partners */}
          <div className="col-6 col-lg-2">
            <h6 style={{ color: headingColor, fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
              Partners
            </h6>
            {[
              { to: '/register', label: 'Register restaurant' },
              { to: '/register', label: 'Rider signup' },
              { to: '/contact', label: 'Partner support' },
            ].map(({ to, label }) => (
              <Link key={label} to={to}
                style={{ display: 'block', color: mutedColor, fontSize: '0.85rem', marginBottom: '0.6rem', textDecoration: 'none' }}
                className="footer-link">
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="col-6 col-lg-3">
            <h6 style={{ color: headingColor, fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>
              Contact
            </h6>
            <div style={{ color: mutedColor, fontSize: '0.85rem' }}>
              <p className="mb-2"><i className="bi bi-envelope me-2" style={{ color: brandRed }} />hello@cravio.com</p>
              <p className="mb-2"><i className="bi bi-telephone me-2" style={{ color: brandRed }} />+1 (555) 000-FOOD</p>
              <p className="mb-0"><i className="bi bi-geo-alt me-2" style={{ color: brandRed }} />123 Flavor Street, NY</p>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '0 0 1.5rem' }} />

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <p style={{ color: mutedColor, fontSize: '0.8rem', margin: 0 }}>
            © 2026 Cravio. All rights reserved.
          </p>
          <div className="d-flex gap-3">
            {['Privacy Policy', 'Terms of Service'].map(t => (
              <a key={t} href="#"
                style={{ color: mutedColor, fontSize: '0.8rem', textDecoration: 'none' }}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
