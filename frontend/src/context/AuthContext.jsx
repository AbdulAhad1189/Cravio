import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ttt_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('ttt_token');
    if (token) {
      authAPI.me()
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('ttt_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('ttt_token');
          localStorage.removeItem('ttt_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('ttt_token', token);
    localStorage.setItem('ttt_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authAPI.register(formData);
    const { token, user: userData } = res.data;
    localStorage.setItem('ttt_token', token);
    localStorage.setItem('ttt_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('ttt_token');
    localStorage.removeItem('ttt_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ttt_user', JSON.stringify(updatedUser));
  }, []);

  const isRole = useCallback((role) => user?.role === role, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
