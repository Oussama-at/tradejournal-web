import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';
import { useAuth } from '../context/AuthContext';

const FREE_TRADE_LIMIT = 6;

const MARKETS = {
  'TREASURY': ['ZT','Z3N','ZF','ZN','TN','ZB','UB','ZQ','SR1','SR3','2YY','5YY','10Y','30Y'],
  'FUTURES':  ['NQ','ES','YM','RTY','NKD','DAX','FDAX','CAC','FTSE','HSI','KOSPI200','IBEX35','MIB','ASX200','SPI200'],
  'MICROS':   ['MNQ','MES','MYM','M2K','MGC','MCL','MHG','MSI','MBTC','METH'],
  'METALS':   ['GC','SI','HG','PL','PA','MGC','SIL'],
  'ENERGY':   ['CL','BZ','NG','RB','HO','UGA','UNL'],
  'AGRI':     ['ZC','ZW','ZS','ZL','ZM','ZO','ZR','KE','DC'],
  'FOREX':    ['EUR/USD','USD/JPY','GBP/USD','USD/CHF','AUD/USD','USD/CAD','NZD/USD','EUR/GBP','EUR/JPY','EUR/AUD','EUR/CAD','EUR/CHF','EUR/NZD','GBP/JPY','GBP/AUD','GBP/CAD','GBP/CHF','GBP/NZD','AUD/JPY','AUD/CAD','AUD/CHF','AUD/NZD','CAD/JPY','CAD/CHF','NZD/JPY','NZD/CAD','NZD/CHF','CHF/JPY','USD/TRY','USD/ZAR','USD/MXN','USD/SEK','USD/NOK','USD/DKK','USD/SGD','USD/HKD','USD/CNH','USD/PLN','USD/CZK','USD/HUF','USD/THB','USD/ILS','EUR/TRY','EUR/ZAR','EUR/NOK','EUR/SEK','GBP/TRY','GBP/ZAR'],
  'CRYPTO':   ['BTC','ETH','SOL','XRP','BNB','ADA','DOGE','AVAX','LINK','LTC','DOT','MATIC','UNI','ATOM','NEAR','FTM','ALGO','XLM','TRX','SHIB'],
};
const SESSIONS = ['LON', 'NY', 'ASI'];
const SESSION_TKEYS = { LON: 'session_lon', NY: 'session_ny', ASI: 'session_asi' };

