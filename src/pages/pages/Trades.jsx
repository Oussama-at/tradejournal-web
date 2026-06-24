import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../components/ConfirmDialog';

// Real trades listing page.
// NOTE: Trades.jsx used to be an accidental duplicate of Ranking.jsx, which is
// why clicking "Trades" opened the leaderboard. This is the proper trades
// table, backed by real /trades data.

const SESSION_LABELS = { LON: 'London', NY: 'New York', ASI: 'Asia' };

const SORT_KEYS = [
  'date_trade', 'marcher', 'type_trd', 'status',
  'point_entree', 'point_sortie', 'montant', 'sessions',
];

const ST = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  toolbar: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  block: { marginBottom: 16 },
  filterRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  search: { flex: 1, minWidth: 200 },
  thInner: { display: 'inline-flex', alignItems: 'center', gap: 4 },
  arrow: { opacity: 0.5, fontSize: 11 },
  spacerTh: { width: 44 },
  numCell: { textAlign: 'right' },
  market: { fontWeight: 600 },
  delBtn: { padding: '4px 8px' },
  empty: { textAlign: 'center', padding: 24, opacity: 0.6 },
  errCell: { textAlign: 'center', padding: 24, color: '#f87171' },
};

function thStyle(align) {
  return { textAlign: align || 'left', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' };
}

function SortableTh({ children, colIdx, sortCol, sortDir, onSort, align }) {
  const active = sortCol === colIdx;
  return (
    <th onClick={() => onSort(colIdx)} style={thStyle(align)}>
      <span style={ST.thInner}>
        {children}
        <span style={ST.arrow}>
          {active ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
        </span>
      </span>
    </th>
  );
}

export default function Trades() {
  const { t } = useLang();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [trades, setTrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | win | lose
  const [sortCol, setSortCol] = useState(0);
  const [sortDir, setSortDir] = useState('desc');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/trades?page=1&limit=9999')
      .then(r => {
        const list = r?.data?.trades || r?.data || [];
        setTrades(Array.isArray(list) ? list : []);
      })
      .catch(() => setError(t('failed_load') || 'Failed to load trades'))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('trade-saved', handler);
    return () => window.removeEventListener('trade-saved', handler);
  }, [load]);

  function handleSort(idx) {
    if (sortCol === idx) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(idx);
      setSortDir('asc');
    }
  }

  async function removeTrade(tr) {
    const id = tr.id_trade || tr.id;
    if (!id) return;
    const ok = await confirm({
      title: t('delete') || 'Delete trade',
      message: (t('confirm_delete_trade') || 'Delete this trade? This cannot be undone.'),
      confirmText: t('delete') || 'Delete',
      danger: true,
    });
    if (!ok) return;
    await api.delete(`/trades/${id}`);
    load();
  }

  const filtered = trades.filter(tr => {
    if (statusFilter !== 'all' && tr.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${tr.marcher || ''} ${tr.type_trd || ''} ${tr.sessions || ''} ${tr.date_trade || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const key = SORT_KEYS[sortCol];
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    const cmp = (typeof av === 'number' && typeof bv === 'number')
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Summary across the filtered set (real data)
  const summary = filtered.reduce((acc, tr) => {
    if (tr.status === 'win') { acc.wins++; acc.net += Math.abs(tr.montant || 0); }
    else { acc.losses++; acc.net -= Math.abs(tr.montant || 0); }
    return acc;
  }, { wins: 0, losses: 0, net: 0 });
  const total   = summary.wins + summary.losses;
  const winRate = total > 0 ? (summary.wins / total * 100) : 0;
  const fmt = (v) => (v >= 0 ? '+' : '-') + Math.abs(v).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '$';

  const headers = [
    t('col_date') || 'Date', t('col_market') || 'Market', t('col_type') || 'Type',
    t('col_status') || 'Status', t('col_entry') || 'Entry', t('col_close') || 'Close',
    t('col_amount') || 'Amount', t('col_session') || 'Session',
  ];

  return (
    <div>
      <div className="page-header" style={ST.header}>
        <div>
          <div className="page-title">{t('nav_trades') || 'Trades'}</div>
          <div className="page-sub">{filtered.length} {t('trades') || 'trades'}</div>
        </div>
        <div style={ST.toolbar}>
          <button className="btn btn-primary" onClick={() => navigate('/add-trade')}>+ {t('nav_add_trade') || 'Add Trade'}</button>
          <button className="btn btn-ghost" onClick={load}>{'\u21BA '}{t('refresh') || 'Refresh'}</button>
        </div>
      </div>

      {/* Summary stat cards (real data) */}
      <div className="grid-4" style={ST.block}>
        <div className="stat-card">
          <div className="stat-label">{t('total_trades') || 'Total trades'}</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('win_rate') || 'Win rate'}</div>
          <div className="stat-value">{winRate.toFixed(1)}%</div>
          <div className="stat-sub">{summary.wins}W / {summary.losses}L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('net_pnl') || 'Net P&L'}</div>
          <div className={`stat-value mono ${summary.net >= 0 ? 'green' : 'red'}`}>{fmt(summary.net)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('wins') || 'Wins'}</div>
          <div className="stat-value green">{summary.wins}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={ST.block}>
        <div style={ST.filterRow}>
          <input
            className="input"
            style={ST.search}
            placeholder={(t('search') || 'Search') + '\u2026'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">{t('all') || 'All'}</option>
            <option value="win">{t('win') || 'Win'}</option>
            <option value="lose">{t('lose') || 'Lose'}</option>
          </select>
        </div>
      </div>

      {/* Trades table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <SortableTh key={h} colIdx={i} sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                    align={i >= 4 ? 'right' : 'left'}>
                    {h}
                  </SortableTh>
                ))}
                <th style={ST.spacerTh}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={ST.empty}>{t('loading') || 'Loading\u2026'}</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={9} style={ST.errCell}>{error}</td></tr>
              )}
              {!loading && !error && sorted.length === 0 && (
                <tr><td colSpan={9} style={ST.empty}>{t('no_trades') || 'No trades recorded yet.'}</td></tr>
              )}
              {!loading && !error && sorted.map(tr => (
                <tr key={tr.id_trade || tr.id}>
                  <td className="muted">{tr.date_trade}</td>
                  <td style={ST.market}>{tr.marcher}</td>
                  <td className={tr.type_trd === 'buy' ? 'green bold' : 'red bold'}>{(tr.type_trd || '').toUpperCase()}</td>
                  <td>
                    <span className={`badge ${tr.status === 'win' ? 'badge-green' : 'badge-red'}`}>
                      {tr.status === 'win' ? (t('win') || 'WIN').toUpperCase() : (t('lose') || 'LOSE').toUpperCase()}
                    </span>
                  </td>
                  <td className="mono" style={ST.numCell}>{tr.point_entree}</td>
                  <td className="mono" style={ST.numCell}>{tr.point_sortie}</td>
                  <td className={`mono bold ${tr.status === 'win' ? 'green' : 'red'}`} style={ST.numCell}>
                    {tr.status === 'win' ? '+' : '-'}{Math.abs(tr.montant || 0).toFixed(2)}$
                  </td>
                  <td className="muted" style={ST.numCell}>{SESSION_LABELS[tr.sessions] || tr.sessions}</td>
                  <td style={ST.numCell}>
                    <button className="btn btn-ghost" style={ST.delBtn} onClick={() => removeTrade(tr)}>{'\u2715'}</button>
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
