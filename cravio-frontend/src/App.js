import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// 404
import NotFound from './pages/NotFound';

// Public pages
import Home from './pages/Home';
import Restaurants from './pages/Restaurants';
import RestaurantDetail from './pages/RestaurantDetail';
import About from './pages/About';
import Contact from './pages/Contact';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer pages
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import Reservations from './pages/Reservations';
import OrderNow from './pages/OrderNow';
import Profile from './pages/Profile';

// Owner pages — have their own sidebar layout
import OwnerDashboard from './pages/owner/Dashboard';
import ManageMenu from './pages/owner/ManageMenu';
import ManageOrders from './pages/owner/ManageOrders';
import ManageReservations from './pages/owner/ManageReservations';

// Admin pages — have their own sidebar layout
import AdminDashboard from './pages/admin/Dashboard';
import ManageRestaurants from './pages/admin/ManageRestaurants';
import ManageUsers from './pages/admin/ManageUsers';

// Routes that use their own full-page layout (no shared Navbar/Footer)
const DASHBOARD_ROUTES = [
  '/owner/dashboard', '/owner/menu', '/owner/orders', '/owner/reservations',
  '/admin/dashboard', '/admin/restaurants', '/admin/users',
];

function AppShell({ children }) {
  const location = useLocation();
  const isDashboard = DASHBOARD_ROUTES.some(r => location.pathname.startsWith(r));

  if (isDashboard) {
    // Dashboard pages handle their own layout (sidebar included)
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer */}
        <Route path="/cart" element={<ProtectedRoute roles={['customer']}><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['customer']}><OrderHistory /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute roles={['customer']}><Reservations /></ProtectedRoute>} />
        <Route path="/order-now" element={<ProtectedRoute roles={['customer']}><OrderNow /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Owner — full-page layout with sidebar */}
        <Route path="/owner/dashboard" element={<ProtectedRoute roles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/menu" element={<ProtectedRoute roles={['owner']}><ManageMenu /></ProtectedRoute>} />
        <Route path="/owner/orders" element={<ProtectedRoute roles={['owner']}><ManageOrders /></ProtectedRoute>} />
        <Route path="/owner/reservations" element={<ProtectedRoute roles={['owner']}><ManageReservations /></ProtectedRoute>} />

        {/* Admin — full-page layout with sidebar */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/restaurants" element={<ProtectedRoute roles={['admin']}><ManageRestaurants /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default App;