/* ─────────────────────────────────────────────
   MarketSelector component
───────────────────────────────────────────── */
function MarketSelector({ value, onChange }) {
  const [activeCat, setActiveCat] = React.useState('FUTURES');
  const [query, setQuery] = React.useState('');

  const filteredList = React.useMemo(() => {
    if (query.trim()) {
      return Object.values(MARKETS).flat().filter(m =>
        m.toLowerCase().includes(query.toLowerCase())
      );
    }
    return MARKETS[activeCat] || [];
  }, [activeCat, query]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (!q) setActiveCat('FUTURES');
  };

  return (
    <div>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '0 10px', marginBottom: 10,
      }}>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>🔍</span>
        <input
          style={{
            flex: 1, border: 'none', background: 'transparent',
            padding: '9px 0', fontSize: 13, color: 'var(--text)',
            outline: 'none',
          }}
          placeholder="Search symbol..."
          value={query}
          onChange={handleSearch}
        />
        {value && (
          <span style={{
            padding: '2px 8px', borderRadius: 12,
            background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.4)',
            color: '#00e676', fontSize: 12, fontWeight: 700,
          }}>{value}</span>
        )}
      </div>

      {/* Category tabs */}
      {!query && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {Object.keys(MARKETS).map(cat => (
            <button
              key={cat} type="button"
              onClick={() => setActiveCat(cat)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: 'none',
                background: activeCat === cat ? '#00e676' : 'var(--bg3)',
                color: activeCat === cat ? '#080c10' : 'var(--muted)',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Market grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
        gap: 5,
        maxHeight: 180,
        overflowY: 'auto',
        paddingRight: 2,
      }}>
        {filteredList.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: 13 }}>
            No results
          </div>
        ) : filteredList.map(m => (
          <button
            key={m} type="button"
            onClick={() => { onChange(m); }}
            style={{
              padding: '6px 4px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', textAlign: 'center', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              border: value === m ? '1px solid rgba(0,230,118,0.5)' : '1px solid var(--border)',
              background: value === m ? 'rgba(0,230,118,0.12)' : 'var(--bg2)',
              color: value === m ? '#00e676' : 'var(--text)',
              transition: 'all 0.12s',
            }}
            title={m}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Upgrade Modal
───────────────────────────────────────────── */
function UpgradeModal({ onClose }) {
  const { t } = useLang();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#111820',
        border: '1px solid rgba(0,230,118,0.25)',
        borderRadius: 16,
        padding: '36px 32px',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16,
          background: 'none', border: 'none', color: '#5a7a9a',
          fontSize: 20, cursor: 'pointer', lineHeight: 1,
        }}>✕</button>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(0,230,118,0.1)',
          border: '2px solid rgba(0,230,118,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 20px',
        }}>🔒</div>

        {/* Title */}
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e8edf3', marginBottom: 6 }}>
          Free Plan Limit Reached
        </div>
        <div style={{ fontSize: 14, color: '#5a7a9a', marginBottom: 24 }}>
          You have used all {FREE_TRADE_LIMIT} free trades
        </div>

        {/* Features */}
        <div style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 24,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#00e676', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            PRO includes everything:
          </div>
          {[
            'Unlimited trades — no restrictions',
            'Full analytics & performance charts',
            'Advanced statistics & win rate tracking',
            'Screenshot attachments per trade',
            'Multi-device sync',
            'Priority support',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 13, color: '#a8bece' }}>
              <span style={{ color: '#00e676', fontSize: 15 }}>✓</span>
              {f}
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="/pricing"
          style={{
            display: 'block',
            background: 'linear-gradient(135deg,#00e676,#00c853)',
            color: '#080c10',
            fontWeight: 800,
            fontSize: 15,
            borderRadius: 10,
            padding: '14px 0',
            textDecoration: 'none',
            marginBottom: 12,
            letterSpacing: 0.3,
          }}
        >
          {t('upgrade_pro')}
        </a>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#5a7a9a',
          fontSize: 13, cursor: 'pointer', padding: '6px 0',
        }}>
          {t('maybe_later') || 'Maybe later'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AddTrade Page
───────────────────────────────────────────── */
export default function AddTrade() {
  const { t } = useLang();
  const { sub, user } = useAuth();
  const isAdmin    = user?.role === 'admin';
  const isLifetime = isAdmin || sub?.pack === 'lifetime';
  const [tradeCount, setTradeCount] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({
    marcher: '', type_trd: 'buy', point_entree: '', point_sortie: '', montant: '',
    nbr_contrat: 1, qty_type: 'contract mini', status: 'win', type_close: 'Target',
    sessions: 'LON', date_trade: new Date().toISOString().split('T')[0], signal: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [logicWarning, setLogicWarning] = useState(null);
  const fileInputRef = React.useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Load trade count for free plan limit check
  useEffect(() => {
    if (!isLifetime) {
      api.get('/trades?page=1&limit=1').then(r => {
        setTradeCount(r?.data?.total ?? 0);
      }).catch(() => setTradeCount(0));
    }
  }, [isLifetime]);

  const calcPnl = () => {
    const e = parseFloat(form.point_entree), c = parseFloat(form.point_sortie);
    if (isNaN(e) || isNaN(c)) return null;
    const pts = form.type_trd === 'buy' ? c - e : e - c;
    return pts;
  };
  const pts = calcPnl();

  // Check logic consistency: direction vs result vs price movement
  const checkLogic = (formData) => {
    const e = parseFloat(formData.point_entree), c = parseFloat(formData.point_sortie);
    if (isNaN(e) || isNaN(c) || e === 0 || c === 0) return null;
    const priceUp = c > e;
    const isBuy = formData.type_trd === 'buy';
    const isWin = formData.status === 'win';
    // BUY + price up = WIN (logical), BUY + price down = LOSE (logical)
    // SELL + price down = WIN (logical), SELL + price up = LOSE (logical)
    const logicalWin = isBuy ? priceUp : !priceUp;
    if (logicalWin !== isWin) {
      const direction = isBuy ? 'BUY' : 'SELL';
      const priceMove = priceUp ? 'went UP' : 'went DOWN';
      const expected = logicalWin ? 'WIN' : 'LOSE';
      const selected = isWin ? 'WIN' : 'LOSE';
      return `Inconsistent trade: ${direction} trade with price that ${priceMove} should be ${expected}, but you selected ${selected}. Please verify your entry/close prices or change the result.`;
    }
    return null;
  };

  // Recalculate logic warning whenever relevant fields change
  useEffect(() => {
    const w = checkLogic(form);
    setLogicWarning(w);
  // eslint-disable-next-line
  }, [form.type_trd, form.status, form.point_entree, form.point_sortie]);

  async function onSave(e) {
    e.preventDefault();
    setMsg(null);

    // Free plan: max 6 trades — show upgrade modal
    if (!isLifetime && tradeCount !== null && tradeCount >= FREE_TRADE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    if (!form.marcher) { setMsg({ type: 'error', text: 'Select a market' }); return; }
    if (!form.point_entree || !form.point_sortie || !form.montant) {
      setMsg({ type: 'error', text: 'Entry, close and amount are required' }); return;
    }
    // Validate QTY: mini/micro must be integer
    const isIntQty = form.qty_type === 'contract mini' || form.qty_type === 'contract micro';
    if (isIntQty) {
      const qtyVal = parseFloat(form.nbr_contrat);
      if (isNaN(qtyVal) || qtyVal % 1 !== 0 || qtyVal < 1) {
        setMsg({ type: 'error', text: t('qty_integer_only') }); return;
      }
    }
    setLoading(true);
    try {
      const body = { ...form, point_entree: +form.point_entree, point_sortie: +form.point_sortie, montant: +form.montant, nbr_contrat: +form.nbr_contrat };

      if (image) {
        const upRes = await api.uploadFile('/upload', image);
        if (upRes?.success) {
          body.image = upRes.data.url;
          body.image_name = upRes.data.image_name || image.name;
        }
      }

      const res = await api.post('/trades', body);
      if (res?.success) {
        setMsg({ type: 'success', text: '✓ Trade saved!' });
        // Reset form fully including market
        setForm({
          marcher: '', type_trd: 'buy', point_entree: '', point_sortie: '', montant: '',
          nbr_contrat: 1, qty_type: 'contract mini', status: 'win', type_close: 'Target',
          sessions: 'LON', date_trade: new Date().toISOString().split('T')[0], signal: '',
        });
        setImage(null); setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (!isLifetime) setTradeCount(c => (c ?? 0) + 1);
        // Notify other components (Dashboard, Chart) to refresh
        window.dispatchEvent(new CustomEvent('trade-saved'));
      } else if (res?.message === 'FREE_LIMIT_REACHED') {
        setShowUpgrade(true);
      } else {
        setMsg({ type: 'error', text: res?.message || 'Save failed' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error saving trade' });
    }
    setLoading(false);
  }

  function handleImageSelect(e) {
    const f = e.target.files[0];
    if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
    // Reset input value so selecting the same file again works, and prevent re-opening
    e.target.value = '';
  }

  function removeImage() {
    setImage(null); setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div>
      {/* Upgrade modal */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="page-header">
        <div className="page-title">{t('add_trade_title')}</div>
        <div className="page-sub">Record a new trade entry</div>
      </div>
      <form onSubmit={onSave}>
        {/* Free plan limit banner */}
        {!isLifetime && tradeCount !== null && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: tradeCount >= FREE_TRADE_LIMIT ? 'rgba(255,71,87,0.1)' : 'rgba(246,216,96,0.07)',
            border: `1px solid ${tradeCount >= FREE_TRADE_LIMIT ? 'rgba(255,71,87,0.3)' : 'rgba(246,216,96,0.25)'}`,
            color: 'var(--muted)',
          }}>
            <span>
              {tradeCount >= FREE_TRADE_LIMIT
                ? `🔒 ${t('free_limit_reached')} (${FREE_TRADE_LIMIT}/${FREE_TRADE_LIMIT}). ${t('upgrade_pro')}`
                : `⚠️ ${t('free_limit_banner')} ${tradeCount}/${FREE_TRADE_LIMIT} ${t('trades_used')}`}
            </span>
            {tradeCount >= FREE_TRADE_LIMIT && (
              <button type="button" onClick={() => setShowUpgrade(true)}
                style={{ background: 'linear-gradient(135deg,#00e676,#00c853)', color: '#080c10', fontWeight: 800, fontSize: 12, border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', marginLeft: 12, whiteSpace: 'nowrap' }}>
{t('upgrade_pro')}
              </button>
            )}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Left - main form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Market selector */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{t('market')}</div>
                {form.marcher && (
                  <button type="button"
                    onClick={() => set('marcher', '')}
                    style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: 'var(--red)', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    ✕ Reset
                  </button>
                )}
              </div>
              <MarketSelector value={form.marcher} onChange={v => set('marcher', v)} />
            </div>

            {/* Direction & Result */}
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('direction')}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['buy', 'sell'].map(d => (
                      <button key={d} type="button"
                        style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                          background: form.type_trd === d ? (d === 'buy' ? 'var(--green)' : 'var(--red)') : 'var(--bg3)',
                          color: form.type_trd === d ? (d === 'buy' ? '#080c10' : '#fff') : 'var(--muted)' }}
                        onClick={() => set('type_trd', d)}>
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('result')}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['win', 'lose'].map(s => (
                      <button key={s} type="button"
                        style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                          background: form.status === s ? (s === 'win' ? 'var(--green)' : 'var(--red)') : 'var(--bg3)',
                          color: form.status === s ? (s === 'win' ? '#080c10' : '#fff') : 'var(--muted)' }}
                        onClick={() => set('status', s)}>
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Logic warning */}
              {logicWarning && (
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 6, background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.35)', color: '#ffd060', fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Inconsistent Trade Logic</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{logicWarning}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button type="button"
                        onClick={() => {
                          // Auto-correct: flip the status based on price movement
                          const e = parseFloat(form.point_entree), c = parseFloat(form.point_sortie);
                          if (!isNaN(e) && !isNaN(c)) {
                            const priceUp = c > e;
                            const isBuy = form.type_trd === 'buy';
                            set('status', (isBuy ? priceUp : !priceUp) ? 'win' : 'lose');
                          }
                        }}
                        style={{ background: 'rgba(255,180,0,0.2)', border: '1px solid rgba(255,180,0,0.4)', color: '#ffd060', borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                        Auto-correct Result
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Prices */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('prices_amount')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[['Entry Price', 'point_entree'], ['Close Price', 'point_sortie'], ['Amount ($)', 'montant']].map(([label, key]) => (
                  <div key={key} className="form-group">
                    <label className="form-label">{label}</label>
                    <input className="input mono" type="number" step="any" placeholder="0"
                      value={form[key]} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
              </div>
              {pts !== null && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6,
                  background: pts >= 0 ? 'rgba(0,230,118,0.08)' : 'rgba(255,71,87,0.08)',
                  color: pts >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {pts >= 0 ? '+' : ''}{pts.toFixed(2)} pts preview
                </div>
              )}
            </div>

            {/* Details */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('trade_details')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">{t('session')}</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {SESSIONS.map(s => (
                      <button key={s} type="button"
                        className={`btn ${form.sessions === s ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, padding: '6px 4px', fontSize: 12 }}
                        onClick={() => set('sessions', s)}>{t(SESSION_TKEYS[s]) || s}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('close_by')}</label>
                  <select className="select" value={form.type_close} onChange={e => set('type_close', e.target.value)}>
                    {['Target', 'Stop Loss', 'Manual'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="input" type="date" value={form.date_trade} onChange={e => set('date_trade', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Contract
                  </label>
                  <select className="select" value={form.qty_type} onChange={e => {
                    const newType = e.target.value;
                    set('qty_type', newType);
                    // Reset QTY to integer when switching to mini/micro
                    if (newType !== 'Lot') {
                      const current = parseFloat(form.nbr_contrat);
                      if (!isNaN(current) && current % 1 !== 0) {
                        set('nbr_contrat', Math.max(1, Math.round(current)));
                      }
                    }
                  }}>
                    {['contract mini', 'contract micro', 'Lot'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  {(() => {
                    const isIntQty = form.qty_type === 'contract mini' || form.qty_type === 'contract micro';
                    return (
                      <>
                        <label className="form-label">
                          QTY {isIntQty
                            ? <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>(e.g. 1, 2, 3)</span>
                            : <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>(e.g. 0.5, 0.01)</span>}
                        </label>
                        <input
                          className="input mono"
                          type="number"
                          step={isIntQty ? '1' : '0.01'}
                          min="1"
                          inputMode={isIntQty ? 'numeric' : 'decimal'}
                          placeholder={isIntQty ? '1' : '0.01'}
                          value={form.nbr_contrat}
                          onKeyDown={e => {
                            if (isIntQty && (e.key === '.' || e.key === ',')) {
                              e.preventDefault();
                            }
                          }}
                          onChange={e => {
                            let val = e.target.value;
                            if (isIntQty) {
                              // Strip decimals for mini/micro
                              val = val.replace(/[^0-9]/g, '');
                              if (val === '') val = '';
                            }
                            set('nbr_contrat', val);
                          }}
                          onBlur={e => {
                            const isIntQty2 = form.qty_type === 'contract mini' || form.qty_type === 'contract micro';
                            if (isIntQty2) {
                              const n = parseInt(e.target.value, 10);
                              set('nbr_contrat', isNaN(n) ? 1 : Math.max(1, n));
                            }
                          }}
                        />
                        {isIntQty && form.nbr_contrat && String(form.nbr_contrat).includes('.') && (
                          <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>
                            {t('qty_integer_only')}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="form-group">
                  <label className="form-label">Signal</label>
                  <input className="input" placeholder="Optional..." value={form.signal}
                    onChange={e => set('signal', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Right - image + submit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Screenshot</div>
              {preview && (
                <>
                  <img src={preview} alt="preview"
                    onClick={() => window.open(preview, '_blank')}
                    style={{ width: '100%', borderRadius: 6, marginBottom: 10, maxHeight: 200, objectFit: 'cover', cursor: 'zoom-in' }}
                    title="Click to view full size" />
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textAlign: 'center' }}>🔍 Click to view full size</div>
                </>
              )}
              {/* Hidden file input — only one, controlled via ref */}
              <input
                ref={fileInputRef}
                id="img-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />
              <button type="button" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                📷 {image ? image.name : 'Choose image'}
              </button>
              {image && (
                <button type="button" className="btn btn-danger" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                  onClick={removeImage}>✕ Remove</button>
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('summary')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                {[
                  ['Market', form.marcher || '—'],
                  ['Direction', form.type_trd?.toUpperCase()],
                  ['Result', form.status?.toUpperCase()],
                  ['Session', form.sessions],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <button className="btn btn-primary" type="submit"
              disabled={loading}
              style={{ padding: '14px', fontSize: 15, justifyContent: 'center' }}>
              {loading ? 'Saving...' : '💾 Save Trade'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
