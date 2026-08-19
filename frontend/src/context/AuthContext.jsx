import { createContext, useState, useEffect } from 'react';
import { authApi } from '../services/api/authApi';

export const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function resolvePhotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');

    if (token && savedRole) {
      setRole(savedRole);
      // Restore any cached user data (photo_url etc.)
      try {
        const saved = localStorage.getItem('user_data');
        setUser(saved ? JSON.parse(saved) : { role: savedRole });
      } catch {
        setUser({ role: savedRole });
      }

      // If student, fetch fresh profile to get latest photo_url
      if (savedRole === 'student') {
        import('../services/api/axiosInstance').then(({ default: axios }) => {
          axios.get('/student/profile').then(res => {
            const p = res.data;
            const userData = { role: savedRole, photo_url: resolvePhotoUrl(p?.photo_url) };
            setUser(userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
          }).catch(() => {});
        });
      }
    }

    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await authApi.login(identifier, password);
      const { token, role } = response;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      const userData = { role };
      setRole(role);
      setUser(userData);

      // Fetch photo for students right after login
      if (role === 'student') {
        import('../services/api/axiosInstance').then(({ default: axios }) => {
          axios.get('/student/profile').then(res => {
            const p = res.data;
            const enriched = { role, photo_url: resolvePhotoUrl(p?.photo_url) };
            setUser(enriched);
            localStorage.setItem('user_data', JSON.stringify(enriched));
          }).catch(() => {});
        });
      }

      return { success: true, role };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout().catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_data');
      setRole(null);
      setUser(null);
    }
  };

  // Allow other components (e.g. StudentDashboard) to update the photo in context
  const updateUserPhoto = (photoUrl) => {
    setUser(prev => {
      const updated = { ...prev, photo_url: resolvePhotoUrl(photoUrl) };
      localStorage.setItem('user_data', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, updateUserPhoto }}>
      {children}
    </AuthContext.Provider>
  );
};
