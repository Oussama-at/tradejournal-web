import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';
import { NavLink, useNavigate } from 'react-router-dom';
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
  { key: 'myplan',    path: '/my-plan',         tkey: 'nav_myplan',      icon: '💳', userOnly: true },
  { key: 'logs',      path: '/logs',            tkey: 'nav_logs',        icon: '≡', admin: true },
  { key: 'act',       path: '/activations',     tkey: 'nav_activations', icon: '★', admin: true },
  { key: 'passreset',   path: '/password-resets', tkey: 'nav_pwd_resets',     icon: '⟳', admin: true },
  { key: 'emailchange', path: '/email-changes',   tkey: 'nav_email_changes',  icon: '✉️', admin: true },
  { key: 'alerts',   path: '/alerts',          tkey: 'nav_alerts',      icon: '📢', admin: true },
  null,
  { key: 'pass',      path: '/password',        tkey: 'nav_password',    icon: '🔒' },
  { key: 'profile',   path: '/profile',         tkey: 'nav_profile',     icon: '👤' },
];

const PACK_LABELS = {
  trial:    { label: '24h Trial', cls: 'trial',    color: 'var(--green)' },
  lifetime: { label: 'Lifetime',  cls: 'lifetime', color: 'var(--gold, #d4af37)' },
};

