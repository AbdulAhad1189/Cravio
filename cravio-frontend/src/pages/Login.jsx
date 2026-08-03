import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read ?next= param — where to go after successful login
  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get('next') || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // If there's a ?next= param, always go there first
      if (nextPath) {
        navigate(nextPath);
      } else if (user.role === 'owner') {
        navigate('/owner/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/restaurants');
      } else {
        navigate('/');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else if (typeof data === 'object' && data !== null) {
        setError(Object.values(data).flat().join(' '));
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Sign in to your Cravio account</p>
        </div>

        {/* Redirect hint — shown when user came from wishlist/booking */}
        {nextPath && (
          <div style={{ background: 'var(--terracotta-pale)', border: '1px solid var(--terracotta)', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1rem' }}>🔒</span>
            <span>Sign in to continue — you'll be taken back automatically.</span>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '36px', boxShadow: '0 4px 20px rgba(74,92,63,0.08)' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', color: '#c0392b', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn-olive" style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '9px', marginTop: '4px', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--terracotta)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
