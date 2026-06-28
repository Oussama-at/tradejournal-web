import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useConfirm } from '../components/ConfirmDialog';
import { useLang } from '../lang/LangContext';
import DatePicker from '../components/DatePicker';
import ExportButton from '../components/ExportButton';

const SUBS_HEADER_ACTIONS = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' };

const PACK_OPTIONS = ['trial', '6months', '1year', 'lifetime'];
const PACK_LABELS  = { trial: '24h Trial', '6months': '6 Months', '1year': '1 Year', lifetime: 'Lifetime' };

const SUBS_EXPORT_COLUMNS = [
  { key: 'user_name', label: 'User' },
  { key: 'pack', label: 'Pack', format: v => PACK_LABELS[v] || v },
  { key: 'expires_at', label: 'Expires', format: (v, s) => (s.pack === 'lifetime' ? '\u221E' : (v || '').substring(0, 10)) },
  { key: 'days_left', label: 'Days Left', align: 'right', format: (_v, s) => { if (s.pack === 'lifetime') return '\u221E'; const d = daysLeft(s.expires_at); return d === null ? '—' : d; } },
  { key: 'payment_method', label: 'Payment', format: (v, s) => (s.pack === 'trial' ? 'Free' : v || '—') },
  { key: 'status', label: 'Status', format: (_v, s) => getSubStatus(s) },
];

const PAYMENT_OPTIONS = {
  trial:     null,
  '6months': ['manual', 'card', 'btc', 'usdt', 'eth', 'paypal'],
  '1year':   ['manual', 'card', 'btc', 'usdt', 'eth', 'paypal'],
  lifetime:  ['manual', 'btc', 'usdt', 'eth', 'paypal'],
};

const PAYPAL_ACCOUNT = 'ousssatt@gmail.com';
const PAYPAL_ME = 'https://paypal.me/Atouchi';
const WHATSAPP_NUMBER = '212635925986';
const PACK_PRICE_USD = { '6months': 20, '1year': 50, lifetime: 70 };

// Top-level payment methods shown in the admin Add-Subscription panel.
const PAY_METHODS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { key: 'card',     label: 'Card',     icon: '💳' },
  { key: 'paypal',   label: 'PayPal',   icon: '🅿' },
  { key: 'crypto',   label: 'Crypto',   icon: '🪙' },
];

// Real crypto wallets that receive payments.
const CRYPTO_COINS = [
  { key: 'btc',  label: 'Bitcoin',  store: 'BTC',          network: 'Bitcoin network',  icon: '₿', address: '153R4TXbRmNDaymXM5ySmjF7hmWqbTu5fB', uri: 'bitcoin:153R4TXbRmNDaymXM5ySmjF7hmWqbTu5fB', explorer: 'https://mempool.space/address/153R4TXbRmNDaymXM5ySmjF7hmWqbTu5fB', note: 'Send only BTC on the Bitcoin network to this address.' },
  { key: 'usdt', label: 'USDT',     store: 'USDT (TRC20)', network: 'TRC20 (Tron)',     icon: '₮', address: 'TShrmLSuNgdKiLgCur492aW3Z5akyUxQx8', uri: 'tron:TShrmLSuNgdKiLgCur492aW3Z5akyUxQx8', explorer: 'https://tronscan.org/#/address/TShrmLSuNgdKiLgCur492aW3Z5akyUxQx8', note: 'TRC20 network ONLY — another network will lose the funds.' },
  { key: 'eth',  label: 'Ethereum', store: 'ETH',          network: 'Ethereum (ERC20)', icon: 'Ξ', address: '0xb9b2e0b9d8f9cbb786730cf933043ed9f0da7f74', uri: 'ethereum:0xb9b2e0b9d8f9cbb786730cf933043ed9f0da7f74', explorer: 'https://etherscan.io/address/0xb9b2e0b9d8f9cbb786730cf933043ed9f0da7f74', note: 'Ethereum mainnet (ERC20) only.' },
];

