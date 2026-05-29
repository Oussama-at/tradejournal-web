import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Colours per alert type ────────────────────────────────
const TYPE_STYLES = {
  info:    { bg: 'rgba(0,180,255,0.13)',  border: '#00b4ff', icon: 'ℹ',  text: '#7dd6f7' },
  warning: { bg: 'rgba(255,180,0,0.13)', border: '#ffb400', icon: '⚠',  text: '#ffd060' },
  success: { bg: 'rgba(0,230,118,0.13)', border: '#00e676', icon: '✓',  text: '#00e676' },
  danger:  { bg: 'rgba(244,67,54,0.13)', border: '#f44336', icon: '✕',  text: '#f77066' },
};

// ── Single banner item ────────────────────────────────────
function Banner({ alert, onDismiss }) {
  const s = TYPE_STYLES[alert.type] || TYPE_STYLES.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 18px',
      background: s.bg,
      borderLeft: `3px solid ${s.border}`,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      animation: 'alertSlideIn 0.3s ease',
    }}>
      <span style={{ fontSize: 16, color: s.border, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ flex: 1, fontSize: 13, color: '#dce8f0', lineHeight: 1.45 }}>
        {alert.message}
      </span>
      <button
        onClick={() => onDismiss(alert.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#7a8a9a', fontSize: 16, lineHeight: 1, padding: '0 2px',
          flexShrink: 0,
        }}
        title="Dismiss"
      >×</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function AlertBanner() {
  const { user } = useAuth();
  const [alerts, setAlerts]       = useState([]);
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
    const id = setInterval(fetchAlerts, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const handleDismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { sessionStorage.setItem('dismissed_alerts', JSON.stringify(next)); } catch {}
  };

  const visible = alerts.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;

  return (
    <>
      <style>{`
        @keyframes alertSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ width: '100%' }}>
        {visible.map(a => (
          <Banner key={a.id} alert={a} onDismiss={handleDismiss} />
        ))}
      </div>
    </>
  );
}
