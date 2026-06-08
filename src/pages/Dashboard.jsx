import React, { useState, useEffect } from 'react';
import { useLang } from '../lang/LangContext';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Sortable table header helper
function SortableTh({ children, sortCol, colIdx, sortDir, onSort }) {
  const active = sortCol === colIdx;
  return (
    <th onClick={() => onSort(colIdx)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        <span style={{ fontSize: 10, opacity: active ? 1 : 0.3, color: active ? 'var(--green)' : 'inherit' }}>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  );
}

const fmt = (v) => (v >= 0 ? '+' : '') + v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '$';
const pClass = (v) => v >= 0 ? 'green' : 'red';

export default function Dashboard() {
  const { t } = useLang();
  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [stats, setStats] = useState(null);
  const [trades, setTrades] = useState([]);
  const [capital, setCapital] = useState(null);
  const [chartData, setChartData] = useState([]);

  const PERIODS = [
    { key: 'all',     label: t('all_dates')   || 'All dates' },
    { key: 'daily',   label: t('today')       || 'Today' },
    { key: 'weekly',  label: t('this_week')   || 'This Week' },
    { key: 'monthly', label: t('this_month')  || 'This Month' },
    { key: 'custom',  label: 'Custom' },
  ];

  // eslint-disable-next-line
  useEffect(() => { load(); }, [period, customFrom, customTo]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line
  }, [period, customFrom, customTo]);

  // Refresh immediately when a new trade is added
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('trade-saved', handler);
    return () => window.removeEventListener('trade-saved', handler);
  // eslint-disable-next-line
  }, [period, customFrom, customTo]);

  async function load() {
    try {
      const param = period !== 'all' && period !== 'custom' ? `?period=${period}` : '';
      const [statsRes, , allTradesRes, capRes] = await Promise.all([
        api.get('/stats' + param),
        api.get('/trades?page=1&limit=9999'),
        api.get('/trades?page=1&limit=9999'),
        api.get('/capital/current').catch(() => null),
      ]);

      setStats(statsRes?.data || null);
      setCapital(capRes?.data || null);

      const allT = allTradesRes?.data?.trades || [];
      // Filter by period client-side
      const today = new Date(); today.setHours(0,0,0,0);
      const filtered = allT.filter(tr => {
        const d = new Date((tr.date_trade || '').substring(0, 10));
        if (period === 'daily') return d >= today;
        if (period === 'weekly') { const s = new Date(today); s.setDate(today.getDate() - today.getDay()); return d >= s; }
        if (period === 'monthly') return d >= new Date(today.getFullYear(), today.getMonth(), 1);
        if (period === 'custom' && customFrom && customTo) {
          const f = new Date(customFrom); const t2 = new Date(customTo); t2.setHours(23,59,59);
          return d >= f && d <= t2;
        }
        return true;
      });
      // Show recent trades filtered by period (max 10)
      setTrades(filtered.slice(0, 10));
      const byDay = {};
      filtered.forEach(tr => {
        const day = (tr.date_trade || '').substring(0, 10);
        if (!byDay[day]) byDay[day] = 0;
        byDay[day] += tr.status === 'win' ? tr.montant : -Math.abs(tr.montant);
      });
      let cum = 0;
      const cd = Object.entries(byDay).sort().map(([day, net]) => {
        cum += net;
        return { day: day.substring(5), cumul: parseFloat(cum.toFixed(2)), net: parseFloat(net.toFixed(2)) };
      });
      setChartData(cd);
    } catch (e) { console.error(e); }
  }

  const allSums = trades.reduce((acc, tr) => {
    if (tr.status === 'win') { acc.wins++; acc.sumWin += tr.montant; }
    else { acc.losses++; acc.sumLose += tr.montant; }
    return acc;
  }, { wins: 0, losses: 0, sumWin: 0, sumLose: 0 });

  // Table sort state
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  function handleSort(idx) {
    if (sortCol === idx) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir('asc'); }
    } else { setSortCol(idx); setSortDir('asc'); }
  }

  const SORT_KEYS = ['date_trade', 'marcher', 'type_trd', 'status', 'point_entree', 'point_sortie', 'montant', 'sessions'];
  const sortedTrades = sortCol === null ? trades : [...trades].sort((a, b) => {
    const av = a[SORT_KEYS[sortCol]] ?? '';
    const bv = b[SORT_KEYS[sortCol]] ?? '';
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const capNow   = capital?.capital_now || 0;
  const capDep   = capital?.capital_depart || 0;
  const capNet   = capNow - capDep;
  const roi      = capDep > 0 ? ((capNet / capDep) * 100) : 0;
  const todayPnl = stats?.today_profit || 0;
  const winRate  = (allSums.wins + allSums.losses) > 0
    ? (allSums.wins / (allSums.wins + allSums.losses) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value;
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: v >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {fmt(v)}
        </div>
      </div>
    );
  };

  const tableHeaders = [
    t('col_date'),  t('col_market'), t('col_type'), t('col_status'),
    t('col_entry'), t('col_close'), t('col_amount'), t('col_session'),
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">{t('dashboard_title')}</div>
          <div className="page-sub">{t('dashboard_overview')}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('period') || 'Period'}:</span>
          <select className="select" style={{ width: 'auto' }} value={period} onChange={e => setPeriod(e.target.value)}>
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          {period === 'custom' && (
            <>
              <input type="date" className="input" style={{ padding: '5px 10px', fontSize: 12, width: 140 }}
                value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>→</span>
              <input type="date" className="input" style={{ padding: '5px 10px', fontSize: 12, width: 140 }}
                value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </>
          )}
          <button className="btn btn-ghost" onClick={load}>↺ {t('refresh') || 'Refresh'}</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label={t('today_pnl') || 'Today P&L'} value={todayPnl} fmt={fmt} pClass={pClass}
          sub={t('todays_performance') || "Today's performance"} />
        <StatCard label={t('win_rate')} value={winRate} fmt={v => v.toFixed(1) + '%'} pClass={v => v >= 50 ? 'green' : 'red'}
          sub={`${allSums.wins}W / ${allSums.losses}L (${allSums.wins + allSums.losses} total)`} />
        <StatCard label={t('total_pnl')} value={capNet} fmt={fmt} pClass={pClass}
          sub={`${allSums.wins + allSums.losses} ${t('total_trades_label') || 'trades'}`} />
        <StatCard label={t('capital')} value={capNow} fmt={v => v.toLocaleString() + '$'} pClass={v => v >= capDep ? 'green' : 'red'}
          sub={`${roi >= 0 ? '+' : ''}${roi.toFixed(2)}% ROI`} mono />
      </div>

      {/* Chart */}
      {chartData.length >= 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>{t('cumulative_pnl')}</div>
            <div className={`mono bold ${pClass(chartData[chartData.length - 1]?.cumul || 0)}`} style={{ fontSize: 16 }}>
              {fmt(chartData[chartData.length - 1]?.cumul || 0)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v.toLocaleString()}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumul" stroke="var(--green)" strokeWidth={2}
                fill="url(#pnlGrad)"
                dot={chartData.length === 1 ? { r: 6, fill: 'var(--green)', stroke: 'var(--bg2)', strokeWidth: 2 } : false}
                activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent trades */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700 }}>{t('recent_trades')}</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {tableHeaders.map((h, i) => (
                  <SortableTh key={h} colIdx={i} sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>{h}</SortableTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTrades.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--dim)', padding: 32 }}>{t('no_trades')}</td></tr>
              )}
              {sortedTrades.map(tr => (
                <tr key={tr.id_trade || tr.id}
                  style={{ background: tr.status === 'win' ? 'rgba(0,230,118,0.03)' : 'rgba(255,71,87,0.03)' }}>
                  <td className="muted">{tr.date_trade}</td>
                  <td style={{ fontWeight: 600 }}>{tr.marcher}</td>
                  <td className={tr.type_trd === 'buy' ? 'green bold' : 'red bold'}>
                    {tr.type_trd?.toUpperCase()}
                  </td>
                  <td>
                    <span className={`badge ${tr.status === 'win' ? 'badge-green' : 'badge-red'}`}>
                      {tr.status === 'win' ? t('win')?.toUpperCase() : t('lose')?.toUpperCase()}
                    </span>
                  </td>
                  <td className="mono">{tr.point_entree}</td>
                  <td className="mono">{tr.point_sortie}</td>
                  <td className={`mono bold ${tr.status === 'win' ? 'green' : 'red'}`}>
                    {tr.status === 'win' ? '+' : '-'}{Math.abs(tr.montant).toFixed(2)}$
                  </td>
                  <td className="muted">{{ LON: 'London', NY: 'New York', ASI: 'Asia' }[tr.sessions] || tr.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, fmt, pClass, sub, mono }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${pClass(value)} ${mono ? 'mono' : ''}`}>{fmt(value)}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
