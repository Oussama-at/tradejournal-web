import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function useCountdown(expiresAt) {
  const [display, setDisplay] = useState('');
  const [hoursLeft, setHoursLeft] = useState(null);

  useEffect(() => {
    function calc() {
      if (!expiresAt) return;
      const diff = new Date(expiresAt) - new Date();
      setHoursLeft(diff / 3600000);
      if (diff <= 0) { setDisplay('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return { display, hoursLeft };
}

export default function ExpiryBanner() {
  const { sub } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const { display, hoursLeft } = useCountdown(sub?.expires_at);

  if (!sub || sub.pack === 'lifetime' || dismissed) return null;
  if (hoursLeft === null || hoursLeft > 1 || hoursLeft <= 0) return null;

  // Only show in the last 60 minutes before expiry
  const mins = Math.floor((hoursLeft * 60));
  const isLastMins = mins <= 10;

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: isLastMins
        ? 'linear-gradient(90deg, #c0392b, #e74c3c)'
        : 'linear-gradient(90deg, #e67e22, #f39c12)',
      color: '#fff',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: isLastMins ? '0 2px 20px rgba(231,76,60,0.5)' : '0 2px 20px rgba(243,156,18,0.4)',
      animation: isLastMins ? 'pulse-red 1.5s ease-in-out infinite' : undefined,
    }}>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 2px 20px rgba(231,76,60,0.5); }
          50% { box-shadow: 0 2px 40px rgba(231,76,60,0.9); }
        }
      `}</style>
      <span style={{ fontSize: 20 }}>{isLastMins ? '🚨' : '⚠️'}</span>
      <div style={{ flex: 1 }}>
        <strong>
          {isLastMins
            ? `⏰ Only ${mins} minute${mins !== 1 ? 's' : ''} left on your trial! `
            : `⚠️ Your trial expires in less than 1 hour! `}
        </strong>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 16, letterSpacing: 2 }}>
          {display}
        </span>
        {' — '}
        <button
          onClick={() => navigate('/my-plan')}
          style={{
            background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)',
            color: '#fff', borderRadius: 6, padding: '2px 12px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          Upgrade Now →
        </button>
      </div>
      <button
        style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, opacity: 0.8 }}
        onClick={() => setDismissed(true)}
      >✕</button>
    </div>
  );
}
