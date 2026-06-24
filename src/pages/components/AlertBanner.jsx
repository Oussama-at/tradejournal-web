import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Auto-dismiss countdown (seconds)
const AUTO_DISMISS_SEC = 5;

// Colours per alert type
const TYPE_STYLES = {
  info:    { bg: 'linear-gradient(135deg, rgba(0,180,255,0.18), rgba(0,180,255,0.07))', border: '#00b4ff', icon: 'ℹ', text: '#bde9fb', bar: '#00b4ff' },
  warning: { bg: 'linear-gradient(135deg, rgba(255,180,0,0.18), rgba(255,180,0,0.07))', border: '#ffb400', icon: '⚠', text: '#ffe2a6', bar: '#ffb400' },
  success: { bg: 'linear-gradient(135deg, rgba(0,230,118,0.18), rgba(0,230,118,0.07))', border: '#00e676', icon: '✓', text: '#9af5c4', bar: '#00e676' },
  danger:  { bg: 'linear-gradient(135deg, rgba(244,67,54,0.18), rgba(244,67,54,0.07))', border: '#f44336', icon: '✕', text: '#ffb3ac', bar: '#f44336' },
};

// Single floating toast with a 5s countdown
function Toast({ alert, onDismiss }) {
  const s = TYPE_STYLES[alert.type] || TYPE_STYLES.info;
  const [remaining, setRemaining] = useState(AUTO_DISMISS_SEC);
  const [leaving, setLeaving] = useState(false);
  const closedRef = useRef(false);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    setLeaving(true);
    setTimeout(() => onDismiss(alert.id), 260);
  }, [alert.id, onDismiss]);

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(tick); close(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [close]);

  const pct = (remaining / AUTO_DISMISS_SEC) * 100;

  const wrapStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 280,
    maxWidth: 380,
    padding: '10px 12px 13px',
    borderRadius: 12,
    background: s.bg,
    border: `1px solid ${s.border}`,
    borderLeft: `4px solid ${s.border}`,
    boxShadow: '0 14px 36px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: s.text,
    position: 'relative',
    overflow: 'hidden',
    animation: leaving
      ? 'alertJumpOut .25s ease forwards'
      : 'alertJumpIn .45s cubic-bezier(.22,1.4,.5,1) both',
  };
  const iconStyle = { fontSize: 18, lineHeight: 1, flexShrink: 0 };
  const msgStyle = { flex: 1, fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 };
  const countStyle = {
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 800,
    color: s.border,
    border: `1.5px solid ${s.border}`,
  };
  const closeStyle = {
    flexShrink: 0,
    background: 'transparent',
    border: 'none',
    color: s.text,
    cursor: 'pointer',
    fontSize: 17,
    lineHeight: 1,
    opacity: 0.8,
    padding: 2,
  };
  const barStyle = {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    width: `${pct}%`,
    background: s.bar,
    transition: 'width 1s linear',
    opacity: 0.9,
  };

  return (
    <div style={wrapStyle}>
      <span style={iconStyle}>{s.icon}</span>
      <span style={msgStyle}>{alert.message}</span>
      <span style={countStyle}>{remaining}</span>
      <button onClick={close} title="Close" style={closeStyle}>×</button>
      <div style={barStyle} />
    </div>
  );
}

// Main component
export default function AlertBanner() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_alerts') || '[]'); }
    catch { return []; }
  });

  const fetchAlerts = useCallback(() => {
    if (!user) return;
    api.get('/alerts')
      .then(r => { if (r?.data?.alerts) setAlerts(r.data.alerts); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60000); // refresh every minute
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const handleDismiss = (id) => {
    setDismissed(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try { sessionStorage.setItem('dismissed_alerts', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;

  const containerStyle = {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 5000,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
    maxWidth: '92vw',
    pointerEvents: 'none',
  };
  const itemStyle = { pointerEvents: 'auto' };

  return (
    <>
      <style>{`
        @keyframes alertJumpIn {
          0%   { opacity: 0; transform: translateY(-26px) scale(.9); }
          60%  { opacity: 1; transform: translateY(4px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes alertJumpOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-16px) scale(.92); }
        }
      `}</style>
      <div style={containerStyle}>
        {visible.map(a => (
          <div key={a.id} style={itemStyle}>
            <Toast alert={a} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