const PAY_STYLES = {
  methodRow:    { display: 'flex', flexWrap: 'wrap', gap: 8 },
  methodBtn:    { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid #1e2a36', background: '#0d1117', color: '#e8edf3', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  methodBtnOn:  { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px solid #00e676', background: 'rgba(0,230,118,0.12)', color: '#00e676', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  methodIcon:   { fontSize: 16 },
  box:          { marginTop: 14, padding: 16, borderRadius: 12, background: '#11181f', border: '1px solid #1e2a36' },
  coinRow:      { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  coinBtn:      { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, border: '1px solid #1e2a36', background: '#0d1117', color: '#e8edf3', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  coinBtnOn:    { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, border: '1px solid #00e676', background: 'rgba(0,230,118,0.12)', color: '#00e676', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  head:         { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBox:      { fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: '#0d1117', border: '1px solid #1e2a36', color: '#00e676', flex: '0 0 auto' },
  title:        { fontWeight: 700, color: '#e8edf3', fontSize: 14, lineHeight: 1.2 },
  net:          { fontSize: 11, color: '#7a8a9a', marginTop: 2 },
  addrRow:      { display: 'flex', alignItems: 'center', gap: 8 },
  addr:         { flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#00e676', wordBreak: 'break-all', background: '#0d1117', border: '1px solid #1e2a36', borderRadius: 8, padding: '10px 12px' },
  copyBtn:      { whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: 8, border: '1px solid #00e676', background: 'transparent', color: '#00e676', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  note:         { marginTop: 12, fontSize: 12, color: '#f0b429', lineHeight: 1.5 },
  info:         { fontSize: 13, color: '#cdd7e1', lineHeight: 1.5 },
  payBtn:       { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#25d366', color: '#06210f', cursor: 'pointer', fontWeight: 800, fontSize: 14, textDecoration: 'none' },
  payBtnBlue:   { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#0070ba', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 14, textDecoration: 'none' },
  payBtnAddr:   { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: '12px 16px', borderRadius: 10, border: '1px solid #00e676', background: 'transparent', color: '#00e676', cursor: 'pointer', fontWeight: 800, fontSize: 14, textDecoration: 'none' },
  payActions:   { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  payAct:       { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: '1px solid #00e676', background: 'transparent', color: '#00e676', cursor: 'pointer', fontWeight: 700, fontSize: 13, textDecoration: 'none' },
  qrWrap:       { marginTop: 12, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, border: '1px solid #1e2a36', background: '#ffffff', width: 'fit-content' },
  qrImg:        { width: 180, height: 180, display: 'block' },
  qrCaption:    { fontSize: 12, color: '#0d1117', fontWeight: 700 },
  payLaterRow:  { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '10px 12px', borderRadius: 10, border: '1px dashed #2a3a48', background: '#0d1117', cursor: 'pointer' },
  payLaterText: { fontSize: 13, color: '#e8edf3', fontWeight: 600 },
  payLaterSub:  { fontSize: 11, color: '#7a8a9a', marginTop: 2 },
};

function packBadgeClass(pack, status) {
  if (status === 'suspended') return 'sub-expired';
  if (status === 'expired') return 'sub-expired';
  return { trial: 'sub-trial', '6months': 'sub-6months', '1year': 'sub-yearly', lifetime: 'sub-lifetime' }[pack] || 'sub-monthly';
}

function getSubStatus(s) {
  if (s.status === 'suspended') return 'suspended';
  const days = daysLeft(s.expires_at);
  if (s.pack !== 'lifetime' && (s.status === 'expired' || (s.status !== 'active' && days !== null && days <= 0))) return 'expired';
  return 'active';
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  // Compare date-only (strip time) to avoid timezone shifting the count
  const expiry = new Date(dateStr);
  const today  = new Date();
  // Normalise both to local midnight for a clean day diff
  const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const todayMidnight  = new Date(today.getFullYear(),  today.getMonth(),  today.getDate());
  const diff = expiryMidnight - todayMidnight;
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

  const [newSub, setNewSub] = useState({ user_id: '', pack: 'trial', method: '', coin: '', payLater: false });
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

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
    const paid = !!PAYMENT_OPTIONS[pack];
    setNewSub(s => ({
      ...s,
      pack,
      method: paid ? (s.method || 'whatsapp') : '',
      coin: paid && s.method === 'crypto' ? (s.coin || 'btc') : '',
      payLater: paid ? s.payLater : false,
    }));
  }

  function buildPaymentMethod(s) {
    let base;
    if (s.method === 'crypto') {
      const c = CRYPTO_COINS.find(x => x.key === s.coin);
      base = c ? c.store : 'Crypto';
    } else if (s.method === 'paypal') base = 'PayPal';
    else if (s.method === 'card') base = 'Card';
    else base = 'WhatsApp';
    return s.payLater ? base + ' (Pay later)' : base;
  }

  function copyText(txt) {
    try { navigator.clipboard.writeText(txt); } catch (e) {}
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 1500);
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
    const payload = { user_id: newSub.user_id, pack: newSub.pack };
    if (PAYMENT_OPTIONS[newSub.pack]) {
      if (!newSub.method) { setMsg({ type: 'error', text: t('select_payment') || 'Select a payment method' }); return; }
      if (newSub.method === 'crypto' && !newSub.coin) { setMsg({ type: 'error', text: t('select_crypto') || 'Select which crypto' }); return; }
      payload.payment_method = buildPaymentMethod(newSub);
    }
    const res = await api.post('/admin/subscriptions', payload);
    if (res?.success) {
      setMsg({ type: 'success', text: '✓ ' + (t('sub_created') || 'Subscription created!') });
      setShowAdd(false);
      setNewSub({ user_id: '', pack: 'trial', method: '', coin: '', payLater: false });
      load();
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed' });
    }
  }

  async function updateSub(id, body) {
    // Append T12:00:00 so the date is noon local time, not UTC midnight
    const safeBody = { ...body };
    if (safeBody.expires_at && /^\d{4}-\d{2}-\d{2}$/.test(safeBody.expires_at)) {
      safeBody.expires_at = safeBody.expires_at + 'T12:00:00';
    }
    const res = await api.put(`/admin/subscriptions/${id}`, safeBody);
    if (res?.success) {
      setEditSub(null);
      setMsg({ type: 'success', text: '✓ ' + (res.message || 'Subscription updated') });
      load();
    } else {
      setMsg({ type: 'error', text: res?.message || 'Failed to update subscription' });
    }
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

  // Count every subscription under its pack so suspended ones still appear in
  // the stats (a suspended lifetime is still a lifetime sub the owner sold).
  // We additionally track active/suspended/expired breakdowns per pack.
  const counts = subs.reduce((a, s) => {
    const status = getSubStatus(s); // 'active' | 'suspended' | 'expired'
    a[s.pack] = (a[s.pack] || 0) + 1;
    a[`${s.pack}_${status}`] = (a[`${s.pack}_${status}`] || 0) + 1;
    a[status] = (a[status] || 0) + 1;
    return a;
  }, {});

  const filtered = subs.filter(s =>
    !search || s.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const isFreePack = !PAYMENT_OPTIONS[newSub.pack];
  const cryptoSel  = CRYPTO_COINS.find(c => c.key === newSub.coin);
  const payAmountUSD = PACK_PRICE_USD[newSub.pack] || null;
  const paypalCheckoutUrl = payAmountUSD ? `${PAYPAL_ME}/${payAmountUSD}USD` : PAYPAL_ME;
  const whatsappPurchaseUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello, I want to purchase the ' + (PACK_LABELS[newSub.pack] || newSub.pack) + ' plan on TradeJournal.')}`;

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
        <div style={SUBS_HEADER_ACTIONS}>
          <ExportButton
            filename={`subscriptions-${new Date().toISOString().substring(0, 10)}.xls`}
            title="TradeJournal PRO — Subscriptions"
            subtitle={`${filtered.length} subscriptions   Generated: ${new Date().toLocaleString()}`}
            columns={SUBS_EXPORT_COLUMNS}
            rows={filtered}
          />
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); loadUsers(); }}>
            + {t('assign_pack') || 'Assign Pack'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          ['Trial',    'trial',    'green'],
          ['6 Months', '6months',  'blue'],
          ['1 Year',   '1year',    'purple'],
          ['Lifetime', 'lifetime', 'gold'],
        ].map(([l, key, c]) => {
          const total     = counts[key] || 0;
          const active    = counts[`${key}_active`] || 0;
          const suspended = counts[`${key}_suspended`] || 0;
          const expired   = counts[`${key}_expired`] || 0;
          return (
            <div key={l} className="stat-card">
              <div className="stat-label">{l}</div>
              <div className={`stat-value ${c}`}>{total}</div>
              {(suspended > 0 || expired > 0) && (
                <div className="stat-sub">
                  {active} {t('active') || 'active'}
                  {suspended > 0 ? ` · ${suspended} ${t('suspended') || 'suspended'}` : ''}
                  {expired > 0 ? ` · ${expired} ${t('expired') || 'expired'}` : ''}
                </div>
              )}
            </div>
          );
        })}
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
                <div style={PAY_STYLES.methodRow}>
                  {PAY_METHODS.map(m => (
                    <button key={m.key} type="button"
                      style={newSub.method === m.key ? PAY_STYLES.methodBtnOn : PAY_STYLES.methodBtn}
                      onClick={() => setNewSub(s => ({ ...s, method: m.key, coin: m.key === 'crypto' ? (s.coin || 'btc') : '' }))}>
                      <span style={PAY_STYLES.methodIcon}>{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PAYMENT DESTINATION PANEL */}
            {!isFreePack && newSub.method && (
              <div style={PAY_STYLES.box}>
                {newSub.method === 'crypto' && (
                  <>
                    <div style={PAY_STYLES.coinRow}>
                      {CRYPTO_COINS.map(c => (
                        <button key={c.key} type="button"
                          style={newSub.coin === c.key ? PAY_STYLES.coinBtnOn : PAY_STYLES.coinBtn}
                          onClick={() => setNewSub(s => ({ ...s, coin: c.key }))}>
                          <span>{c.icon}</span>{c.label} · {c.store}
                        </button>
                      ))}
                    </div>
                    {cryptoSel && (
                      <>
                        <div style={PAY_STYLES.head}>
                          <div style={PAY_STYLES.iconBox}>{cryptoSel.icon}</div>
                          <div>
                            <div style={PAY_STYLES.title}>{cryptoSel.label} ({cryptoSel.store})</div>
                            <div style={PAY_STYLES.net}>{cryptoSel.network} · {t('deposit_address') || 'deposit address'}</div>
                          </div>
                        </div>
                        <div style={PAY_STYLES.addrRow}>
                          <code style={PAY_STYLES.addr}>{cryptoSel.address}</code>
                          <button type="button" style={PAY_STYLES.copyBtn} onClick={() => copyText(cryptoSel.address)}>
                            {copiedAddr ? (t('copied') || 'Copied ✓') : (t('copy') || 'Copy')}
                          </button>
                        </div>
                        <div style={PAY_STYLES.note}>⚠️ {cryptoSel.note}</div>
                        <div style={PAY_STYLES.payActions}>
                          <button type="button" style={PAY_STYLES.payAct} onClick={() => setQrOpen(o => !o)}>
                            📷 {t('pay_show_qr')}
                          </button>
                          {cryptoSel.uri && (
                            <a href={cryptoSel.uri} style={PAY_STYLES.payAct}>
                              👛 {t('open_in_wallet')}
                            </a>
                          )}
                          {cryptoSel.explorer && (
                            <a href={cryptoSel.explorer} target="_blank" rel="noopener noreferrer" style={PAY_STYLES.payAct}>
                              🔎 {t('view_on_explorer')}
                            </a>
                          )}
                        </div>
                        {qrOpen && (
                          <div style={PAY_STYLES.qrWrap}>
                            <img alt="QR" style={PAY_STYLES.qrImg} src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cryptoSel.address)}`} />
                            <div style={PAY_STYLES.qrCaption}>{cryptoSel.store}</div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {newSub.method === 'paypal' && (
                  <>
                    <div style={PAY_STYLES.head}>
                      <div style={PAY_STYLES.iconBox}>🅿</div>
                      <div>
                        <div style={PAY_STYLES.title}>PayPal</div>
                        <div style={PAY_STYLES.net}>{t('paypal_account') || 'PayPal account (Friends & Family)'}</div>
                      </div>
                    </div>
                    <div style={PAY_STYLES.addrRow}>
                      <code style={PAY_STYLES.addr}>{PAYPAL_ACCOUNT}</code>
                      <button type="button" style={PAY_STYLES.copyBtn} onClick={() => copyText(PAYPAL_ACCOUNT)}>
                        {copiedAddr ? (t('copied') || 'Copied ✓') : (t('copy') || 'Copy')}
                      </button>
                    </div>
                    <div style={PAY_STYLES.note}>⚠️ Send as Friends & Family to avoid extra fees.</div>
                    <a href={paypalCheckoutUrl} target="_blank" rel="noopener noreferrer" style={PAY_STYLES.payBtnBlue}>
                      🅿 {t('open_paypal_checkout')}{payAmountUSD ? ` · ${payAmountUSD}` : ''}
                    </a>
                  </>
                )}

                {newSub.method === 'whatsapp' && (
                  <div>
                    <div style={PAY_STYLES.info}>💬 {t('pay_whatsapp_hint')}</div>
                    <a href={whatsappPurchaseUrl} target="_blank" rel="noopener noreferrer" style={PAY_STYLES.payBtn}>
                      💬 {t('open_whatsapp_purchase')}
                    </a>
                  </div>
                )}

                {newSub.method === 'card' && (
                  <div style={PAY_STYLES.info}>💳 {t('pay_card_hint') || 'Card payment is handled externally, then recorded here.'}</div>
                )}

                {/* Assign now / pay later */}
                <div style={PAY_STYLES.payLaterRow} onClick={() => setNewSub(s => ({ ...s, payLater: !s.payLater }))}>
                  <input type="checkbox" checked={!!newSub.payLater} readOnly />
                  <div>
                    <div style={PAY_STYLES.payLaterText}>{t('pay_later') || 'Assign now, pay later'}</div>
                    <div style={PAY_STYLES.payLaterSub}>{t('pay_later_hint') || 'Activate the pack now and mark the payment as pending.'}</div>
                  </div>
                </div>
              </div>
            )}

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
                const subStatus = getSubStatus(s);
                const expired = subStatus === 'expired';
                const suspended = subStatus === 'suspended';
                const isTrial = s.pack === 'trial';
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
                        <span className={`sub-badge ${packBadgeClass(s.pack, subStatus)}`}>
                          {PACK_LABELS[s.pack] || s.pack}
                        </span>
                      )}
                    </td>
                    <td className="muted mono" style={{ fontSize: 12 }}>
                      {isEdit && editSub.pack !== 'lifetime' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
                          <span style={{ fontSize: 10, color: 'var(--muted)' }}>📅</span>
                          <DatePicker
                            style={{ fontSize: 12, padding: '2px 4px', width: 130, background: 'transparent', border: 'none', color: 'var(--text)', colorScheme: 'dark', outline: 'none' }}
                            value={editSub.expires_at || ''}
                            onChange={v => setEditSub(es => ({ ...es, expires_at: v }))}
                          />
                        </div>
                      ) : (
                        s.pack === 'lifetime' ? '∞' : (s.expires_at || '').substring(0, 10)
                      )}
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
                      {isEdit ? (
                        <select className="select" style={{ width: 'auto', fontSize: 12 }}
                          value={editSub.status || subStatus}
                          onChange={e => setEditSub(es => ({ ...es, status: e.target.value }))}>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="expired">Expired</option>
                        </select>
                      ) : (
                        <span className={`badge ${suspended ? 'badge-orange' : expired ? 'badge-red' : 'badge-green'}`}>
                          {suspended ? 'Suspended' : expired ? (t('expired') || 'Expired') : (t('active') || 'Active')}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEdit ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }}
                            onClick={() => updateSub(s.id, { pack: editSub.pack, expires_at: editSub.expires_at || null, status: editSub.status })}>{t('save_changes') || 'Save'}</button>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}
                            onClick={() => setEditSub(null)}>{t('cancel')}</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => setEditSub({ id: s.id, pack: s.pack, expires_at: s.expires_at ? s.expires_at.substring(0,10) : '', status: subStatus })}>✏️ {t('edit')}</button>
                          {/* Suspend / Reactivate — only for non-trial paid subs */}
                          {!isTrial && subStatus === 'active' && (
                            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px', color: 'var(--orange)', borderColor: 'var(--orange)' }}
                              onClick={() => updateSub(s.id, { status: 'suspended', pack: s.pack, expires_at: s.expires_at ? s.expires_at.substring(0, 10) : null })}>⏸ Suspend</button>
                          )}
                          {!isTrial && (subStatus === 'suspended' || subStatus === 'expired') && (
                            <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }}
                              onClick={() => updateSub(s.id, { status: 'active', pack: s.pack, expires_at: s.expires_at ? s.expires_at.substring(0, 10) : null })}>▶ Reactivate</button>
                          )}
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
