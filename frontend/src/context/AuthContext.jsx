import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure we have a CSRF cookie so cookie-auth requests can include X-CSRFToken.
    api.get('csrf/').catch(() => {});

    const loadMe = async () => {
      // If cookie-auth is active, prefer the server as the source of truth.
      try {
        const meRes = await api.get('auth/me/');
        localStorage.setItem('user', JSON.stringify(meRes.data));
        setUser(meRes.data);
      } catch {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('auth/login/', { username, password });
    const { token, ...userData } = response.data;
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password, fullName, role) => {
    await api.post('auth/register/', { 
        username, 
        email, 
        password, 
        full_name: fullName, 
        role 
    });
    // Auto login after register
    return login(username, password);
  };

  const logout = async () => {
    // Server clears the HttpOnly cookie; client clears any non-HttpOnly cookies it can see.
    try {
      await api.post('auth/logout/');
    } catch {
      // Still clear local state even if network fails.
    }

    // Clear CSRF cookie (not HttpOnly by default).
    if (typeof document !== 'undefined') {
      document.cookie = 'csrftoken=; Max-Age=0; path=/';
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
