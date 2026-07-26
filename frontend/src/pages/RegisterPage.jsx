import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      const dashMap = { admin: '/admin', owner: '/owner', customer: '/' };
      navigate(dashMap[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div className="text-center mb-4 animate-fadeInUp">
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f04923', letterSpacing: '-0.03em', marginBottom: 8 }}>Cravio</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join thousands of food lovers</p>
        </div>

        <div className="ttt-card animate-fadeInUp" style={{ padding: '2rem', animationDelay: '0.1s' }}>
          {error && (
            <div className="ttt-alert ttt-alert-error mb-4">
              <i className="bi bi-exclamation-circle me-2" />{error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="mb-4">
            <label className="ttt-label d-block mb-2">I am a…</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { value: 'customer', label: 'Customer', icon: 'bi-person' },
                { value: 'owner', label: 'Restaurant Owner', icon: 'bi-shop' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `2px solid ${form.role === opt.value ? '#f04923' : 'var(--border-card)'}`,
                    background: form.role === opt.value ? 'rgba(226,55,68,0.06)' : 'var(--bg-elevated)',
                    color: form.role === opt.value ? '#f04923' : 'var(--text-secondary)',
                    transition: 'var(--transition)', fontSize: '0.875rem', fontWeight: 600,
                  }}
                >
                  <i className={`bi ${opt.icon} me-2`} />{opt.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="reg-name" className="ttt-label">Full Name</label>
              <input
                id="reg-name" type="text" name="name"
                className="ttt-input" style={{ width: '100%' }}
                placeholder="John Smith"
                value={form.name} onChange={handleChange} required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="reg-email" className="ttt-label">Email Address</label>
              <input
                id="reg-email" type="email" name="email"
                className="ttt-input" style={{ width: '100%' }}
                placeholder="you@example.com"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="reg-password" className="ttt-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password" type={showPass ? 'text' : 'password'} name="password"
                  className="ttt-input" style={{ width: '100%', paddingRight: '3rem' }}
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange} required
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                }}>
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="reg-confirm" className="ttt-label">Confirm Password</label>
              <input
                id="reg-confirm" type={showPass ? 'text' : 'password'} name="confirm"
                className="ttt-input" style={{ width: '100%' }}
                placeholder="Repeat password"
                value={form.confirm} onChange={handleChange} required
              />
            </div>

            <button
              id="reg-submit" type="submit"
              className="btn-gold" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-4" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#f04923', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
