// ═══════════════════════════════════════════════════════════════════════════
// FILE: OtherPages_patches.jsx
//
// This file contains the REPLACEMENT versions of two components from
// src/pages/OtherPages.jsx:
//   1. export function Users()   — replaces lines ~193..530
//   2. export function Profile() — replaces lines ~533..630
//
// Copy-paste each export function into OtherPages.jsx, replacing the old one.
// Everything else in OtherPages.jsx stays the same.
// ═══════════════════════════════════════════════════════════════════════════

// ── USERS (Manage Users) ────────────────────────────────────────────────────
export function Users() {
  const { t } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ user_name: '', password: '', role: 'user', email: '' });
  const [licenseMsg, setLicenseMsg] = useState(null);
  const [loggingInAs, setLoggingInAs] = useState(null);

  // Contact-user modal state
  const [contactModal, setContactModal] = useState(null); // { userId, userName, email }
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await api.get('/admin/users');
    setUsers(res?.data?.users || []);
  }

  async function addUser() {
    if (!newUser.user_name || !newUser.password) {
      setMsg({ type: 'error', text: 'Username and password required' });
      return;
    }
    const res = await api.post('/admin/users', newUser);
    if (res?.success) {
      setShowAdd(false);
      setNewUser({ user_name: '', password: '', role: 'user', email: '' });
      load();
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  async function toggleLicense(id, currentActive) {
    setLicenseMsg({ userId: id, text: 'Updating...', type: 'info' });
    const res = await api.post(`/admin/users/${id}/toggle-license`, {});
    if (res?.success) {
      const newState = res.data?.is_active;
      const wasCreated = res.data?.created;
      const text = wasCreated
        ? '✓ License created & activated'
        : newState ? '✓ License activated' : '✓ License disabled';
      setLicenseMsg({ userId: id, text, type: newState ? 'success' : 'warning' });
      setUsers(prev => prev.map(u => {
        if (u.id !== id) return u;
        return {
          ...u,
          is_active: newState,
          license_key: u.license_key || (wasCreated ? '__assigned__' : u.license_key),
        };
      }));
      load();
      setTimeout(() => setLicenseMsg(null), 2500);
    } else {
      setLicenseMsg({ userId: id, text: res?.message || 'Failed to toggle license', type: 'error' });
      setTimeout(() => setLicenseMsg(null), 3000);
    }
  }

  const showConfirm = useConfirm();

  async function loginAsUser(u) {
    const ok = await showConfirm({
      title: `Login as ${u.user_name}?`,
      message: 'You will be logged in as this user. Only this device will connect to that account. Your admin session will end.',
      type: 'warning',
      confirmLabel: 'Login as user',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    setLoggingInAs(u.id);
    try {
      const deviceId = 'web-adm-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36);
      const res = await api.post(`/admin/users/${u.id}/generate-token`, { device_id: deviceId });
      if (res?.success && res.data?.token) {
        localStorage.setItem('device_id', deviceId);
        login(res.data.token, u.user_name, u.role || 'user');
        navigate('/');
      } else {
        setMsg({ type: 'error', text: res?.message || 'Failed to login as user' });
        setLoggingInAs(null);
      }
    } catch {
      setMsg({ type: 'error', text: 'Server error while trying to login as user' });
      setLoggingInAs(null);
    }
  }

  async function resetDevice(id) {
    const ok = await showConfirm({ title: 'Reset Device?', message: 'This will log the user out of their current device.', type: 'warning', confirmLabel: 'Reset', cancelLabel: 'Cancel' });
    if (ok) { await api.post(`/admin/users/${id}/reset-device`, {}); load(); }
  }

  async function deleteUser(id, name) {
    const ok = await showConfirm({ title: `Delete ${name}?`, message: 'This will permanently delete the user and all their data.', type: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel' });
    if (ok) { await api.delete(`/admin/users/${id}`); load(); }
  }

  async function toggleAccess(id, blocked) {
    await api.put(`/admin/users/${id}/access`, { blocked: !blocked });
    load();
  }

  async function resetPassword(id, name) {
    const pw = window.prompt(`New password for ${name}:`);
    if (pw && pw.length >= 4) {
      const res = await api.post(`/admin/users/${id}/reset-password`, { new_password: pw });
      alert(res?.success ? '✓ Done' : res?.message);
    }
  }

  // ── Contact user via email ────────────────────────────────────────────────
  function openContact(u) {
    if (!u.email) {
      setMsg({ type: 'error', text: `${u.user_name} has no email on file` });
      return;
    }
    setContactModal({ userId: u.id, userName: u.user_name, email: u.email });
    setContactForm({ subject: '', message: '' });
    setContactSending(false);
  }

  async function sendContact() {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      setMsg({ type: 'error', text: 'Subject and message are required' });
      return;
    }
    setContactSending(true);
    const res = await api.post(`/admin/users/${contactModal.userId}/contact`, contactForm);
    setContactSending(false);
    if (res?.success) {
      setContactModal(null);
      setMsg({ type: 'success', text: `✓ Email sent to ${contactModal.userName}` });
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed to send email' });
    }
  }

  const filtered = users.filter(u => u.user_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* ── Contact Modal ──────────────────────────────────────────────── */}
      {contactModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, margin: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              ✉️ Contact {contactModal.userName}
            </div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 16 }}>
              {contactModal.email}
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">Subject</label>
              <input
                className="input"
                placeholder="e.g. Account Update"
                value={contactForm.subject}
                onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Message</label>
              <textarea
                className="input"
                rows={5}
                placeholder="Write your message here..."
                style={{ resize: 'vertical', minHeight: 100 }}
                value={contactForm.message}
                onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setContactModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendContact} disabled={contactSending}>
                {contactSending ? 'Sending...' : '✉️ Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">{t('users_title')}</div>
          <div className="page-sub">{users.length} {t('users_count')}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>{t('add_user')}</button>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <input className="input" placeholder={t('search_users')} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* ── Global alert ───────────────────────────────────────────────── */}
      {msg && !showAdd && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => setMsg(null)}>
          {msg.text} <span style={{ float: 'right', opacity: 0.6 }}>✕</span>
        </div>
      )}

      {/* ── Add New User form ───────────────────────────────────────────── */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Add New User</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="input" value={newUser.user_name}
                onChange={e => setNewUser(u => ({ ...u, user_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" value={newUser.password}
                onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
            </div>
            {/* ── NEW: Email field ── */}
            <div className="form-group">
              <label className="form-label">Email <span className="muted" style={{ fontSize: 10 }}>(optional — sends credentials)</span></label>
              <input className="input" type="email" placeholder="user@example.com"
                value={newUser.email}
                onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="select" value={newUser.role}
                onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
                <option>user</option>
                <option>admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={addUser}>Add</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: 8 }}>{msg.text}</div>}
        </div>
      )}

      {/* ── Users Table ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[t('col_user'), 'Email', t('col_role'), t('col_license'), t('col_access'), t('col_created'), t('col_actions')].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const active = u.is_active;
                const hasLicense = !!u.license_key;
                const pending = !hasLicense;
                const blocked = u.blocked;

                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.user_name}</td>
                    {/* ── NEW: Email column ── */}
                    <td>
                      {u.email
                        ? <span className="muted" style={{ fontSize: 12 }}>{u.email}</span>
                        : <span className="muted" style={{ fontSize: 11, opacity: 0.4 }}>—</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${pending ? 'badge-orange' : active ? 'badge-green' : 'badge-red'}`}>
                        {pending ? t('pending') : active ? t('active') || 'Active' : t('expired') || 'Expired'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${blocked ? 'badge-red' : 'badge-green'}`}>
                        {blocked ? 'Blocked' : 'OK'}
                      </span>
                    </td>
                    <td className="muted">{(u.created_at || '').substring(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {/* License toggle */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <button
                            className={`btn ${active ? 'btn-danger' : 'btn-primary'} ${licenseMsg?.userId === u.id ? 'btn-ghost' : ''}`}
                            style={{ fontSize: 10, padding: '2px 7px' }}
                            onClick={() => toggleLicense(u.id, u.is_active)}
                            title={pending ? 'Create & assign a license' : active ? 'Disable license' : 'Re-activate license'}
                          >
                            🔑 {licenseMsg?.userId === u.id ? '...' : pending ? 'Assign' : active ? 'Disable' : 'Enable'}
                          </button>
                          {licenseMsg?.userId === u.id && (
                            <span style={{ fontSize: 9, color: licenseMsg.type === 'success' ? 'var(--green)' : licenseMsg.type === 'warning' ? 'var(--orange)' : 'var(--red)', whiteSpace: 'nowrap' }}>
                              {licenseMsg.text}
                            </span>
                          )}
                        </div>

                        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => resetDevice(u.id)}>📱 Device</button>
                        <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => resetPassword(u.id, u.user_name)}>🔒 Pwd</button>
                        <button className={`btn ${blocked ? 'btn-primary' : 'btn-danger'}`}
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => toggleAccess(u.id, blocked)}>
                          {blocked ? 'Unblock' : 'Block'}
                        </button>

                        {/* ── NEW: Contact via Email button ── */}
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 10, padding: '2px 7px', opacity: u.email ? 1 : 0.4 }}
                          onClick={() => openContact(u)}
                          title={u.email ? `Email ${u.user_name}` : 'No email on file'}
                        >
                          ✉️ Email
                        </button>

                        {u.role !== 'admin' && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 10, padding: '2px 7px', opacity: loggingInAs === u.id ? 0.5 : 1 }}
                            onClick={() => loginAsUser(u)}
                            disabled={loggingInAs === u.id}
                          >
                            {loggingInAs === u.id ? '...' : '🔐 Login As'}
                          </button>
                        )}

                        <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => deleteUser(u.id, u.user_name)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// ── PROFILE ─────────────────────────────────────────────────────────────────
