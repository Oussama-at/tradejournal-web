import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';
import { useAuth } from '../context/AuthContext';
import DatePicker from '../components/DatePicker';
import ImageLightbox from '../components/ImageLightbox';


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
  const { t } = useLang();
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
          placeholder={t('search_symbol')}
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
            {t('no_results')}
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
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 16,
          background: 'none', border: 'none', color: '#5a7a9a',
          fontSize: 20, cursor: 'pointer', lineHeight: 1,
        }}>✕</button>

        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(0,230,118,0.1)',
          border: '2px solid rgba(0,230,118,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 20px',
        }}>🔒</div>

        <div style={{ fontSize: 22, fontWeight: 800, color: '#e8edf3', marginBottom: 6 }}>
          {t('free_limit_reached')}
        </div>
        <div style={{ fontSize: 14, color: '#5a7a9a', marginBottom: 24 }}>
          You have used all {FREE_TRADE_LIMIT} free trades
        </div>

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
   Screenshot Section — plain file picker only
   (crop dialog is Profile photo only)
───────────────────────────────────────────── */
function ScreenshotSection({ image, preview, onImageSave, onRemove, t }) {
  const [lightbox, setLightbox] = React.useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    e.target.value = ''; // reset so same file can be re-selected next time
    const localUrl = URL.createObjectURL(f);
    onImageSave(f, localUrl);
  }

  function openPicker() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  return (
    <>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('screenshot')}</div>

        {/* Preview of the chosen/cropped image */}
        {preview && (
          <>
            <img
              src={preview}
              alt="preview"
              onClick={() => setLightbox(true)}
              style={{
                width: '100%', borderRadius: 8, marginBottom: 8,
                maxHeight: 200, objectFit: 'cover', cursor: 'zoom-in',
                border: '1px solid rgba(0,230,118,0.2)',
              }}
              title={t('click_full_size')}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, textAlign: 'center' }}>
              🔍 {t('click_full_size')}
            </div>
          </>
        )}

        {/* Hidden file input — single trigger via ref */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={openPicker}
        >
          {image ? t('change_image') : t('choose_image')}
        </button>

        {image && (
          <button
            type="button"
            className="btn btn-danger"
            style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
            onClick={onRemove}
          >
            {t('remove')}
          </button>
        )}
      </div>
      {lightbox && preview && (
        <ImageLightbox src={preview} name="trade-screenshot" onClose={() => setLightbox(false)} />
      )}
    </>
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
  // Inline qty decimal block message (shown while typing, not just on submit)
  const [qtyBlockMsg, setQtyBlockMsg] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const beHintStyle = { fontSize: 12, marginTop: 6, lineHeight: 1.45 };

  useEffect(() => {
    if (!isLifetime) {
      // Persistent counter: counts how many trades were EVER added on the free plan,
      // independent of capital being deleted/re-added.
      api.get('/trades/free-usage').then(r => {
        setTradeCount(r?.data?.used ?? 0);
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

  const checkLogic = (formData) => {
    const e = parseFloat(formData.point_entree), c = parseFloat(formData.point_sortie);
    if (isNaN(e) || isNaN(c) || e === 0 || c === 0) return null;
    const priceUp = c > e;
    const isBuy = formData.type_trd === 'buy';
    const isWin = formData.status === 'win';
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

  useEffect(() => {
    const w = checkLogic(form);
    setLogicWarning(w);
  // eslint-disable-next-line
  }, [form.type_trd, form.status, form.point_entree, form.point_sortie]);

  // Keep "Close by" consistent with the result:
  //  - A winning trade can never be closed by Stop Loss
  //  - A losing trade can never be closed by Target
  useEffect(() => {
    if (form.status === 'win' && form.type_close === 'Stop Loss') set('type_close', 'Target');
    if (form.status === 'lose' && form.type_close === 'Target') set('type_close', 'Stop Loss');
  // eslint-disable-next-line
  }, [form.status]);

  // Clear qty block message when contract type changes
  useEffect(() => {
    setQtyBlockMsg(null);
  }, [form.qty_type]);

  async function onSave(e) {
    e.preventDefault();
    setMsg(null);

    if (!isLifetime && tradeCount !== null && tradeCount >= FREE_TRADE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    if (!form.marcher) { setMsg({ type: 'error', text: 'Select a market' }); return; }
    if (!form.point_entree || !form.point_sortie || !form.montant) {
      setMsg({ type: 'error', text: 'Entry, close and amount are required' }); return;
    }
    const isIntQty = form.qty_type === 'contract mini' || form.qty_type === 'contract micro';
    if (isIntQty) {
      const qtyVal = parseFloat(form.nbr_contrat);
      if (isNaN(qtyVal) || qtyVal % 1 !== 0 || qtyVal < 1) {
        setMsg({ type: 'error', text: t('qty_integer_only') }); return;
      }
    }
    setLoading(true);
    try {
      const body = {
        ...form,
        point_entree: +form.point_entree,
        point_sortie: +form.point_sortie,
        montant: +form.montant,
        nbr_contrat: +form.nbr_contrat,
      };

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
        setForm({
          marcher: '', type_trd: 'buy', point_entree: '', point_sortie: '', montant: '',
          nbr_contrat: 1, qty_type: 'contract mini', status: 'win', type_close: 'Target',
          sessions: 'LON', date_trade: new Date().toISOString().split('T')[0], signal: '',
        });
        // Revoke old preview URL and clear image state
        if (preview) URL.revokeObjectURL(preview);
        setImage(null);
        setPreview(null);
        if (!isLifetime) setTradeCount(c => (c ?? 0) + 1);
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

  // Called from ScreenshotSection after crop dialog saves
  function handleImageSave(file, localUrl) {
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(localUrl);
  }

  function removeImage() {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview(null);
  }

  const isIntQty = form.qty_type === 'contract mini' || form.qty_type === 'contract micro';

  return (
    <div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div className="page-header">
        <div className="page-title">{t('add_trade_title')}</div>
        <div className="page-sub">{t('add_trade_sub')}</div>
      </div>
      <form onSubmit={onSave}>
        {/* Free plan limit banner */}
        {!isLifetime && tradeCount !== null && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: tradeCount >= FREE_TRADE_LIMIT ? 'rgba(255,71,87,0.1)' : 'rgba(246,216,96,0.07)',
            border: `1px solid ${tradeCount >= FREE_TRADE_LIMIT ? 'rgba(255,71,87,0.3)' : 'rgba(246,216,96,0.25)'}`,
            color: 'var(--muted)',
          }}>
            <span>
              {tradeCount >= FREE_TRADE_LIMIT
                ? `🔒 ${t('free_limit_reached')} (${FREE_TRADE_LIMIT}/${FREE_TRADE_LIMIT}). ${t('upgrade_pro')}`
                : (FREE_TRADE_LIMIT - tradeCount === 1)
                  ? `⚠️ ${t('free_last_trade')} (${tradeCount}/${FREE_TRADE_LIMIT}). ${t('upgrade_pro')}`
                  : `⚠️ ${t('free_limit_banner')} ${tradeCount}/${FREE_TRADE_LIMIT} ${t('trades_used')}`}
            </span>
            {(tradeCount >= FREE_TRADE_LIMIT || FREE_TRADE_LIMIT - tradeCount === 1) && (
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
                    {t('clear')}
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
                        {t(d)?.toUpperCase()}
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
                        {t(s)?.toUpperCase()}
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
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('inconsistent_logic')}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{logicWarning}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button type="button"
                        onClick={() => {
                          const e = parseFloat(form.point_entree), c = parseFloat(form.point_sortie);
                          if (!isNaN(e) && !isNaN(c)) {
                            const priceUp = c > e;
                            const isBuy = form.type_trd === 'buy';
                            set('status', (isBuy ? priceUp : !priceUp) ? 'win' : 'lose');
                          }
                        }}
                        style={{ background: 'rgba(255,180,0,0.2)', border: '1px solid rgba(255,180,0,0.4)', color: '#ffd060', borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                        {t('auto_correct')}
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
                {[[t('entry_price'), 'point_entree'], [t('close_price'), 'point_sortie'], [t('amount'), 'montant']].map(([label, key]) => (
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
                  {pts >= 0 ? '+' : ''}{pts.toFixed(2)} {t('pts_preview')}
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
                    {['Target', 'Stop Loss', 'Break Even', 'Manual'].map(o => {
                      const disabled = (form.status === 'win' && o === 'Stop Loss')
                        || (form.status === 'lose' && o === 'Target');
                      return (
                        <option key={o} value={o} disabled={disabled}>
                          {({Target:t('target'),'Stop Loss':t('stop_loss'),'Break Even':t('break_even'),Manual:t('manual')})[o] || o}{disabled ? ' — ' + t('not_applicable') : ''}
                        </option>
                      );
                    })}
                  </select>
                  {form.type_close === 'Break Even' && (
                    <div className="muted" style={beHintStyle}>
                      🛡️ {t('break_even_hint')}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('date')}</label>
                  <DatePicker value={form.date_trade} onChange={v => set('date_trade', v)} placeholder={t('select_trade_date')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('contract')}</label>
                  <select className="select" value={form.qty_type} onChange={e => {
                    const newType = e.target.value;
                    set('qty_type', newType);
                    setQtyBlockMsg(null);
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

                {/* QTY field — integer-only for mini/micro */}
                <div className="form-group">
                  <label className="form-label">
                    {t('qty')}{' '}
                    {isIntQty
                      ? <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{t('qty_hint_int')}</span>
                      : <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>{t('qty_hint_dec')}</span>
                    }
                  </label>
                  <input
                    className="input mono"
                    type={isIntQty ? 'text' : 'number'}
                    inputMode={isIntQty ? 'numeric' : 'decimal'}
                    step={isIntQty ? undefined : '0.01'}
                    min="1"
                    placeholder={isIntQty ? '1' : '0.01'}
                    value={form.nbr_contrat}
                    style={{
                      borderColor: qtyBlockMsg ? 'rgba(255,71,87,0.6)' : undefined,
                      outline: qtyBlockMsg ? '1px solid rgba(255,71,87,0.4)' : undefined,
                    }}
                    onKeyDown={e => {
                      if (!isIntQty) return;
                      // Block decimal separators before they appear
                      if (e.key === '.' || e.key === ',') {
                        e.preventDefault();
                        setQtyBlockMsg(t('qty_decimal_blocked'));
                        // Auto-clear message after 3s
                        setTimeout(() => setQtyBlockMsg(null), 3000);
                      }
                    }}
                    onChange={e => {
                      let val = e.target.value;
                      if (isIntQty) {
                        // Strip any non-digit characters (handles paste)
                        const stripped = val.replace(/[^0-9]/g, '');
                        if (stripped !== val) {
                          setQtyBlockMsg(t('qty_decimal_blocked'));
                          setTimeout(() => setQtyBlockMsg(null), 3000);
                        }
                        val = stripped;
                      }
                      set('nbr_contrat', val);
                    }}
                    onBlur={e => {
                      if (isIntQty) {
                        const n = parseInt(e.target.value, 10);
                        set('nbr_contrat', isNaN(n) ? 1 : Math.max(1, n));
                        setQtyBlockMsg(null);
                      }
                    }}
                  />
                  {/* Inline decimal-blocked warning */}
                  {isIntQty && qtyBlockMsg && (
                    <div style={{
                      marginTop: 6,
                      padding: '7px 10px',
                      borderRadius: 6,
                      background: 'rgba(255,71,87,0.08)',
                      border: '1px solid rgba(255,71,87,0.35)',
                      color: '#ff4757',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}>🚫</span>
                      <span>{qtyBlockMsg}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{t('signal')}</label>
                  <input className="input" placeholder={t('signal_placeholder')} value={form.signal}
                    onChange={e => set('signal', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Right - screenshot + submit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Screenshot with crop dialog */}
            <ScreenshotSection
              image={image}
              preview={preview}
              onImageSave={handleImageSave}
              onRemove={removeImage}
              t={t}
            />

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>{t('summary')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                {[
                  [t('market'), form.marcher || '—'],
                  [t('direction'), form.type_trd ? t(form.type_trd) : '—'],
                  [t('result'), form.status ? t(form.status) : '—'],
                  [t('session'), t(SESSION_TKEYS[form.sessions]) || form.sessions],
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
              {loading ? t('saving') : t('save_trade')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
