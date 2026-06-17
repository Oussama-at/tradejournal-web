// Capital Archive
import React, { useState, useEffect, useRef } from 'react';
import { PhotoViewModal } from './Ranking';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useConfirm } from '../components/ConfirmDialog';
import { useLang } from '../lang/LangContext';
import { useAuth } from '../context/AuthContext';
import DatePicker from '../components/DatePicker';

// ── Reusable SortableTable ─────────────────────────────────────────────────
function SortableTable({ headers, sortableCount, rows, rowKey, renderRow }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc' | null

  function handleSort(idx) {
    if (idx >= (sortableCount ?? headers.length)) return;
    if (sortCol === idx) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir('asc'); }
    } else { setSortCol(idx); setSortDir('asc'); }
  }

  const sorted = sortCol === null ? rows : [...rows].sort((a, b) => {
    const aKeys = Object.values(a);
    const bKeys = Object.values(b);
    const av = aKeys[sortCol] ?? '';
    const bv = bKeys[sortCol] ?? '';
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <table>
      <thead>
        <tr>
          {headers.map((h, i) => {
            const sortable = i < (sortableCount ?? headers.length);
            const isActive = sortCol === i;
            return (
              <th key={h} onClick={() => sortable && handleSort(i)} style={{ cursor: sortable ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {h}
                  {sortable && (
                    <span style={{ fontSize: 10, opacity: isActive ? 1 : 0.3, color: isActive ? 'var(--green)' : 'inherit' }}>
                      {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 && (
          <tr><td colSpan={headers.length} style={{ textAlign: 'center', color: 'var(--dim)', padding: 24 }}>No data</td></tr>
        )}
        {sorted.map(row => renderRow(row))}
      </tbody>
    </table>
  );
}

// ── Searchable Select ──────────────────────────────────────────────────────
function SearchableSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function outside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [open]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );
  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => { setOpen(o => !o); setSearch(''); }}
        className="select"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
        <span>{current?.label || placeholder || 'Select...'}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 300, background: '#0e1420', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden', marginTop: 2 }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input autoFocus className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '5px 8px', fontSize: 12, width: '100%' }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(o => (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ width: '100%', padding: '8px 12px', background: o.value === value ? 'rgba(0,230,118,0.1)' : 'transparent', border: 'none', color: o.value === value ? 'var(--green)' : 'var(--text)', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}>
                {o.label}
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: '10px 12px', color: 'var(--dim)', fontSize: 12 }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function Capital() {
  const { t } = useLang();
  const [capitals, setCapitals] = useState([]);
  const [current, setCurrent] = useState(null);
  const [newCap, setNewCap] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [cur, hist] = await Promise.all([api.get('/capital/current'), api.get('/capital')]);
    setCurrent(cur?.data || null);
    setCapitals(hist?.data?.capitals || []);
  }

  async function addCapital() {
    if (!newCap) return;
    const res = await api.post('/capital', { capital_depart: +newCap, capital_now: +newCap });
    if (res?.success) { setMsg({ type: 'success', text: '✓ Capital added!' }); setNewCap(''); load(); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  const showConfirm = useConfirm();
  async function deactivate(id) {
    const ok = await showConfirm({ title: 'Deactivate Capital?', message: 'This will mark the capital as inactive.', type: 'warning', confirmLabel: 'Deactivate', cancelLabel: 'Cancel' });
    if (!ok) return;
    await api.put(`/capital/${id}/status`, { status: 'disabled' });
    load();
  }

  async function activate(id) {
    await api.put(`/capital/${id}/status`, { status: 'active' });
    load();
  }

  async function deleteCapital(id) {
    const ok2 = await showConfirm({ title: 'Delete Capital?', message: 'This action cannot be undone.', type: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel' });
    if (!ok2) return;
    await api.delete(`/capital/${id}`);
    load();
  }

  const now  = current?.capital_now || 0;
  const dep  = current?.capital_depart || 0;
  const net  = now - dep;
  const roi  = dep > 0 ? (net / dep * 100) : 0;

  return (
    <div>
      <div className="page-header">{t('capital_archive')}</div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[[t('current_capital'), now.toLocaleString() + '$', now >= dep ? 'green' : 'red'],
          [t('starting_capital'), dep.toLocaleString() + '$', 'muted'],
          [t('net_pnl'), (net >= 0 ? '+' : '') + parseFloat(net || 0).toFixed(2) + '$', net >= 0 ? 'green' : 'red'],
          [t('roi'), (roi >= 0 ? '+' : '') + parseFloat(roi || 0).toFixed(2) + '%', roi >= 0 ? 'green' : 'red'],
        ].map(([label, value, cls]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${cls} mono`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('add_new_capital')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" type="number" placeholder="Amount ($)" value={newCap} onChange={e => setNewCap(e.target.value)} />
            <button className="btn btn-primary" onClick={addCapital}>Add</button>
          </div>
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: 8 }}>{msg.text}</div>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <SortableTable
            headers={[t('col_starting'), t('col_current'), t('col_net_pnl'), t('col_roi'), t('col_created'), t('col_status'), t('col_actions')]}
            sortableCount={6}
            rows={capitals}
            rowKey={c => c.id}
            renderRow={c => {
              const cn = c.capital_now || 0, cd = c.capital_depart || c.capital_initial || 0;
              const cn2 = cn - cd, roi2 = cd > 0 ? (cn2 / cd * 100) : 0;
              const active = c.status === 'active';
              return (
                <tr key={c.id}>
                  <td className="mono">{cd.toLocaleString()}$</td>
                  <td className="mono">{cn.toLocaleString()}$</td>
                  <td className={`mono ${cn2 >= 0 ? 'green' : 'red'}`}>{(cn2 >= 0 ? '+' : '')}{parseFloat(cn2 || 0).toFixed(2)}$</td>
                  <td className={roi2 >= 0 ? 'green' : 'red'}>{parseFloat(roi2 || 0).toFixed(2)}%</td>
                  <td className="muted">{(c.date_creation || '').substring(0, 10)}</td>
                  <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? t('active') || 'Active' : t('closed') || 'Closed'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {active ? (
                        <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => deactivate(c.id)}>{ t('deactivate') || 'Deactivate' }</button>
                      ) : (
                        <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => activate(c.id)}>{ t('activate') || 'Activate' }</button>
                      )}
                      <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => deleteCapital(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Withdraw
export function Withdraw() {
  const showConfirm = useConfirm();
  const { t } = useLang();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [capNow, setCapNow] = useState(0);
  const [totalW, setTotalW] = useState(0);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [wRes, capRes] = await Promise.all([api.get('/withdraw'), api.get('/capital/current').catch(() => null)]);
    const ws = wRes?.data?.withdrawals || [];
    setHistory(ws);
    setTotalW(ws.reduce((s, w) => s + parseFloat(w.amount || 0), 0));
    setCapNow(capRes?.data?.capital_now || 0);
  }

  async function doWithdraw() {
    if (!amount || +amount <= 0) { setMsg({ type: 'error', text: 'Enter a valid amount' }); return; }
    const ok = await showConfirm({ title: t('confirm_withdrawal'), message: `${t('withdraw_btn')} ${amount}$ ?`, type: 'warning', confirmLabel: t('withdraw_btn'), cancelLabel: t('cancel') });
    if (!ok) return;
    const res = await api.post('/withdraw', { amount: +amount, ...(note ? { note } : {}) });
    if (res?.success) { setMsg({ type: 'success', text: '✓ ' + t('withdrawal_history') }); setAmount(''); setNote(''); load(); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  return (
    <div>
      <div className="page-header"><div className="page-title">{t('withdraw_title')}</div></div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">{t('available_capital')}</div><div className="stat-value green mono">{capNow.toLocaleString()}$</div></div>
        <div className="stat-card"><div className="stat-label">{t('total_withdrawn')}</div><div className="stat-value red mono">{parseFloat(totalW).toFixed(2)}$</div></div>
      </div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('new_withdrawal')}</div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Amount ($)</label>
            <input className="input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Note (optional)</label>
            <input className="input" placeholder="Reason..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 8 }}>{msg.text}</div>}
          <button className="btn btn-primary" onClick={doWithdraw} style={{ width: '100%', justifyContent: 'center' }}>{t('withdraw_btn')}</button>
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('withdrawal_history')}</div>
        <div className="table-wrap">
          <SortableTable
            headers={[t('col_date'), t('col_amount'), t('col_note')]}
            sortableCount={2}
            rows={history}
            rowKey={(w, i) => i}
            renderRow={(w, i) => (
              <tr key={i}>
                <td className="muted">{(w.created_at || '').substring(0, 10)}</td>
                <td className="mono red bold">{parseFloat(w.amount || 0).toFixed(2)}$</td>
                <td className="muted">{w.note || '—'}</td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Manage Users
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
  const [contactAttachment, setContactAttachment] = useState(null); // { name, content(base64) }
  const contactMsgRef = useRef(null);

  // Admin direct email-edit modal
  const [emailEditModal, setEmailEditModal] = useState(null); // { userId, userName, currentEmail }
  const [emailEditValue, setEmailEditValue] = useState('');
  const [emailEditMsg, setEmailEditMsg] = useState(null);

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

  // Password reset modal state
  const [pwdResetModal, setPwdResetModal] = useState(null); // { id, name }
  const [pwdResetValue, setPwdResetValue] = useState('');
  const [pwdResetShow, setPwdResetShow] = useState(false);
  const [pwdResetError, setPwdResetError] = useState('');

  async function resetPassword(id, name) {
    setPwdResetModal({ id, name });
    setPwdResetValue('');
    setPwdResetError('');
    setPwdResetShow(false);
  }

  async function submitResetPassword() {
    if (!pwdResetValue || pwdResetValue.length < 4) {
      setPwdResetError('Password must be at least 4 characters');
      return;
    }
    const res = await api.post(`/admin/users/${pwdResetModal.id}/reset-password`, { new_password: pwdResetValue });
    if (res?.success) {
      setPwdResetModal(null);
      setMsg({ type: 'success', text: `✓ Password updated for ${pwdResetModal.name}` });
    } else {
      setPwdResetError(res?.message || 'Failed to update password');
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
    const payload = {
      subject: contactForm.subject,
      message: contactForm.message,
      html: contactForm.message.replace(/\n/g, '<br>'),
      attachment: contactAttachment || undefined,
    };
    const res = await api.post(`/admin/users/${contactModal.userId}/contact`, payload);
    setContactSending(false);
    if (res?.success) {
      setContactModal(null);
      setContactAttachment(null);
      setContactForm({ subject: '', message: '' });
      setMsg({ type: 'success', text: `✓ Email sent to ${contactModal.userName}` });
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed to send email' });
    }
  }

  const emailToolbarStyle = { display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' };
  const emailAttachLabelStyle = { cursor: 'pointer', marginLeft: 'auto' };
  const emailHiddenInputStyle = { display: 'none' };
  const emailAttachInfoStyle = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12 };

  function wrapContactSelection(before, after) {
    const el = contactMsgRef.current;
    const msg = contactForm.message || '';
    if (!el) { setContactForm(f => ({ ...f, message: msg + before + after })); return; }
    const s = el.selectionStart ?? msg.length;
    const e = el.selectionEnd ?? msg.length;
    const sel = msg.substring(s, e) || 'text';
    const next = msg.substring(0, s) + before + sel + after + msg.substring(e);
    setContactForm(f => ({ ...f, message: next }));
  }

  function onContactAttach(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'Attachment must be under 5 MB' }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1] || '';
      setContactAttachment({ name: file.name, content: base64 });
    };
    reader.readAsDataURL(file);
  }

  // Admin direct email set
  function openEmailEdit(u) {
    setEmailEditModal({ userId: u.id, userName: u.user_name, currentEmail: u.email || '' });
    setEmailEditValue(u.email || '');
    setEmailEditMsg(null);
  }

  async function saveEmail() {
    if (!emailEditValue || !emailEditValue.includes('@')) {
      setEmailEditMsg({ type: 'error', text: 'Enter a valid email address' });
      return;
    }
    const res = await api.put(`/admin/users/${emailEditModal.userId}/email`, { email: emailEditValue });
    if (res?.success) {
      setEmailEditModal(null);
      setMsg({ type: 'success', text: `✓ Email updated for ${emailEditModal.userName}` });
      load();
    } else {
      setEmailEditMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  const filtered = users.filter(u => u.user_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* ── Professional Password Reset Modal ─────────────────────────── */}
      {pwdResetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#111820', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 16, padding: '32px 28px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔑</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#e8edf3' }}>Reset Password</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>For user: <strong style={{ color: 'var(--green)' }}>{pwdResetModal.name}</strong></div>
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                type={pwdResetShow ? 'text' : 'password'}
                className="input"
                placeholder="New password (min 4 chars)..."
                value={pwdResetValue}
                onChange={e => { setPwdResetValue(e.target.value); setPwdResetError(''); }}
                onKeyDown={e => e.key === 'Enter' && submitResetPassword()}
                autoFocus
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button type="button" onClick={() => setPwdResetShow(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>
                {pwdResetShow ? '🙈' : '👁'}
              </button>
            </div>
            {pwdResetError && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>⚠ {pwdResetError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={submitResetPassword}>✓ Set Password</button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPwdResetModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {emailEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, margin: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>✏️ Set Email — {emailEditModal.userName}</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Current: {emailEditModal.currentEmail || <em>not set</em>}
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">New email address</label>
              <input
                className="input"
                type="email"
                placeholder="user@example.com"
                value={emailEditValue}
                onChange={e => setEmailEditValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEmail()}
                autoFocus
              />
            </div>
            {emailEditMsg && <div className={`alert alert-${emailEditMsg.type}`} style={{ marginBottom: 10, fontSize: 12 }}>{emailEditMsg.text}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setEmailEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEmail}>✓ Save Email</button>
            </div>
          </div>
        </div>
      )}

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
              <div style={emailToolbarStyle}>
                <button type="button" className="btn btn-ghost" onClick={() => wrapContactSelection('<strong>', '</strong>')}><b>B</b></button>
                <button type="button" className="btn btn-ghost" onClick={() => wrapContactSelection('<em>', '</em>')}><i>I</i></button>
                <button type="button" className="btn btn-ghost" onClick={() => wrapContactSelection('<u>', '</u>')}><u>U</u></button>
                <label className="btn btn-ghost" style={emailAttachLabelStyle}>
                  📎 Attach
                  <input type="file" onChange={onContactAttach} style={emailHiddenInputStyle} />
                </label>
              </div>
              <textarea
                className="input"
                rows={5}
                ref={contactMsgRef}
                placeholder="Write your message here..."
                style={{ resize: 'vertical', minHeight: 100 }}
                value={contactForm.message}
                onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
              />
              {contactAttachment && (
                <div className="muted" style={emailAttachInfoStyle}>
                  📎 {contactAttachment.name}
                  <button type="button" className="btn btn-ghost" onClick={() => setContactAttachment(null)}>✕</button>
                </div>
              )}
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

      {/* ── Search ──────────────────────────────��──────────────────────── */}
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

                        {/* Admin direct email set */}
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 10, padding: '2px 7px' }}
                          onClick={() => openEmailEdit(u)}
                          title="Set / change email directly"
                        >
                          ✏️ Email
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

export function Logs() {
  const { t } = useLang();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]   = useState('');
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const PER = 20;

  useEffect(() => {
    api.get('/admin/logs?page=1&limit=1000').then(r => setLogs(r?.data?.logs || []));
  }, []);

  const DOT_COLOR = { LOGIN:'var(--blue)', LOGIN_FAILED:'var(--red)', TRADE_SAVED:'var(--green)', TRADE_DELETED:'var(--red)', TRADE_EDITED:'var(--blue)', ADMIN_ADD_USER:'var(--purple)', WITHDRAWAL:'var(--orange)', CAPITAL_ADDED:'var(--green)', ADMIN_CREATE_ALERT:'var(--orange)', ADMIN_TOGGLE_ACCESS:'var(--purple)', REGISTER:'var(--blue)', PROFILE_PHOTO_UPDATED:'var(--green)', SECRET_ANSWERS_SET:'var(--blue)', EMAIL_CHANGE_REQUEST:'var(--orange)', EMAIL_CHANGE_VERIFIED:'var(--blue)', ADMIN_APPROVE_EMAIL_CHANGE:'var(--purple)', ADMIN_IMPERSONATE:'var(--purple)', SUBSCRIPTION_ASSIGNED:'var(--green)', SUBSCRIPTION_REVOKED:'var(--red)', PASSWORD_CHANGED:'var(--orange)' };
  const dotColor = a => DOT_COLOR[a] || 'var(--dim)';

  const ACTION_ICONS = { LOGIN:'🔑', LOGIN_FAILED:'🚫', TRADE_SAVED:'📈', TRADE_DELETED:'🗑️', TRADE_EDITED:'✏️', ADMIN_ADD_USER:'👤', WITHDRAWAL:'💸', CAPITAL_ADDED:'💰', ADMIN_CREATE_ALERT:'🔔', ADMIN_TOGGLE_ACCESS:'🔒', REGISTER:'✅', PROFILE_PHOTO_UPDATED:'🖼️', SECRET_ANSWERS_SET:'🔐', EMAIL_CHANGE_REQUEST:'✉️', EMAIL_CHANGE_VERIFIED:'✅', ADMIN_APPROVE_EMAIL_CHANGE:'📧', ADMIN_IMPERSONATE:'👁️', SUBSCRIPTION_ASSIGNED:'🎫', SUBSCRIPTION_REVOKED:'❌', PASSWORD_CHANGED:'🔑' };
  const actionIcon = a => ACTION_ICONS[a] || '•';

  // Unique action types and users from log data
  const allActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean))).sort();
  const allUsers   = Array.from(new Set(logs.map(l => l.user_name).filter(Boolean))).sort();

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.action?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q);
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    const matchUser   = userFilter === 'all' || l.user_name === userFilter;
    const logDate = (l.created_at || '').substring(0, 10);
    const matchFrom = !dateFrom || logDate >= dateFrom;
    const matchTo   = !dateTo   || logDate <= dateTo;
    return matchSearch && matchAction && matchUser && matchFrom && matchTo;
  });

  const paged  = filtered.slice(page * PER, (page + 1) * PER);
  const maxPg  = Math.ceil(filtered.length / PER);
  const activeFilters = [actionFilter !== 'all', userFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

  const clearFilters = () => { setActionFilter('all'); setUserFilter('all'); setDateFrom(''); setDateTo(''); setSearch(''); setPage(0); };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="page-title">{t('logs_title')}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <button className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: 12, position: 'relative' }}
            onClick={() => setShowFilters(s => !s)}>
            ⚙ Filters {activeFilters > 0 && (
              <span style={{ marginLeft: 4, background: 'var(--red)', color: '#fff', borderRadius: 99, padding: '0 6px', fontSize: 11 }}>{activeFilters}</span>
            )}
          </button>
          {activeFilters > 0 && (
            <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--muted)' }} onClick={clearFilters}>✕ Clear</button>
          )}
        </div>
      </div>

      {/* Search bar always visible */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px' }}>
          <span style={{ color: 'var(--muted)' }}>🔍</span>
          <input style={{ flex: 1, border: 'none', background: 'transparent', padding: '11px 0', fontSize: 13, color: 'var(--text)', outline: 'none' }}
            placeholder="Search by action, details or user..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }} onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Type</label>
              <SearchableSelect
                value={actionFilter}
                onChange={v => { setActionFilter(v); setPage(0); }}
                options={[{ value: 'all', label: 'All Actions' }, ...allActions.map(a => ({ value: a, label: a.replace(/_/g, ' ') }))]}
                placeholder="All Actions"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</label>
              <SearchableSelect
                value={userFilter}
                onChange={v => { setUserFilter(v); setPage(0); }}
                options={[{ value: 'all', label: 'All Users' }, ...allUsers.map(u => ({ value: u, label: u }))]}
                placeholder="All Users"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From Date</label>
              <DatePicker style={{ padding: '8px 10px', fontSize: 13, width: '100%', colorScheme: 'dark' }}
                value={dateFrom} onChange={v => { setDateFrom(v); setPage(0); }} placeholder="From date" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To Date</label>
              <DatePicker style={{ padding: '8px 10px', fontSize: 13, width: '100%', colorScheme: 'dark' }}
                value={dateTo} onChange={v => { setDateTo(v); setPage(0); }} placeholder="To date" />
            </div>
          </div>
          {/* Quick action type badges */}
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['LOGIN', 'TRADE_SAVED', 'TRADE_DELETED', 'WITHDRAWAL', 'PROFILE_PHOTO_UPDATED', 'ADMIN_TOGGLE_ACCESS', 'SUBSCRIPTION_ASSIGNED'].map(a => (
              <button key={a} onClick={() => { setActionFilter(actionFilter === a ? 'all' : a); setPage(0); }}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: actionFilter === a ? dotColor(a) : 'var(--bg3)',
                  color: actionFilter === a ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}>
                {actionIcon(a)} {a.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Log list */}
      <div className="card">
        {paged.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--dim)', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div>No logs match your filters</div>
          </div>
        )}
        {paged.map((l, i) => {
          const date = (l.created_at || '').substring(0, 16).replace('T', ' ');
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < paged.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {/* Colored dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(l.action), flexShrink: 0, marginTop: 5 }} />
              {/* Icon */}
              <div style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }}>{actionIcon(l.action)}</div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 12, background: dotColor(l.action) + '22', color: dotColor(l.action),
                    padding: '2px 8px', borderRadius: 4, letterSpacing: '0.04em' }}>
                    {l.action}
                  </span>
                  {l.details && (
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{l.details}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>@{l.user_name}</span>
                  <span>🕐 {date}</span>
                </div>
              </div>
            </div>
          );
        })}
        {maxPg > 1 && (
          <div className="pagination" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page + 1} / {maxPg}</span>
            <button className="btn btn-ghost" disabled={page >= maxPg - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Activations
export function Activations() {
  const { t } = useLang();
  const [data, setData] = useState([]);
  useEffect(() => { load(); }, []);
  async function load() {
    const res = await api.get('/admin/activation-requests');
    setData(res?.data?.requests || []);
  }
  async function action(id, act, userId) {
    const body = act === 'approve' ? { user_id: userId } : {};
    await api.post(`/admin/activation-requests/${id}/${act}`, body);
    load();
  }
  const counts = data.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  return (
    <div>
      <div className="page-header"><div className="page-title">{t('activations_title')}</div></div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[[t('total') || 'Total', data.length, 'blue'], [t('pending') || 'Pending', counts.pending || 0, 'orange'], [t('approved') || 'Approved', (counts.activated || 0) + (counts.approved || 0), 'green'], [t('rejected') || 'Rejected', counts.rejected || 0, 'red']].map(([l, v, c]) => (
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <SortableTable
            headers={[t('col_id'), t('col_user'), t('col_device'), t('col_date'), t('col_status'), t('col_actions')]}
            sortableCount={5}
            rows={data}
            rowKey={r => r.id}
            renderRow={r => (
              <tr key={r.id}>
                <td className="muted mono">{r.id}</td>
                <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                <td className="muted mono" style={{ fontSize: 11 }}>{r.device_id?.substring(0, 20)}...</td>
                <td className="muted">{(r.requested_at || r.created_at || '').substring(0, 10)}</td>
                <td><span className={`badge ${r.status === 'pending' ? 'badge-orange' : r.status === 'activated' || r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(r.status === 'pending') && <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => action(r.id, 'approve', r.user_id)}>Approve</button>}
                    {(r.status === 'pending') && <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => action(r.id, 'reject')}>Reject</button>}
                    {r.status !== 'pending' && <span style={{ color: 'var(--dim)', fontSize: 11 }}>—</span>}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Password Reset Requests
export function PasswordReset() {
  const { t } = useLang();
  const [reqs, setReqs] = useState([]);
  const [pwdModal, setPwdModal] = useState(null); // { id, name }
  const [pwdValue, setPwdValue] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  useEffect(() => { load(); }, []);
  async function load() {
    const res = await api.get('/admin/password-resets');
    setReqs(res?.data?.requests || []);
  }
  async function approve(id, name) {
    setPwdModal({ id, name });
    setPwdValue('');
    setPwdError('');
    setShowPwd(false);
  }
  async function submitApprove() {
    if (!pwdValue || pwdValue.length < 4) { setPwdError('Password must be at least 4 characters'); return; }
    const res = await api.post(`/admin/password-resets/${pwdModal.id}/approve`, { new_password: pwdValue });
    if (res?.success) { setPwdModal(null); load(); }
    else setPwdError(res?.message || 'Failed to set password');
  }
  const showConfirm = useConfirm();
  async function reject(id) { const ok = await showConfirm({ title: 'Reject Request?', message: 'The user will need to submit a new password reset request.', type: 'danger', confirmLabel: 'Reject', cancelLabel: 'Cancel' }); if (ok) { await api.post(`/admin/password-resets/${id}/reject`, {}); load(); } }
  const counts = reqs.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  return (
    <div>
      {/* Styled Password Modal */}
      {pwdModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#111820', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 16, padding: '32px 28px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔑</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#e8edf3' }}>Set New Password</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>For user: <strong style={{ color: 'var(--green)' }}>{pwdModal.name}</strong></div>
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="input"
                placeholder="New password (min 4 chars)..."
                value={pwdValue}
                onChange={e => { setPwdValue(e.target.value); setPwdError(''); }}
                onKeyDown={e => e.key === 'Enter' && submitApprove()}
                autoFocus
                style={{ width: '100%', paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {pwdError && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>⚠ {pwdError}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={submitApprove}>✓ Set Password</button>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setPwdModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header"><div className="page-title">{t('pwd_resets_title')}</div></div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[[t('total') || 'Total', reqs.length, 'blue'], [t('pending') || 'Pending', counts.pending || 0, 'orange'], [t('approved') || 'Approved', counts.approved || 0, 'green'], [t('rejected') || 'Rejected', counts.rejected || 0, 'red']].map(([l, v, c]) => (
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <SortableTable
            headers={[t('col_id')||'#', t('col_user')||'User', t('col_date')||'Date', t('col_status')||'Status', t('col_actions')||'Actions']}
            sortableCount={4}
            rows={reqs}
            rowKey={r => r.id}
            renderRow={r => (
              <tr key={r.id}>
                <td className="muted mono">{r.id}</td>
                <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                <td className="muted">{(r.created_at || '').substring(0, 10)}</td>
                <td><span className={`badge ${r.status === 'pending' ? 'badge-orange' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.status === 'pending' && <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => approve(r.id, r.user_name)}>Set Password</button>}
                    {r.status === 'pending' && <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => reject(r.id)}>Reject</button>}
                    {r.status !== 'pending' && <span style={{ color: 'var(--dim)', fontSize: 11 }}>—</span>}
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Email Change Requests
export function EmailChangeRequests() {
  const { t } = useLang();
  const showConfirm = useConfirm();
  const [reqs, setReqs] = useState([]);
  useEffect(() => { load(); }, []);
  async function load() {
    const res = await api.get('/admin/email-change-requests');
    setReqs(res?.data?.requests || []);
  }
  async function approve(id, userName, newEmail) {
    const ok = await showConfirm({
      title: 'Approve Email Change?',
      message: `This will update ${userName}'s email to ${newEmail}. They will be notified automatically.`,
      type: 'primary',
      confirmLabel: 'Approve',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    const res = await api.post(`/admin/email-change-requests/${id}/approve`, {});
    if (res?.success) load();
  }
  async function reject(id, userName) {
    const ok = await showConfirm({
      title: 'Reject Request?',
      message: `Reject ${userName}'s email change request? They will be notified by email.`,
      type: 'danger',
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    await api.post(`/admin/email-change-requests/${id}/reject`, {});
    load();
  }
  const counts = reqs.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  return (
    <div>
      <div className="page-header"><div className="page-title">✉️ Email Change Requests</div></div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[['Total', reqs.length, 'blue'], ['Pending', counts.pending || 0, 'orange'], ['Approved', counts.approved || 0, 'green'], ['Rejected', counts.rejected || 0, 'red']].map(([l, v, c]) => (
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <SortableTable
            headers={[t('col_id') || '#', t('col_user') || 'User', 'Current Email', 'Requested Email', t('col_date') || 'Date', t('col_status') || 'Status', t('col_actions') || 'Actions']}
            sortableCount={6}
            rows={reqs}
            rowKey={r => r.id}
            renderRow={r => (
              <tr key={r.id}>
                <td className="muted mono">{r.id}</td>
                <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                <td className="muted" style={{ fontSize: 12 }}>{r.current_email || <em>—</em>}</td>
                <td style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: 13 }}>{r.new_email}</td>
                <td className="muted">{(r.created_at || '').substring(0, 10)}</td>
                <td>
                  <span className={`badge ${r.status === 'pending' ? 'badge-orange' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                    {r.status}
                  </span>
                </td>
                <td>
                  {r.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => approve(r.id, r.user_name, r.new_email)}>Approve</button>
                      <button className="btn btn-danger"  style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => reject(r.id, r.user_name)}>Reject</button>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--dim)', fontSize: 11 }}>—</span>
                  )}
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// My Profile
// My Profile
export function Profile() {
  const { t } = useLang();
  const { updateAvatar } = useAuth();
  const [profile, setProfile]   = useState(null);
  // Avatar: object URL (instant) or server URL
  const [avatarSrc, setAvatarSrc] = useState(null);

  // Photo flow
  const fileInputRef             = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCrop, setShowCrop]  = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // 'idle'|'uploading'|'success'|'error'
  const [uploadMsg, setUploadMsg] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Security questions
  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');
  const [questions, setQuestions] = useState([]);
  const [msg, setMsg] = useState(null);

  // Admin direct email
  const [adminEmail, setAdminEmail]         = useState('');
  const [adminEmailMsg, setAdminEmailMsg]   = useState(null);
  const [adminEmailLoading, setAdminEmailLoading] = useState(false);
  const [emailEditMode, setEmailEditMode] = useState(false);

  // Email change 3-step
  const [emailStep, setEmailStep] = useState('idle');
  const [userQ1, setUserQ1]       = useState('');
  const [userQ2, setUserQ2]       = useState('');
  const [verifyA1, setVerifyA1]   = useState('');
  const [verifyA2, setVerifyA2]   = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState(null);
  const [verifyToken, setVerifyToken]     = useState(null);
  const [newEmail, setNewEmail]   = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  // First-login security setup
  const [showSecurityAlert, setShowSecurityAlert] = useState(false);

  const DEFAULTS = [
    'What is your favourite color?', 'Name of your best player?',
    'What is your birthday?', "Mother's maiden name?",
    'First pet name?', 'City you were born in?',
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup_security') === '1') {
      setShowSecurityAlert(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    api.get('/profile').then(r => {
      const u = r?.data?.user || null;
      setProfile(u);
      // The backend stores the photo in `profile_pic`; fall back to other shapes.
      const pic = u?.profile_pic || u?.avatar || u?.avatar_url || u?.picture || null;
      if (pic) { setAvatarSrc(pic); updateAvatar(pic); }
      if (u?.email)  setAdminEmail(u.email);
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

  // ── Photo flow ────────────────────────��────────────────────────────────
  // Step 1: button click → open picker via ref only (no label wrapper)
  function openFilePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // allow same file re-select
      fileInputRef.current.click();
    }
  }

  // Step 2: file chosen → open crop dialog
  function onFileChosen(e) {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = ''; // reset immediately — prevents double-fire
    setSelectedFile(f);
    setShowCrop(true);
  }

  // Step 3: crop saved → show upload progress → instant avatar preview
  async function handleCropSave(blob) {
    setShowCrop(false);
    setSelectedFile(null);

    // Show instant local preview
    const localUrl = URL.createObjectURL(blob);
    setAvatarSrc(localUrl);

    // Show uploading state
    setUploadState('uploading');
    setUploadMsg('');

    const formFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    const res = await api.uploadFile('/profile/picture', formFile, 'picture');

    if (res?.success) {
      const serverUrl = res?.data?.url || res?.data?.profile_pic || res?.data?.avatar || res?.data?.avatar_url || res?.data?.picture || res?.url || null;
      if (serverUrl) { setAvatarSrc(serverUrl); updateAvatar(serverUrl); }
      else {
        // Reload profile to get updated avatar URL
        api.get('/profile').then(r => {
          const av = r?.data?.user?.profile_pic || r?.data?.user?.avatar || r?.data?.user?.avatar_url || r?.data?.user?.picture;
          if (av) { setAvatarSrc(av); updateAvatar(av); }
        }).catch(() => {});
      }
      setUploadState('success');
      // Log to backend
      api.post('/log', { action: 'PROFILE_PHOTO_UPDATED', details: 'Profile photo updated' }).catch(() => {});
    } else {
      setAvatarSrc(profile?.profile_pic || profile?.avatar || null); // revert on failure
      setUploadState('error');
      setUploadMsg(res?.message || 'Upload failed');
    }
    URL.revokeObjectURL(localUrl);
  }

  function handleCropCancel() {
    setShowCrop(false);
    setSelectedFile(null);
  }

  // ── Admin email ────────────────────────────────────────────────────���──
  async function saveAdminEmail() {
    if (!adminEmail || !adminEmail.includes('@')) {
      setAdminEmailMsg({ type: 'error', text: 'Enter a valid email address' }); return;
    }
    setAdminEmailLoading(true); setAdminEmailMsg(null);
    const res = await api.put('/profile/email', { email: adminEmail });
    setAdminEmailLoading(false);
    if (res?.success) {
      setAdminEmailMsg({ type: 'success', text: '✓ Email saved!' });
      setProfile(p => ({ ...p, email: adminEmail }));
      setEmailEditMode(false);
    } else {
      setAdminEmailMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  // ── Security questions ────────────────────────────────────────────────
  async function saveQuestions() {
    if (!q1 || !a1 || !q2 || !a2) { setMsg({ type: 'error', text: 'All fields required' }); return; }
    if (q1 === q2) { setMsg({ type: 'error', text: 'Questions must be different' }); return; }
    const res = await api.post('/set-secret-answers', { question_1: q1, answer_1: a1, question_2: q2, answer_2: a2 });
    if (res?.success) {
      setMsg({ type: 'success', text: '✓ Security questions saved!' });
      setA1(''); setA2(''); setUserQ1(q1); setUserQ2(q2);
      setShowSecurityAlert(false);
      api.post('/log', { action: 'SECRET_ANSWERS_SET', details: 'User set security questions' }).catch(() => {});
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  // ── Email change ──────────────────────────────────────────────────────
  async function startEmailChange() {
    setVerifyA1(''); setVerifyA2(''); setVerifyMsg(null);
    setNewEmail(''); setSubmitMsg(null); setVerifyToken(null);
    try {
      const r = await api.get('/profile');
      const uname = r?.data?.user?.user_name;
      if (uname) {
        const qr = await api.get(`/secret-questions/${uname}`).catch(() => null);
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
    const res = await api.post('/profile/verify-for-email-change', { answer_1: verifyA1, answer_2: verifyA2 });
    setVerifyLoading(false);
    if (res?.success) {
      setVerifyToken(res.data?.verify_token); setEmailStep('verified');
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
    const res = await api.post('/profile/request-email-change', { new_email: newEmail, verify_token: verifyToken });
    setSubmitLoading(false);
    if (res?.success) {
      setEmailStep('pending'); setVerifyToken(null);
    } else {
      if (res?.message?.includes('expired') || res?.message?.includes('invalid')) setEmailStep('idle');
      setSubmitMsg({ type: 'error', text: res?.message || 'Failed to submit request' });
    }
  }

  const initials = profile?.user_name?.[0]?.toUpperCase() || 'U';

  return (
    <div>
      {/* ── Photo crop dialog (Profile only) ─────────────────────────── */}
      {showCrop && selectedFile && (
        <PhotoCropDialogInline
          file={selectedFile}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
          t={t}
        />
      )}

      {showPhotoModal && (
        <PhotoViewModal
          avatarSrc={avatarSrc}
          initials={initials}
          userName={profile?.user_name || ''}
          onClose={() => setShowPhotoModal(false)}
          onChange={openFilePicker}
        />
      )}

      {/* ── Upload status overlay ─────────────────────────────────────── */}
      {uploadState !== 'idle' && (
        <UploadStatusOverlay
          state={uploadState}
          msg={uploadMsg}
          onClose={() => setUploadState('idle')}
          t={t}
        />
      )}

      {/* Hidden file input — single ref trigger only, NO label wrapper */}
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

      {showSecurityAlert && (
        <div className="alert alert-warning" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>🔐 <strong>Setup Required:</strong> Please set your security questions on the right to protect your account.</span>
          <button onClick={() => setShowSecurityAlert(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      )}

      <div className="grid-2">
        {/* ── Identity card ──────────────────────────────────────────── */}
        <div className="card">
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'var(--bg4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: 'var(--blue)',
              overflow: 'hidden', flexShrink: 0,
              border: '2px solid rgba(0,230,118,0.2)',
              position: 'relative',
            }} onClick={() => setShowPhotoModal(true)} title="View / change photo" role="button">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.user_name}</div>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{profile?.role}</span>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {t('member_since')} {(profile?.created_at || '').substring(0, 10)}
              </div>
            </div>
          </div>

          {/* ── Email section ─────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 14 }}>
            {profile?.role === 'admin' ? (
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>✉️ Email Address</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" type="email" placeholder="your@email.com"
                    value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminEmailMsg(null); }}
                    onKeyDown={e => e.key === 'Enter' && saveAdminEmail()} readOnly={!emailEditMode} style={{ flex: 1 }} />
                  <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}
                    onClick={saveAdminEmail} disabled={adminEmailLoading} hidden={!emailEditMode}>
                    {adminEmailLoading ? '...' : '✓ Save'}
                  </button>
                  {!emailEditMode && (
                    <button className="btn btn-ghost" onClick={() => { setEmailEditMode(true); setAdminEmailMsg(null); }}>✏️ Edit</button>
                  )}
                </div>
                {adminEmailMsg && <div className={`alert alert-${adminEmailMsg.type}`} style={{ marginTop: 8, fontSize: 12 }}>{adminEmailMsg.text}</div>}
              </div>
            ) : (
              <>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    ✉️ Email Address
                    <span style={{ fontSize: 10, color: 'var(--dim)', fontWeight: 400 }}>(read-only)</span>
                  </label>
                  <div className="input" style={{ cursor: 'default', opacity: 0.75, background: 'var(--bg3)' }}>
                    {profile?.email || <span style={{ opacity: 0.4 }}>Not set</span>}
                  </div>
                </div>
                {emailStep === 'idle' && (
                  <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={startEmailChange}>🔐 Request email change</button>
                )}
                {emailStep === 'pending' && (
                  <div className="alert alert-warning" style={{ fontSize: 12 }}>⏳ Your email change request is pending admin approval.</div>
                )}
                {emailStep === 'verifying' && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🔒 Verify your identity</div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>Answer your security questions to continue.</div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label" style={{ fontSize: 12 }}>{userQ1 || 'Security Question 1'}</label>
                      <input className="input" placeholder="Your answer..." value={verifyA1} onChange={e => setVerifyA1(e.target.value)} autoComplete="off" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label" style={{ fontSize: 12 }}>{userQ2 || 'Security Question 2'}</label>
                      <input className="input" placeholder="Your answer..." value={verifyA2} onChange={e => setVerifyA2(e.target.value)} autoComplete="off" onKeyDown={e => e.key === 'Enter' && submitVerify()} />
                    </div>
                    {verifyMsg && <div className={`alert alert-${verifyMsg.type}`} style={{ marginBottom: 10, fontSize: 12 }}>{verifyMsg.text}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" onClick={submitVerify} disabled={verifyLoading}>{verifyLoading ? 'Checking...' : '✓ Verify'}</button>
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
                        onChange={e => setNewEmail(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && submitEmailChange()} />
                    </div>
                    {submitMsg && <div className={`alert alert-${submitMsg.type}`} style={{ marginBottom: 10, fontSize: 12 }}>{submitMsg.text}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" onClick={submitEmailChange} disabled={submitLoading}>{submitLoading ? 'Submitting...' : '📨 Submit request'}</button>
                      <button className="btn btn-ghost" onClick={() => setEmailStep('idle')}>Cancel</button>
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Admin will review and approve. You'll be notified by email.</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Change photo — button only, NO label wrapper ──────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={openFilePicker}
            >
              {t('change_photo')}
            </button>
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

      {/* ── All users' security questions (view list + edit) ──────────── */}
      <AllSecurityQuestions
        t={t}
        isAdmin={profile?.role === 'admin'}
        currentUser={profile?.user_name}
        questionBank={questions}
        onEditMine={(uq1, uq2) => {
          if (uq1) setQ1(uq1);
          if (uq2) setQ2(uq2);
          setA1(''); setA2('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

/* ── All Users' Security Questions (view + admin edit) ───────────────────── */
function AllSecurityQuestions({ t, isAdmin, currentUser, questionBank, onEditMine }) {
  const [rows, setRows]       = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState('');
  const [editId, setEditId]   = React.useState(null);
  const [eq1, setEq1]         = React.useState('');
  const [ea1, setEa1]         = React.useState('');
  const [eq2, setEq2]         = React.useState('');
  const [ea2, setEa2]         = React.useState('');
  const [saving, setSaving]   = React.useState(false);
  const [rowMsg, setRowMsg]   = React.useState(null);

  const SQ = {
    card: { marginTop: 16 },
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontWeight: 700, fontSize: 16 },
    scroll: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thL: { textAlign: 'left', padding: 8, opacity: 0.7, fontSize: 13 },
    thR: { textAlign: 'right', padding: 8, opacity: 0.7, fontSize: 13 },
    rowTr: { borderTop: '1px solid rgba(255,255,255,0.08)' },
    tdName: { padding: 8, fontWeight: 600 },
    td: { padding: 8 },
    tdR: { padding: 8, textAlign: 'right' },
    you: { marginLeft: 6 },
    editTd: { padding: 12, background: 'rgba(255,255,255,0.03)' },
    grid: { gap: 12 },
    actions: { display: 'flex', gap: 8, marginTop: 8 },
  };

  const bank = (questionBank && questionBank.length) ? questionBank : [
    'What is your favourite color?', 'Name of your best player?',
    'What is your birthday?', "Mother's maiden name?",
    'First pet name?', 'City you were born in?',
  ];

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    api.get('/secret-questions/all').then(r => {
      if (r && r.success) setRows((r.data && r.data.users) || []);
      else setError((r && r.message) || 'Failed to load');
    }).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  function startEdit(row) {
    setRowMsg(null);
    setEditId(row.id);
    setEq1(row.question_1 || '');
    setEq2(row.question_2 || '');
    setEa1(''); setEa2('');
  }

  function cancelEdit() { setEditId(null); setRowMsg(null); }

  async function saveEdit(row) {
    if (!eq1 || !ea1 || !eq2 || !ea2) { setRowMsg({ type: 'error', text: 'All fields required' }); return; }
    if (eq1 === eq2) { setRowMsg({ type: 'error', text: 'Questions must be different' }); return; }
    setSaving(true); setRowMsg(null);
    const res = await api.post('/admin/users/' + row.id + '/set-secret-answers', {
      question_1: eq1, answer_1: ea1, question_2: eq2, answer_2: ea2,
    });
    setSaving(false);
    if (res && res.success) {
      setRowMsg({ type: 'success', text: 'Saved' });
      setEditId(null);
      load();
    } else {
      setRowMsg({ type: 'error', text: (res && res.message) || 'Failed' });
    }
  }

  const visibleRows = isAdmin ? rows : rows.filter(r => r.user_name === currentUser);

  return (
    <div className="card" style={SQ.card}>
      <div style={SQ.head}>
        <div style={SQ.title}>{t('all_security_questions') || 'All Security Questions'}</div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>{t('refresh') || 'Refresh'}</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="muted">Loading...</div>
      ) : visibleRows.length === 0 ? (
        <div className="muted">No security questions found.</div>
      ) : (
        <div style={SQ.scroll}>
          <table style={SQ.table}>
            <thead>
              <tr>
                <th style={SQ.thL}>User</th>
                <th style={SQ.thL}>Question 1</th>
                <th style={SQ.thL}>Question 2</th>
                <th style={SQ.thL}>Answers</th>
                <th style={SQ.thR}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(row => (
                <React.Fragment key={row.id}>
                  <tr style={SQ.rowTr}>
                    <td style={SQ.tdName}>
                      {row.user_name}
                      {row.user_name === currentUser && <span className="badge badge-blue" style={SQ.you}>you</span>}
                    </td>
                    <td style={SQ.td}>{row.question_1 || <span className="muted">not set</span>}</td>
                    <td style={SQ.td}>{row.question_2 || <span className="muted">not set</span>}</td>
                    <td style={SQ.td}>{row.has_answers ? <span className="badge badge-blue">✓ Set</span> : <span className="muted">Not set</span>}</td>
                    <td style={SQ.tdR}>
                      {isAdmin ? (
                        <button className="btn btn-ghost" onClick={() => startEdit(row)}>Edit</button>
                      ) : row.user_name === currentUser ? (
                        <button className="btn btn-ghost" onClick={() => onEditMine(row.question_1, row.question_2)}>Edit</button>
                      ) : <span className="muted">-</span>}
                    </td>
                  </tr>
                  {isAdmin && editId === row.id && (
                    <tr>
                      <td colSpan={5} style={SQ.editTd}>
                        <div className="grid-2" style={SQ.grid}>
                          <div className="form-group">
                            <label className="form-label">Question 1</label>
                            <select className="select" value={eq1} onChange={e => setEq1(e.target.value)}>
                              <option value="">Select...</option>
                              {bank.map(q => <option key={q}>{q}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Answer 1</label>
                            <input className="input" placeholder="New answer..." value={ea1} onChange={e => setEa1(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Question 2</label>
                            <select className="select" value={eq2} onChange={e => setEq2(e.target.value)}>
                              <option value="">Select...</option>
                              {bank.filter(q => q !== eq1).map(q => <option key={q}>{q}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Answer 2</label>
                            <input className="input" placeholder="New answer..." value={ea2} onChange={e => setEa2(e.target.value)} />
                          </div>
                        </div>
                        {rowMsg && <div className={'alert alert-' + rowMsg.type}>{rowMsg.text}</div>}
                        <div style={SQ.actions}>
                          <button className="btn btn-primary" onClick={() => saveEdit(row)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                          <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Inline crop dialog (only used inside Profile) ───────────────────────── */
function PhotoCropDialogInline({ file, onSave, onCancel, t }) {
  const CROP_SIZE = 260;
  const [shape, setShape] = React.useState('circle');
  const [zoom, setZoom]   = React.useState(1);
  const [pos, setPos]     = React.useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = React.useState({ w: 0, h: 0 });
  const [saving, setSaving]   = React.useState(false);
  const [src, setSrc]         = React.useState('');
  const imgRef  = React.useRef(null);
  const dragRef = React.useRef(null);
  const objUrl  = React.useRef(null);

  React.useEffect(() => {
    if (!file) return;
    objUrl.current = URL.createObjectURL(file);
    setSrc(objUrl.current);
    return () => { if (objUrl.current) URL.revokeObjectURL(objUrl.current); };
  }, [file]);

  const handleImgLoad = React.useCallback(() => {
    const el = imgRef.current; if (!el) return;
    const w = el.naturalWidth, h = el.naturalHeight;
    setImgSize({ w, h });
    setZoom(Math.max(CROP_SIZE / w, CROP_SIZE / h));
    setPos({ x: 0, y: 0 });
  }, []);

  function clamp({ x, y }) {
    if (!imgSize.w) return { x, y };
    const maxX = Math.max(0, (imgSize.w * zoom - CROP_SIZE) / 2);
    const maxY = Math.max(0, (imgSize.h * zoom - CROP_SIZE) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }

  React.useEffect(() => { setPos(p => clamp(p)); }, [zoom, imgSize]); // eslint-disable-line

  const onMouseDown = React.useCallback((e) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    function onMove(ev) {
      setPos(clamp({ x: dragRef.current.origX + ev.clientX - dragRef.current.startX, y: dragRef.current.origY + ev.clientY - dragRef.current.startY }));
    }
    function onUp() { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]); // eslint-disable-line

  const onTouchStart = React.useCallback((e) => {
    const t0 = e.touches[0];
    dragRef.current = { startX: t0.clientX, startY: t0.clientY, origX: pos.x, origY: pos.y };
    function onMove(ev) {
      const t1 = ev.touches[0];
      setPos(clamp({ x: dragRef.current.origX + t1.clientX - dragRef.current.startX, y: dragRef.current.origY + t1.clientY - dragRef.current.startY }));
    }
    function onEnd() { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd); }
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, [pos]); // eslint-disable-line

  const onWheel = React.useCallback((e) => {
    e.preventDefault();
    const minZ = imgSize.w ? Math.max(CROP_SIZE / imgSize.w, CROP_SIZE / imgSize.h) : 0.5;
    setZoom(z => Math.min(5, Math.max(minZ, z - e.deltaY * 0.001)));
  }, [imgSize]);

  async function handleSave() {
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const OUT = 400; canvas.width = OUT; canvas.height = OUT;
      const ctx = canvas.getContext('2d');
      if (shape === 'circle') { ctx.beginPath(); ctx.arc(OUT/2, OUT/2, OUT/2, 0, Math.PI*2); ctx.clip(); }
      const scaledW = imgSize.w * zoom, scaledH = imgSize.h * zoom;
      const imgLeft = (CROP_SIZE - scaledW) / 2 + pos.x;
      const imgTop  = (CROP_SIZE - scaledH) / 2 + pos.y;
      ctx.drawImage(imgRef.current, (0 - imgLeft)/zoom, (0 - imgTop)/zoom, CROP_SIZE/zoom, CROP_SIZE/zoom, 0, 0, OUT, OUT);
      canvas.toBlob(blob => { if (blob) onSave(blob); setSaving(false); }, 'image/jpeg', 0.92);
    } catch { setSaving(false); }
  }

  const minZoom = imgSize.w ? Math.max(CROP_SIZE / imgSize.w, CROP_SIZE / imgSize.h) : 0.5;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background:'linear-gradient(160deg,#111820 0%,#0d1117 100%)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:20, padding:'28px 28px 24px', width:'100%', maxWidth:420, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', position:'relative' }}>
        <button onClick={onCancel} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.06)', border:'none', color:'#5a7a9a', fontSize:18, cursor:'pointer', width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#e8edf3', marginBottom:4 }}>{t('photo_dialog_title')}</div>
          <div style={{ fontSize:12, color:'#5a7a9a' }}>{t('photo_dialog_sub')}</div>
        </div>
        {/* Crop box */}
        <div style={{ width:CROP_SIZE, height:CROP_SIZE, margin:'0 auto 18px', position:'relative', overflow:'hidden', borderRadius: shape==='circle'?'50%':12, border:'2px solid rgba(0,230,118,0.5)', cursor:'grab', userSelect:'none', touchAction:'none' }}
          onMouseDown={onMouseDown} onTouchStart={onTouchStart} onWheel={onWheel}>
          <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', backgroundImage:`linear-gradient(rgba(255,255,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.07) 1px,transparent 1px)`, backgroundSize:`${CROP_SIZE/3}px ${CROP_SIZE/3}px` }} />
          {src && (
            <img ref={imgRef} src={src} alt="crop" onLoad={handleImgLoad} draggable={false}
              style={{ position:'absolute', width:imgSize.w*zoom, height:imgSize.h*zoom, top:'50%', left:'50%', transform:`translate(calc(-50% + ${pos.x}px),calc(-50% + ${pos.y}px))`, pointerEvents:'none' }} />
          )}
        </div>
        <div style={{ fontSize:11, color:'#3a5a7a', textAlign:'center', marginBottom:16 }}>🖱 Drag to reposition · Scroll to zoom</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Shape toggle */}
          <div style={{ display:'flex', gap:8 }}>
            {['circle','square'].map(s => (
              <button key={s} type="button" onClick={() => setShape(s)} style={{ flex:1, padding:'8px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', border: shape===s?'1px solid rgba(0,230,118,0.6)':'1px solid var(--border,#1e2d3d)', background: shape===s?'rgba(0,230,118,0.12)':'var(--bg3,#0d1f2d)', color: shape===s?'#00e676':'#5a7a9a', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {s==='circle' ? <><span style={{fontSize:16}}>◯</span> {t('photo_shape_circle')}</> : <><span style={{fontSize:16}}>⬜</span> {t('photo_shape_square')}</>}
              </button>
            ))}
          </div>
          {/* Zoom */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'#5a7a9a', fontWeight:600 }}>🔍 {t('photo_zoom')}</span>
              <span style={{ fontSize:11, color:'#3a5a7a', fontFamily:'monospace' }}>{Math.round(zoom*100)}%</span>
            </div>
            <input type="range" min={Math.round(minZoom*100)} max={500} step={1} value={Math.round(zoom*100)} onChange={e => setZoom(Number(e.target.value)/100)} style={{ width:'100%', accentColor:'#00e676', cursor:'pointer' }} />
          </div>
          {/* Buttons */}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" onClick={onCancel} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border,#1e2d3d)', background:'var(--bg3,#0d1f2d)', color:'#5a7a9a', fontWeight:700, fontSize:13, cursor:'pointer' }}>{t('photo_cancel')}</button>
            <button type="button" onClick={handleSave} disabled={saving||!src} style={{ flex:2, padding:'11px', borderRadius:10, background: saving?'rgba(0,230,118,0.3)':'linear-gradient(135deg,#00e676,#00c853)', border:'none', color:'#080c10', fontWeight:800, fontSize:13, cursor: saving?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {saving ? <><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⟳</span> Saving...</> : <>💾 {t('photo_save')}</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

/* ── Upload status overlay — replaces the native alert() ────────────────── */
function UploadStatusOverlay({ state, msg, onClose, t }) {
  const isLoading = state === 'uploading';
  const isSuccess = state === 'success';

  // Auto-close on success after 2.5s
  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99998, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
      <div style={{ background:'linear-gradient(160deg,#111820,#0d1117)', border:`1px solid ${isSuccess?'rgba(0,230,118,0.35)':isLoading?'rgba(255,255,255,0.08)':'rgba(255,71,87,0.35)'}`, borderRadius:20, padding:'36px 40px', maxWidth:360, width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}>
        {/* Icon */}
        {isLoading && (
          <div style={{ width:64, height:64, margin:'0 auto 20px', borderRadius:'50%', border:'3px solid rgba(0,230,118,0.2)', borderTop:'3px solid #00e676', animation:'spin 0.9s linear infinite' }} />
        )}
        {isSuccess && (
          <div style={{ width:64, height:64, margin:'0 auto 20px', borderRadius:'50%', background:'rgba(0,230,118,0.12)', border:'2px solid rgba(0,230,118,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>✓</div>
        )}
        {state === 'error' && (
          <div style={{ width:64, height:64, margin:'0 auto 20px', borderRadius:'50%', background:'rgba(255,71,87,0.1)', border:'2px solid rgba(255,71,87,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>✕</div>
        )}
        {/* Title */}
        <div style={{ fontSize:18, fontWeight:800, color: isSuccess?'#00e676': state==='error'?'#ff4757':'#e8edf3', marginBottom:8 }}>
          {isLoading ? 'Uploading photo…' : isSuccess ? t('photo_updated') : 'Upload failed'}
        </div>
        <div style={{ fontSize:13, color:'#5a7a9a', marginBottom: state==='error'?20:0 }}>
          {isLoading ? 'Please wait while your photo is being saved.' : isSuccess ? 'Your profile photo has been updated successfully.' : msg || 'Something went wrong. Please try again.'}
        </div>
        {/* Error close button */}
        {state === 'error' && (
          <button onClick={onClose} style={{ background:'rgba(255,71,87,0.15)', border:'1px solid rgba(255,71,87,0.35)', color:'#ff4757', borderRadius:10, padding:'10px 24px', fontWeight:700, fontSize:13, cursor:'pointer' }}>Close</button>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

export function Password() {
  const { t } = useLang();
  const [cur, setCur] = useState('');
  const [np, setNp] = useState('');
  const [conf, setConf] = useState('');
  const [msg, setMsg] = useState(null);

  async function change() {
    if (!cur) { setMsg({ type: 'error', text: 'Enter current password' }); return; }
    if (!np)  { setMsg({ type: 'error', text: 'Enter new password' }); return; }
    if (np !== conf) { setMsg({ type: 'error', text: "Passwords don't match" }); return; }
    if (np.length < 6) { setMsg({ type: 'error', text: 'Minimum 6 characters' }); return; }
    const res = await api.post('/change-password', { current_password: cur, new_password: np });
    if (res?.success) { setMsg({ type: 'success', text: '✓ Password changed!' }); setCur(''); setNp(''); setConf('');
      localStorage.setItem('tj_onboard_pw_' + (localStorage.getItem('username') || ''), '1');
      window.dispatchEvent(new CustomEvent('onboard-refresh'));
      api.post('/log', { action: 'PASSWORD_CHANGED', details: 'Password changed successfully' }).catch(() => {}); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  return (
    <div>
      <div className="page-header"><div className="page-title">{t('password_title')}</div></div>
      <div style={{ maxWidth: 420 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[[t('current_password'), cur, setCur], [t('new_password'), np, setNp], [t('confirm_password'), conf, setConf]].map(([label, val, setter]) => (
            <div key={label} className="form-group">
              <label className="form-label">{label}</label>
              <input className="input" type="password" value={val} onChange={e => setter(e.target.value)} />
            </div>
          ))}
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <button className="btn btn-primary" onClick={change} style={{ justifyContent: 'center' }}>{t('change_password')}</button>
        </div>
      </div>
    </div>
  );
}
