import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { confirm_password, ...data } = form;
      const user = await register(data);
      if (user.role === 'owner') navigate('/owner/dashboard');
      else navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (!data) {
        setError('Registration failed. Please check your connection.');
        return;
      }
      // Map common backend field errors to readable messages
      if (data.email) {
        setError(Array.isArray(data.email) ? data.email[0] : data.email);
      } else if (data.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else if (data.password) {
        setError(Array.isArray(data.password) ? data.password[0] : data.password);
      } else if (typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(' | ');
        setError(msgs);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg></div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--dark)', marginBottom: '6px' }}>Join Cravio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>Create your account and start exploring</p>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border)', padding: '36px', boxShadow: '0 4px 20px rgba(74,92,63,0.08)' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', color: '#c0392b', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          {/* Role Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
            {[{ value: 'customer', label: '🙋 I\'m a Customer', desc: 'Browse & order food' },
              { value: 'owner', label: '🏪 I\'m an Owner', desc: 'Manage my restaurant' }].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, role: opt.value })}
                style={{
                  padding: '14px', border: `2px solid ${form.role === opt.value ? 'var(--olive)' : 'var(--border)'}`,
                  borderRadius: '10px', background: form.role === opt.value ? 'var(--olive-pale)' : 'white',
                  cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === opt.value ? 'var(--olive)' : 'var(--dark)' }}>{opt.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="form-cravio" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>First Name</label>
                <input placeholder="John" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
              </div>
              <div>
                <label>Last Name</label>
                <input placeholder="Doe" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
              </div>
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label>Confirm Password</label>
              <input type="password" placeholder="Repeat your password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-olive" style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '9px', marginTop: '4px', opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