export function Profile() {
  const { t } = useLang();
  const [profile, setProfile] = useState(null);
  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');
  const [questions, setQuestions] = useState([]);
  const [msg, setMsg] = useState(null);

  // Email change request state
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailRequestStatus, setEmailRequestStatus] = useState(null); // 'pending' | null

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
    });
    api.get('/secret-questions').then(r => {
      const qs = r?.data?.questions || [];
      setQuestions(qs.length ? qs : DEFAULTS);
    }).catch(() => setQuestions(DEFAULTS));
    // Check if there's already a pending email change request
    api.get('/profile/email-change-status').then(r => {
      if (r?.data?.status === 'pending') setEmailRequestStatus('pending');
    }).catch(() => {});
  // eslint-disable-next-line
  }, []);

  async function saveQuestions() {
    if (!q1 || !a1 || !q2 || !a2) { setMsg({ type: 'error', text: 'All fields required' }); return; }
    if (q1 === q2) { setMsg({ type: 'error', text: 'Questions must be different' }); return; }
    const res = await api.post('/set-secret-answers', { question_1: q1, answer_1: a1, question_2: q2, answer_2: a2 });
    if (res?.success) { setMsg({ type: 'success', text: '✓ Saved!' }); setA1(''); setA2(''); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  async function changePhoto(file) {
    if (!file) return;
    const res = await api.uploadFile('/profile/picture', file);
    if (res?.success) alert('✓ Photo updated!');
  }

  async function requestEmailChange() {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailMsg({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    setEmailLoading(true);
    setEmailMsg(null);
    const res = await api.post('/profile/request-email-change', { new_email: newEmail });
    setEmailLoading(false);
    if (res?.success) {
      setEmailMsg({ type: 'success', text: '✓ Request submitted — waiting for admin approval.' });
      setEmailRequestStatus('pending');
      setNewEmail('');
    } else {
      setEmailMsg({ type: 'error', text: res?.message || 'Failed to submit request' });
    }
  }

  return (
    <div>
      <div className="page-header"><div className="page-title">{t('my_profile')}</div></div>

      <div className="grid-2">
        {/* ── Identity card ──────────────────────────────────────────── */}
        <div className="card">
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

          {/* ── Email display (read-only) ─────────────────────────── */}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              ✉️ Email Address
              <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 400 }}>(read-only — request change below)</span>
            </label>
            <div className="input" style={{ cursor: 'default', opacity: 0.8, background: 'var(--bg3)' }}>
              {profile?.email || <span style={{ opacity: 0.4 }}>Not set</span>}
            </div>
          </div>

          {/* ── Change email request ────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Request Email Change</div>
            {emailRequestStatus === 'pending' ? (
              <div className="alert alert-warning" style={{ fontSize: 12 }}>
                ⏳ Your email change request is pending admin approval.
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <input
                    className="input"
                    type="email"
                    placeholder="new@email.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />
                </div>
                {emailMsg && <div className={`alert alert-${emailMsg.type}`} style={{ marginBottom: 8, fontSize: 12 }}>{emailMsg.text}</div>}
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                  onClick={requestEmailChange}
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Submitting...' : '📨 Request Change'}
                </button>
                <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                  Admin will review and approve. You'll receive a confirmation email.
                </div>
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
            <label>
              <div className="btn btn-ghost" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('pic-input').click()}>
                {t('change_photo')}
              </div>
              <input id="pic-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => changePhoto(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* ── Security questions ───────────────────────────────────── */}
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


// ── SMALL EXTRA: GET /profile/email-change-status endpoint for server.js ────
// Add this to server.js after the GET /profile endpoint:
//
// app.get('/profile/email-change-status', authMiddleware, async (req, res) => {
//   try {
//     const r = await pool.query(
//       `SELECT status FROM email_change_requests
//        WHERE user_id = $1 AND status = 'pending'
//        ORDER BY created_at DESC LIMIT 1`,
//       [req.user.user_id]
//     );
//     sendResponse(res, true, { status: r.rows[0]?.status || null });
//   } catch (err) {
//     sendResponse(res, false, null, 'Failed');
//   }
// });
