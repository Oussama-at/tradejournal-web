import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from '../components/DatePicker';
import { useLang } from '../lang/LangContext';
import api from '../services/api';
import {
  Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine
} from 'recharts';

const PERIODS = [
  { label: 'Today', val: 'today' }, { label: 'Week', val: 'week' },
  { label: 'Month', val: 'month' }, { label: 'All', val: 'all' },
  { label: 'Custom', val: 'custom' },
];

const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(2) + '$';

const DailyPnLTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: p.color, fontSize: 13, marginBottom: 2 }}>
          {p.name === 'profit' ? 'Profit' : 'Loss'}: {p.value > 0 ? '+' : ''}{Math.abs(p.value).toFixed(2)}$
        </div>
      ))}
    </div>
  );
};

// Tooltip for the combined Cumulative P&L + Withdrawals chart
const CumulWithdrawTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const cumul   = payload.find(p => p.dataKey === 'cumul');
  const wAmt    = payload.find(p => p.dataKey === 'withdrawAmount');
  const netLine = payload.find(p => p.dataKey === 'netCapital');
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', minWidth: 180 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{label}</div>
      {cumul && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: 'var(--muted)' }}>Trading P&L</span>
          <span style={{ fontWeight: 700, color: cumul.value >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)' }}>{fmt(cumul.value)}</span>
        </div>
      )}
      {wAmt && wAmt.value > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: 'var(--muted)' }}>Withdrawal</span>
          <span style={{ fontWeight: 700, color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>-{wAmt.value.toFixed(2)}$</span>
        </div>
      )}
      {netLine && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
          <span style={{ color: 'var(--muted)' }}>Net Capital</span>
          <span style={{ fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>{netLine.value >= 0 ? '+' : ''}{netLine.value.toFixed(2)}$</span>
        </div>
      )}
    </div>
  );
};

// Custom crosshair cursor: vertical line + horizontal price line with value label
const CustomCrosshair = ({ points, width, height, top, left, payload }) => {
  if (!points || !points.length) return null;
  const { x, y } = points[0];
  const chartValue = payload?.[0]?.value;
  const label = chartValue != null ? (chartValue >= 0 ? '+' : '') + chartValue.toFixed(2) + '$' : null;
  const labelWidth = label ? label.length * 7.5 + 16 : 0;
  const labelX = x + 8;
  const labelFits = labelX + labelWidth < (left + width - 4);
  const finalLabelX = labelFits ? labelX : x - labelWidth - 8;
  return (
    <g>
      {/* Vertical line */}
      <line x1={x} y1={top} x2={x} y2={top + height}
        stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="4 3" />
      {/* Horizontal price line */}
      <line x1={left} y1={y} x2={left + width} y2={y}
        stroke="rgba(255,255,255,0.18)" strokeWidth={1} strokeDasharray="3 3" />
      {/* Price label pill on the right */}
      {label && (
        <g>
          <rect x={finalLabelX - 2} y={y - 10} width={labelWidth} height={20}
            rx={4} fill="rgba(30,30,40,0.92)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <text x={finalLabelX + labelWidth / 2 - 2} y={y + 4.5}
            textAnchor="middle" fill={chartValue >= 0 ? 'var(--green, #22c55e)' : 'var(--red, #ef4444)'}
            fontSize={11} fontWeight={700} fontFamily="monospace">
            {label}
          </text>
        </g>
      )}
    </g>
  );
};

// Custom dot for withdrawal markers — rendered ON the cumul (P&L) line
// props.cy comes from the cumul series; payload.withdrawAmount is the withdrawal value
const WithdrawDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.withdrawAmount || payload.withdrawAmount <= 0) return null;
  return (
    <g>
      {/* Outer pulse ring */}
      <circle cx={cx} cy={cy} r={10} fill="var(--orange)" opacity={0.12} />
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={6} fill="var(--orange)" opacity={0.25} />
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={4} fill="var(--orange)" stroke="var(--bg2)" strokeWidth={2} />
      {/* Down-arrow indicator */}
      <line x1={cx} y1={cy + 6} x2={cx} y2={cy + 14} stroke="var(--orange)" strokeWidth={1.5} strokeLinecap="round" />
      <polyline points={`${cx - 4},${cy + 11} ${cx},${cy + 16} ${cx + 4},${cy + 11}`} fill="none" stroke="var(--orange)" strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  );
};

