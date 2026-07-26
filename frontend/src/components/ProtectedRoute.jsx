import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a route to enforce authentication and optional role check.
 * Usage:
 *   <Route element={<ProtectedRoute />}>...</Route>
 *   <Route element={<ProtectedRoute role="owner" />}>...</Route>
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-ring" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    // Redirect to appropriate dashboard
    const dashMap = { admin: '/admin', owner: '/owner', customer: '/' };
    return <Navigate to={dashMap[user.role] || '/'} replace />;
  }

  return children;
}
