import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PERIODS = [
  { label: 'Today', val: 'today' }, { label: 'Week', val: 'week' },
  { label: 'Month', val: 'month' }, { label: 'All', val: 'all' },
];

const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(2) + '$';
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: v >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(v)}</div>
    </div>
  );
};

export default function Chart() {
  const [period, setPeriod] = useState('month');
  const [trades, setTrades] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  const load = React.useCallback(async () => {
    try {
      const [statsRes, tradesRes] = await Promise.all([
        api.get(`/stats/chart?period=${period}`),
        api.get('/trades?page=1&limit=9999'),
      ]);
      const allTrades = tradesRes?.data?.trades || [];
      setTrades(allTrades);

      // Build cumulative chart
      const byDay = {};
      allTrades.forEach(t => {
        const day = (t.date_trade || '').substring(0, 10);
        if (!byDay[day]) byDay[day] = 0;
        byDay[day] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
      });
      let cum = 0;
      const cd = Object.entries(byDay).sort().map(([day, net]) => {
        cum += net;
        return { day: day.substring(5), cumul: parseFloat(cum.toFixed(2)), net: parseFloat(net.toFixed(2)) };
      });
      setChartData(cd);

      // Monthly bar chart
      const byMonth = {};
      allTrades.forEach(t => {
        const m = (t.date_trade || '').substring(0, 7);
        if (!byMonth[m]) byMonth[m] = 0;
        byMonth[m] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
      });
      setMonthData(Object.entries(byMonth).sort().map(([m, v]) => ({ month: m.substring(5), value: parseFloat(v.toFixed(2)) })));
    } catch (e) { console.error(e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => { load(); }, [load]);

  // Win rate
  const wins   = trades.filter(t => t.status === 'win').length;
  const losses = trades.filter(t => t.status !== 'win').length;
  const total  = wins + losses;
  const wr     = total > 0 ? (wins / total * 100) : 0;

  // Session stats
  const sessMap = {};
  trades.forEach(t => {
    const s = t.sessions || 'Unknown';
    if (!sessMap[s]) sessMap[s] = 0;
    sessMap[s] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
  });

  // Market stats
  const mktMap = {};
  trades.forEach(t => {
    const m = t.marcher || 'Unknown';
    if (!mktMap[m]) mktMap[m] = 0;
    mktMap[m] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
  });
  const topMarkets = Object.entries(mktMap).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5);

  const totalPnl = chartData[chartData.length - 1]?.cumul || 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div className="page-title">P&L Chart</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIODS.map(p => (
            <button key={p.val} className={`btn ${period === p.val ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px' }} onClick={() => setPeriod(p.val)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total P&L</div>
          <div className={`stat-value mono ${totalPnl >= 0 ? 'green' : 'red'}`}>{fmt(totalPnl)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className={`stat-value ${wr >= 50 ? 'green' : 'red'}`}>{wr.toFixed(1)}%</div>
          <div className="stat-sub">{wins}W / {losses}L / {total} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Best Day</div>
          <div className="stat-value blue mono">{chartData.length ? fmt(Math.max(...chartData.map(d => d.net))) : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Worst Day</div>
          <div className="stat-value red mono">{chartData.length ? fmt(Math.min(...chartData.map(d => d.net))) : '—'}</div>
        </div>
      </div>

      {/* Cumulative P&L */}
      {chartData.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Cumulative P&L</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumul" stroke={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
                strokeWidth={2} fill="url(#grad1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Bar + Session/Market */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Monthly P&L</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {monthData.map((d, i) => <Cell key={i} fill={d.value >= 0 ? 'var(--green)' : 'var(--red)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>By Session</div>
            {Object.entries(sessMap).map(([sess, pnl]) => (
              <div key={sess} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{sess}</span>
                  <span className={`mono bold ${pnl >= 0 ? 'green' : 'red'}`}>{fmt(pnl)}</span>
                </div>
                <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 99 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: pnl >= 0 ? 'var(--green)' : 'var(--red)', width: `${Math.min(100, Math.abs(pnl) / Math.max(...Object.values(sessMap).map(Math.abs)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Top markets */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Top Markets</div>
            {topMarkets.map(([mkt, pnl], i) => {
              const colors = ['var(--blue)', 'var(--green)', 'var(--orange)', 'var(--purple)', 'var(--muted)'];
              return (
                <div key={mkt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ background: colors[i] + '22', color: colors[i], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{mkt}</span>
                  <span className={`mono bold ${pnl >= 0 ? 'green' : 'red'}`}>{fmt(pnl)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
