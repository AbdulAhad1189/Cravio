import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', textAlign: 'center', padding: '2rem',
    }}>
      <div style={{
        fontSize: '7rem', fontWeight: 900, fontFamily: 'Inter, sans-serif',
        color: 'var(--brand-gold)',
        lineHeight: 1, marginBottom: '1rem',
      }}>
        404
      </div>
      <h2 style={{ marginBottom: '0.75rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: 380 }}>
        Looks like this dish isn't on the menu. Let's get you back to something delicious.
      </p>
      <div className="d-flex gap-3">
        <Link to="/" className="btn-gold" style={{ textDecoration: 'none' }}>
          <i className="bi bi-house me-2" />Go Home
        </Link>
        <Link to="/restaurants" className="btn-ghost" style={{ textDecoration: 'none' }}>
          Browse Restaurants
        </Link>
      </div>
    </div>
  );
}
