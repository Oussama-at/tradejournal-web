import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FREE_TRADE_LIMIT = 5;

const MARKETS = { 'Indices': ['NAS100','US30','SP500','UK100','GER40'], 'Forex': ['EURUSD','GBPUSD','USDJPY','AUDUSD'], 'Commodities': ['XAUUSD','XAGUSD','USOIL'] };
const SESSIONS = ['LON', 'NY', 'ASI'];

export default function AddTrade() {
  const { sub } = useAuth();
  const isLifetime = sub?.plan === 'lifetime';
  const [tradeCount, setTradeCount] = useState(null);
  const [form, setForm] = useState({
    marcher: '', type_trd: 'buy', point_entree: '', point_sortie: '', montant: '',
    nbr_contrat: 1, qty_type: 'contract mini', status: 'win', type_close: 'Target',
    sessions: 'LON', date_trade: new Date().toISOString().split('T')[0], signal: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

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

  async function onSave(e) {
    e.preventDefault();
    setMsg(null);
    // Free plan: max 5 trades
    if (!isLifetime && tradeCount !== null && tradeCount >= FREE_TRADE_LIMIT) {
      setMsg({ type: 'error', text: `Pack gratuit limité à ${FREE_TRADE_LIMIT} trades. Passez au pack Lifetime pour des trades illimités.` });
      return;
    }
    if (!form.marcher) { setMsg({ type: 'error', text: 'Select a market' }); return; }
    if (!form.point_entree || !form.point_sortie || !form.montant) {
      setMsg({ type: 'error', text: 'Entry, close and amount are required' }); return;
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
        setForm(f => ({ ...f, point_entree: '', point_sortie: '', montant: '', signal: '' }));
        setImage(null); setPreview(null);
        if (!isLifetime) setTradeCount(c => (c ?? 0) + 1);
      } else {
        setMsg({ type: 'error', text: res?.message || 'Save failed' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error saving trade' });
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Add Trade</div>
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
                ? `🔒 Limite du pack gratuit atteinte (${FREE_TRADE_LIMIT}/${FREE_TRADE_LIMIT} trades). Passez au pack Lifetime pour continuer.`
                : `⚠️ Pack gratuit : ${tradeCount}/${FREE_TRADE_LIMIT} trades utilisés`}
            </span>
            {tradeCount >= FREE_TRADE_LIMIT && (
              <a href="/pricing" style={{ color: 'var(--gold)', fontWeight: 700, marginLeft: 12, whiteSpace: 'nowrap' }}>
                Passer Lifetime →
              </a>
            )}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Left - main form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Market selector */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Market</div>
              <input className="input" placeholder="Type or select market..." value={form.marcher}
                onChange={e => set('marcher', e.target.value)} style={{ marginBottom: 12 }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(MARKETS).map(([cat, mkts]) => [
                  <div key={cat} style={{ width: '100%', fontSize: 11, color: 'var(--dim)', fontWeight: 700, marginTop: 4, textTransform: 'uppercase' }}>{cat}</div>,
                  ...mkts.map(m => (
                    <button key={m} type="button"
                      className={`btn ${form.marcher === m ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => set('marcher', m)}>
                      {m}
                    </button>
                  ))
                ])}
              </div>
            </div>

            {/* Direction & Result */}
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Direction</div>
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
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Result</div>
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
            </div>

            {/* Prices */}
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Prices & Amount</div>
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
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Trade Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Session</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {SESSIONS.map(s => (
                      <button key={s} type="button"
                        className={`btn ${form.sessions === s ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1, padding: '6px 4px', fontSize: 12 }}
                        onClick={() => set('sessions', s)}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Close By</label>
                  <select className="select" value={form.type_close} onChange={e => set('type_close', e.target.value)}>
                    {['Target', 'Stop Loss', 'Manual'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="input" type="date" value={form.date_trade} onChange={e => set('date_trade', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contract</label>
                  <select className="select" value={form.qty_type} onChange={e => set('qty_type', e.target.value)}>
                    {['contract mini', 'contract micro', 'Lot'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">QTY</label>
                  <input className="input mono" type="number" step="any" value={form.nbr_contrat}
                    onChange={e => set('nbr_contrat', e.target.value)} />
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
                <img src={preview} alt="preview"
                  style={{ width: '100%', borderRadius: 6, marginBottom: 10, maxHeight: 200, objectFit: 'cover' }} />
              )}
              <label style={{ display: 'block', cursor: 'pointer' }}>
                <div className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => document.getElementById('img-input').click()}>
                  📷 {image ? image.name : 'Choose image'}
                </div>
                <input id="img-input" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setImage(f); setPreview(URL.createObjectURL(f)); }
                  }} />
              </label>
              {image && (
                <button type="button" className="btn btn-danger" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                  onClick={() => { setImage(null); setPreview(null); }}>✕ Remove</button>
              )}
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Summary</div>
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
            <button className="btn btn-primary" type="submit" disabled={loading || (!isLifetime && tradeCount !== null && tradeCount >= FREE_TRADE_LIMIT)}
              style={{ padding: '14px', fontSize: 15, justifyContent: 'center' }}>
              {loading ? 'Saving...' : '💾 Save Trade'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
