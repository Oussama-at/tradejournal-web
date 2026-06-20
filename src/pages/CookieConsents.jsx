import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';

const statsRow = { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 };
const headerRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' };
const cardStyle = { marginBottom: 16 };
const padMuted = { padding: 24, color: '#7a8a9a' };
const padError = { padding: 24, color: '#f44336' };
const scrollStyle = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const guestStyle = { color: '#7a8a9a' };
const ipStyle = { color: '#7a8a9a', fontSize: 12 };
const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: '#7a8a9a', borderBottom: '1px solid #1e2a36', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: 13, color: '#e8edf3', borderBottom: '1px solid #141d26' };

function StatCard({ label, value, color }) {
  const box = { flex: 1, minWidth: 120, background: '#11181f', border: '1px solid #1e2a36', borderRadius: 10, padding: '14px 16px' };
  const val = { fontSize: 24, fontWeight: 800, color: color || '#e8edf3' };
  const lab = { fontSize: 12, color: '#7a8a9a', marginTop: 4 };
  return (
    <div style={box}>
      <div style={val}>{value}</div>
      <div style={lab}>{label}</div>
    </div>
  );
}

const DECISION_MAP = {
  accept_all: { bg: 'rgba(0,230,118,0.15)', color: '#00e676', label: 'Accept all' },
  reject_all: { bg: 'rgba(244,67,54,0.15)', color: '#f44336', label: 'Reject all' },
  custom: { bg: 'rgba(240,180,41,0.15)', color: '#f0b429', label: 'Custom' },
};

function Badge({ decision }) {
  const s = DECISION_MAP[decision] || DECISION_MAP.custom;
  const style = { display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color };
  return <span style={style}>{s.label}</span>;
}

function YesNo({ on }) {
  const style = { color: on ? '#00e676' : '#7a8a9a', fontWeight: 700 };
  return <span style={style}>{on ? 'Yes' : 'No'}</span>;
}

export default function CookieConsents() {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/cookie-consents')
      .then(r => {
        if (r && r.data) {
          setRows(r.data.consents || []);
          setSummary(r.data.summary || null);
          setError('');
        } else {
          setError((r && r.message) || 'Failed to load');
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString(); } catch (e) { return d; }
  };

  return (
    <div>
      <div className="page-header" style={headerRow}>
        <div className="page-title">🍪 {t('nav_cookie_consents') || 'Cookie Consents'}</div>
        <button className="btn" onClick={load}>↻ Refresh</button>
      </div>

      {summary && (
        <div style={statsRow}>
          <StatCard label="Total" value={summary.total} />
          <StatCard label="Accept all" value={summary.accept_all} color="#00e676" />
          <StatCard label="Reject all" value={summary.reject_all} color="#f44336" />
          <StatCard label="Custom" value={summary.custom} color="#f0b429" />
          <StatCard label="Analytics on" value={summary.analytics_on} color="#00b4ff" />
        </div>
      )}

      <div className="card" style={cardStyle}>
        {loading ? (
          <div style={padMuted}>Loading…</div>
        ) : error ? (
          <div style={padError}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={padMuted}>No cookie consents recorded yet.</div>
        ) : (
          <div style={scrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>When</th>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Decision</th>
                  <th style={thStyle}>Analytics</th>
                  <th style={thStyle}>Preferences</th>
                  <th style={thStyle}>Saved login</th>
                  <th style={thStyle}>IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{fmt(r.created_at)}</td>
                    <td style={tdStyle}>{r.user_name || <span style={guestStyle}>Guest</span>}</td>
                    <td style={tdStyle}><Badge decision={r.decision} /></td>
                    <td style={tdStyle}><YesNo on={r.analytics} /></td>
                    <td style={tdStyle}><YesNo on={r.preferences} /></td>
                    <td style={tdStyle}><YesNo on={r.saved_login} /></td>
                    <td style={tdStyle}><span style={ipStyle}>{r.ip_address || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
