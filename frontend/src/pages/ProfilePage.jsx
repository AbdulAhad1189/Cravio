import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/axios';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const res = await authAPI.updateMe({ name: form.name, email: form.email });
      updateUser(res.data.user || { ...user, name: form.name, email: form.email });
      setMsg('✓ Profile updated successfully!');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handlePw = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg('New passwords do not match.'); return; }
    setSavingPw(true); setPwMsg('');
    try {
      await authAPI.updateMe({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg('✓ Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.error || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  return (
    <>
      <div className="page-hero" style={{ padding: '2.5rem 0 2rem' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title mb-0">
            <i className="bi bi-person me-3" style={{ fontSize: '1.8rem' }} />My Profile
          </h1>
          <p className="section-subtitle mt-1">Manage your account details</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1rem 4rem', maxWidth: 680 }}>
        {/* Avatar */}
        <div className="text-center mb-5">
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2.5rem', fontWeight: 800, color: '#000',
            boxShadow: 'var(--shadow-gold)',
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <h4 style={{ marginBottom: 4 }}>{user?.name}</h4>
          <span className={`badge-${user?.role === 'owner' ? 'violet' : user?.role === 'admin' ? 'rose' : 'emerald'}`}>
            {user?.role}
          </span>
        </div>

        {/* Profile Form */}
        <div className="ttt-card mb-4" style={{ padding: '1.75rem' }}>
          <h5 style={{ marginBottom: '1.25rem' }}>
            <i className="bi bi-person-circle me-2" style={{ color: 'var(--brand-gold)' }} />
            Account Details
          </h5>
          {msg && (
            <div className={`ttt-alert ${msg.startsWith('✓') ? 'ttt-alert-success' : 'ttt-alert-error'} mb-3`}>
              {msg}
            </div>
          )}
          <form onSubmit={handleProfile}>
            <div className="mb-3">
              <label htmlFor="profile-name" className="ttt-label">Full Name</label>
              <input
                id="profile-name" type="text" className="ttt-input" style={{ width: '100%' }}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="profile-email" className="ttt-label">Email Address</label>
              <input
                id="profile-email" type="email" className="ttt-input" style={{ width: '100%' }}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
              />
            </div>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="ttt-card" style={{ padding: '1.75rem' }}>
          <h5 style={{ marginBottom: '1.25rem' }}>
            <i className="bi bi-shield-lock me-2" style={{ color: 'var(--brand-violet)' }} />
            Change Password
          </h5>
          {pwMsg && (
            <div className={`ttt-alert ${pwMsg.startsWith('✓') ? 'ttt-alert-success' : 'ttt-alert-error'} mb-3`}>
              {pwMsg}
            </div>
          )}
          <form onSubmit={handlePw}>
            <div className="mb-3">
              <label htmlFor="current-pw" className="ttt-label">Current Password</label>
              <input
                id="current-pw" type="password" className="ttt-input" style={{ width: '100%' }}
                value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="new-pw" className="ttt-label">New Password</label>
              <input
                id="new-pw" type="password" className="ttt-input" style={{ width: '100%' }}
                value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirm-pw" className="ttt-label">Confirm New Password</label>
              <input
                id="confirm-pw" type="password" className="ttt-input" style={{ width: '100%' }}
                value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required
              />
            </div>
            <button type="submit" className="btn-ghost" disabled={savingPw}>
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
