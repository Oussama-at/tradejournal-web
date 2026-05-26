import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// ── Trial Countdown Popup ─────────────────────────────────
function TrialPopup({ sub, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      if (!sub?.expires_at) return;
      const diff = new Date(sub.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [sub]);

  const hoursLeft = sub?.expires_at ? (new Date(sub.expires_at) - new Date()) / 3600000 : 0;
  const isExpiringSoon = hoursLeft < 6 && hoursLeft > 0;
  const isExpired = hoursLeft <= 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg2)', border: `2px solid ${isExpired ? 'var(--red)' : isExpiringSoon ? 'var(--orange)' : 'var(--blue)'}`,
        borderRadius: 20, padding: '36px 32px', maxWidth: 380, width: '90%', textAlign: 'center',
        boxShadow: `0 0 40px ${isExpired ? 'rgba(255,80,80,0.25)' : isExpiringSoon ? 'rgba(255,160,0,0.25)' : 'rgba(0,120,255,0.25)'}`
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{isExpired ? '🔒' : isExpiringSoon ? '⚠️' : '⏱️'}</div>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
          {isExpired ? 'Trial Expired' : '24-Hour Trial Active'}
        </div>
        {!isExpired && (
          <>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
              Your trial subscription ends in:
            </div>
            <div style={{
              background: 'var(--bg)', borderRadius: 12, padding: '16px 24px', marginBottom: 20,
              fontFamily: 'monospace', fontSize: 28, fontWeight: 800,
              color: isExpiringSoon ? 'var(--orange)' : 'var(--text)',
              letterSpacing: 2,
              border: `1px solid ${isExpiringSoon ? 'var(--orange)' : 'var(--border)'}`
            }}>
              {timeLeft}
            </div>
            {isExpiringSoon && (
              <div style={{ color: 'var(--orange)', fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
                ⚠️ Less than 6 hours remaining! Upgrade now.
              </div>
            )}
          </>
        )}
        {isExpired && (
          <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
            Your trial has ended. Contact admin to get a subscription and continue using TradeJournal PRO.
          </div>
        )}
        <button
          onClick={onDismiss}
          style={{
            background: isExpired ? 'var(--red)' : isExpiringSoon ? 'var(--orange)' : 'var(--blue)',
            color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%'
          }}
        >
          {isExpired ? 'Got it' : 'Continue to app →'}
        </button>
      </div>
    </div>
  );
}

// ── Lifetime Welcome Flash ────────────────────────────────
function LifetimeFlash({ username, onDone }) {
  const [phase, setPhase] = useState(0); // 0=enter, 1=show, 2=exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 50);
    const t2 = setTimeout(() => setPhase(2), 4000);
    const t3 = setTimeout(() => onDone(), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at center, #0a1628 0%, #060c18 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      transition: 'opacity 0.8s ease',
      opacity: phase === 2 ? 0 : 1
    }}>
      {/* Particle stars */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: Math.random() * 3 + 1 + 'px', height: Math.random() * 3 + 1 + 'px',
          background: '#fff', borderRadius: '50%',
          top: Math.random() * 100 + '%', left: Math.random() * 100 + '%',
          opacity: Math.random() * 0.7 + 0.1,
          animation: `twinkle ${Math.random() * 2 + 1}s infinite alternate`
        }} />
      ))}

      {/* Gold beams */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(212,175,55,0.06) 20deg, transparent 40deg, rgba(212,175,55,0.04) 80deg, transparent 100deg, rgba(212,175,55,0.06) 200deg, transparent 220deg, rgba(212,175,55,0.04) 300deg, transparent 360deg)`,
        transition: 'opacity 0.5s',
        opacity: phase >= 1 ? 1 : 0
      }} />

      {/* Main card */}
      <div style={{
        textAlign: 'center', zIndex: 2,
        transform: phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
        opacity: phase >= 1 ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Crown icon */}
        <div style={{
          fontSize: 72, marginBottom: 8,
          filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.8))',
          animation: 'float 2s ease-in-out infinite'
        }}>👑</div>

        {/* Lifetime badge */}
        <div style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #d4af37, #f5e6a3, #d4af37)',
          borderRadius: 40, padding: '6px 24px', marginBottom: 20,
          fontWeight: 800, fontSize: 12, letterSpacing: 3, color: '#1a0a00',
          textTransform: 'uppercase', boxShadow: '0 0 20px rgba(212,175,55,0.5)'
        }}>
          ✦ Lifetime Member ✦
        </div>

        <div style={{
          fontSize: 38, fontWeight: 900, marginBottom: 8, letterSpacing: -1,
          background: 'linear-gradient(135deg, #fff 0%, #d4af37 50%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Welcome back,
        </div>
        <div style={{
          fontSize: 46, fontWeight: 900, marginBottom: 24,
          background: 'linear-gradient(135deg, #d4af37, #f5e6a3, #d4af37)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.4))'
        }}>
          {username}
        </div>

        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 1 }}>
          Your trading journey continues forever ∞
        </div>

        {/* Gold line */}
        <div style={{
          width: 120, height: 2, margin: '24px auto 0',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)'
        }} />
      </div>

      <style>{`
        @keyframes twinkle { from { opacity: 0.1; } to { opacity: 0.8; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
}

// ── Auth Provider ─────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [sub,     setSub]     = useState(null);
  const [showTrialPopup,   setShowTrialPopup]   = useState(false);
  const [showLifetimeFlash, setShowLifetimeFlash] = useState(false);
  const trialShownRef   = useRef(false);
  const lifetimeShownRef = useRef(false);

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
          api.get('/subscription/my').then(r => {
            if (r?.data) {
              setSub(r.data);
              maybeShowNotifications(r.data, false);
            }
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

  function maybeShowNotifications(subData, isNewLogin) {
    if (!subData) return;

    // Trial popup on every login
    if (subData.pack === 'trial' || (subData.pack !== 'lifetime' && subData.expires_at)) {
      if (isNewLogin || !trialShownRef.current) {
        trialShownRef.current = true;
        setShowTrialPopup(true);
      }
    }

    // Lifetime flash on every login (luxury feel)
    if (subData.pack === 'lifetime' && isNewLogin) {
      if (!lifetimeShownRef.current) {
        lifetimeShownRef.current = true;
        setShowLifetimeFlash(true);
      }
    }
  }

  function clearStorage() {
    ['token','username','role','device_id'].forEach(k => localStorage.removeItem(k));
  }

  const login = (token, username, role) => {
    localStorage.setItem('token',    token);
    localStorage.setItem('username', username);
    localStorage.setItem('role',     role || 'user');
    setUser({ username, token, role: role || 'user' });
    trialShownRef.current   = false;
    lifetimeShownRef.current = false;
    api.get('/subscription/my').then(r => {
      if (r?.data) {
        setSub(r.data);
        maybeShowNotifications(r.data, true);
      }
    }).catch(() => {});
  };

  const logout = () => {
    clearStorage();
    setUser(null);
    setSub(null);
    setShowTrialPopup(false);
    setShowLifetimeFlash(false);
    trialShownRef.current   = false;
    lifetimeShownRef.current = false;
  };

  const refreshSub = () => {
    api.get('/subscription/my').then(r => {
      if (r?.data) setSub(r.data);
    }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, sub, refreshSub }}>
      {children}
      {showLifetimeFlash && user && (
        <LifetimeFlash username={user.username} onDone={() => setShowLifetimeFlash(false)} />
      )}
      {showTrialPopup && sub && !showLifetimeFlash && (
        <TrialPopup sub={sub} onDismiss={() => setShowTrialPopup(false)} />
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
