import React from 'react';
import { useLang } from '../lang/LangContext';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { key: 'dash',      path: '/',                tkey: 'nav_dashboard',   icon: '▦' },
  { key: 'chart',     path: '/chart',           tkey: 'nav_chart',       icon: '↗' },
  { key: 'trades',    path: '/trades',          tkey: 'nav_trades',      icon: '⊟' },
  { key: 'add',       path: '/add-trade',       tkey: 'nav_add_trade',   icon: '+' },
  { key: 'capital',   path: '/capital',         tkey: 'nav_capital',     icon: '◎' },
  { key: 'withdraw',  path: '/withdraw',        tkey: 'nav_withdraw',    icon: '↓' },
  null,
  { key: 'users',     path: '/users',           tkey: 'nav_users',       icon: '⊞', admin: true },
  { key: 'subs',      path: '/subscriptions',   tkey: 'nav_subs',        icon: '💳', admin: true },
  { key: 'myplan',    path: '/my-plan',          tkey: 'nav_myplan',      icon: '💳', userOnly: true },
  { key: 'logs',      path: '/logs',            tkey: 'nav_logs',        icon: '≡', admin: true },
  { key: 'act',       path: '/activations',     tkey: 'nav_activations', icon: '★', admin: true },
  { key: 'passreset', path: '/password-resets', tkey: 'nav_pwd_resets',  icon: '⟳', admin: true },
  null,
  { key: 'pass',      path: '/password',        tkey: 'nav_password',    icon: '🔒' },
  { key: 'profile',   path: '/profile',         tkey: 'nav_profile',     icon: '👤' },
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
  const { lang, t, toggleLang, isRTL } = useLang();
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
          if (item.userOnly && isAdmin) return null;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {t(item.tkey)}
              {item.admin && <span className="admin-tag">ADMIN</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        style={{
          margin: '0 12px 8px',
          padding: '9px 14px',
          background: 'rgba(0,230,118,0.07)',
          border: '1px solid rgba(0,230,118,0.2)',
          borderRadius: 8,
          color: 'var(--green)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.13)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,230,118,0.07)'}
      >
        <span style={{ fontSize: 16 }}>{lang === 'en' ? '🇸🇦' : '🇬🇧'}</span>
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      <button className="sidebar-logout" onClick={logout}>
        ⏻ {t('logout')}
      </button>
    </aside>
  );
}
