import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { key: 'dash',      path: '/',                label: 'Dashboard',       icon: '▦' },
  { key: 'chart',     path: '/chart',           label: 'P&L Chart',       icon: '↗' },
  { key: 'trades',    path: '/trades',          label: 'Trades',          icon: '⊟' },
  { key: 'add',       path: '/add-trade',       label: 'Add Trade',       icon: '+' },
  { key: 'capital',   path: '/capital',         label: 'Capital Archive', icon: '◎' },
  { key: 'withdraw',  path: '/withdraw',        label: 'Withdraw',        icon: '↓' },
  null,
  { key: 'users',     path: '/users',           label: 'Manage Users',    icon: '⊞', admin: true },
  { key: 'subs',      path: '/subscriptions',   label: 'Subscriptions',   icon: '💳', admin: true },
  { key: 'logs',      path: '/logs',            label: 'Activity Logs',   icon: '≡', admin: true },
  { key: 'act',       path: '/activations',     label: 'Activations',     icon: '★', admin: true },
  { key: 'passreset', path: '/password-resets', label: 'Pwd Resets',      icon: '⟳', admin: true },
  null,
  { key: 'pass',      path: '/password',        label: 'Update Password', icon: '🔒' },
  { key: 'profile',   path: '/profile',         label: 'My Profile',      icon: '👤' },
];

const PACK_LABELS = {
  trial:    { label: '24h Trial', cls: 'trial',    color: 'var(--green)' },
  '6months':{ label: '6 Months', cls: 'pro',      color: 'var(--blue)' },
  '1year':  { label: '1 Year',   cls: 'pro',      color: 'var(--purple)' },
  lifetime: { label: 'Lifetime', cls: 'lifetime', color: 'var(--gold)' },
};

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Sidebar({ capitalInfo }) {
  const { user, logout, sub } = useAuth();
  const isAdmin = user?.role === 'admin';

  const packInfo = sub ? PACK_LABELS[sub.pack] : null;
  const days = sub?.expires_at ? daysLeft(sub.expires_at) : null;
  const expiresLabel = sub?.pack === 'lifetime'
    ? 'Never expires'
    : days !== null ? (days > 0 ? `${days}d left` : 'Expired') : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">TJ</div>
        <div>
          <div className="brand-name">TradeJournal</div>
          <div className="brand-sub">PRO · v2.0</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
        <div className="user-info">
          <div className="user-name">{user?.username}</div>
          {capitalInfo && (
            <div className={`user-cap mono ${capitalInfo.pct >= 0 ? 'green' : 'red'}`}>
              {capitalInfo.now?.toLocaleString()}$ {capitalInfo.pct >= 0 ? '+' : ''}{capitalInfo.pct?.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Subscription badge */}
      {packInfo && (
        <div className={`sidebar-pack ${packInfo.cls}`}>
          <div className="pack-title" style={{ color: packInfo.color }}>{packInfo.label}</div>
          {expiresLabel && <div className="pack-expire">{expiresLabel}</div>}
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (!item) return <div key={i} className="nav-divider" />;
          if (item.admin && !isAdmin) return null;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.admin && <span className="admin-tag">ADMIN</span>}
            </NavLink>
          );
        })}
      </nav>

      <button className="sidebar-logout" onClick={logout}>
        ⏻ Logout
      </button>
    </aside>
  );
}
