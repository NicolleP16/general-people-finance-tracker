import { useState, useEffect } from 'react';
import api from '../api/axios';
import { getProfile } from '../services/authService';
import AuthContext from './auth-context';

const readStoredUser = () => {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('access_token');

  if (!savedUser || !token) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem('access_token'))
  );

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return undefined;

    let active = true;

    getProfile()
      .then((profile) => {
        if (!active) return;
        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    const { access, refresh, user: userData } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await api.post('/auth/register/', { name, email, password });
    const { access, refresh, user: userData } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
