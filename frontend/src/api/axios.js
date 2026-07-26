import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token ──────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ttt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ──────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ttt_token');
      localStorage.removeItem('ttt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

// ── Convenience helpers ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register/', data),
  login: (data) => API.post('/auth/login/', data),
  me: () => API.get('/auth/me/'),
  updateMe: (data) => API.put('/auth/me/', data),
  logout: () => API.post('/auth/logout/'),
};

export const restaurantAPI = {
  list: (params) => API.get('/restaurants/', { params }),
  mine: () => API.get('/restaurants/mine/'),
  detail: (id) => API.get(`/restaurants/${id}/`),
  menu: (id) => API.get(`/restaurants/${id}/menu/`),
  create: (data) => API.post('/restaurants/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/restaurants/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const foodAPI = {
  list: (params) => API.get('/foods/', { params }),
  detail: (id) => API.get(`/foods/${id}/`),
  create: (data) => API.post('/foods/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/foods/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/foods/${id}/`),
  categories: () => API.get('/categories/'),
};

export const cartAPI = {
  get: () => API.get('/cart/'),
  addItem: (food_id, quantity = 1) => API.post('/cart/', { food_id, quantity }),
  updateItem: (food_id, quantity) => API.put(`/cart/item/${food_id}/`, { quantity }),
  removeItem: (food_id) => API.delete(`/cart/item/${food_id}/`),
  clear: () => API.delete('/cart/'),
};

export const orderAPI = {
  list: (params) => API.get('/orders/', { params }),
  detail: (id) => API.get(`/orders/${id}/`),
  place: (data) => API.post('/orders/', data),
  updateStatus: (id, status) => API.put(`/orders/${id}/status/`, { status }),
};

export const reservationAPI = {
  list: (params) => API.get('/reservations/', { params }),
  byRestaurant: (restaurant_id, status) =>
    API.get('/reservations/', { params: { restaurant_id, ...(status ? { status } : {}) } }),
  stats: (restaurant_id) =>
    API.get('/reservations/stats/', { params: restaurant_id ? { restaurant_id } : {} }),
  detail: (id) => API.get(`/reservations/${id}/`),
  create: (data) => API.post('/reservations/', data),
  updateStatus: (id, status) => API.put(`/reservations/${id}/status/`, { status }),
};

export const notificationAPI = {
  list: (unread) => API.get('/notifications/', { params: unread ? { unread: 'true' } : {} }),
  markRead: (id) => API.put(`/notifications/${id}/read/`),
  markAllRead: () => API.put('/notifications/read-all/'),
};

export const reviewAPI = {
  list: (restaurant_id) => API.get('/reviews/', { params: { restaurant: restaurant_id } }),
  create: (data) => API.post('/reviews/', data),
};

export const adminAPI = {
  restaurants: (params) => API.get('/admin/restaurants/', { params }),
  approveRestaurant: (id, approve) => API.put(`/admin/restaurants/${id}/approve/`, { approve }),
  users: (params) => API.get('/admin/users/', { params }),
  userDetail: (id) => API.get(`/admin/users/${id}/`),
  toggleUser: (id) => API.put(`/admin/users/${id}/`),
  stats: () => API.get('/admin/stats/'),
};

export const analyticsAPI = {
  restaurant: (id) => API.get(`/analytics/restaurant/${id}/`),
  platform: () => API.get('/analytics/platform/'),
  predict: (id) => API.get(`/analytics/predict/${id}/`),
};
