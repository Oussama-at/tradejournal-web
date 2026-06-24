// ═══════════════════════════════════════════════════════════════════════════
// Profile  –  Fixed version
//   ✓ react-intl via useLang
//   ✓ Professional PhotoCropDialog (crop/resize/shape) before upload
//   ✓ No double file-picker trigger (ref-only, no <label> wrapper)
//   ✓ Avatar updates instantly after save (no page refresh)
//   ✓ Professional PhotoSuccessToast instead of alert()
//   ✓ 3-step email-change flow preserved
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';
import { useAuth } from '../context/AuthContext';
import PhotoCropDialog from '../components/PhotoCropDialog';
import PhotoSuccessToast from '../components/PhotoSuccessToast';

export function Profile() {
  const { t } = useLang();
  const { updateAvatar } = useAuth();
  const [profile, setProfile] = useState(null);
  // Local avatar URL (object URL or server URL) for instant update
  const [avatarSrc, setAvatarSrc] = useState(null);

  // Photo dialog state
  const [selectedFile, setSelectedFile] = useState(null); // raw File from picker
  const [showCrop, setShowCrop] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef(null);

  // Security questions
  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');
  const [questions, setQuestions] = useState([]);
  const [msg, setMsg] = useState(null);

  // Email change — 3 steps
  const [emailStep, setEmailStep] = useState('idle');
  const [userQ1, setUserQ1] = useState('');
  const [userQ2, setUserQ2] = useState('');
  const [verifyA1, setVerifyA1] = useState('');
  const [verifyA2, setVerifyA2] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [verifyToken, setVerifyToken] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  const DEFAULTS = [
    'What is your favourite color?',
    'Name of your best player?',
    'What is your birthday?',
    "Mother's maiden name?",
    'First pet name?',
    'City you were born in?',
  ];

  useEffect(() => {
    api.get('/profile').then(r => {
      const u = r?.data?.user || null;
      setProfile(u);
      if (u?.avatar) setAvatarSrc(u.avatar);
    });
    api.get('/secret-questions').then(r => {
      const qs = r?.data?.questions || [];
      setQuestions(qs.length ? qs : DEFAULTS);
    }).catch(() => setQuestions(DEFAULTS));
    api.get('/profile/email-change-status').then(r => {
      if (r?.data?.status === 'pending') setEmailStep('pending');
    }).catch(() => {});
    // eslint-disable-next-line
  }, []);

  // ── Photo flow ────────────────────────────────────────────────────────────
  // Step 1: user clicks "Change Photo" → open file picker (ref only, no double trigger)
  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';   // reset so same file can be re-selected
      fileInputRef.current.click();
    }
  }, []);

  // Step 2: file selected → show crop dialog
  function onFileChosen(e) {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = ''; // reset input immediately to avoid re-trigger
    setSelectedFile(f);
    setShowCrop(true);
  }

  // Step 3: user saves crop → upload blob → update avatar instantly
  async function handleCropSave(blob) {
    setShowCrop(false);
    setSelectedFile(null);

    // Show instant preview from the blob
    const localUrl = URL.createObjectURL(blob);
    setAvatarSrc(localUrl);

    // Upload to server
    const formFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    const res = await api.uploadFile('/profile/picture', formFile);

    if (res?.success) {
      // Replace object URL with server URL if available
      const serverUrl = res?.data?.url || null;
      if (serverUrl) setAvatarSrc(serverUrl);
      // Update the sidebar avatar instantly (and persist it)
      if (updateAvatar) updateAvatar(serverUrl || localUrl);
      setShowToast(true);
    } else {
      // Revert on failure
      setAvatarSrc(profile?.avatar || null);
    }
    URL.revokeObjectURL(localUrl);
  }

  function handleCropCancel() {
    setShowCrop(false);
    setSelectedFile(null);
  }

  // ── Security questions ───────────────────────────────────────────────────
  async function saveQuestions() {
    if (!q1 || !a1 || !q2 || !a2) { setMsg({ type: 'error', text: 'All fields required' }); return; }
    if (q1 === q2) { setMsg({ type: 'error', text: 'Questions must be different' }); return; }
    const res = await api.post('/set-secret-answers', {
      question_1: q1, answer_1: a1, question_2: q2, answer_2: a2,
    });
    if (res?.success) {
      setMsg({ type: 'success', text: '✓ Saved!' });
      setA1(''); setA2('');
      setUserQ1(q1); setUserQ2(q2);
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  // ── Email change flow ────────────────────────────────────────────────────
  async function startEmailChange() {
    setVerifyA1(''); setVerifyA2(''); setVerifyMsg(null);
    setNewEmail(''); setSubmitMsg(null); setVerifyToken(null);
    try {
      const r = await api.get('/profile');
      const username = r?.data?.user?.user_name;
      if (username) {
        const qr = await api.get(`/secret-questions/${username}`);
        setUserQ1(qr?.data?.question_1 || '');
        setUserQ2(qr?.data?.question_2 || '');
      }
    } catch {}
    setEmailStep('verifying');
  }

  async function submitVerify() {
    if (!verifyA1.trim() || !verifyA2.trim()) {
      setVerifyMsg({ type: 'error', text: 'Please answer both questions' }); return;
    }
    setVerifyLoading(true); setVerifyMsg(null);
    const res = await api.post('/profile/verify-for-email-change', {
      answer_1: verifyA1, answer_2: verifyA2,
    });
    setVerifyLoading(false);
    if (res?.success) {
      setVerifyToken(res.data?.verify_token);
      setEmailStep('verified'); setVerifyMsg(null);
    } else {
      setVerifyMsg({ type: 'error', text: res?.message || 'Verification failed' });
    }
  }

  async function submitEmailChange() {
    if (!newEmail || !newEmail.includes('@')) {
      setSubmitMsg({ type: 'error', text: 'Please enter a valid email address' }); return;
    }
    if (!verifyToken) {
      setSubmitMsg({ type: 'error', text: 'Verification expired — please start again' });
      setEmailStep('idle'); return;
    }
    setSubmitLoading(true); setSubmitMsg(null);
    const res = await api.post('/profile/request-email-change', {
      new_email: newEmail, verify_token: verifyToken,
    });
    setSubmitLoading(false);
    if (res?.success) {
      setEmailStep('pending'); setVerifyToken(null);
    } else {
      if (res?.message?.includes('expired') || res?.message?.includes('invalid')) {
        setEmailStep('idle');
      }
      setSubmitMsg({ type: 'error', text: res?.message || 'Failed to submit request' });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const initials = profile?.user_name?.[0]?.toUpperCase() || 'U';

  return (
    <div>
      {/* Photo crop dialog */}
      {showCrop && selectedFile && (
        <PhotoCropDialog
          file={selectedFile}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}

      {/* Success toast */}
      {showToast && (
        <PhotoSuccessToast
          message={t('photo_updated')}
          onDone={() => setShowToast(false)}
        />
      )}

      {/* Hidden file input — single trigger via ref */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFileChosen}
      />

      <div className="page-header">
        <div className="page-title">{t('my_profile')}</div>
      </div>

      <div className="grid-2">
        {/* ── Identity card ─────────────────────────────────────────────── */}
        <div className="card">
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {/* Avatar — updates instantly on upload */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'var(--bg4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: 'var(--blue)',
              overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(0,230,118,0.2)',
              position: 'relative',
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.user_name}</div>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                {profile?.role}
              </span>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {t('member_since')} {(profile?.created_at || '').substring(0, 10)}
              </div>
            </div>
          </div>

          {/* ── Email section ─────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                ✉️ Email Address
                <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 400 }}>(read-only)</span>
              </label>
              <div className="input" style={{ cursor: 'default', opacity: 0.75, background: 'var(--bg3)' }}>
                {profile?.email || <span style={{ opacity: 0.4 }}>Not set</span>}
              </div>
            </div>

            {emailStep === 'idle' && (
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={startEmailChange}>
                🔐 Request email change
              </button>
            )}
            {emailStep === 'pending' && (
              <div className="alert alert-warning" style={{ fontSize: 12 }}>
                ⏳ Your email change request is pending admin approval.
              </div>
            )}
            {emailStep === 'verifying' && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>🔒 Verify your identity</div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  Answer your security questions to proceed.
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>{userQ1 || 'Security Question 1'}</label>
                  <input className="input" placeholder="Your answer..." value={verifyA1}
                    onChange={e => setVerifyA1(e.target.value)} autoComplete="off" />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>{userQ2 || 'Security Question 2'}</label>
                  <input className="input" placeholder="Your answer..." value={verifyA2}
                    onChange={e => setVerifyA2(e.target.value)} autoComplete="off"
                    onKeyDown={e => e.key === 'Enter' && submitVerify()} />
                </div>
                {verifyMsg && (
                  <div className={`alert alert-${verifyMsg.type}`} style={{ marginBottom: 10, fontSize: 12 }}>
                    {verifyMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submitVerify} disabled={verifyLoading}>
                    {verifyLoading ? 'Checking...' : '✓ Verify'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setEmailStep('idle')}>Cancel</button>
                </div>
              </div>
            )}
            {emailStep === 'verified' && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: 'var(--green)', fontSize: 16 }}>✅</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Identity verified</span>
                  <span className="muted" style={{ fontSize: 11 }}>(token valid 10 min)</span>
                </div>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>New email address</label>
                  <input className="input" type="email" placeholder="new@email.com" value={newEmail}
                    onChange={e => setNewEmail(e.target.value)} autoFocus
                    onKeyDown={e => e.key === 'Enter' && submitEmailChange()} />
                </div>
                {submitMsg && (
                  <div className={`alert alert-${submitMsg.type}`} style={{ marginBottom: 10, fontSize: 12 }}>
                    {submitMsg.text}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submitEmailChange} disabled={submitLoading}>
                    {submitLoading ? 'Submitting...' : '📨 Submit request'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setEmailStep('idle')}>Cancel</button>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                  Admin will review and approve. You'll be notified by email.
                </div>
              </div>
            )}
          </div>

          {/* ── Photo change ─────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={openFilePicker}
            >
              {t('change_photo')}
            </button>
          </div>
        </div>

        {/* ── Security questions ────────────────────────────────────────── */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>{t('security_questions')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Question 1</label>
              <select className="select" value={q1} onChange={e => setQ1(e.target.value)}>
                <option value="">Select...</option>
                {questions.map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Answer 1</label>
              <input className="input" placeholder="Your answer..." value={a1}
                onChange={e => setA1(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Question 2</label>
              <select className="select" value={q2} onChange={e => setQ2(e.target.value)}>
                <option value="">Select...</option>
                {questions.filter(q => q !== q1).map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Answer 2</label>
              <input className="input" placeholder="Your answer..." value={a2}
                onChange={e => setA2(e.target.value)} />
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <button className="btn btn-primary" onClick={saveQuestions}>
              {t('save_questions')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
