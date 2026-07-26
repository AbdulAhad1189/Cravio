export default function StarRating({ rating = 0, max = 5, onChange, size = 'md' }) {
  const sizes = { sm: '1rem', md: '1.3rem', lg: '1.6rem' };
  const fontSize = sizes[size] || sizes.md;

  return (
    <div className="d-inline-flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <i
          key={star}
          className={`bi ${star <= rating ? 'bi-star-fill' : 'bi-star'}`}
          style={{
            fontSize,
            color: star <= rating ? 'var(--brand-gold)' : 'var(--text-muted)',
            cursor: onChange ? 'pointer' : 'default',
            transition: 'color 0.15s ease',
          }}
          onClick={() => onChange && onChange(star)}
          onMouseOver={e => { if (onChange) e.target.style.color = 'var(--brand-gold-light)'; }}
          onMouseOut={e => { if (onChange) e.target.style.color = star <= rating ? 'var(--brand-gold)' : 'var(--text-muted)'; }}
        />
      ))}
    </div>
  );
}
