import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function generateDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'web-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    localStorage.setItem('device_id', id);
  }
  return id;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Please enter username'); return; }
    if (!password.trim()) { setError('Please enter password'); return; }
    setLoading(true);
    try {
      const deviceId = generateDeviceId();
      const res = await api.postNoAuth('/login', {
        user_name: username.trim(),
        password,
        device_id: deviceId,
      });
      if (res.success) {
        // Extract role from JWT if available
        let role = 'user';
        try {
          const payload = JSON.parse(atob(res.data.token.split('.')[1]));
          role = payload.role || 'user';
        } catch {}
        login(res.data.token, username.trim(), role);
        navigate('/');
      } else {
        setError(res.message || 'Login failed');
        setPassword('');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb1" />
        <div className="login-orb login-orb2" />
      </div>
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>TJ</div>
          <h1 className="login-title">TradeJournal <span>PRO</span></h1>
          <p className="login-sub">Sign in to your account</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="input"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="login-footer" style={{ marginTop: 20 }}>
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => navigate('/register')}>Get started</button>
          {' · '}
          <button className="link-btn" onClick={() => navigate('/')}>Back to home</button>
        </div>
      </div>
    </div>
  );
}
