import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV = [
  { key: 'dash',      path: '/',           label: 'Dashboard',       icon: '▦' },
  { key: 'chart',     path: '/chart',      label: 'P&L Chart',       icon: '↗' },
  { key: 'trades',    path: '/trades',     label: 'Trades',          icon: '⊟' },
  { key: 'add',       path: '/add-trade',  label: 'Add Trade',       icon: '+' },
  { key: 'capital',   path: '/capital',    label: 'Capital Archive', icon: '◎' },
  { key: 'withdraw',  path: '/withdraw',   label: 'Withdraw',        icon: '↓' },
  null, // divider
  { key: 'users',     path: '/users',      label: 'Manage Users',    icon: '⊞', admin: true },
  { key: 'logs',      path: '/logs',       label: 'Activity Logs',   icon: '≡', admin: true },
  { key: 'act',       path: '/activations',label: 'Activations',     icon: '★', admin: true },
  { key: 'passreset', path: '/password-resets', label: 'Pwd Resets', icon: '⟳', admin: true },
  null,
  { key: 'pass',      path: '/password',   label: 'Update Password', icon: '🔒' },
  { key: 'profile',   path: '/profile',    label: 'My Profile',      icon: '👤' },
];

export default function Sidebar({ capitalInfo }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (!item) return <div key={i} className="nav-divider" />;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.admin ? 'admin' : ''}`}
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
