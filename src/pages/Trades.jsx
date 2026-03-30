import React, { useState, useEffect } from 'react';
import api from '../services/api';

const PERIODS = ['All', 'Today', 'This Week', 'This Month', 'Last Month'];

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', period: 'All', search: '' });
  const [editTrade, setEditTrade] = useState(null);

  useEffect(() => { load(); }, [page, filters]);

  async function load() {
    setLoading(true);
    try {
      let url = `/trades?page=${page}&limit=50`;
      if (filters.search) url += `&market=${encodeURIComponent(filters.search)}`;
      if (filters.type !== 'All') url += `&type=${filters.type.toLowerCase()}`;
      if (filters.status !== 'All') url += `&status=${filters.status.toLowerCase()}`;
      if (filters.period === 'Today') url += '&filter=Daily';
      else if (filters.period === 'This Week') url += '&filter=Weekly';
      else if (filters.period === 'This Month') url += '&filter=Monthly';
      else if (filters.period === 'Last Month') url += '&filter=LastMonth';

      const res = await api.get(url);
      setTrades(res?.data?.trades || []);
      setTotal(res?.data?.total || 0);
      setTotalPages(Math.max(1, Math.ceil((res?.data?.total || 0) / 50)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function deleteTrade(id) {
    if (!window.confirm(`Delete trade #${id}?`)) return;
    await api.delete(`/trades/${id}`);
    load();
  }

  async function saveEdit(body) {
    await api.put(`/trades/${editTrade.id_trade || editTrade.id}`, body);
    setEditTrade(null);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Trades</div>
        <div className="page-sub">{total} total trades</div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input className="input" placeholder="Search market..." value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
          </div>
          {[
            { key: 'type', opts: ['All', 'Buy', 'Sell'] },
            { key: 'status', opts: ['All', 'Win', 'Lose'] },
            { key: 'period', opts: PERIODS },
          ].map(({ key, opts }) => (
            <select key={key} className="select" style={{ width: 'auto' }}
              value={filters[key]} onChange={e => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1); }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
          <button className="btn btn-ghost" onClick={() => { setFilters({ type: 'All', status: 'All', period: 'All', search: '' }); setPage(1); }}>
            ↺ Reset
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['#', 'Date', 'Market', 'Type', 'Entry', 'Close', 'Qty', 'Status', 'Amount', 'Session', 'Actions'].map(h =>
                  <th key={h}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>}
              {!loading && trades.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--dim)', padding: 32 }}>No trades found</td></tr>}
              {!loading && trades.map(t => {
                const id = t.id_trade || t.id;
                return (
                  <tr key={id} style={{ background: t.status === 'win' ? 'rgba(0,230,118,0.025)' : 'rgba(255,71,87,0.025)' }}>
                    <td className="muted mono" style={{ fontSize: 12 }}>{id}</td>
                    <td className="muted">{t.date_trade}</td>
                    <td style={{ fontWeight: 700 }}>{t.marcher}</td>
                    <td className={t.type_trd === 'buy' ? 'green bold' : 'red bold'}>{t.type_trd?.toUpperCase()}</td>
                    <td className="mono">{t.point_entree}</td>
                    <td className="mono">{t.point_sortie}</td>
                    <td className="mono muted">{t.nbr_contrat} {t.qty_type?.includes('lot') ? 'L' : ''}</td>
                    <td>
                      <span className={`badge ${t.status === 'win' ? 'badge-green' : 'badge-red'}`}>
                        {t.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className={`mono bold ${t.status === 'win' ? 'green' : 'red'}`}>
                      {t.status === 'win' ? '+' : '-'}{Math.abs(t.montant).toFixed(2)}$
                    </td>
                    <td className="muted">{t.sessions}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={() => setEditTrade(t)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={() => deleteTrade(id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page} / {totalPages} · {total} trades</span>
          <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      </div>

      {editTrade && <EditModal trade={editTrade} onClose={() => setEditTrade(null)} onSave={saveEdit} />}
    </div>
  );
}

function EditModal({ trade, onClose, onSave }) {
  const [form, setForm] = useState({
    marcher: trade.marcher || '',
    type_trd: trade.type_trd || 'buy',
    point_entree: trade.point_entree || 0,
    point_sortie: trade.point_sortie || 0,
    montant: trade.montant || 0,
    nbr_contrat: trade.nbr_contrat || 1,
    qty_type: trade.qty_type || 'contract mini',
    status: trade.status || 'win',
    type_close: trade.type_close || 'Target',
    sessions: trade.sessions || 'LON',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>Edit Trade #{trade.id_trade || trade.id}</div>
          <button className="btn btn-ghost" style={{ padding: '3px 8px' }} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Market', 'marcher', 'text'],
            ['Entry', 'point_entree', 'number'],
            ['Close', 'point_sortie', 'number'],
            ['Amount ($)', 'montant', 'number'],
            ['Qty', 'nbr_contrat', 'number'],
          ].map(([label, key, type]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input className="input" type={type} value={form[key]}
                onChange={e => set(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)} />
            </div>
          ))}
          {[
            ['Type', 'type_trd', ['buy', 'sell']],
            ['Status', 'status', ['win', 'lose']],
            ['Close By', 'type_close', ['Target', 'Stop Loss', 'Manual']],
            ['Session', 'sessions', ['LON', 'NY', 'ASI']],
          ].map(([label, key, opts]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <select className="select" value={form[key]} onChange={e => set(key, e.target.value)}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
