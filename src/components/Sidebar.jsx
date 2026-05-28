import React, { useState, useEffect } from 'react';
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
  lifetime: { label: 'Lifetime',  cls: 'lifetime', color: 'var(--gold, #d4af37)' },
};

// Language options: cycle EN → AR → FR → EN
const LANG_CYCLE = {
  en: { next: 'ar', flag: '🇦🇷', label: 'العربية' },   // currently EN → show AR option
  ar: { next: 'fr', flag: '🇫🇷', label: 'Français' }, // currently AR → show FR option
  fr: { next: 'en', flag: '🇬🇧', label: 'English' },   // currently FR → show EN option
};
// Correct flags for current language display
const LANG_FLAG = { en: '🇬🇧', ar: '🇦🇪', fr: '🇫🇷' };

// Live countdown hook
function useTrialCountdown(expiresAt) {
  const [data, setData] = useState({ display: '', hoursLeft: null, expired: false });

  useEffect(() => {
    function calc() {
      if (!expiresAt) return;
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setData({ display: 'Expired', hoursLeft: 0, expired: true }); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setData({
        display: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
        hoursLeft: diff / 3600000,
        expired: false,
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return data;
}

export default function Sidebar({ capitalInfo }) {
  const { user, logout, sub } = useAuth();
  const { lang, t, setLang, isRTL } = useLang();
  const isAdmin = user?.role === 'admin';

  const packInfo = sub ? PACK_LABELS[sub.pack] : null;
  const { display: countdownDisplay, hoursLeft, expired } = useTrialCountdown(
    sub?.pack !== 'lifetime' ? sub?.expires_at : null
  );

  // Compute expiry label for badge
  let expiresLabel = null;
  if (sub?.pack === 'lifetime') {
    expiresLabel = '∞ Never expires';
  } else if (sub?.expires_at) {
    if (expired) {
      expiresLabel = 'Expired';
    } else if (hoursLeft !== null && hoursLeft < 24) {
      // Show live countdown when less than 24h left
      expiresLabel = countdownDisplay;
    } else {
      const days = Math.ceil((new Date(sub.expires_at) - new Date()) / 86400000);
      expiresLabel = days > 0 ? `${days}d left` : 'Expired';
    }
  }

  const countdownColor = expired
    ? 'var(--red)'
    : hoursLeft !== null && hoursLeft < 1
      ? 'var(--red)'
      : hoursLeft !== null && hoursLeft < 6
        ? 'var(--orange)'
        : 'var(--green)';

  const langInfo = LANG_CYCLE[lang] || LANG_CYCLE['en'];

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

      {/* Subscription badge with live countdown */}
      {packInfo && (
        <div className={`sidebar-pack ${packInfo.cls}`}>
          <div className="pack-title" style={{ color: packInfo.color }}>{packInfo.label}</div>
          {expiresLabel && (
            <div
              className="pack-expire"
              style={{
                color: sub?.pack !== 'lifetime' && hoursLeft !== null && hoursLeft < 24
                  ? countdownColor
                  : undefined,
                fontFamily: sub?.pack !== 'lifetime' && hoursLeft !== null && hoursLeft < 24
                  ? 'monospace'
                  : undefined,
                fontWeight: sub?.pack !== 'lifetime' && hoursLeft !== null && hoursLeft < 24
                  ? 800
                  : undefined,
                fontSize: sub?.pack !== 'lifetime' && hoursLeft !== null && hoursLeft < 24
                  ? 13
                  : undefined,
                letterSpacing: sub?.pack !== 'lifetime' && hoursLeft !== null && hoursLeft < 24
                  ? 1
                  : undefined,
              }}
            >
              {expiresLabel}
            </div>
          )}
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

      {/* Language toggle — cycles EN → AR → FR → EN */}
      <button
        onClick={() => setLang(langInfo.next)}
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
        {/* Show current language flag + name, then arrow to next */}
        <span style={{ fontSize: 16 }}>{LANG_FLAG[lang]}</span>
        <span style={{ opacity: 0.5, fontSize: 11 }}>{lang.toUpperCase()}</span>
        <span style={{ opacity: 0.4 }}>→</span>
        <span style={{ fontSize: 16 }}>{langInfo.flag}</span>
        {langInfo.label}
      </button>

      <button className="sidebar-logout" onClick={logout}>
        ⏻ {t('logout')}
      </button>
    </aside>
  );
}
