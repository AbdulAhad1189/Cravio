import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dashMap = { admin: '/admin', owner: '/owner', customer: '/' };
      navigate(dashMap[user.role] || from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center mb-4 animate-fadeInUp">
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f04923', letterSpacing: '-0.03em', marginBottom: 8 }}>Cravio</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        <div className="ttt-card animate-fadeInUp" style={{ padding: '2rem', animationDelay: '0.1s' }}>
          {error && (
            <div className="ttt-alert ttt-alert-error mb-4">
              <i className="bi bi-exclamation-circle me-2" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="login-email" className="ttt-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                className="ttt-input"
                style={{ width: '100%' }}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="login-password" className="ttt-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  className="ttt-input"
                  style={{ width: '100%', paddingRight: '3rem' }}
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  }}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-gold"
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-4" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--brand-gold)', fontWeight: 600, textDecoration: 'none' }}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