function PnlChartStyles() {
  return (
    <style>{`
      .pnl-chart-page .card,
      .pnl-chart-page .stat-card {
        animation: pnlFadeUp .5s ease both;
        transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      }
      .pnl-chart-page .stat-card {
        background: linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
      }
      .pnl-chart-page .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        border-color: rgba(0,230,118,0.35);
      }
      .pnl-chart-page .card {
        position: relative;
        overflow: hidden;
      }
      .pnl-chart-page .card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg, #00e676, #00b0ff, transparent);
        opacity: .65;
      }
      .pnl-chart-page .stat-value { letter-spacing: .3px; }
      .pnl-chart-page .recharts-surface { overflow: visible; }
      @keyframes pnlFadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}

export default function Chart() {
  const { t } = useLang();
  const [period, setPeriod]     = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [trades, setTrades]     = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [dailyPnL, setDailyPnL]   = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [combinedData, setCombinedData] = useState([]);

  // Helper: filter trades by period client-side
  const filterByPeriod = useCallback((list, isWithdrawal = false) => {
    const dateKey = isWithdrawal ? 'created_at' : 'date_trade';
    const today = new Date(); today.setHours(0,0,0,0);
    return list.filter(item => {
      const d = new Date((item[dateKey] || '').substring(0, 10));
      if (period === 'today') return d >= today;
      if (period === 'week') {
        const start = new Date(today); start.setDate(today.getDate() - today.getDay());
        return d >= start;
      }
      if (period === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return d >= start;
      }
      if (period === 'custom' && customFrom && customTo) {
        const from = new Date(customFrom); const to = new Date(customTo); to.setHours(23,59,59);
        return d >= from && d <= to;
      }
      return true; // 'all'
    });
  }, [period, customFrom, customTo]);

  const load = useCallback(async () => {
    try {
      const [tradesRes, withdrawRes] = await Promise.all([
        api.get('/trades?page=1&limit=9999'),
        api.get('/withdraw'),
      ]);
      const rawTrades = tradesRes?.data?.trades || [];
      const rawWithdrawals = withdrawRes?.data?.withdrawals || [];
      const allTrades = filterByPeriod(rawTrades);
      const allWithdrawals = filterByPeriod(rawWithdrawals, true);
      setTrades(allTrades);
      setWithdrawals(allWithdrawals);

      // Build per-day PnL
      const byDay = {};
      allTrades.forEach(t => {
        const day = (t.date_trade || '').substring(0, 10);
        if (!byDay[day]) byDay[day] = 0;
        byDay[day] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
      });

      // Build per-day withdrawals map
      const wByDay = {};
      allWithdrawals.forEach(w => {
        const day = (w.created_at || '').substring(0, 10);
        if (!wByDay[day]) wByDay[day] = 0;
        wByDay[day] += parseFloat(w.amount || 0);
      });

      // Collect all unique days (trades + withdrawals)
      const allDays = Array.from(new Set([
        ...Object.keys(byDay),
        ...Object.keys(wByDay),
      ])).sort();

      let cum = 0;
      let netCum = 0;
      const cd = allDays.map(day => {
        const net = byDay[day] || 0;
        const wAmt = wByDay[day] || 0;
        cum += net;
        netCum += net - wAmt;
        return {
          day: day.substring(5),
          fullDay: day,
          cumul: parseFloat(cum.toFixed(2)),
          net: parseFloat(net.toFixed(2)),
          withdrawAmount: parseFloat(wAmt.toFixed(2)),
          netCapital: parseFloat(netCum.toFixed(2)),
        };
      });
      // Prepend a $0 origin so the line always starts from zero
      const cdWithOrigin = cd.length > 0
        ? [{ day: '', fullDay: '', cumul: 0, net: 0, withdrawAmount: 0, netCapital: 0 }, ...cd]
        : cd;
      setCombinedData(cdWithOrigin);

      // Monthly bar chart
      const byMonth = {};
      allTrades.forEach(t => {
        const m = (t.date_trade || '').substring(0, 7);
        if (!byMonth[m]) byMonth[m] = 0;
        byMonth[m] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
      });
      // Monthly withdrawals
      const wByMonth = {};
      allWithdrawals.forEach(w => {
        const m = (w.created_at || '').substring(0, 7);
        if (!wByMonth[m]) wByMonth[m] = 0;
        wByMonth[m] += parseFloat(w.amount || 0);
      });
      const allMonths = Array.from(new Set([...Object.keys(byMonth), ...Object.keys(wByMonth)])).sort();
      setMonthData(allMonths.map(m => ({
        month: m.substring(5),
        value: parseFloat((byMonth[m] || 0).toFixed(2)),
        withdrawn: parseFloat((wByMonth[m] || 0).toFixed(2)),
      })));

      // Daily P&L Win vs Loss
      const dailyMap = {};
      allTrades.forEach(t => {
        const day = (t.date_trade || '').substring(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { profit: 0, loss: 0 };
        if (t.status === 'win') dailyMap[day].profit += t.montant;
        else dailyMap[day].loss += Math.abs(t.montant);
      });
      const dl = Object.entries(dailyMap).sort().map(([day, { profit, loss }]) => ({
        day: day.substring(5),
        profit: parseFloat(profit.toFixed(2)),
        loss: parseFloat((-loss).toFixed(2)),
      }));
      setDailyPnL(dl);
    } catch (e) { console.error(e); }
  }, [filterByPeriod]);

  useEffect(() => { load(); }, [load]);

  // Refresh immediately when a new trade is added from AddTrade page
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('trade-saved', handler);
    return () => window.removeEventListener('trade-saved', handler);
  }, [load]);

  // Stats
  const wins   = trades.filter(t => t.status === 'win').length;
  const losses = trades.filter(t => t.status !== 'win').length;
  const total  = wins + losses;
  const wr     = total > 0 ? (wins / total * 100) : 0;
  const sessMap = {};
  trades.forEach(t => {
    const s = t.sessions || 'Unknown';
    if (!sessMap[s]) sessMap[s] = 0;
    sessMap[s] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
  });
  const mktMap = {};
  trades.forEach(t => {
    const m = t.marcher || 'Unknown';
    if (!mktMap[m]) mktMap[m] = 0;
    mktMap[m] += t.status === 'win' ? t.montant : -Math.abs(t.montant);
  });
  const topMarkets = Object.entries(mktMap).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5);

  const totalPnl = trades.reduce((s, t) => s + (t.status === 'win' ? t.montant : -Math.abs(t.montant)), 0);
  const totalWithdrawn = withdrawals.reduce((s, w) => s + parseFloat(w.amount || 0), 0);
  const netCapital = totalPnl - totalWithdrawn;
  const daysWithWithdrawals = combinedData.filter(d => d.withdrawAmount > 0);
  const hasWithdrawals = withdrawals.length > 0;
  const hasData = combinedData.length > 0 || trades.length > 0;

  return (
    <div className="pnl-chart-page">
      <PnlChartStyles />
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div><div className="page-title">{t('chart_title')}</div></div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {PERIODS.map(p => (
            <button key={p.val} className={`btn ${period === p.val ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px' }} onClick={() => setPeriod(p.val)}>
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>FROM</span>
              <DatePicker
                style={{ padding: '4px 8px', fontSize: 12, width: 130, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, colorScheme: 'dark', color: 'var(--text)' }}
                value={customFrom} onChange={v => setCustomFrom(v)} placeholder="From" />
              <span style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 300 }}>→</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>TO</span>
              <DatePicker
                style={{ padding: '4px 8px', fontSize: 12, width: 130, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, colorScheme: 'dark', color: 'var(--text)' }}
                value={customTo} onChange={v => setCustomTo(v)} placeholder="To" />
              {(customFrom || customTo) && (
                <button onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>✕</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top stats — now includes withdrawal stats */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">{t('total_pnl')}</div>
          <div className={`stat-value mono ${totalPnl >= 0 ? 'green' : 'red'}`}>{fmt(totalPnl)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('win_rate')}</div>
          <div className={`stat-value ${wr >= 50 ? 'green' : 'red'}`}>{wr.toFixed(1)}%</div>
          <div className="stat-sub">{wins}W / {losses}L / {total} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Withdrawn</div>
          <div className="stat-value mono" style={{ color: 'var(--orange)' }}>-{totalWithdrawn.toFixed(2)}$</div>
          <div className="stat-sub">{withdrawals.length} withdrawal{withdrawals.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Capital (P&L − Withdrawals)</div>
          <div className={`stat-value mono ${netCapital >= 0 ? 'blue' : 'red'}`}>{fmt(netCapital)}</div>
        </div>
      </div>

      {/* No data empty state */}
      {!hasData && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No trades in this period</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Try selecting a different time range or switch to "All"</div>
        </div>
      )}

      {/* Cumulative P&L with Withdrawal Markers */}
      {combinedData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Cumulative P&L{hasWithdrawals ? ' & Withdrawals' : ''}</div>
              {period !== 'all' && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                  background: 'var(--bg3)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  { period === 'today' ? 'Today' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : `${customFrom} → ${customTo}` }
                </span>
              )}
            </div>
            {hasWithdrawals && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 12, height: 3, borderRadius: 99, background: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }} />
                  Trading P&L
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--orange)' }} />
                  Withdrawal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  <div style={{ width: 12, height: 2, borderRadius: 99, background: 'var(--blue)', borderTop: '2px dashed var(--blue)' }} />
                  Net Capital
                </div>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={combinedData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `$${v}`}
                width={64}
              />
              <Tooltip
                content={<CumulWithdrawTooltip />}
                cursor={<CustomCrosshair />}
              />
              {/* Zero reference line */}
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
              {/* Trading P&L area — withdrawal dots rendered here on the correct line position */}
              <Area
                type="monotone"
                dataKey="cumul"
                stroke={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
                strokeWidth={2.5}
                fill="url(#grad1)"
                dot={(dotProps) => {
                  const { payload } = dotProps;
                  // Show dot for withdrawal markers OR when only 1 point (single trade)
                  if (payload?.withdrawAmount > 0) return <WithdrawDot key={`wd-${dotProps.index}`} {...dotProps} />;
                  if (combinedData.length === 1) return <circle key={`single-${dotProps.index}`} cx={dotProps.cx} cy={dotProps.cy} r={6} fill={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stroke="var(--bg2)" strokeWidth={2} />;
                  return <g key={`empty-${dotProps.index}`} />;
                }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg2)', fill: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}
              />
              {/* Net Capital dashed line */}
              {hasWithdrawals && (
                <Line
                  type="monotone"
                  dataKey="netCapital"
                  stroke="var(--blue)"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg2)', fill: 'var(--blue)' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          {/* Withdrawal markers list below chart */}
          {daysWithWithdrawals.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {daysWithWithdrawals.map((d, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,160,0,0.1)', border: '1px solid rgba(255,160,0,0.3)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 11
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />
                  <span style={{ color: 'var(--muted)' }}>{d.day}</span>
                  <span style={{ color: 'var(--orange)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>-{d.withdrawAmount.toFixed(2)}$</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdrawal Timeline (only if there are withdrawals) */}
      {hasWithdrawals && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Withdrawal History Chart</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={combinedData.filter(d => d.withdrawAmount > 0)} barSize={Math.max(24, Math.min(80, Math.floor(600 / Math.max(combinedData.filter(d => d.withdrawAmount > 0).length, 1))))}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
                      <div style={{ fontWeight: 700, color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>-{payload[0].value.toFixed(2)}$</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="withdrawAmount" name="Withdrawn" radius={[4, 4, 0, 0]} fill="var(--orange)" />
            </BarChart>
          </ResponsiveContainer>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Total Withdrawn</div>
              <div style={{ fontWeight: 800, color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>-{totalWithdrawn.toFixed(2)}$</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Avg per Withdrawal</div>
              <div style={{ fontWeight: 800, color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>{withdrawals.length ? (totalWithdrawn / withdrawals.length).toFixed(2) : 0}$</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Largest Single</div>
              <div style={{ fontWeight: 800, color: 'var(--orange)', fontFamily: 'var(--font-mono)' }}>{withdrawals.length ? Math.max(...withdrawals.map(w => parseFloat(w.amount))).toFixed(2) : 0}$</div>
            </div>
          </div>
        </div>
      )}

      {/* Daily P&L Win vs Loss */}
      {dailyPnL.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>{t('daily_pnl')}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green)' }} /> Profit
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--red)' }} /> Loss
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyPnL} barCategoryGap="30%" barGap={4} barSize={Math.max(20, Math.min(60, Math.floor(600 / Math.max(dailyPnL.length, 1))))}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${Math.abs(v)}`} />
              <Tooltip content={<DailyPnLTooltip />} />
              <Bar dataKey="profit" name="profit" radius={[4, 4, 0, 0]} fill="var(--green)" />
              <Bar dataKey="loss"   name="loss"   radius={[4, 4, 0, 0]} fill="var(--red)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly Bar + Session/Market */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>{t('monthly_chart')}</div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={monthData} barSize={Math.max(20, Math.min(60, Math.floor(300 / Math.max(monthData.length, 1))))}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} style={{ fontWeight: 700, color: p.name === 'withdrawn' ? 'var(--orange)' : p.value >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 2 }}>
                        {p.name === 'withdrawn' ? 'Withdrawn' : 'P&L'}: {p.name === 'withdrawn' ? '-' : p.value >= 0 ? '+' : ''}{Math.abs(p.value).toFixed(2)}$
                      </div>
                    ))}
                  </div>
                );
              }} />
              <Bar dataKey="value" name="pnl" radius={[4, 4, 0, 0]}>
                {monthData.map((d, i) => <Cell key={i} fill={d.value >= 0 ? 'var(--green)' : 'var(--red)'} />)}
              </Bar>
              {hasWithdrawals && (
                <Bar dataKey="withdrawn" name="withdrawn" radius={[4, 4, 0, 0]} fill="var(--orange)" opacity={0.7} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          {hasWithdrawals && (
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--green)' }} /> P&L
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--orange)', opacity: 0.7 }} /> Withdrawals
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Session */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('by_session')}</div>
            {Object.entries(sessMap).map(([sess, pnl]) => {
              const sessLabel = { LON: 'London', NY: 'New York', ASI: 'Asia' }[sess] || sess;
              return (
              <div key={sess} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{sessLabel}</span>
                  <span className={`mono bold ${pnl >= 0 ? 'green' : 'red'}`}>{fmt(pnl)}</span>
                </div>
                <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 99 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: pnl >= 0 ? 'var(--green)' : 'var(--red)', width: `${Math.min(100, Math.abs(pnl) / Math.max(...Object.values(sessMap).map(Math.abs)) * 100)}%` }} />
                </div>
              </div>
              );
            })}
          </div>

          {/* Top markets */}
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('top_markets')}</div>
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
