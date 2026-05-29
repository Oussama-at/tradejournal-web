// ═══════════════════════════════════════════════════════════════════════════
// Replace ONLY the export function Profile() in OtherPages.jsx.
// This version adds a 3-step email change flow:
//   Step 1 — user sees their current email (read-only)
//   Step 2 — user must answer both security questions correctly
//   Step 3 — only then can they submit the new email
// ═══════════════════════════════════════════════════════════════════════════

export function Profile() {
  const { t } = useLang();
  const [profile, setProfile] = useState(null);

  // Security questions (for the set-questions card)
  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');
  const [questions, setQuestions] = useState([]);
  const [msg, setMsg] = useState(null);

  // Email change — 3 steps: 'idle' | 'verifying' | 'verified' | 'pending'
  const [emailStep, setEmailStep] = useState('idle');
  // Step 2: answers to the user's own secret questions
  const [userQ1, setUserQ1] = useState('');   // question text (fetched)
  const [userQ2, setUserQ2] = useState('');
  const [verifyA1, setVerifyA1] = useState('');
  const [verifyA2, setVerifyA2] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [verifyToken, setVerifyToken] = useState(null); // returned by server

  // Step 3: actual new email
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
    api.get('/profile').then(r => setProfile(r?.data?.user || null));
    api.get('/secret-questions').then(r => {
      const qs = r?.data?.questions || [];
      setQuestions(qs.length ? qs : DEFAULTS);
    }).catch(() => setQuestions(DEFAULTS));
    // Check for existing pending email-change request
    api.get('/profile/email-change-status').then(r => {
      if (r?.data?.status === 'pending') setEmailStep('pending');
    }).catch(() => {});
    // eslint-disable-next-line
  }, []);

  // ── Set security questions ────────────────────────────────────────────────
  async function saveQuestions() {
    if (!q1 || !a1 || !q2 || !a2) { setMsg({ type: 'error', text: 'All fields required' }); return; }
    if (q1 === q2) { setMsg({ type: 'error', text: 'Questions must be different' }); return; }
    const res = await api.post('/set-secret-answers', {
      question_1: q1, answer_1: a1, question_2: q2, answer_2: a2,
    });
    if (res?.success) {
      setMsg({ type: 'success', text: '✓ Saved!' });
      setA1(''); setA2('');
      // Update local question labels used in email-change step
      setUserQ1(q1); setUserQ2(q2);
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  async function changePhoto(file) {
    if (!file) return;
    const res = await api.uploadFile('/profile/picture', file);
    if (res?.success) alert('✓ Photo updated!');
  }

  // ── Email change: Step 1 → open verify panel ────────────────────────────
  async function startEmailChange() {
    setVerifyA1(''); setVerifyA2('');
    setVerifyMsg(null);
    setNewEmail('');
    setSubmitMsg(null);
    setVerifyToken(null);

    // Fetch the user's own security questions (they don't need to know the answers —
    // just show the questions so they know what to type)
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

  // ── Email change: Step 2 → verify secret answers ────────────────────────
  async function submitVerify() {
    if (!verifyA1.trim() || !verifyA2.trim()) {
      setVerifyMsg({ type: 'error', text: 'Please answer both questions' });
      return;
    }
    setVerifyLoading(true);
    setVerifyMsg(null);

    const res = await api.post('/profile/verify-for-email-change', {
      answer_1: verifyA1,
      answer_2: verifyA2,
    });

    setVerifyLoading(false);

    if (res?.success) {
      setVerifyToken(res.data?.verify_token);
      setEmailStep('verified');
      setVerifyMsg(null);
    } else {
      setVerifyMsg({ type: 'error', text: res?.message || 'Verification failed' });
    }
  }

  // ── Email change: Step 3 → submit new email with token ──────────────────
  async function submitEmailChange() {
    if (!newEmail || !newEmail.includes('@')) {
      setSubmitMsg({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    if (!verifyToken) {
      setSubmitMsg({ type: 'error', text: 'Verification expired — please start again' });
      setEmailStep('idle');
      return;
    }
    setSubmitLoading(true);
    setSubmitMsg(null);

    const res = await api.post('/profile/request-email-change', {
      new_email: newEmail,
      verify_token: verifyToken,
    });

    setSubmitLoading(false);

    if (res?.success) {
      setEmailStep('pending');
      setVerifyToken(null);
    } else {
      // Token may have expired (10-min window)
      if (res?.message?.includes('expired') || res?.message?.includes('invalid')) {
        setEmailStep('idle');
      }
      setSubmitMsg({ type: 'error', text: res?.message || 'Failed to submit request' });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header"><div className="page-title">{t('my_profile')}</div></div>

      <div className="grid-2">
        {/* ── Identity card ────────────────────────────────────────────── */}
        <div className="card">
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>
              {profile?.user_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.user_name}</div>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{profile?.role}</span>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{t('member_since')} {(profile?.created_at || '').substring(0, 10)}</div>
            </div>
          </div>

          {/* ── Email section ──────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>

            {/* Current email (always read-only) */}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                ✉️ Email Address
                <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 400 }}>(read-only)</span>
              </label>
              <div className="input" style={{ cursor: 'default', opacity: 0.75, background: 'var(--bg3)' }}>
                {profile?.email || <span style={{ opacity: 0.4 }}>Not set</span>}
              </div>
            </div>

            {/* ── State machine ─────────────────────────────────────────── */}

            {/* IDLE: just a button to start the flow */}
            {emailStep === 'idle' && (
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={startEmailChange}>
                🔐 Request email change
              </button>
            )}

            {/* PENDING: waiting for admin */}
            {emailStep === 'pending' && (
              <div className="alert alert-warning" style={{ fontSize: 12 }}>
                ⏳ Your email change request is pending admin approval.
              </div>
            )}

            {/* VERIFYING: show security questions */}
            {emailStep === 'verifying' && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
                  🔒 Verify your identity
                </div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  Answer your security questions to proceed.
                </div>

                {/* Q1 */}
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>
                    {userQ1 || 'Security Question 1'}
                  </label>
                  <input
                    className="input"
                    placeholder="Your answer..."
                    value={verifyA1}
                    onChange={e => setVerifyA1(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {/* Q2 */}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>
                    {userQ2 || 'Security Question 2'}
                  </label>
                  <input
                    className="input"
                    placeholder="Your answer..."
                    value={verifyA2}
                    onChange={e => setVerifyA2(e.target.value)}
                    autoComplete="off"
                    onKeyDown={e => e.key === 'Enter' && submitVerify()}
                  />
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
                  <button className="btn btn-ghost" onClick={() => setEmailStep('idle')}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* VERIFIED: identity confirmed, show new-email input */}
            {emailStep === 'verified' && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: 'var(--green)', fontSize: 16 }}>✅</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Identity verified</span>
                  <span className="muted" style={{ fontSize: 11 }}>(token valid 10 min)</span>
                </div>

                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>New email address</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="new@email.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && submitEmailChange()}
                  />
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
                  <button className="btn btn-ghost" onClick={() => setEmailStep('idle')}>
                    Cancel
                  </button>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                  Admin will review and approve. You'll be notified by email.
                </div>
              </div>
            )}
          </div>

          {/* Photo change */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
            <label>
              <div className="btn btn-ghost" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('pic-input').click()}>
                {t('change_photo')}
              </div>
              <input id="pic-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => changePhoto(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* ── Security questions ──────────────────────────────────────── */}
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
              <input className="input" placeholder="Your answer..." value={a1} onChange={e => setA1(e.target.value)} />
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
              <input className="input" placeholder="Your answer..." value={a2} onChange={e => setA2(e.target.value)} />
            </div>
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <button className="btn btn-primary" onClick={saveQuestions}>{t('save_questions')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
