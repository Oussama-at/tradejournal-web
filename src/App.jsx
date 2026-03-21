import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chart from './pages/Chart';
import Trades from './pages/Trades';
import AddTrade from './pages/AddTrade';
import { Capital, Withdraw, Users, Logs, Activations, PasswordReset, Profile, Password } from './pages/OtherPages';
import api from './services/api';
import './index.css';

function AppLayout() {
  const { user } = useAuth();
  const [capInfo, setCapInfo] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/capital/current').then(r => {
        const d = r?.data;
        if (d) {
          const now = d.capital_now || 0, dep = d.capital_depart || 0;
          setCapInfo({ now, pct: dep > 0 ? ((now - dep) / dep * 100) : 0 });
        }
      }).catch(() => {});
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar capitalInfo={capInfo} />
      <main className="main-content">
        <Routes>
          <Route path="/"                 element={<Dashboard />} />
          <Route path="/chart"            element={<Chart />} />
          <Route path="/trades"           element={<Trades />} />
          <Route path="/add-trade"        element={<AddTrade />} />
          <Route path="/capital"          element={<Capital />} />
          <Route path="/withdraw"         element={<Withdraw />} />
          <Route path="/users"            element={<Users />} />
          <Route path="/logs"             element={<Logs />} />
          <Route path="/activations"      element={<Activations />} />
          <Route path="/password-resets"  element={<PasswordReset />} />
          <Route path="/profile"          element={<Profile />} />
          <Route path="/password"         element={<Password />} />
          <Route path="*"                 element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute />} />
          <Route path="/*"     element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
