import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';

const TYPE_COLORS = {
  info:    '#00b4ff',
  warning: '#ffb400',
  success: '#00e676',
  danger:  '#f44336',
};

const TYPE_ICONS = { info: 'ℹ', warning: '⚠', success: '✓', danger: '✕' };

const EMPTY = { message: '', type: 'info', target: 'all' };

export default function AdminAlerts() {
  const { t } = useLang();
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null); // alert id being edited
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/admin/alerts');
      setAlerts(r?.data?.alerts || []);
    } catch { flash('Failed to load alerts', false); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/alerts/${editing}`, form);
        flash('Alert updated ✓');
      } else {
        await api.post('/admin/alerts', form);
        flash('Alert created ✓');
      }
      setForm(EMPTY);
      setEditing(null);
      load();
    } catch { flash('Failed to save', false); }
    finally { setSaving(false); }
  }

  async function toggleActive(alert) {
    try {
      await api.put(`/admin/alerts/${alert.id}`, { is_active: !alert.is_active });
      load();
    } catch { flash('Failed to update', false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await api.delete(`/admin/alerts/${id}`);
      flash('Deleted');
      load();
    } catch { flash('Failed to delete', false); }
  }

  function startEdit(alert) {
    setEditing(alert.id);
    setForm({ message: alert.message, type: alert.type, target: alert.target });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY);
  }

  const inputStyle = {
    background: '#0d1117', border: '1px solid #1e2a35', borderRadius: 6,
    color: '#e8edf3', padding: '9px 12px', fontSize: 13, outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 780, margin: '0 auto' }}>
      <h2 style={{ color: '#00e676', margin: '0 0 6px', fontSize: 20 }}>📢 Alert Notifications</h2>
      <p style={{ color: '#7a8a9a', fontSize: 13, margin: '0 0 24px' }}>
        Create banners shown to users at the top of every page.
      </p>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: msg.ok ? 'rgba(0,230,118,0.1)' : 'rgba(244,67,54,0.1)',
          border: `1px solid ${msg.ok ? '#00e676' : '#f44336'}`,
          color: msg.ok ? '#00e676' : '#f77066',
        }}>{msg.text}</div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} style={{
        background: '#0d1117', border: '1px solid #1e2a35', borderRadius: 10,
        padding: 20, marginBottom: 28,
      }}>
        <h3 style={{ color: '#c8d8e4', margin: '0 0 16px', fontSize: 15 }}>
          {editing ? '✏️ Edit Alert' : '➕ New Alert'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Alert message..."
            rows={3}
            required
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#7a8a9a', fontSize: 12, display: 'block', marginBottom: 5 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={selectStyle}>
                <option value="info">ℹ Info</option>
                <option value="warning">⚠ Warning</option>
                <option value="success">✓ Success</option>
                <option value="danger">✕ Danger</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#7a8a9a', fontSize: 12, display: 'block', marginBottom: 5 }}>SHOW TO</label>
              <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} style={selectStyle}>
                <option value="all">Everyone</option>
                <option value="users">Users only</option>
                <option value="admins">Admins only</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.message.trim() && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 6,
              background: `rgba(${form.type === 'info' ? '0,180,255' : form.type === 'warning' ? '255,180,0' : form.type === 'success' ? '0,230,118' : '244,67,54'},0.1)`,
              border: `1px solid ${TYPE_COLORS[form.type]}`,
            }}>
              <span style={{ color: TYPE_COLORS[form.type], fontSize: 15 }}>{TYPE_ICONS[form.type]}</span>
              <span style={{ fontSize: 13, color: '#dce8f0' }}>{form.message}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7a8a9a' }}>preview</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{
              background: '#00e676', color: '#080c10', border: 'none',
              borderRadius: 6, padding: '9px 20px', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
            }}>
              {saving ? 'Saving…' : editing ? 'Update Alert' : 'Create Alert'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} style={{
                background: 'none', border: '1px solid #2a3a4a', color: '#7a8a9a',
                borderRadius: 6, padding: '9px 16px', fontSize: 13, cursor: 'pointer',
              }}>Cancel</button>
            )}
          </div>
        </div>
      </form>

      {/* ── Alert list ── */}
      {loading ? (
        <div style={{ color: '#7a8a9a', textAlign: 'center', padding: 30 }}>Loading…</div>
      ) : alerts.length === 0 ? (
        <div style={{ color: '#7a8a9a', textAlign: 'center', padding: 30 }}>No alerts yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map(a => (
            <div key={a.id} style={{
              background: '#0d1117', border: `1px solid ${a.is_active ? '#1e2a35' : '#13191f'}`,
              borderLeft: `3px solid ${a.is_active ? TYPE_COLORS[a.type] : '#2a3a4a'}`,
              borderRadius: 8, padding: '12px 16px',
              opacity: a.is_active ? 1 : 0.5,
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <span style={{ fontSize: 18, color: TYPE_COLORS[a.type], flexShrink: 0, marginTop: 1 }}>
                {TYPE_ICONS[a.type]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#dce8f0', fontSize: 13, marginBottom: 5, wordBreak: 'break-word' }}>
                  {a.message}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 10,
                    background: `rgba(${a.type === 'info' ? '0,180,255' : a.type === 'warning' ? '255,180,0' : a.type === 'success' ? '0,230,118' : '244,67,54'},0.15)`,
                    color: TYPE_COLORS[a.type], textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{a.type}</span>
                  <span style={{ fontSize: 10, color: '#4a5a6a' }}>→</span>
                  <span style={{ fontSize: 11, color: '#7a8a9a' }}>{a.target}</span>
                  <span style={{ fontSize: 10, color: '#4a5a6a', marginLeft: 4 }}>
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 10,
                    background: a.is_active ? 'rgba(0,230,118,0.12)' : 'rgba(122,138,154,0.12)',
                    color: a.is_active ? '#00e676' : '#7a8a9a',
                  }}>{a.is_active ? 'ACTIVE' : 'OFF'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => startEdit(a)} style={{
                  background: 'none', border: '1px solid #2a3a4a', color: '#7a8a9a',
                  borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>Edit</button>
                <button onClick={() => toggleActive(a)} style={{
                  background: 'none',
                  border: `1px solid ${a.is_active ? '#7a8a9a' : '#00e676'}`,
                  color: a.is_active ? '#7a8a9a' : '#00e676',
                  borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>{a.is_active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleDelete(a.id)} style={{
                  background: 'none', border: '1px solid #f44336', color: '#f44336',
                  borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
                }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
