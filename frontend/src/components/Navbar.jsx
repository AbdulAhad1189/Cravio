import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';

/* Fork-knife icon SVG matching FeastHub */
const ForkIcon = () => (
  <div style={{
    width: 36, height: 36, borderRadius: 10,
    background: '#f04923', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  </div>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinkStyle = {
    textDecoration: 'none',
    color: '#59564d',
    fontWeight: 500,
    fontSize: '0.9rem',
    transition: 'color 0.2s',
  };

  return (
    <nav className="navbar navbar-expand-md sticky-top">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand" to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <ForkIcon />
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000000', letterSpacing: '-0.02em' }}>Cravio</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          style={{ color: 'var(--text-secondary)' }}
        >
          <i className="bi bi-list fs-3" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          {/* Center nav links */}
          <ul className="navbar-nav mx-auto gap-4 align-items-center mt-2 mt-md-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/restaurants" end style={navLinkStyle}>
                Restaurants
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/restaurants?cuisine=all" style={navLinkStyle}>
                Cuisines
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/restaurants?offers=1" style={navLinkStyle}>
                Offers
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/contact" style={navLinkStyle}>
                Reserve
              </NavLink>
            </li>
          </ul>

          {/* Right side */}
          <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
            {user ? (
              <>
                {/* User dropdown */}
                <div className="nav-item dropdown" style={{ listStyle: 'none' }}>
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center gap-2"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    style={{ color: '#000000', fontWeight: 500, fontSize: '0.9rem' }}
                  >
                    <span
                      style={{
                        width: 30, height: 30,
                        borderRadius: '50%',
                        background: '#f04923',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                      }}
                    >
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <span className="d-none d-lg-inline">{user.name?.split(' ')[0]}</span>
                  </a>
                  <ul
                    className="dropdown-menu dropdown-menu-end shadow-sm border-0"
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      minWidth: 190,
                      padding: '8px 0',
                    }}
                  >
                    <li>
                      <Link className="dropdown-item" to="/profile"
                        style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '8px 16px' }}>
                        <i className="bi bi-person me-2" />Profile
                      </Link>
                    </li>
                    {user.role === 'customer' && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/orders"
                            style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '8px 16px' }}>
                            <i className="bi bi-clock-history me-2" />Orders
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/reservations"
                            style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '8px 16px' }}>
                            <i className="bi bi-calendar2 me-2" />Reservations
                          </Link>
                        </li>
                      </>
                    )}
                    {user.role === 'owner' && (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/owner"
                            style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '8px 16px' }}>
                            <i className="bi bi-grid me-2" />Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/owner/reservations"
                            style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '8px 16px' }}>
                            <i className="bi bi-calendar2-week me-2" />Reservation Dashboard
                          </Link>
                        </li>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <li>
                        <Link className="dropdown-item" to="/admin"
                          style={{ color: 'var(--text-primary)', fontSize: '0.875rem', padding: '8px 16px' }}>
                          <i className="bi bi-shield-check me-2" />Admin Dashboard
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" style={{ borderColor: 'var(--border-subtle)' }} /></li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={handleLogout}
                        style={{ color: '#f04923', fontSize: '0.875rem', padding: '8px 16px', fontWeight: 600 }}
                      >
                        <i className="bi bi-box-arrow-right me-2" />Logout
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Cart button (customers) */}
                {user.role === 'customer' && (
                  <Link
                    to="/cart"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: '#f04923', color: '#fff',
                      padding: '8px 20px', borderRadius: 999,
                      fontWeight: 700, fontSize: '0.85rem',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    <i className="bi bi-bag-fill" />
                    Cart · {itemCount}
                  </Link>
                )}
              </>
            ) : (
              <>
                <NavLink to="/login" style={{ ...navLinkStyle, color: '#000000', fontWeight: 600 }}>
                  Sign in
                </NavLink>
                <Link
                  to="/cart"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#f04923', color: '#fff',
                    padding: '8px 20px', borderRadius: 999,
                    fontWeight: 700, fontSize: '0.85rem',
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  <i className="bi bi-bag-fill" />
                  Cart · {itemCount}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
