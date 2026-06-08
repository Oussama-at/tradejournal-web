/**
 * SessionGuard — monitors JWT expiry and idle time.
 *
 * • IDLE_TIMEOUT_MS  : auto-logout after this much inactivity (default 30 min)
 * • WARN_BEFORE_MS   : show warning dialog this many ms before expiry (default 2 min)
 *
 * Shows two dialogs:
 *   1. Warning (N minutes left)  → "Stay Logged In" refreshes the token / resets idle,
 *                                  "Logout Now" logs out immediately.
 *   2. Expired notice            → "Go to Login" button.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLang } from '../lang/LangContext';
import { useAuth } from '../context/AuthContext';
import { msUntilExpiry } from '../utils/cookies';

const IDLE_TIMEOUT_MS  = 30 * 60 * 1000;   // 30 minutes
const WARN_BEFORE_MS   = 2  * 60 * 1000;   // warn 2 min before expiry
const TICK_INTERVAL_MS = 10 * 1000;        // check every 10 s

// ── Overlay base style ────────────────────────────────────────────────────
const OVERLAY = {
  position: 'fixed', inset: 0, zIndex: 99999,
  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};

// ── Warning Dialog ────────────────────────────────────────────────────────
function SessionWarningDialog({ minutesLeft, onStay, onLogout }) {
  const { t } = useLang();
  const [count, setCount] = useState(minutesLeft);

  // Countdown every second
  useEffect(() => {
    setCount(minutesLeft);
    const id = setInterval(() => setCount(c => Math.max(0, c - 1)), 60_000);
    return () => clearInterval(id);
  }, [minutesLeft]);

  return (
    <div style={OVERLAY}>
      <div style={{
        background: 'linear-gradient(160deg,#111820 0%,#0d1117 100%)',
        border: '1px solid rgba(255,180,0,0.35)',
        borderRadius: 20, padding: '36px 32px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        textAlign: 'center',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(255,180,0,0.1)',
          border: '2px solid rgba(255,180,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>⏱</div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 800, color: '#ffd060', marginBottom: 8 }}>
          {t('session_warning_title')}
        </div>

        {/* Message */}
        <div style={{ fontSize: 14, color: '#8aabb8', marginBottom: 8, lineHeight: 1.6 }}>
          {t('session_warning_msg').replace('{minutes}', count)}
        </div>

        {/* Countdown bar */}
        <div style={{
          height: 4, borderRadius: 4, background: 'rgba(255,180,0,0.15)',
          margin: '16px 0 24px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: 'linear-gradient(90deg,#ffd060,#ff9800)',
            width: `${Math.min(100, (count / minutesLeft) * 100)}%`,
            transition: 'width 1s linear',
          }} />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onLogout}
            style={{
              flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid rgba(255,71,87,0.35)',
              background: 'rgba(255,71,87,0.08)',
              color: '#ff5757', fontWeight: 700, fontSize: 14,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,71,87,0.08)'}
          >
            {t('session_logout_now')}
          </button>
          <button
            onClick={onStay}
            style={{
              flex: 2, padding: '12px', borderRadius: 10, cursor: 'pointer',
              border: 'none',
              background: 'linear-gradient(135deg,#ffd060,#ff9800)',
              color: '#1a0a00', fontWeight: 800, fontSize: 14,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ✓ {t('session_stay')}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.96); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,180,0,0.4)} 50%{box-shadow:0 0 0 12px rgba(255,180,0,0)} }
      `}</style>
    </div>
  );
}

// ── Expired Dialog ────────────────────────────────────────────────────────
function SessionExpiredDialog({ onLoginAgain }) {
  const { t } = useLang();
  return (
    <div style={OVERLAY}>
      <div style={{
        background: 'linear-gradient(160deg,#111820 0%,#0d1117 100%)',
        border: '1px solid rgba(255,71,87,0.35)',
        borderRadius: 20, padding: '36px 32px',
        maxWidth: 400, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        textAlign: 'center',
        animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(255,71,87,0.1)', border: '2px solid rgba(255,71,87,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
        }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#ff5757', marginBottom: 10 }}>
          {t('session_expired_title')}
        </div>
        <div style={{ fontSize: 14, color: '#8aabb8', marginBottom: 28, lineHeight: 1.6 }}>
          {t('session_expired_msg')}
        </div>
        <button
          onClick={onLoginAgain}
          style={{
            width: '100%', padding: '14px', borderRadius: 10, cursor: 'pointer',
            border: 'none',
            background: 'linear-gradient(135deg,#00e676,#00c853)',
            color: '#080c10', fontWeight: 800, fontSize: 15,
          }}
        >
          {t('session_login_again')}
        </button>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(0.96); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}

// ── SessionGuard (main export) ────────────────────────────────────────────
export default function SessionGuard() {
  const { user, logout } = useAuth();

  // 'idle' | 'warning' | 'expired'
  const [phase, setPhase] = useState('idle');
  const [minutesLeft, setMinutesLeft] = useState(2);

  const idleTimer   = useRef(null);
  const checkTimer  = useRef(null);
  const warnShown   = useRef(false);

  // ── reset idle timer on any user activity ──
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (!user) return;
    idleTimer.current = setTimeout(() => {
      setPhase('expired');
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [user, logout]);

  // ── periodic JWT-expiry check ──
  const checkExpiry = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const ms = msUntilExpiry(token);
    if (ms === null) return;

    if (ms <= 0) {
      // already expired
      setPhase('expired');
      logout();
      return;
    }
    if (ms <= WARN_BEFORE_MS && !warnShown.current) {
      warnShown.current = true;
      setMinutesLeft(Math.max(1, Math.ceil(ms / 60_000)));
      setPhase('warning');
    }
  }, [logout]);

  // ── setup / teardown on auth change ──
  useEffect(() => {
    if (!user) {
      clearTimeout(idleTimer.current);
      clearInterval(checkTimer.current);
      warnShown.current = false;
      setPhase('idle');
      return;
    }

    // start monitoring
    resetIdle();
    checkTimer.current = setInterval(checkExpiry, TICK_INTERVAL_MS);
    checkExpiry(); // immediate check

    // listen for user activity
    const EVENTS = ['mousemove','keydown','click','scroll','touchstart'];
    EVENTS.forEach(ev => window.addEventListener(ev, resetIdle, { passive: true }));

    return () => {
      clearTimeout(idleTimer.current);
      clearInterval(checkTimer.current);
      EVENTS.forEach(ev => window.removeEventListener(ev, resetIdle));
    };
  }, [user, resetIdle, checkExpiry]);

  // ── Stay logged in: reset warning flag and idle timer ──
  function handleStay() {
    warnShown.current = false;
    setPhase('idle');
    resetIdle();
    // Optionally call a refresh-token endpoint here:
    // api.post('/refresh-token').then(r => { if (r?.token) { ... } });
  }

  function handleLogout() {
    setPhase('idle');
    logout();
  }

  function handleLoginAgain() {
    setPhase('idle');
    logout();
    // Navigate to login — use window.location to avoid router dependency
    window.location.href = '/login';
  }

  if (!user) return null;

  if (phase === 'warning') {
    return (
      <SessionWarningDialog
        minutesLeft={minutesLeft}
        onStay={handleStay}
        onLogout={handleLogout}
      />
    );
  }

  if (phase === 'expired') {
    return <SessionExpiredDialog onLoginAgain={handleLoginAgain} />;
  }

  return null;
}
