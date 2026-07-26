import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would POST to a contact endpoint
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <div className="page-hero" style={{ padding: '3.5rem 0 2.5rem' }}>
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title">Contact Us</h1>
          <p className="section-subtitle">We'd love to hear from you. Drop us a message!</p>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1rem 5rem' }}>
        <div className="row g-5 justify-content-center">
          {/* Contact Info */}
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-3">
              {[
                { icon: 'bi-envelope', color: 'var(--brand-gold)', label: 'Email', value: 'hello@cravio.com' },
                { icon: 'bi-telephone', color: 'var(--brand-emerald)', label: 'Phone', value: '+1 (555) 000-FOOD' },
                { icon: 'bi-geo-alt', color: 'var(--brand-violet)', label: 'Address', value: '123 Flavor Street, New York, NY 10001' },
                { icon: 'bi-clock', color: 'var(--brand-rose)', label: 'Hours', value: 'Mon–Fri, 9am – 6pm EST' },
              ].map(item => (
                <div key={item.label} className="ttt-card" style={{ padding: '1.25rem' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: `${item.color}1a`, border: `1px solid ${item.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: '1.1rem' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="col-lg-7">
            <div className="ttt-card" style={{ padding: '2rem' }}>
              {sent ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Message Sent!</h4>
                  <p style={{ color: 'var(--text-muted)' }}>We'll get back to you within 24 hours.</p>
                  <button className="btn-gold mt-3" onClick={() => setSent(false)}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="ttt-label">Your Name</label>
                      <input id="contact-name" type="text" className="ttt-input" style={{ width: '100%' }}
                        placeholder="John Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div className="col-sm-6">
                      <label className="ttt-label">Email</label>
                      <input id="contact-email" type="email" className="ttt-input" style={{ width: '100%' }}
                        placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <label className="ttt-label">Subject</label>
                      <input id="contact-subject" type="text" className="ttt-input" style={{ width: '100%' }}
                        placeholder="How can we help?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <label className="ttt-label">Message</label>
                      <textarea id="contact-message" className="ttt-input" style={{ width: '100%', minHeight: 140, resize: 'vertical' }}
                        placeholder="Tell us more…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn-gold" style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
                        <i className="bi bi-send me-2" />Send Message
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
