import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';

const statsRow = { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 };
const headerRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' };
const actionsRow = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const cardStyle = { marginBottom: 16 };
const padMuted = { padding: 24, color: '#7a8a9a' };
const padError = { padding: 24, color: '#f44336' };
const scrollStyle = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const guestStyle = { color: '#7a8a9a' };
const ipStyle = { color: '#7a8a9a', fontSize: 12 };
const thStyle = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: '#7a8a9a', borderBottom: '1px solid #1e2a36', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: 13, color: '#e8edf3', borderBottom: '1px solid #141d26' };
const detailBtnStyle = { background: 'transparent', border: '1px solid #1e2a36', color: '#00b4ff', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const dlBtnStyle = { background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00e676', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const autoWrap = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7a8a9a', cursor: 'pointer', userSelect: 'none' };
const liveDot = { width: 8, height: 8, borderRadius: 999, background: '#00e676', display: 'inline-block' };
const liveDotOff = { width: 8, height: 8, borderRadius: 999, background: '#7a8a9a', display: 'inline-block' };

// Details modal styles
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };
const modalStyle = { width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', background: '#11181f', border: '1px solid #1e2a36', borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' };
const modalHead = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 };
const modalTitle = { fontSize: 16, fontWeight: 800, color: '#e8edf3' };
const modalCloseStyle = { background: 'transparent', border: 'none', color: '#7a8a9a', fontSize: 20, cursor: 'pointer', lineHeight: 1 };
const rowStyle = { display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #141d26' };
const rowLabel = { width: 130, flexShrink: 0, fontSize: 12, color: '#7a8a9a' };
const rowValue = { fontSize: 13, color: '#e8edf3', wordBreak: 'break-word' };
const uaValue = { fontSize: 12, color: '#b5c2cf', wordBreak: 'break-word', lineHeight: 1.5 };

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

function decisionLabel(d) {
  return DECISION_MAP[d] ? DECISION_MAP[d].label : (d || 'Custom');
}

function Badge({ decision }) {
  const s = DECISION_MAP[decision] || DECISION_MAP.custom;
  const style = { display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color };
  return <span style={style}>{s.label}</span>;
}

function YesNo({ on }) {
  const style = { color: on ? '#00e676' : '#7a8a9a', fontWeight: 700 };
  return <span style={style}>{on ? 'Yes' : 'No'}</span>;
}

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString(); } catch (e) { return d; }
}

function DetailRow({ label, children }) {
  return (
    <div style={rowStyle}>
      <div style={rowLabel}>{label}</div>
      <div style={rowValue}>{children}</div>
    </div>
  );
}

function DetailsModal({ row, onClose }) {
  if (!row) return null;
  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHead}>
          <div style={modalTitle}>🍪 Consent details</div>
          <button style={modalCloseStyle} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <DetailRow label="When">{fmt(row.created_at)}</DetailRow>
        <DetailRow label="User">{row.user_name || <span style={guestStyle}>Guest (not logged in)</span>}</DetailRow>
        <DetailRow label="Visitor ID">{row.visitor_id || '—'}</DetailRow>
        <DetailRow label="Decision"><Badge decision={row.decision} /></DetailRow>
        <DetailRow label="Necessary"><YesNo on={row.necessary} /></DetailRow>
        <DetailRow label="Analytics"><YesNo on={row.analytics} /></DetailRow>
        <DetailRow label="Preferences"><YesNo on={row.preferences} /></DetailRow>
        <DetailRow label="Saved login"><YesNo on={row.saved_login} /></DetailRow>
        <DetailRow label="IP address">{row.ip_address || '—'}</DetailRow>
        <DetailRow label="Device">{row.device_type || '—'}</DetailRow>
        <DetailRow label="OS">{row.os || '—'}</DetailRow>
        <DetailRow label="Browser">{row.browser || '—'}</DetailRow>
        <DetailRow label="Screen">{row.screen_size || '—'}</DetailRow>
        <DetailRow label="Timezone">{row.timezone || '—'}</DetailRow>
        <DetailRow label="Language">{row.lang || '—'}</DetailRow>
        <DetailRow label="Country">{row.country || '—'}</DetailRow>
        <DetailRow label="City">{row.city || '—'}</DetailRow>
        <DetailRow label="Page URL"><span style={uaValue}>{row.page_url || '—'}</span></DetailRow>
        <DetailRow label="Referrer"><span style={uaValue}>{row.referrer || '—'}</span></DetailRow>
        <DetailRow label="User-agent"><span style={uaValue}>{row.user_agent || '—'}</span></DetailRow>
      </div>
    </div>
  );
}

export default function CookieConsents() {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auto, setAuto] = useState(true);
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback((silent) => {
    if (!silent) setLoading(true);
    api.get('/admin/cookie-consents')
      .then(r => {
        if (r && r.data) {
          setRows(r.data.consents || []);
          setSummary(r.data.summary || null);
          setError('');
          setLastUpdated(new Date());
        } else {
          setError((r && r.message) || 'Failed to load');
        }
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh (near real-time): re-fetch every 8s while enabled
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => load(true), 8000);
    return () => clearInterval(id);
  }, [auto, load]);

  const downloadCSV = useCallback(() => {
    const headers = ['When', 'User', 'Visitor ID', 'Decision', 'Necessary', 'Analytics', 'Preferences', 'Saved login', 'IP', 'Device', 'OS', 'Browser', 'Screen', 'Timezone', 'Language', 'Country', 'City', 'Page URL', 'Referrer', 'User-agent'];
    const esc = (v) => '"' + (v == null ? '' : String(v)).replace(/"/g, '""') + '"';
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push([
        fmt(r.created_at),
        r.user_name || 'Guest',
        r.visitor_id || '',
        decisionLabel(r.decision),
        r.necessary ? 'Yes' : 'No',
        r.analytics ? 'Yes' : 'No',
        r.preferences ? 'Yes' : 'No',
        r.saved_login ? 'Yes' : 'No',
        r.ip_address || '',
        r.device_type || '',
        r.os || '',
        r.browser || '',
        r.screen_size || '',
        r.timezone || '',
        r.lang || '',
        r.country || '',
        r.city || '',
        r.page_url || '',
        r.referrer || '',
        r.user_agent || '',
      ].map(esc).join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookie-consents-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rows]);

  return (
    <div>
      <div className="page-header" style={headerRow}>
        <div className="page-title">🍪 {t('nav_cookie_consents') || 'Cookie Consents'}</div>
        <div style={actionsRow}>
          <label style={autoWrap} onClick={() => setAuto(a => !a)}>
            <span style={auto ? liveDot : liveDotOff} />
            {auto ? 'Live' : 'Paused'}
          </label>
          <button style={dlBtnStyle} onClick={downloadCSV} disabled={!rows.length}>⬇ Download CSV</button>
          <button className="btn" onClick={() => load()}>↻ Refresh</button>
        </div>
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
                  <th style={thStyle}>Device</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}></th>
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
                    <td style={tdStyle}>{r.device_type || '—'}</td>
                    <td style={tdStyle}><span style={ipStyle}>{[r.city, r.country].filter(Boolean).join(', ') || '—'}</span></td>
                    <td style={tdStyle}><button style={detailBtnStyle} onClick={() => setSelected(r)}>Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {lastUpdated && (
        <div style={ipStyle}>Last updated {lastUpdated.toLocaleTimeString()}{auto ? ' · auto-refreshing every 8s' : ''}</div>
      )}

      <DetailsModal row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
