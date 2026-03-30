import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PACK_OPTIONS = ['trial', '6months', '1year', 'lifetime'];
const PACK_LABELS  = { trial: '24h Trial', '6months': '6 Months', '1year': '1 Year', lifetime: 'Lifetime' };

function packBadgeClass(pack, expired) {
  if (expired) return 'sub-expired';
  return { trial: 'sub-trial', '6months': 'sub-6months', '1year': 'sub-yearly', lifetime: 'sub-lifetime' }[pack] || 'sub-monthly';
}

function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Subscriptions() {
  const [subs,    setSubs]    = useState([]);
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');
  const [msg,     setMsg]     = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editSub, setEditSub] = useState(null);

  // New subscription form
  const [newSub, setNewSub] = useState({ user_id: '', pack: 'trial', payment_method: 'manual' });

  useEffect(() => { load(); }, []);

  async function load() {
    const [subRes, userRes] = await Promise.all([
      api.get('/admin/subscriptions'),
      api.get('/admin/users'),
    ]);
    setSubs(subRes?.data?.subscriptions || []);
    setUsers(userRes?.data?.users || []);
  }

  async function createSub() {
    if (!newSub.user_id) { setMsg({ type: 'error', text: 'Select a user' }); return; }
    const res = await api.post('/admin/subscriptions', newSub);
    if (res?.success) {
      setMsg({ type: 'success', text: '✓ Subscription created!' });
      setShowAdd(false);
      setNewSub({ user_id: '', pack: 'trial', payment_method: 'manual' });
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
    if (!window.confirm('Revoke this subscription?')) return;
    await api.delete(`/admin/subscriptions/${id}`);
    load();
  }

  // Stats
  const counts = subs.reduce((a, s) => {
    const days = daysLeft(s.expires_at);
    const expired = s.pack !== 'lifetime' && days !== null && days <= 0;
    a[expired ? 'expired' : s.pack] = (a[expired ? 'expired' : s.pack] || 0) + 1;
    return a;
  }, {});

  const filtered = subs.filter(s =>
    !search || s.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Subscriptions</div>
          <div className="page-sub">{subs.length} total subscriptions</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Assign Pack</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          ['Trial',    counts.trial    || 0, 'green'],
          ['6 Months', counts['6months'] || 0, 'blue'],
          ['1 Year',   counts['1year'] || 0, 'purple'],
          ['Lifetime', counts.lifetime || 0, 'gold'],
        ].map(([l, v, c]) => (
          <div key={l} className="stat-card">
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

      {/* Add subscription */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Assign Subscription to User</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label">User</label>
              <select className="select" value={newSub.user_id}
                onChange={e => setNewSub(s => ({ ...s, user_id: e.target.value }))}>
                <option value="">Select user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.user_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pack</label>
              <select className="select" value={newSub.pack}
                onChange={e => setNewSub(s => ({ ...s, pack: e.target.value }))}>
                {PACK_OPTIONS.map(p => <option key={p} value={p}>{PACK_LABELS[p]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment</label>
              <select className="select" value={newSub.payment_method}
                onChange={e => setNewSub(s => ({ ...s, payment_method: e.target.value }))}>
                {['manual', 'card', 'btc', 'usdt', 'eth'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={createSub}>Assign</button>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Search by username..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{['User', 'Pack', 'Expires', 'Days Left', 'Payment', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--dim)', padding: 32 }}>No subscriptions</td></tr>
              )}
              {filtered.map(s => {
                const days = daysLeft(s.expires_at);
                const expired = s.pack !== 'lifetime' && days !== null && days <= 0;
                const isEdit = editSub?.id === s.id;

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
                          {expired ? 'Expired' : `${days}d`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{s.payment_method || '—'}</td>
                    <td>
                      <span className={`badge ${expired ? 'badge-red' : 'badge-green'}`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {isEdit ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }}
                            onClick={() => updateSub(s.id, { pack: editSub.pack })}>Save</button>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}
                            onClick={() => setEditSub(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => setEditSub({ id: s.id, pack: s.pack })}>✏️ Edit</button>
                          <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }}
                            onClick={() => revokeSub(s.id)}>Revoke</button>
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
