import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const PACKS = {
  trial:    { label: '24h Trial', price: 0,   isFree: true },
  '6months':{ label: '6 Months', price: 50,  isFree: false },
  '1year':  { label: '1 Year',   price: 100, isFree: false },
  lifetime: { label: 'Lifetime', price: 300, isFree: false },
};

const CRYPTO_OPTIONS = [
  { symbol: 'BTC',  name: 'Bitcoin',  icon: '₿',  address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  { symbol: 'USDT', name: 'USDT (TRC20)', icon: '₮', address: 'TJCuJngR7M3KVBh5JXgAnbvhPhAKHRoKqN' },
  { symbol: 'ETH',  name: 'Ethereum', icon: 'Ξ',  address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
];

export default function Register() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const initPack   = params.get('pack') || 'trial';

  const [step,   setStep]   = useState(1); // 1=email, 2=pack, 3=payment, 4=confirm
  const [email,  setEmail]  = useState('');
  const [pack,   setPack]   = useState(initPack);
  const [method, setMethod] = useState('card'); // 'card' | 'crypto'
  const [crypto, setCrypto] = useState('BTC');
  const [copied, setCopied] = useState(false);
  const [loading,setLoading]= useState(false);
  const [msg,    setMsg]    = useState(null);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const selectedPack = PACKS[pack] || PACKS.trial;
  const isFree = selectedPack.isFree;

  const steps = isFree
    ? [{ n: 1, label: 'Email' }, { n: 2, label: 'Plan' }, { n: 3, label: 'Confirm' }]
    : [{ n: 1, label: 'Email' }, { n: 2, label: 'Plan' }, { n: 3, label: 'Payment' }, { n: 4, label: 'Confirm' }];

  // If pack is trial, skip payment step

  async function submitEmail() {
    if (!email.includes('@')) { setMsg({ type: 'error', text: 'Please enter a valid email address' }); return; }
    setLoading(true);
    setMsg(null);
    // We validate email exists / send verification — using existing API or simulating
    // For now we just move to next step (email verification will be sent at final step)
    setLoading(false);
    setStep(2);
  }

  function submitPack() {
    if (isFree) {
      setStep(3); // skip payment
    } else {
      setStep(3); // go to payment
    }
  }

  async function submitPayment() {
    if (method === 'card') {
      if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
        setMsg({ type: 'error', text: 'Please fill all card fields' }); return;
      }
    }
    // Move to final confirmation
    setStep(4);
  }

  async function finalSubmit() {
    setLoading(true);
    setMsg(null);
    try {
      // Register via API — sends confirmation email with credentials
      const res = await api.postNoAuth('/register', {
        email,
        pack,
        payment_method: isFree ? 'free' : method,
        payment_crypto: method === 'crypto' ? crypto : undefined,
      });

      if (res?.success) {
        navigate('/email-sent?email=' + encodeURIComponent(email));
      } else {
        setMsg({ type: 'error', text: res?.message || 'Registration failed. Please try again.' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Cannot reach server. Please try again.' });
    }
    setLoading(false);
  }

  function copyAddress() {
    const addr = CRYPTO_OPTIONS.find(c => c.symbol === crypto)?.address || '';
    navigator.clipboard.writeText(addr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const currentStep = isFree
    ? (step === 3 ? 3 : step)
    : step;

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb1" />
        <div className="login-orb login-orb2" />
      </div>
      <div className="login-box" style={{ maxWidth: 520 }}>
        {/* Header */}
        <div className="login-header">
          <div className="login-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>TJ</div>
          <h1 className="login-title">Create Account</h1>
          <p className="login-sub">Join TradeJournal PRO</p>
        </div>

        {/* Steps indicator */}
        <div className="steps">
          {steps.map((s, i) => {
            const done   = currentStep > s.n;
            const active = currentStep === s.n;
            return (
              <React.Fragment key={s.n}>
                <div className={`step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                  <div className="step-num">{done ? '✓' : s.n}</div>
                  <div className="step-label">{s.label}</div>
                </div>
                {i < steps.length - 1 && <div className={`step-line ${done ? 'done' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitEmail()}
                autoFocus
              />
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Your login credentials will be sent to this email
              </div>
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 13 }} onClick={submitEmail} disabled={loading}>
              {loading ? 'Checking...' : 'Continue →'}
            </button>
            <div className="login-footer">
              Already have an account? <button className="link-btn" onClick={() => navigate('/login')}>Sign in</button>
            </div>
          </div>
        )}

        {/* Step 2: Choose plan */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Choose your plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(PACKS).map(([key, p]) => (
                <div
                  key={key}
                  onClick={() => setPack(key)}
                  style={{
                    padding: '14px 16px', border: '2px solid', borderRadius: 10, cursor: 'pointer',
                    borderColor: pack === key ? 'var(--green)' : 'var(--border)',
                    background: pack === key ? 'rgba(0,230,118,0.05)' : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {key === 'trial' && '24 hours · Full access · No card needed'}
                      {key === '6months' && '6 months access · All features'}
                      {key === '1year' && '12 months access · Best value per month'}
                      {key === 'lifetime' && 'Pay once · Access forever · All updates'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18,
                    color: key === 'lifetime' ? 'var(--gold)' : key === 'trial' ? 'var(--green)' : 'var(--text)',
                    flexShrink: 0, marginLeft: 16 }}>
                    {p.isFree ? 'FREE' : `$${p.price}`}
                  </div>
                </div>
              ))}
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13 }} onClick={submitPack}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment (only for paid plans) */}
        {step === 3 && !isFree && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>Payment</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--green)' }}>
                ${selectedPack.price}
              </div>
            </div>

            {/* Method picker */}
            <div className="payment-methods">
              <div className={`payment-method ${method === 'card' ? 'selected' : ''}`} onClick={() => setMethod('card')}>
                <div className="pm-icon">💳</div>
                <div className="pm-name">Bank Card</div>
                <div className="pm-sub">Visa / Mastercard</div>
              </div>
              <div className={`payment-method ${method === 'crypto' ? 'selected' : ''}`} onClick={() => setMethod('crypto')}>
                <div className="pm-icon">₿</div>
                <div className="pm-name">Crypto</div>
                <div className="pm-sub">BTC / USDT / ETH</div>
              </div>
            </div>

            {/* Card form */}
            {method === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Cardholder Name</label>
                  <input className="input" placeholder="John Doe" value={cardForm.name}
                    onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input className="input mono" placeholder="1234 5678 9012 3456" value={cardForm.number}
                    maxLength={19}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g,'').replace(/(\d{4})/g,'$1 ').trim();
                      setCardForm(f => ({ ...f, number: v }));
                    }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Expiry</label>
                    <input className="input mono" placeholder="MM/YY" value={cardForm.expiry}
                      maxLength={5}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g,'');
                        if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2,4);
                        setCardForm(f => ({ ...f, expiry: v }));
                      }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input className="input mono" placeholder="123" value={cardForm.cvv} maxLength={4}
                      onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g,'') }))} />
                  </div>
                </div>
                <div className="alert alert-info" style={{ fontSize: 12 }}>
                  🔒 Your payment is processed securely. Card details are not stored on our servers.
                </div>
              </div>
            )}

            {/* Crypto form */}
            {method === 'crypto' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Choose a cryptocurrency and send <strong style={{ color: 'var(--text)' }}>${selectedPack.price}</strong> to the address below.
                  Your account will be activated after payment confirmation.
                </div>
                <div className="crypto-list">
                  {CRYPTO_OPTIONS.map(c => (
                    <div key={c.symbol}
                      className={`crypto-item ${crypto === c.symbol ? 'selected' : ''}`}
                      onClick={() => setCrypto(c.symbol)}>
                      <div className="crypto-symbol" style={{ color: c.symbol === 'BTC' ? '#f7931a' : c.symbol === 'ETH' ? '#627eea' : '#26a17b' }}>
                        {c.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                        <div className="crypto-address">{c.address}</div>
                      </div>
                      <button
                        className={`btn btn-ghost crypto-copy ${copied && crypto === c.symbol ? 'btn-primary' : ''}`}
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={e => { e.stopPropagation(); setCrypto(c.symbol); copyAddress(); }}
                      >
                        {copied && crypto === c.symbol ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="alert alert-warning" style={{ fontSize: 12 }}>
                  ⚠️ After sending, click "Confirm" and your account will be created. Admin will verify and activate within 24h.
                </div>
              </div>
            )}

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13 }} onClick={submitPayment}>
                Confirm Payment →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 (free) or Step 4 (paid): Review & Submit */}
        {((step === 3 && isFree) || (step === 4 && !isFree)) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Review & Create Account</div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Email', email],
                ['Plan', selectedPack.label],
                ['Amount', isFree ? 'FREE' : `$${selectedPack.price}`],
                ...(!isFree ? [['Payment', method === 'card' ? 'Bank Card' : `Crypto (${crypto})`]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="alert alert-info" style={{ fontSize: 12 }}>
              📧 Your <strong>username and password</strong> will be sent to <strong>{email}</strong> after registration.
              Please check your inbox (and spam folder).
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(isFree ? 2 : 3)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13 }}
                onClick={finalSubmit} disabled={loading}>
                {loading ? 'Creating account...' : '🚀 Create My Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
