export default function AboutPage() {
  return (
    <>
      <div className="page-hero" style={{ padding: '4rem 0 3rem' }}>
        <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="section-title">About Cravio</h1>
          <p className="section-subtitle" style={{ maxWidth: 560, margin: '0 auto' }}>
            We connect passionate food lovers with extraordinary restaurants — one unforgettable meal at a time.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '4rem 1rem' }}>
        <div className="row g-5 align-items-center mb-6">
          <div className="col-lg-6">
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Our Mission</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Cravio was born from a simple idea: great food deserves a great discovery experience.
              We've built a platform where restaurant owners can showcase their passion, and diners can find exactly
              what their taste buds are craving — from a cozy ramen bar to a fine-dining steakhouse.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: '1rem' }}>
              Every restaurant on our platform is carefully vetted to ensure quality, authenticity, and a commitment
              to exceptional hospitality.
            </p>
          </div>
          <div className="col-lg-6">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '🏆', title: 'Quality First', desc: 'Every restaurant vetted for excellence.' },
                { icon: '🌍', title: 'Diverse Cuisine', desc: 'Flavors from every corner of the world.' },
                { icon: '⚡', title: 'Fast & Easy', desc: 'Order or reserve in seconds.' },
                { icon: '💚', title: 'Support Local', desc: 'Empowering independent restaurants.' },
              ].map(item => (
                <div key={item.title} className="ttt-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{item.icon}</div>
                  <h6 style={{ marginBottom: 6 }}>{item.title}</h6>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="text-center mb-4">
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Our Values</h2>
          <p style={{ color: 'var(--text-muted)' }}>What drives everything we do</p>
        </div>
        <div className="row g-4">
          {[
            { icon: 'bi-stars', color: 'var(--brand-gold)', title: 'Excellence', desc: 'We hold ourselves and our partner restaurants to the highest standards of quality and service.' },
            { icon: 'bi-people', color: 'var(--brand-violet)', title: 'Community', desc: 'We believe food brings people together. Our platform is built to strengthen food communities.' },
            { icon: 'bi-shield-check', color: 'var(--brand-emerald)', title: 'Trust', desc: 'Transparent reviews, verified restaurants, and secure payments — always.' },
          ].map(v => (
            <div key={v.title} className="col-md-4">
              <div className="ttt-card" style={{ padding: '2rem', height: '100%' }}>
                <i className={`bi ${v.icon}`} style={{ fontSize: '2rem', color: v.color, marginBottom: '1rem', display: 'block' }} />
                <h5 style={{ marginBottom: '0.75rem' }}>{v.title}</h5>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
