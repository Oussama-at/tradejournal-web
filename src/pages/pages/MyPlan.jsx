import React from 'react';
import { useAuth } from '../context/AuthContext';
import PaymentDialog from '../components/PaymentDialog';

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Live countdown component
function TrialCountdown({ expiresAt }) {
  const [display, setDisplay] = React.useState('');
  const [hoursLeft, setHoursLeft] = React.useState(null);

  React.useEffect(() => {
    function calc() {
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

  const color = hoursLeft === null ? 'var(--green)'
    : hoursLeft < 1 ? 'var(--red)'
    : hoursLeft < 6 ? 'var(--orange)'
    : 'var(--green)';

  return (
    <div style={{
      background: 'var(--bg)', borderRadius: 8, padding: '8px 16px',
      fontFamily: 'monospace', fontSize: 20, fontWeight: 800,
      color,
      border: `1px solid ${hoursLeft !== null && hoursLeft < 1 ? 'var(--red)' : hoursLeft !== null && hoursLeft < 6 ? 'var(--orange)' : 'var(--border)'}`,
      letterSpacing: 2,
    }}>
      ⏱ {display}
    </div>
  );
}

const PLANS = [
  {
    key: 'lifetime',
    label: 'Lifetime',
    price: 'Contact Admin',
    icon: '👑',
    color: 'var(--gold, #d4af37)',
    features: [
      'Lifetime access — never expires',
      'All trading tools',
      'P&L Charts',
      'Capital tracking',
      'Priority support',
      'Future features included',
    ],
  },
];

export default function MyPlan() {
  const { sub } = useAuth();
  const [payOpen, setPayOpen] = React.useState(false);

  const days = sub?.expires_at ? daysLeft(sub.expires_at) : null;
  const expired = sub?.pack !== 'lifetime' && days !== null && days <= 0;

  const packColors = {
    trial:    'var(--green)',
    lifetime: 'var(--gold, #d4af37)',
    free:     'var(--dim)',
  };
  const packLabels = {
    trial:    '24h Trial',
    lifetime: 'Lifetime',
    free:     'Free',
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💳 My Plan</div>
        <div className="page-sub">Your current subscription &amp; upgrade options</div>
      </div>

      <PaymentDialog open={payOpen} onClose={() => setPayOpen(false)} />

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

          {/* Live countdown for active trial */}
          {sub?.pack === 'trial' && !expired && sub?.expires_at && (
            <TrialCountdown expiresAt={sub.expires_at} />
          )}

          {sub?.pack === 'lifetime' && (
            <div style={{ fontWeight: 600, color: 'var(--gold, #d4af37)' }}>∞ Never expires</div>
          )}

          {sub?.expires_at && sub?.pack !== 'lifetime' && !expired && (
            <div style={{ color: 'var(--dim)', fontSize: 13 }}>
              Expires: {new Date(sub.expires_at).toLocaleString()}
            </div>
          )}

          {expired && (
            <div style={{ color: 'var(--red)', fontWeight: 600 }}>
              ⚠️ Your plan has expired. Upgrade to regain access.
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Options — only show for non-lifetime */}
      {sub?.pack !== 'lifetime' && (
        <>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
            🚀 Upgrade Your Plan
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            {PLANS.map(plan => (
              <div key={plan.key} className="card" style={{
                padding: 32, position: 'relative',
                border: `2px solid ${plan.color}`,
                boxShadow: '0 0 40px rgba(212,175,55,0.2)',
                width: '100%', maxWidth: 420,
              }}>
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: '#1a0a00', borderRadius: 20,
                  padding: '4px 18px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
                  letterSpacing: 1,
                }}>
                  ⭐ RECOMMENDED
                </div>

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 56, marginBottom: 10, filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.6))' }}>{plan.icon}</div>
                  <div style={{ fontWeight: 900, fontSize: 26, color: plan.color, marginBottom: 4 }}>{plan.label}</div>
                  <div style={{ color: 'var(--dim)', fontSize: 13 }}>{plan.price}</div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: plan.color, fontWeight: 700, fontSize: 16 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPayOpen(true); }}
                  style={{
                    display: 'block', textAlign: 'center',
                    background: plan.color, color: '#1a0a00',
                    borderRadius: 10, padding: '13px 0',
                    fontWeight: 800, fontSize: 15, textDecoration: 'none',
                    letterSpacing: 0.5,
                  }}
                >
                  💳 Pay / Upgrade →
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
