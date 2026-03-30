import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [sub,     setSub]     = useState(null); // subscription info

  useEffect(() => {
    const token    = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role     = localStorage.getItem('role');
    if (token && username) {
      try {
        const parts   = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ username, token, role: role || 'user' });
          // Load subscription info
          api.get('/subscription/my').then(r => {
            if (r?.data) setSub(r.data);
          }).catch(() => {});
        } else {
          clearStorage();
        }
      } catch {
        clearStorage();
      }
    }
    setLoading(false);
  }, []);

  function clearStorage() {
    ['token','username','role','device_id'].forEach(k => localStorage.removeItem(k));
  }

  const login = (token, username, role) => {
    localStorage.setItem('token',    token);
    localStorage.setItem('username', username);
    localStorage.setItem('role',     role || 'user');
    setUser({ username, token, role: role || 'user' });
    // Load sub
    api.get('/subscription/my').then(r => {
      if (r?.data) setSub(r.data);
    }).catch(() => {});
  };

  const logout = () => {
    clearStorage();
    setUser(null);
    setSub(null);
  };

  const refreshSub = () => {
    api.get('/subscription/my').then(r => {
      if (r?.data) setSub(r.data);
    }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, sub, refreshSub }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
