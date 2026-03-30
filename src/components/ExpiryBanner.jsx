import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ExpiryBanner() {
  const { sub } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!sub || sub.pack === 'lifetime' || dismissed) return null;

  const days = daysLeft(sub.expires_at);
  if (days === null || days > 7) return null;

  const expired = days <= 0;

  return (
    <div className="expiry-banner">
      <span style={{ fontSize: 18 }}>{expired ? '🔒' : '⚠️'}</span>
      <div style={{ flex: 1 }}>
        {expired
          ? <>Your subscription has <strong>expired</strong>. Renew now to continue using the app. <button className="link-btn" onClick={() => navigate('/register')}>Renew →</button></>
          : <>Your subscription expires in <strong>{days} day{days !== 1 ? 's' : ''}</strong>. <button className="link-btn" onClick={() => navigate('/register')}>Renew now →</button></>
        }
      </div>
      {!expired && (
        <button
          style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
          onClick={() => setDismissed(true)}
        >✕</button>
      )}
    </div>
  );
}
