import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import ReservationsPage from './pages/ReservationsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OwnerReservationDashboard from './pages/OwnerReservationDashboard';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';

/** Layout with Navbar + Footer */
function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 72px)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

/** Layout without Footer (dashboards) */
function DashboardLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public routes with Navbar + Footer */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer protected routes */}
              <Route path="/cart" element={
                <ProtectedRoute role="customer"><CartPage /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute role="customer"><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/orders/:orderId" element={
                <ProtectedRoute role="customer"><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/reservations" element={
                <ProtectedRoute role="customer"><ReservationsPage /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
            </Route>

            {/* Dashboard routes (no footer) */}
            <Route element={<DashboardLayout />}>
              <Route path="/owner" element={
                <ProtectedRoute role="owner"><OwnerDashboardPage /></ProtectedRoute>
              } />
              <Route path="/owner/reservations" element={
                <ProtectedRoute role="owner"><OwnerReservationDashboard /></ProtectedRoute>
              } />
              <Route path="/owner/reservations/:restaurantId" element={
                <ProtectedRoute role="owner"><OwnerReservationDashboard /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
