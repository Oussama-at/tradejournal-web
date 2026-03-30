// Capital Archive
import React, { useState, useEffect } from 'react';
import api from '../services/api';

export function Capital() {
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

  async function deactivate(id) {
    if (!window.confirm('Deactivate this capital?')) return;
    await api.put(`/capital/${id}/status`, { status: 'disabled' });
    load();
  }

  async function activate(id) {
    await api.put(`/capital/${id}/status`, { status: 'active' });
    load();
  }

  async function deleteCapital(id) {
    if (!window.confirm('Delete this capital?')) return;
    await api.delete(`/capital/${id}`);
    load();
  }

  const now  = current?.capital_now || 0;
  const dep  = current?.capital_depart || 0;
  const net  = now - dep;
  const roi  = dep > 0 ? (net / dep * 100) : 0;

  return (
    <div>
      <div className="page-header"><div className="page-title">Capital Archive</div></div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[['Current Capital', now.toLocaleString() + '$', now >= dep ? 'green' : 'red'],
          ['Starting Capital', dep.toLocaleString() + '$', 'muted'],
          ['Net P&L', (net >= 0 ? '+' : '') + net.toFixed(2) + '$', net >= 0 ? 'green' : 'red'],
          ['ROI', (roi >= 0 ? '+' : '') + roi.toFixed(2) + '%', roi >= 0 ? 'green' : 'red'],
        ].map(([label, value, cls]) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${cls} mono`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Add New Capital</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" type="number" placeholder="Amount ($)" value={newCap} onChange={e => setNewCap(e.target.value)} />
            <button className="btn btn-primary" onClick={addCapital}>Add</button>
          </div>
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: 8 }}>{msg.text}</div>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>{['Starting', 'Current', 'Net P&L', 'ROI', 'Created', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {capitals.map(c => {
                const cn = c.capital_now || 0, cd = c.capital_depart || c.capital_initial || 0;
                const cn2 = cn - cd, roi2 = cd > 0 ? (cn2 / cd * 100) : 0;
                const active = c.status === 'active';
                return (
                  <tr key={c.id}>
                    <td className="mono">{cd.toLocaleString()}$</td>
                    <td className="mono">{cn.toLocaleString()}$</td>
                    <td className={`mono ${cn2 >= 0 ? 'green' : 'red'}`}>{(cn2 >= 0 ? '+' : '')}{cn2.toFixed(2)}$</td>
                    <td className={roi2 >= 0 ? 'green' : 'red'}>{roi2.toFixed(2)}%</td>
                    <td className="muted">{(c.date_creation || '').substring(0, 10)}</td>
                    <td><span className={`badge ${active ? 'badge-green' : 'badge-red'}`}>{active ? 'Active' : 'Closed'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {active ? (
                          <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => deactivate(c.id)}>Deactivate</button>
                        ) : (
                          <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => activate(c.id)}>Activate</button>
                        )}
                        <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => deleteCapital(c.id)}>Delete</button>
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

// Withdraw
export function Withdraw() {
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
    setTotalW(ws.reduce((s, w) => s + w.amount, 0));
    setCapNow(capRes?.data?.capital_now || 0);
  }

  async function doWithdraw() {
    if (!amount || +amount <= 0) { setMsg({ type: 'error', text: 'Enter a valid amount' }); return; }
    if (!window.confirm(`Withdraw ${amount}$ from ${capNow.toLocaleString()}$?`)) return;
    const res = await api.post('/withdraw', { amount: +amount, ...(note ? { note } : {}) });
    if (res?.success) { setMsg({ type: 'success', text: '✓ Withdrawal successful!' }); setAmount(''); setNote(''); load(); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  return (
    <div>
      <div className="page-header"><div className="page-title">Withdraw</div></div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Available Capital</div><div className="stat-value green mono">{capNow.toLocaleString()}$</div></div>
        <div className="stat-card"><div className="stat-label">Total Withdrawn</div><div className="stat-value red mono">{totalW.toLocaleString()}$</div></div>
      </div>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>New Withdrawal</div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Amount ($)</label>
            <input className="input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Note (optional)</label>
            <input className="input" placeholder="Reason..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 8 }}>{msg.text}</div>}
          <button className="btn btn-primary" onClick={doWithdraw} style={{ width: '100%', justifyContent: 'center' }}>Withdraw</button>
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Withdrawal History</div>
        <div className="table-wrap">
          <table>
            <thead><tr>{['Date', 'Amount', 'Note'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {history.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--dim)', padding: 24 }}>No withdrawals</td></tr>}
              {history.map((w, i) => (
                <tr key={i}>
                  <td className="muted">{(w.created_at || '').substring(0, 10)}</td>
                  <td className="mono red bold">{w.amount.toFixed(2)}$</td>
                  <td className="muted">{w.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Manage Users
export function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ user_name: '', password: '', role: 'user' });

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await api.get('/admin/users');
    setUsers(res?.data?.users || []);
  }

  async function addUser() {
    if (!newUser.user_name || !newUser.password) { setMsg({ type: 'error', text: 'Username and password required' }); return; }
    const res = await api.post('/admin/users', newUser);
    if (res?.success) { setShowAdd(false); setNewUser({ user_name: '', password: '', role: 'user' }); load(); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  async function toggleLicense(id) { await api.post(`/admin/users/${id}/toggle-license`, {}); load(); }
  async function resetDevice(id)  { if (window.confirm('Reset device?')) { await api.post(`/admin/users/${id}/reset-device`, {}); load(); } }
  async function deleteUser(id, name) { if (window.confirm(`Delete user ${name}?`)) { await api.delete(`/admin/users/${id}`); load(); } }
  async function toggleAccess(id, blocked) { await api.put(`/admin/users/${id}/access`, { blocked: !blocked }); load(); }
  async function resetPassword(id, name) {
    const pw = window.prompt(`New password for ${name}:`);
    if (pw && pw.length >= 4) { const res = await api.post(`/admin/users/${id}/reset-password`, { new_password: pw }); alert(res?.success ? '✓ Done' : res?.message); }
  }

  const filtered = users.filter(u => u.user_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div className="page-title">Manage Users</div><div className="page-sub">{users.length} users</div></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Add New User</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div className="form-group"><label className="form-label">Username</label><input className="input" value={newUser.user_name} onChange={e => setNewUser(u => ({ ...u, user_name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Password</label><input className="input" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Role</label><select className="select" value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}><option>user</option><option>admin</option></select></div>
            <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" onClick={addUser}>Add</button><button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button></div>
          </div>
          {msg && <div className={`alert alert-${msg.type}`} style={{ marginTop: 8 }}>{msg.text}</div>}
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>{['User', 'Role', 'License', 'Access', 'Created', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(u => {
                const active = u.is_active;
                const pending = !u.license_key || !u.device_id;
                const blocked = u.blocked;
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.user_name}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                    <td><span className={`badge ${pending ? 'badge-orange' : active ? 'badge-green' : 'badge-red'}`}>{pending ? 'Pending' : active ? 'Active' : 'Expired'}</span></td>
                    <td><span className={`badge ${blocked ? 'badge-red' : 'badge-green'}`}>{blocked ? 'Blocked' : 'OK'}</span></td>
                    <td className="muted">{(u.created_at || '').substring(0, 10)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost"  style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => toggleLicense(u.id)}>🔑 License</button>
                        <button className="btn btn-ghost"  style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => resetDevice(u.id)}>📱 Device</button>
                        <button className="btn btn-ghost"  style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => resetPassword(u.id, u.user_name)}>🔒 Pwd</button>
                        <button className={`btn ${blocked ? 'btn-primary' : 'btn-danger'}`} style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => toggleAccess(u.id, blocked)}>{blocked ? 'Unblock' : 'Block'}</button>
                        <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => deleteUser(u.id, u.user_name)}>🗑</button>
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

// Activity Logs
export function Logs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PER = 15;

  useEffect(() => { api.get('/admin/logs?page=1&limit=500').then(r => setLogs(r?.data?.logs || [])); }, []);

  const filtered = logs.filter(l =>
    !search || l.action?.toLowerCase().includes(search) || l.details?.toLowerCase().includes(search) || l.user_name?.toLowerCase().includes(search)
  );
  const paged = filtered.slice(page * PER, (page + 1) * PER);
  const maxPg = Math.ceil(filtered.length / PER);

  const dotColor = (a) => ({ LOGIN:'var(--blue)', LOGIN_FAILED:'var(--red)', TRADE_SAVED:'var(--green)', TRADE_DELETED:'var(--red)', ADMIN_ADD_USER:'var(--purple)', WITHDRAWAL:'var(--orange)', CAPITAL_ADDED:'var(--green)' }[a] || 'var(--dim)');

  return (
    <div>
      <div className="page-header"><div className="page-title">Activity Logs</div></div>
      <div className="card" style={{ marginBottom: 16 }}>
        <input className="input" placeholder="Search logs..." value={search} onChange={e => { setSearch(e.target.value.toLowerCase()); setPage(0); }} />
      </div>
      <div className="card">
        {paged.map((l, i) => {
          const date = (l.created_at || '').substring(0, 16).replace('T', ' ');
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(l.action), flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{l.action}{l.details ? ' — ' + l.details : ''}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{l.user_name} · {date}</div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: 'center', color: 'var(--dim)', padding: 32 }}>No logs</div>}
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page + 1} / {maxPg || 1}</span>
          <button className="btn btn-ghost" disabled={page >= maxPg - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>
    </div>
  );
}

// Activations
export function Activations() {
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
      <div className="page-header"><div className="page-title">Activations</div></div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[['Total', data.length, 'blue'], ['Pending', counts.pending || 0, 'orange'], ['Approved', (counts.activated || 0) + (counts.approved || 0), 'green'], ['Rejected', counts.rejected || 0, 'red']].map(([l, v, c]) => (
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>{['ID', 'User', 'Device', 'Date', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {data.map(r => (
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Password Reset Requests
export function PasswordReset() {
  const [reqs, setReqs] = useState([]);
  useEffect(() => { load(); }, []);
  async function load() {
    const res = await api.get('/admin/password-resets');
    setReqs(res?.data?.requests || []);
  }
  async function approve(id, name) {
    const pw = window.prompt(`Set new password for ${name}:`);
    if (!pw || pw.length < 4) return;
    const res = await api.post(`/admin/password-resets/${id}/approve`, { new_password: pw });
    alert(res?.success ? '✓ Password set' : res?.message); load();
  }
  async function reject(id) { if (window.confirm('Reject this request?')) { await api.post(`/admin/password-resets/${id}/reject`, {}); load(); } }
  const counts = reqs.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  return (
    <div>
      <div className="page-header"><div className="page-title">Password Resets</div></div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[['Total', reqs.length, 'blue'], ['Pending', counts.pending || 0, 'orange'], ['Approved', counts.approved || 0, 'green'], ['Rejected', counts.rejected || 0, 'red']].map(([l, v, c]) => (
          <div key={l} className="stat-card"><div className="stat-label">{l}</div><div className={`stat-value ${c}`}>{v}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>{['ID', 'User', 'Date', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {reqs.map(r => (
                <tr key={r.id}>
                  <td className="muted mono">{r.id}</td>
                  <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                  <td className="muted">{(r.created_at || '').substring(0, 10)}</td>
                  <td><span className={`badge ${r.status === 'pending' ? 'badge-orange' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status === 'pending' && <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => approve(r.id, r.user_name)}>Set Password</button>}
                      {r.status === 'pending' && <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => reject(r.id)}>Reject</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// My Profile
export function Profile() {
  const [profile, setProfile] = useState(null);
  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');
  const [questions, setQuestions] = useState([]);
  const [msg, setMsg] = useState(null);
  const DEFAULTS = ['What is your favourite color?', 'Name of your best player?', 'What is your birthday?', "Mother's maiden name?", 'First pet name?', 'City you were born in?'];

  useEffect(() => {
    api.get('/profile').then(r => setProfile(r?.data?.user || null));
    api.get('/secret-questions').then(r => {
      const qs = r?.data?.questions || [];
      setQuestions(qs.length ? qs : DEFAULTS);
    }).catch(() => setQuestions(DEFAULTS));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div>
      <div className="page-header"><div className="page-title">My Profile</div></div>
      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--blue)' }}>
              {profile?.user_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{profile?.user_name}</div>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{profile?.role}</span>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Member since {(profile?.created_at || '').substring(0, 10)}</div>
            </div>
          </div>
          <label>
            <div className="btn btn-ghost" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('pic-input').click()}>
              📷 Change Photo
            </div>
            <input id="pic-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => changePhoto(e.target.files[0])} />
          </label>
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Security Questions</div>
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
            <button className="btn btn-primary" onClick={saveQuestions}>Save Security Questions</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Update Password
export function Password() {
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
    if (res?.success) { setMsg({ type: 'success', text: '✓ Password changed!' }); setCur(''); setNp(''); setConf(''); }
    else setMsg({ type: 'error', text: res?.message || 'Failed' });
  }

  return (
    <div>
      <div className="page-header"><div className="page-title">Update Password</div></div>
      <div style={{ maxWidth: 420 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Current Password', cur, setCur], ['New Password', np, setNp], ['Confirm New Password', conf, setConf]].map(([label, val, setter]) => (
            <div key={label} className="form-group">
              <label className="form-label">{label}</label>
              <input className="input" type="password" value={val} onChange={e => setter(e.target.value)} />
            </div>
          ))}
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <button className="btn btn-primary" onClick={change} style={{ justifyContent: 'center' }}>Change Password</button>
        </div>
      </div>
    </div>
  );
}
