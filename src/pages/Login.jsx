import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../lang/LangContext';
import api from '../services/api';
import { getConsent, getSavedUsername, saveSavedUsername, clearSavedUsername } from '../utils/cookies';

function generateDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'web-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
    localStorage.setItem('device_id', id);
  }
  return id;
}

// ── Forgot Password Modal ─────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep]           = useState('choose'); // choose | request | questions
  const [username, setUsername]   = useState('');
  const [questions, setQuestions] = useState(null);
  const [answer1, setAnswer1]     = useState('');
  const [answer2, setAnswer2]     = useState('');
  const [newPw, setNewPw]         = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [msg, setMsg]             = useState(null);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  async function handleRequestToAdmin() {
    if (!username.trim()) { setMsg({ type: 'error', text: 'Enter your username first' }); return; }
    setLoading(true);
    const deviceId = generateDeviceId();
    try {
      const res = await api.postNoAuth('/request-password-reset', { user_name: username.trim(), device_id: deviceId });
      if (res.success) {
        setDone(true);
        setMsg({ type: 'success', text: 'Request sent! Admin will reset your password.' });
      } else {
        setMsg({ type: 'error', text: res.message || 'Failed to send request' });
      }
    } catch { setMsg({ type: 'error', text: 'Cannot reach server' }); }
    setLoading(false);
  }

  async function handleLoadQuestions() {
    if (!username.trim()) { setMsg({ type: 'error', text: 'Enter your username first' }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.getNoAuth(`/secret-questions/${encodeURIComponent(username.trim())}`);
      if (res.success) {
        setQuestions(res.data);
        setStep('questions');
      } else {
        setMsg({ type: 'error', text: res.message || 'No security questions found for this account' });
      }
    } catch { setMsg({ type: 'error', text: 'Cannot reach server' }); }
    setLoading(false);
  }

  async function handleVerifyAnswers() {
    if (!answer1.trim() || !answer2.trim() || !newPw.trim()) {
      setMsg({ type: 'error', text: 'All fields required' }); return;
    }
    if (newPw.length < 4) { setMsg({ type: 'error', text: 'Password min 4 characters' }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.postNoAuth('/verify-secret-answers', {
        user_name: username.trim(), answer_1: answer1, answer_2: answer2, new_password: newPw
      });
      if (res.success) {
        setDone(true);
        setMsg({ type: 'success', text: 'Password reset! You can now login.' });
      } else {
        setMsg({ type: 'error', text: res.message || 'Wrong answers' });
      }
    } catch { setMsg({ type: 'error', text: 'Cannot reach server' }); }
    setLoading(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
        padding: 32, width: '100%', maxWidth: 420, position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          color: 'var(--muted)', cursor: 'pointer', fontSize: 18
        }}>✕</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Forgot Password</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Choose how to recover your account</div>
        </div>

        {done ? (
          <div>
            <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 12 }}>✅</div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onClose}>Back to Login</button>
          </div>
        ) : (
          <>
            {/* Username input always visible */}
            {step !== 'questions' && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Username</label>
                <input
                  className="input" placeholder="Enter your username"
                  value={username} onChange={e => { setUsername(e.target.value); setMsg(null); }}
                />
              </div>
            )}

            {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 12 }}>{msg.text}</div>}

            {step === 'choose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleRequestToAdmin}
                  disabled={loading}
                  style={{ justifyContent: 'center' }}
                >
                  {loading ? 'Sending...' : '📨 Request reset from Admin'}
                </button>
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>— or —</div>
                <button
                  className="btn btn-ghost"
                  onClick={handleLoadQuestions}
                  disabled={loading}
                  style={{ justifyContent: 'center' }}
                >
                  {loading ? 'Loading...' : '🔐 Answer security questions'}
                </button>
              </div>
            )}

            {step === 'questions' && questions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 4 }}>
                  Answering for: <strong style={{ color: 'var(--text)' }}>{username}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">{questions.question_1}</label>
                  <input className="input" placeholder="Your answer" value={answer1} onChange={e => setAnswer1(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{questions.question_2}</label>
                  <input className="input" placeholder="Your answer" value={answer2} onChange={e => setAnswer2(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input" type={showPw ? 'text' : 'password'}
                      placeholder="New password (min 4 chars)"
                      value={newPw} onChange={e => setNewPw(e.target.value)}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16
                      }}
                    >{showPw ? '🙈' : '👁️'}</button>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleVerifyAnswers} disabled={loading} style={{ justifyContent: 'center' }}>
                  {loading ? 'Verifying...' : 'Reset Password'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setStep('choose'); setMsg(null); }} style={{ justifyContent: 'center' }}>← Back</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Save Password Prompt ──────────────────────────────────
