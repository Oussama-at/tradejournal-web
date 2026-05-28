import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useConfirm } from '../components/ConfirmDialog';
import { useLang } from '../lang/LangContext';

const PACK_OPTIONS = ['trial', '6months', '1year', 'lifetime'];
const PACK_LABELS  = { trial: '24h Trial', '6months': '6 Months', '1year': '1 Year', lifetime: 'Lifetime' };

const PAYMENT_OPTIONS = {
  trial:     null,
  '6months': ['manual', 'card', 'btc', 'usdt', 'eth'],
  '1year':   ['manual', 'card', 'btc', 'usdt', 'eth'],
  lifetime:  ['manual'],
};

function packBadgeClass(pack, expired) {
  if (expired) return 'sub-expired';
  return { trial: 'sub-trial', '6months': 'sub-6months', '1year': 'sub-yearly', lifetime: 'sub-lifetime' }[pack] || 'sub-monthly';
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── Quick Add User Modal ───────────────────────────────── */
function AddUserModal({ onClose, onCreated }) {
  const { t } = useLang();
  const [form, setForm]   = useState({ user_name: '', password: '', role: 'user' });
  const [err,  setErr]    = useState('');
  const [busy, setBusy]   = useState(false);

  async function submit() {
    if (!form.user_name.trim()) { setErr(t('username_required') || 'Username is required'); return; }
    if (!form.password.trim())  { setErr(t('password_required') || 'Password is required'); return; }
    setBusy(true);
    const res = await api.post('/admin/users', form);
    setBusy(false);
    if (res?.success) {
      onCreated(res.data?.user || res.data || { id: res.data?.id, user_name: form.user_name });
    } else {
      setErr(res?.message || 'Failed to create user');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: 400, padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            👤 {t('quick_add_user') || 'Quick Add User'}
          </div>
          <button className="btn btn-ghost" style={{ padding: '3px 8px' }} onClick={onClose}>✕</button>
        </div>

        {err && (
          <div className="alert alert-error" style={{ marginBottom: 14, fontSize: 13 }}>{err}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">{t('username') || 'Username'}</label>
            <input className="input" autoFocus placeholder={t('username') || 'Username'}
              value={form.user_name}
              onChange={e => { setForm(f => ({ ...f, user_name: e.target.value })); setErr(''); }} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('new_password') || 'Password'}</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErr(''); }} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('col_role') || 'Role'}</label>
            <select className="select" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? (t('loading') || 'Creating...') : (t('create_user') || '+ Create User')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export default function Subscriptions() {
  const showConfirm = useConfirm();
  const { t } = useLang();
  const [subs,         setSubs]         = useState([]);
  const [users,        setUsers]        = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search,       setSearch]       = useState('');
  const [msg,          setMsg]          = useState(null);
  const [showAdd,      setShowAdd]      = useState(false);
  const [editSub,      setEditSub]      = useState(null);
  const [showAddUser,  setShowAddUser]  = useState(false);   // ← quick-add user modal

  const [newSub, setNewSub] = useState({ user_id: '', pack: 'trial', payment_method: '' });

  useEffect(() => { loadSubs(); loadUsers(); }, []);

  async function load() { loadSubs(); loadUsers(); }

  async function loadSubs() {
    try {
      const res = await api.get('/admin/subscriptions');
      setSubs(res?.data?.subscriptions || []);
    } catch (e) { console.error('subs error', e); }
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const res  = await api.get('/admin/users');
      const list = res?.data?.users || res?.data || res?.users || (Array.isArray(res) ? res : []);
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) { console.error('users error', e); }
    setUsersLoading(false);
  }

  function handlePackChange(pack) {
    const opts = PAYMENT_OPTIONS[pack];
    setNewSub(s => ({ ...s, pack, payment_method: opts ? opts[0] : '' }));
  }

  /* Called after quick-add succeeds — auto-select the new user */
  function handleUserCreated(newUser) {
    setShowAddUser(false);
    loadUsers();   // refresh list
    // auto-select the newly created user if we have their id
    if (newUser?.id) {
      setNewSub(s => ({ ...s, user_id: String(newUser.id) }));
    }
    setMsg({ type: 'success', text: `✓ User "${newUser?.user_name || ''}" created!` });
  }

  async function createSub() {
    if (!newSub.user_id) { setMsg({ type: 'error', text: t('select_user') || 'Select a user' }); return; }
    const payload = { ...newSub };
    if (!PAYMENT_OPTIONS[newSub.pack]) delete payload.payment_method;
    const res = await api.post('/admin/subscriptions', payload);
    if (res?.success) {
      setMsg({ type: 'success', text: '✓ ' + (t('sub_created') || 'Subscription created!') });
      setShowAdd(false);
      setNewSub({ user_id: '', pack: 'trial', payment_method: '' });
      load();
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  async function updateSub(id, body) {
    const res = await api.put(`/admin/subscriptions/${id}`, body);
    if (res?.success) { setEditSub(null); load(); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  async function revokeSub(id) {
    const ok = await showConfirm({
      title: t('revoke_sub_title') || 'Revoke Subscription?',
      message: t('revoke_sub_msg') || 'The user will lose access immediately.',
      type: 'danger', confirmLabel: t('revoke') || 'Revoke', cancelLabel: t('cancel'),
    });
    if (!ok) return;
    await api.delete(`/admin/subscriptions/${id}`);
    load();
  }

  const counts = subs.reduce((a, s) => {
    const days = daysLeft(s.expires_at);
    const expired = s.pack !== 'lifetime' && (
      s.status === 'expired' ||
      (s.status !== 'active' && days !== null && days <= 0)
    );
    a[expired ? 'expired' : s.pack] = (a[expired ? 'expired' : s.pack] || 0) + 1;
    return a;
  }, {});

  const filtered = subs.filter(s =>
    !search || s.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const paymentOpts = PAYMENT_OPTIONS[newSub.pack];
  const isFreePack  = !paymentOpts;

  return (
    <div>
      {/* Quick Add User Modal */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onCreated={handleUserCreated}
        />
      )}

      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">{t('subs_title') || 'Subscriptions'}</div>
          <div className="page-sub">{subs.length} {t('total_subscriptions') || 'total subscriptions'}</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); loadUsers(); }}>
          + {t('assign_pack') || 'Assign Pack'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          ['Trial',    counts.trial      || 0, 'green'],
          ['6 Months', counts['6months'] || 0, 'blue'],
          ['1 Year',   counts['1year']   || 0, 'purple'],
          ['Lifetime', counts.lifetime   || 0, 'gold'],
        ].map(([l, v, c]) => (
          <div key={l} className="stat-card">
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      {/* Assign subscription form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('assign_sub_title') || 'Assign Subscription to User'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>

            {/* USER dropdown + quick-add button */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{t('col_user') || 'User'}</span>
                <button
                  type="button"
                  onClick={() => setShowAddUser(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--green)', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 3, padding: 0,
                  }}
                >
                  <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span>
                  {t('new_user') || 'New user'}
                </button>
              </label>
              <select className="select" value={newSub.user_id}
                onChange={e => setNewSub(s => ({ ...s, user_id: e.target.value }))}>
                <option value="">
                  {usersLoading ? (t('loading') || 'Loading...') : (t('select_user_placeholder') || 'Select user...')}
                </option>
                {users.map(u => (
                  <option key={u.id} value={String(u.id)}>{u.user_name}</option>
                ))}
              </select>
            </div>

            {/* PACK */}
            <div className="form-group">
              <label className="form-label">{t('pack') || 'Pack'}</label>
              <select className="select" value={newSub.pack} onChange={e => handlePackChange(e.target.value)}>
                {PACK_OPTIONS.map(p => <option key={p} value={p}>{PACK_LABELS[p]}</option>)}
              </select>
            </div>

            {/* PAYMENT */}
            <div className="form-group">
              <label className="form-label">{t('payment') || 'Payment'}</label>
              {isFreePack ? (
                <div className="select" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,230,118,0.08)', border: '1px solid var(--green)',
                  color: 'var(--green)', fontWeight: 600, fontSize: 12, cursor: 'default',
                }}>
                  🎁 {t('free_pack') || 'Free — No Payment'}
                </div>
              ) : (
                <select className="select" value={newSub.payment_method}
                  onChange={e => setNewSub(s => ({ ...s, payment_method: e.target.value }))}>
                  {paymentOpts.map(m => (
                    <option key={m} value={m}>{m === 'manual' ? `${m} (WhatsApp)` : m}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={createSub}>{t('assign') || 'Assign'}</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <input className="input" placeholder={t('search_by_username') || 'Search by username...'} value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  t('col_user')    || 'User',
                  t('pack')        || 'Pack',
                  t('expires')     || 'Expires',
                  t('days_left')   || 'Days Left',
                  t('payment')     || 'Payment',
                  t('col_status')  || 'Status',
                  t('col_actions') || 'Actions',
                ].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dim)', padding: 32 }}>
                  {t('no_subscriptions') || 'No subscriptions'}
                </td></tr>
              )}
              {filtered.map(s => {
                const days    = daysLeft(s.expires_at);
                // Trust the server's status field when available;
                // only fall back to date math if the API doesn't provide one.
                const expired = s.pack !== 'lifetime' && (
                  s.status === 'expired' ||
                  (s.status !== 'active' && days !== null && days <= 0)
                );
                const isEdit  = editSub?.id === s.id;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.user_name}</td>
                    <td>
                      {isEdit ? (
                        <select className="select" style={{ width: 'auto', fontSize: 12 }}
                          value={editSub.pack}
                          onChange={e => setEditSub(es => ({ ...es, pack: e.target.value }))}>
                          {PACK_OPTIONS.map(p => <option key={p} value={p}>{PACK_LABELS[p]}</option>)}
                        </select>
                      ) : (
                        <span className={`sub-badge ${packBadgeClass(s.pack, expired)}`}>
                          {PACK_LABELS[s.pack] || s.pack}
                        </span>
                      )}
                    </td>
                    <td className="muted mono" style={{ fontSize: 12 }}>
                      {s.pack === 'lifetime' ? '∞' : (s.expires_at || '').substring(0, 10)}
                    </td>
                    <td>
                      {s.pack === 'lifetime' ? (
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>∞</span>
                      ) : days !== null ? (
                        <span style={{ fontWeight: 700, color: expired ? 'var(--red)' : days <= 7 ? 'var(--orange)' : 'var(--green)' }}>
                          {expired ? (t('expired') || 'Expired') : `${days}d`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>
                      {s.pack === 'trial'
                        ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>🎁 {t('free_pack') || 'Free'}</span>
                        : s.payment_method
                          ? (s.payment_method === 'manual' ? `${s.payment_method} (WhatsApp)` : s.payment_method)
                          : '—'}
                    </td>
                    <td>
                      <span className={`badge ${expired ? 'badge-red' : 'badge-green'}`}>
                        {expired ? (t('expired') || 'Expired') : (t('active') || 'Active')}
                      </span>
                    </td>
                    <td>
                      {isEdit ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }}
                            onClick={() => updateSub(s.id, { pack: editSub.pack })}>{t('save_changes') || 'Save'}</button>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}
                            onClick={() => setEditSub(null)}>{t('cancel')}</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => setEditSub({ id: s.id, pack: s.pack })}>✏️ {t('edit')}</button>
                          <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => revokeSub(s.id)}>{t('revoke') || 'Revoke'}</button>
                        </div>
                      )}
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
