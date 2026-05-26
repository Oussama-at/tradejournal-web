import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '../lang/LangContext';
import api from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, Scatter, ScatterChart, ZAxis
} from 'recharts';

const PERIODS = [
  { label: 'Today', val: 'today' }, { label: 'Week', val: 'week' },
  { label: 'Month', val: 'month' }, { label: 'All', val: 'all' },
];

const fmt = v => (v >= 0 ? '+' : '') + v.toFixed(2) + '$';
const fmtAbs = v => parseFloat(v).toFixed(2) + '$';

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

// Custom dot for withdrawal markers on the chart
const WithdrawDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.withdrawAmount || payload.withdrawAmount <= 0) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="var(--orange)" opacity={0.2} />
      <circle cx={cx} cy={cy} r={4} fill="var(--orange)" stroke="#fff" strokeWidth={1.5} />
    </g>
  );
};

export default function Chart() {
  const { t } = useLang();
  const [period, setPeriod]     = useState('month');
  const [trades, setTrades]     = useState([]);
  const [chartData, setChartData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [dailyPnL, setDailyPnL]   = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [combinedData, setCombinedData] = useState([]);

  const load = useCallback(async () => {
    try {
      const [statsRes, tradesRes, withdrawRes] = await Promise.all([
        api.get(`/stats/chart?period=${period}`),
        api.get('/trades?page=1&limit=9999'),
        api.get('/withdraw'),
      ]);
      const allTrades = tradesRes?.data?.trades || [];
      const allWithdrawals = withdrawRes?.data?.withdrawals || [];
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
      setChartData(cd);
      setCombinedData(cd);

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
  }, [period]);

  useEffect(() => { load(); }, [load]);

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

  const totalPnl = chartData[chartData.length - 1]?.cumul || 0;
  const totalWithdrawn = withdrawals.reduce((s, w) => s + parseFloat(w.amount || 0), 0);
  const netCapital = totalPnl - totalWithdrawn;
  const daysWithWithdrawals = combinedData.filter(d => d.withdrawAmount > 0);
  const hasWithdrawals = withdrawals.length > 0;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div><div className="page-title">{t('chart_title')}</div></div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIODS.map(p => (
            <button key={p.val} className={`btn ${period === p.val ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px' }} onClick={() => setPeriod(p.val)}>
              {p.label}
            </button>
          ))}
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

      {/* Cumulative P&L with Withdrawal Markers */}
      {combinedData.length > 1 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>Cumulative P&L{hasWithdrawals ? ' & Withdrawals' : ''}</div>
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
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={combinedData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CumulWithdrawTooltip />} />
              {/* Zero line */}
              <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
              {/* Trading P&L area */}
              <Area type="monotone" dataKey="cumul" stroke={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}
                strokeWidth={2} fill="url(#grad1)" dot={false} />
              {/* Net Capital line (P&L minus withdrawals) */}
              {hasWithdrawals && (
                <Line type="monotone" dataKey="netCapital" stroke="var(--blue)"
                  strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              )}
              {/* Withdrawal markers as scatter dots */}
              {hasWithdrawals && (
                <Area type="monotone" dataKey="withdrawAmount"
                  stroke="transparent" fill="transparent"
                  dot={<WithdrawDot />} activeDot={false} />
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
            <BarChart data={combinedData.filter(d => d.withdrawAmount > 0)}>
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
            <BarChart data={dailyPnL} barCategoryGap="30%" barGap={4}>
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
            <ComposedChart data={monthData}>
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