// Language config — using real flag images (Windows doesn't render emoji flags)
const LANGUAGES = [
  { code: 'en', label: 'English',  flagUrl: 'https://flagcdn.com/w40/us.png', short: 'EN' },
  { code: 'ar', label: 'العربية',  flagUrl: 'https://flagcdn.com/w40/sa.png', short: 'AR' },
  { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/w40/fr.png', short: 'FR' },
];

function FlagImg({ url, size = 20 }) {
  return (
    <img
      src={url}
      alt=""
      style={{ width: size, height: Math.round(size * 0.67), borderRadius: 3, objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

// ── Live countdown hook ───────────────────────────────────
function useCountdown(expiresAt) {
  const [state, setState] = useState({ h: 0, m: 0, s: 0, total: 0, pct: 100 });

  useEffect(() => {
    if (!expiresAt) return;
    // Assume 24h trial from creation — estimate start as expires_at - 24h
    const totalDuration = 24 * 3600 * 1000;

    function calc() {
      const now  = Date.now();
      const end  = new Date(expiresAt).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setState({ h: 0, m: 0, s: 0, total: 0, pct: 0 });
        return;
      }
      const h   = Math.floor(diff / 3600000);
      const m   = Math.floor((diff % 3600000) / 60000);
      const s   = Math.floor((diff % 60000) / 1000);
      const pct = Math.min(100, Math.max(0, (diff / totalDuration) * 100));
      setState({ h, m, s, total: diff, pct });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return state;
}

// ── Trial countdown widget ────────────────────────────────
function getEffectiveExpiry(sub) {
  // If server already gave us expires_at, use it directly
  if (sub?.expires_at) return sub.expires_at;

  // Fallback: use trial_start stored at login time + 24h
  try {
    const trialStart = localStorage.getItem('trial_start');
    if (trialStart) {
      const expiry = new Date(parseInt(trialStart, 10) + 24 * 3600 * 1000);
      return expiry.toISOString();
    }
  } catch {}

  return null;
}

function TrialCountdownWidget({ sub, navigate }) {
  const effectiveExpiry = getEffectiveExpiry(sub);
  const { h, m, s, pct } = useCountdown(effectiveExpiry);
  const hasExpiry  = !!effectiveExpiry;
  const isExpired  = hasExpiry && new Date(effectiveExpiry) <= new Date();
  const isUrgent   = hasExpiry && !isExpired && h < 1;
  const isWarning  = hasExpiry && !isExpired && !isUrgent && h < 6;

  const trackColor  = isExpired ? '#3a1010' : isUrgent ? '#3a1010' : isWarning ? '#2d2000' : '#0a2a18';
  const fillColor   = isExpired ? '#e74c3c' : isUrgent ? '#e74c3c' : isWarning ? '#f39c12' : '#00e676';
  const glowColor   = isExpired ? 'rgba(231,76,60,0.4)' : isUrgent ? 'rgba(231,76,60,0.35)' : isWarning ? 'rgba(243,156,18,0.35)' : 'rgba(0,230,118,0.3)';
  const textColor   = isExpired ? '#e74c3c' : isUrgent ? '#e74c3c' : isWarning ? '#f39c12' : '#00e676';

  const displayPct = hasExpiry ? pct : 100;
  const radius = 34;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ * (displayPct / 100);

  return (
    <div style={{
      margin: '4px 12px 8px',
      background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(20,20,35,0.6))',
      border: `1px solid ${isExpired || isUrgent ? 'rgba(231,76,60,0.35)' : isWarning ? 'rgba(243,156,18,0.25)' : 'rgba(0,230,118,0.2)'}`,
      borderRadius: 14,
      padding: '14px 14px 12px',
      cursor: isExpired ? 'pointer' : 'default',
      boxShadow: `0 0 20px ${glowColor}`,
      transition: 'box-shadow 0.3s',
    }}
    onClick={() => isExpired && navigate('/my-plan')}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--dim)', textTransform: 'uppercase' }}>
          {isExpired ? '⛔ EXPIRED' : '⏱ TRIAL'}
        </span>
        {!isExpired && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '2px 7px',
            background: isUrgent ? 'rgba(231,76,60,0.15)' : isWarning ? 'rgba(243,156,18,0.12)' : 'rgba(0,230,118,0.1)',
            borderRadius: 20, color: textColor, border: `1px solid ${textColor}44`,
          }}>
            {isUrgent ? 'URGENT' : isWarning ? 'WARNING' : 'ACTIVE'}
          </span>
        )}
      </div>

      {/* Circular progress + digits */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* SVG ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={40} cy={40} r={radius} fill="none" stroke={trackColor} strokeWidth={6} />
            {/* Fill */}
            <circle
              cx={40} cy={40} r={radius} fill="none"
              stroke={fillColor} strokeWidth={6}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px ${fillColor})`,
                transition: 'stroke-dasharray 0.5s ease',
              }}
            />
          </svg>
          {/* Percentage in center */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: textColor,
            fontFamily: 'monospace',
          }}>
            {isExpired ? '0%' : !hasExpiry ? '24h' : `${Math.round(pct)}%`}
          </div>
        </div>

        {/* HH:MM:SS digits */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {isExpired ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#e74c3c', fontWeight: 700, marginBottom: 6 }}>
                Trial ended
              </div>
              <div
                onClick={() => navigate('/my-plan')}
                style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                  padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                  background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                  color: '#fff', textAlign: 'center',
                }}
              >
                Upgrade →
              </div>
            </div>
          ) : !hasExpiry ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)', marginBottom: 4 }}>24h Trial</div>
              <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 8 }}>Active</div>
              <div
                onClick={() => navigate('/my-plan')}
                style={{
                  fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 7,
                  cursor: 'pointer', textAlign: 'center',
                  background: 'linear-gradient(135deg, #00e676, #00c853)',
                  color: '#000',
                }}
              >
                View Plans →
              </div>
            </div>
          ) : (
            <>
              <div style={{
                fontFamily: 'monospace', fontSize: 16, fontWeight: 900,
                color: textColor, letterSpacing: 0, lineHeight: 1,
                textShadow: `0 0 10px ${glowColor}`,
                whiteSpace: 'nowrap',
              }}>
                {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {['HRS','MIN','SEC'].map(l => (
                  <span key={l} style={{ fontSize: 8, color: 'var(--dim)', letterSpacing: 1, fontWeight: 600, flex: 1, textAlign: 'center' }}>{l}</span>
                ))}
              </div>
              {(isUrgent || isWarning) && (
                <div
                  onClick={() => navigate('/my-plan')}
                  style={{
                    marginTop: 8, fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                    padding: '4px 8px', borderRadius: 7, cursor: 'pointer', textAlign: 'center',
                    background: isUrgent
                      ? 'linear-gradient(135deg, #e74c3c, #c0392b)'
                      : 'linear-gradient(135deg, #f39c12, #d68910)',
                    color: '#fff',
                  }}
                >
                  Upgrade Now →
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress bar (linear) at bottom */}
      {hasExpiry && !isExpired && (
        <div style={{ marginTop: 10, background: trackColor, borderRadius: 4, height: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${fillColor}88, ${fillColor})`,
            borderRadius: 4, transition: 'width 0.5s ease',
            boxShadow: `0 0 6px ${fillColor}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ── Luxury Language Switcher ──────────────────────────────
function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div style={{ margin: '0 12px 8px', position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px',
          background: open
            ? 'linear-gradient(135deg, rgba(0,230,118,0.12), rgba(0,180,100,0.08))'
            : 'linear-gradient(135deg, rgba(0,230,118,0.06), rgba(0,180,100,0.04))',
          border: `1px solid ${open ? 'rgba(0,230,118,0.35)' : 'rgba(0,230,118,0.18)'}`,
          borderRadius: open ? '10px 10px 0 0' : 10,
          color: 'var(--green)', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          transition: 'all 0.2s',
          boxShadow: open ? '0 0 14px rgba(0,230,118,0.15)' : 'none',
        }}
      >
        <FlagImg url={current.flagUrl} />
        <span style={{ flex: 1, textAlign: 'left' }}>{current.label}</span>
        <span style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 5,
          background: 'rgba(0,230,118,0.12)', fontWeight: 800, letterSpacing: 1,
        }}>{current.short}</span>
        <span style={{
          fontSize: 10, opacity: 0.6,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s', display: 'inline-block',
        }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, right: 0,
          background: 'linear-gradient(180deg, #0e1420, #0a1020)',
          border: '1px solid rgba(0,230,118,0.25)',
          borderBottom: 'none',
          borderRadius: '10px 10px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
          zIndex: 200,
        }}>
          {LANGUAGES.map((l, i) => {
            const isActive = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(0,230,118,0.15), rgba(0,230,118,0.05))'
                    : 'transparent',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  color: isActive ? 'var(--green)' : 'var(--text, #ccc)',
                  cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 500,
                  transition: 'background 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <FlagImg url={l.flagUrl} />
                <span style={{ flex: 1 }}>{l.label}</span>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 5, letterSpacing: 1,
                  background: isActive ? 'rgba(0,230,118,0.2)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? 'var(--green)' : 'var(--dim)',
                  fontWeight: 800,
                }}>{l.short}</span>
                {isActive && <span style={{ fontSize: 12, color: 'var(--green)' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


const TYPE_STYLES = {
  info:    { border: '#00b4ff', icon: 'ℹ',  bg: 'rgba(0,180,255,0.08)',  text: '#7dd6f7' },
  warning: { border: '#ffb400', icon: '⚠',  bg: 'rgba(255,180,0,0.08)',  text: '#ffd060' },
  success: { border: '#00e676', icon: '✓',  bg: 'rgba(0,230,118,0.08)',  text: '#00e676' },
  danger:  { border: '#f44336', icon: '✕',  bg: 'rgba(244,67,54,0.08)',  text: '#f77066' },
};

function useAlerts(user) {
  const [alerts, setAlerts]       = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_alerts') || '[]'); }
    catch { return []; }
  });

  const fetch = useCallback(() => {
    if (!user) return;
    api.get('/alerts')
      .then(r => { if (r?.data?.alerts) setAlerts(r.data.alerts); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [fetch]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { sessionStorage.setItem('dismissed_alerts', JSON.stringify(next)); } catch {}
  };

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  return { visible, dismiss };
}

function NotificationBell({ user }) {
  const [open, setOpen]   = useState(false);
  const { visible, dismiss } = useAlerts(user);
  const panelRef = useRef(null);
  const count    = visible.length;

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes slideInPanel {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bellShake {
          0%,100% { transform: rotate(0deg); }
          20%      { transform: rotate(-18deg); }
          40%      { transform: rotate(18deg); }
          60%      { transform: rotate(-10deg); }
          80%      { transform: rotate(10deg); }
        }
        .bell-btn:hover .bell-icon { animation: bellShake 0.5s ease; }
      `}</style>

      {/* Bell button */}
      <button
        className="bell-btn"
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          position: 'relative',
          background: open ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 9,
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        <span className="bell-icon" style={{ fontSize: 17, lineHeight: 1 }}>🔔</span>
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#f44336',
            color: '#fff',
            fontSize: 9, fontWeight: 800,
            width: 17, height: 17,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #080c10',
            lineHeight: 1,
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Slide-in panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: 0, right: 0,
            width: 340,
            height: '100vh',
            background: 'linear-gradient(180deg, #0a0f16 0%, #080c10 100%)',
            borderLeft: '1px solid #1e2a35',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInPanel 0.25s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid #1e2a35',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div>
                <div style={{ color: '#e8edf3', fontWeight: 700, fontSize: 15 }}>Notifications</div>
                <div style={{ color: '#7a8a9a', fontSize: 11 }}>
                  {count === 0 ? 'All clear' : `${count} active alert${count > 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid #1e2a35',
                color: '#7a8a9a', borderRadius: 7, width: 30, height: 30,
                cursor: 'pointer', fontSize: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>

          {/* Alert list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {count === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                color: '#4a5a6a', paddingTop: 60,
              }}>
                <span style={{ fontSize: 48 }}>🔕</span>
                <div style={{ fontSize: 14, color: '#7a8a9a' }}>No notifications</div>
                <div style={{ fontSize: 12, color: '#4a5a6a', textAlign: 'center' }}>
                  You're all caught up!
                </div>
              </div>
            ) : visible.map(a => {
              const s = TYPE_STYLES[a.type] || TYPE_STYLES.info;
              return (
                <div key={a.id} style={{
                  background: s.bg,
                  border: `1px solid ${s.border}33`,
                  borderLeft: `3px solid ${s.border}`,
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ color: s.border, fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#dce8f0', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {a.message}
                    </div>
                    <div style={{ color: '#4a5a6a', fontSize: 10, marginTop: 5 }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(a.id)}
                    title="Dismiss"
                    style={{
                      background: 'none', border: 'none', color: '#4a5a6a',
                      cursor: 'pointer', fontSize: 15, padding: '0 2px',
                      flexShrink: 0, lineHeight: 1,
                    }}
                  >×</button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2a35', flexShrink: 0 }}>
              <button
                onClick={() => visible.forEach(a => dismiss(a.id))}
                style={{
                  width: '100%', padding: '9px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid #1e2a35', borderRadius: 7, color: '#7a8a9a',
                  cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Main Sidebar ──────────────────────────────────────────
export default function Sidebar({ capitalInfo }) {
  const { user, logout, sub } = useAuth();
  const { lang, t, setLang } = useLang();
  const isAdmin  = user?.role === 'admin';
  const navigate = useNavigate();

  const packInfo = sub ? PACK_LABELS[sub.pack] : null;

  // For lifetime: just show label + never expires
  const isTrial    = sub?.pack === 'trial';
  const isLifetime = sub?.pack === 'lifetime';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-icon">TJ</div>
          <div>
            <div className="brand-name">TradeJournal</div>
            <div className="brand-sub">PRO · v2.0</div>
          </div>
        </div>
        <NotificationBell user={user} />
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

      {/* Lifetime badge (simple) */}
      {isLifetime && packInfo && (
        <div className={`sidebar-pack ${packInfo.cls}`}>
          <div className="pack-title" style={{ color: packInfo.color }}>{packInfo.label}</div>
          <div className="pack-expire" style={{ color: 'var(--gold, #d4af37)' }}>∞ Never expires</div>
        </div>
      )}

      {/* Trial countdown widget — show for any trial pack (with or without expires_at) */}
      {isTrial && (
        <TrialCountdownWidget sub={sub} navigate={navigate} />
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

      {/* Luxury language switcher */}
      <LangSwitcher lang={lang} setLang={setLang} />

      <button className="sidebar-logout" onClick={logout}>
        ⏻ {t('logout')}
      </button>
    </aside>
  );
}
