import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ExpiryBanner from './components/ExpiryBanner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import { EmailSent, BlockedPage } from './pages/StatusPages';
import Dashboard from './pages/Dashboard';
import Chart from './pages/Chart';
import Trades from './pages/Trades';
import AddTrade from './pages/AddTrade';
import Subscriptions from './pages/Subscriptions';
import {
  Capital, Withdraw, Users, Logs,
  Activations, PasswordReset, Profile, Password
} from './pages/OtherPages';
import api from './services/api';
import './index.css';

// ── Helpers ─────────────────────────────────────────────
function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isExpired(sub) {
  if (!sub) return false;
  if (sub.pack === 'lifetime') return false;
  if (sub.blocked) return true;
  const days = daysLeft(sub.expires_at);
  return days !== null && days <= 0;
}

// ── Protected app shell ──────────────────────────────────
function AppLayout() {
  const { user, sub } = useAuth();
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

  // If user is blocked or subscription expired → show blocked page
  if (user.role !== 'admin' && isExpired(sub)) {
    return <BlockedPage />;
  }

  return (
    <div className="app-layout">
      <Sidebar capitalInfo={capInfo} />
      <main className="main-content">
        <ExpiryBanner />
        <Routes>
          <Route path="/"                 element={<Dashboard />} />
          <Route path="/chart"            element={<Chart />} />
          <Route path="/trades"           element={<Trades />} />
          <Route path="/add-trade"        element={<AddTrade />} />
          <Route path="/capital"          element={<Capital />} />
          <Route path="/withdraw"         element={<Withdraw />} />
          <Route path="/users"            element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/subscriptions"    element={<AdminRoute><Subscriptions /></AdminRoute>} />
          <Route path="/logs"             element={<AdminRoute><Logs /></AdminRoute>} />
          <Route path="/activations"      element={<AdminRoute><Activations /></AdminRoute>} />
          <Route path="/password-resets"  element={<AdminRoute><PasswordReset /></AdminRoute>} />
          <Route path="/profile"          element={<Profile />} />
          <Route path="/password"         element={<Password />} />
          <Route path="*"                 element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// ── Admin-only guard ─────────────────────────────────────
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// ── Public route (redirect to app if already logged in) ──
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (user) return <Navigate to="/" replace />;
  return children;
}

// ── Root: landing is shown to everyone ──────────────────
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  // Logged-in users see the app (AppLayout handles auth + routes)
  if (user) return <AppLayout />;
  // Everyone else sees the landing page
  return <Landing />;
}

// ── App root ─────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/"           element={<RootRoute />} />
          <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"   element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/email-sent" element={<EmailSent />} />

          {/* Protected app */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
