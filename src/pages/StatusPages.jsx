import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function EmailSent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email    = params.get('email') || 'your email';

  return (
    <div className="confirm-page">
      <div className="confirm-box">
        <div className="confirm-icon">📧</div>
        <h2 className="confirm-title">Check your inbox!</h2>
        <p className="confirm-sub" style={{ marginBottom: 24 }}>
          We've sent your <strong>username and password</strong> to:
          <br />
          <strong style={{ color: 'var(--blue)', display: 'block', marginTop: 8, wordBreak: 'break-all' }}>{email}</strong>
        </p>
        <p className="confirm-sub" style={{ marginBottom: 32 }}>
          Once you receive your credentials, you can log in immediately.
          For paid plans, your account will be activated after payment verification.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }}
            onClick={() => navigate('/login')}>
            Go to Login →
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--dim)' }}>
          Didn't receive it? Check spam or contact support.
        </p>
      </div>
    </div>
  );
}

export function BlockedPage() {
  const navigate = useNavigate();

  return (
    <div className="blocked-page">
      <div className="blocked-box">
        <div className="blocked-icon">🔒</div>
        <h2 className="blocked-title">Account Access Blocked</h2>
        <p className="blocked-sub" style={{ marginBottom: 24 }}>
          Your subscription has expired or your access has been suspended.
          Please renew your plan to continue using TradeJournal PRO.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }}
            onClick={() => navigate('/register')}>
            🔄 Renew Subscription
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { localStorage.clear(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: 'var(--dim)' }}>
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </div>
  );
}
