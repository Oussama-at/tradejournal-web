import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const PACKS = {
  trial:    { label: '24h Trial', price: 0,   isFree: true,  currency: '' },
  lifetime: { label: 'Lifetime', price: 700, originalPrice: 1000, discount: '-30%', isFree: false, currency: 'DH' },
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
                    borderColor: pack === key ? (key === 'lifetime' ? 'var(--gold)' : 'var(--green)') : 'var(--border)',
                    background: pack === key ? (key === 'lifetime' ? 'rgba(246,216,96,0.05)' : 'rgba(0,230,118,0.05)') : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {key === 'trial' && '24 heures · Accès complet · Sans carte'}
                      {key === 'lifetime' && 'Payer une fois · Accès à vie · Toutes les mises à jour'}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18,
                    color: key === 'lifetime' ? 'var(--gold)' : 'var(--green)',
                    flexShrink: 0, marginLeft: 16 }}>
                    {p.isFree ? 'FREE' : `${p.price} ${p.currency}`}
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

        {/* Step 3: Payment (only for paid plans = Lifetime via WhatsApp) */}
        {step === 3 && !isFree && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>Paiement</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99 }}>🔥 -30%</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--dim)', textDecoration: 'line-through' }}>1000 DH</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold)', fontSize: 20 }}>700 DH</span>
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(246,216,96,0.06)', border: '1px solid rgba(246,216,96,0.25)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 28 }}>💬</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Paiement via WhatsApp</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Contactez-nous pour finaliser votre paiement</div>
                </div>
              </div>
              <a
                href={`https://wa.me/212635925986?text=Bonjour%2C+je+veux+souscrire+au+pack+Lifetime+700DH+%28promo+-30%25%29.+Mon+email+est+${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: 15,
                  background: 'linear-gradient(135deg,#f6d860,#e6b800)', color: '#080c10',
                  textDecoration: 'none', cursor: 'pointer',
                }}
              >
                💬 Contacter sur WhatsApp — +212 635 925 986
              </a>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                Après confirmation du paiement, votre <strong style={{ color: 'var(--text)' }}>username + mot de passe</strong> seront envoyés à <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </div>
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>← Retour</button>
              <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 13 }} onClick={submitPayment}>
                J'ai effectué le paiement →
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
                ['Amount', isFree ? 'FREE' : `${selectedPack.price} ${selectedPack.currency}`],
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
