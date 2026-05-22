import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pulse_token');
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => localStorage.removeItem('pulse_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('pulse_token', data.accessToken);
    localStorage.setItem('pulse_refresh', data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, username, displayName, password) => {
    const data = await api.register({ email, username, displayName, password });
    localStorage.setItem('pulse_token', data.accessToken);
    localStorage.setItem('pulse_refresh', data.refreshToken);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_refresh');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
