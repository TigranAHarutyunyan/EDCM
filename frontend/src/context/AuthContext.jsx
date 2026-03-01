import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure we have a CSRF cookie so cookie-auth requests can include X-CSRFToken.
    api.get('csrf/').catch(() => {});

    // We can't read the HttpOnly auth cookie, so we keep user metadata in localStorage.
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) setUser(storedUser);
    setLoading(false);
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

  const logout = () => {
    api.post('auth/logout/').catch(() => {});
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