function SavePasswordPrompt({ username, onSave, onDismiss }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const style = {
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
    opacity: visible ? 1 : 0,
    transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
  };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 99995,
      maxWidth: 320, width: 'calc(100vw - 48px)', ...style,
    }}>
      <div style={{
        background: 'linear-gradient(160deg,#111820,#0d1117)',
        border: '1px solid rgba(0,230,118,0.25)',
        borderRadius: 16, padding: '18px 20px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🔑</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#e8edf3', marginBottom: 4 }}>
              {t('save_pwd_title')}
            </div>
            <div style={{ fontSize: 12, color: '#5a7a9a', lineHeight: 1.5 }}>
              {t('save_pwd_desc')}
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#3a6a4a', fontFamily: 'monospace' }}>
              👤 {username}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onDismiss} style={{
            flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#5a7a9a', fontWeight: 600, fontSize: 12,
          }}>{t('save_pwd_no')}</button>
          <button onClick={onSave} style={{
            flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
            border: 'none', background: 'linear-gradient(135deg,#00e676,#00c853)',
            color: '#080c10', fontWeight: 800, fontSize: 12,
          }}>💾 {t('save_pwd_yes')}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Login Page ───────────────────────────────────────
export default function Login() {
  const [username,     setUsername]     = useState(() => getSavedUsername() || '');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);
  const [showSavePwd,  setShowSavePwd]  = useState(false);
  const [lastUsername, setLastUsername] = useState('');
  const { login } = useAuth();
  const { t } = useLang();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Please enter username'); return; }
    if (!password.trim()) { setError('Please enter password'); return; }
    setLoading(true);
    try {
      const deviceId = generateDeviceId();
      const res = await api.postNoAuth('/login', {
        user_name: username.trim(),
        password,
        device_id: deviceId,
      });
      if (res.success) {
        let role = 'user';
        try {
          const payload = JSON.parse(atob(res.data.token.split('.')[1]));
          role = payload.role || 'user';
        } catch {}
        login(res.data.token, username.trim(), role);

        // Offer to save username if cookie consent allows saved login
        const consent = getConsent();
        if (consent.savedLogin) {
          saveSavedUsername(username.trim());
        } else if (consent.decided) {
          // consent was made but savedLogin not enabled — skip prompt
        } else {
          // Consent not yet decided — offer prompt
          setLastUsername(username.trim());
          setShowSavePwd(true);
        }

        if (res.data.first_login) {
          navigate('/profile?setup_security=1');
        } else {
          navigate('/');
        }
      } else {
        setError(res.message || 'Login failed');
        setPassword('');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function handleSaveYes() {
    saveSavedUsername(lastUsername);
    setShowSavePwd(false);
  }
  function handleSaveNo() {
    clearSavedUsername();
    setShowSavePwd(false);
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb1" />
        <div className="login-orb login-orb2" />
      </div>
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>TJ</div>
          <h1 className="login-title">TradeJournal <span>PRO</span></h1>
          <p className="login-sub">Sign in to your account</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">USERNAME</label>
            <input
              className="input"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
            {getSavedUsername() && (
              <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#3a6a4a' }}>💾 Saved:</span>
                <span style={{
                  fontSize: 11, color: '#00e676', fontFamily: 'monospace',
                  background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)',
                  borderRadius: 4, padding: '1px 6px',
                }}>{getSavedUsername()}</span>
                <button
                  type="button"
                  onClick={() => { clearSavedUsername(); setUsername(''); }}
                  style={{ background: 'none', border: 'none', color: '#5a7a9a', cursor: 'pointer', fontSize: 11, padding: 0 }}
                >✕ clear</button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                  fontSize: 16, padding: 0, lineHeight: 1
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <button
              type="button"
              className="link-btn"
              style={{ fontSize: 12 }}
              onClick={() => setShowForgot(true)}
            >
              Forgot password?
            </button>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="login-footer" style={{ marginTop: 20 }}>
          Don't have an account?{' '}
          <button className="link-btn" onClick={() => navigate('/register')}>Get started</button>
          {' · '}
          <button className="link-btn" onClick={() => navigate('/')}>Back to home</button>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      {showSavePwd && (
        <SavePasswordPrompt
          username={lastUsername}
          onSave={handleSaveYes}
          onDismiss={handleSaveNo}
        />
      )}
    </div>
  );
}
