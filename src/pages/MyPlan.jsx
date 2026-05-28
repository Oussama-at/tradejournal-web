import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const PLANS = [
  {
    key: '6months',
    label: '6 Months',
    price: 'Contact Admin',
    icon: '📅',
    color: 'var(--blue)',
    features: ['Full access for 6 months', 'All trading tools', 'P&L Charts', 'Capital tracking'],
  },
  {
    key: '1year',
    label: '1 Year',
    price: 'Contact Admin',
    icon: '🗓️',
    color: 'var(--purple, #9b59b6)',
    features: ['Full access for 1 year', 'All trading tools', 'P&L Charts', 'Capital tracking', 'Priority support'],
    popular: true,
  },
  {
    key: 'lifetime',
    label: 'Lifetime',
    price: 'Contact Admin',
    icon: '👑',
    color: 'var(--gold, #d4af37)',
    features: ['Lifetime access', 'All trading tools', 'P&L Charts', 'Capital tracking', 'Priority support', 'Future features included'],
  },
];

export default function MyPlan() {
  const { sub } = useAuth();
  const navigate = useNavigate();

  const days = sub?.expires_at ? daysLeft(sub.expires_at) : null;
  const expired = sub?.pack !== 'lifetime' && days !== null && days <= 0;

  const packColors = {
    trial: 'var(--green)',
    '6months': 'var(--blue)',
    '1year': 'var(--purple, #9b59b6)',
    lifetime: 'var(--gold, #d4af37)',
    free: 'var(--dim)',
  };
  const packLabels = {
    trial: '24h Trial', '6months': '6 Months', '1year': '1 Year',
    lifetime: 'Lifetime', free: 'Free',
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💳 My Plan</div>
        <div className="page-sub">Your current subscription & upgrade options</div>
      </div>

      {/* Current Plan Card */}
      <div className="card" style={{ marginBottom: 28, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Current Plan
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{
            background: expired ? 'var(--red)' : packColors[sub?.pack] || 'var(--dim)',
            color: '#fff', borderRadius: 10, padding: '8px 20px',
            fontWeight: 800, fontSize: 18,
          }}>
            {expired ? '⛔ Expired' : (packLabels[sub?.pack] || 'No Plan')}
          </div>

          {sub?.pack === 'trial' && !expired && days !== null && (
            <div style={{ fontWeight: 600, color: days <= 0 ? 'var(--red)' : days < 1 ? 'var(--orange)' : 'var(--green)' }}>
              ⏱ {days > 0 ? `${days} day${days !== 1 ? 's' : ''} remaining` : 'Less than 1 day remaining'}
            </div>
          )}

          {sub?.pack === 'lifetime' && (
            <div style={{ fontWeight: 600, color: 'var(--gold, #d4af37)' }}>∞ Never expires</div>
          )}

          {sub?.expires_at && sub?.pack !== 'lifetime' && !expired && (
            <div style={{ color: 'var(--dim)', fontSize: 13 }}>
              Expires: {new Date(sub.expires_at).toLocaleDateString()}
            </div>
          )}

          {expired && (
            <div style={{ color: 'var(--red)', fontWeight: 600 }}>
              ⚠️ Your plan has expired. Upgrade to regain access.
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Options */}
      {sub?.pack !== 'lifetime' && (
        <>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            🚀 Upgrade Your Plan
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
            {PLANS.map(plan => (
              <div key={plan.key} className="card" style={{
                padding: 24, position: 'relative',
                border: plan.popular ? `2px solid ${plan.color}` : '1px solid var(--border)',
                transition: 'transform 0.15s',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: plan.color, color: '#fff', borderRadius: 20,
                    padding: '3px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  }}>
                    ⭐ Most Popular
                  </div>
                )}
                <div style={{ fontSize: 32, marginBottom: 8 }}>{plan.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: plan.color, marginBottom: 4 }}>{plan.label}</div>
                <div style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 16 }}>{plan.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: plan.color, fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/your-number"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', textAlign: 'center',
                    background: plan.color, color: '#fff',
                    borderRadius: 8, padding: '10px 0',
                    fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  }}
                >
                  Contact Admin →
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {sub?.pack === 'lifetime' && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--gold, #d4af37)', marginBottom: 8 }}>You have Lifetime Access</div>
          <div style={{ color: 'var(--dim)' }}>Enjoy all features forever. Thank you for your support!</div>
        </div>
      )}
    </div>
  );
}
