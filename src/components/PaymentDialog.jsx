import React, { useState } from 'react';
import api from '../services/api';

/*
 * Customer-facing checkout. Lets a logged-in user pick a pack, choose a
 * currency, and pay by being redirected to PayPal.me or to a real crypto
 * wallet address. After paying they confirm via WhatsApp / email and an
 * in-app admin notification (reuses the existing /request-activation hook).
 */

const PAYPAL_ME = 'https://paypal.me/Atouchi';
const WHATSAPP = '212635925986';
const SUPPORT_EMAIL = 'ousssatt@gmail.com';

// Base prices are in USD. Lifetime has a promo price (was 100, now 70).
const PACKS = [
  { key: '6months',  label: '6 Months', icon: '📅', usd: 20,  features: ['All trading tools', 'P&L charts', 'Capital tracking'] },
  { key: '1year',    label: '1 Year',   icon: '🗓️', usd: 50,  badge: 'Best value', features: ['Everything in 6 Months', 'Priority support', 'Save vs 6-month'] },
  { key: 'lifetime', label: 'Lifetime', icon: '👑', usd: 100, promoUsd: 70, badge: '-30% promo', features: ['Never expires', 'All future features', 'VIP support'] },
];

// Display currencies. rate = multiplier from the USD base price.
const CURRENCIES = [
  { code: 'MAD', rate: 10,   fmt: a => `${a} MAD` },
  { code: 'EUR', rate: 0.92, fmt: a => `€${a}` },
  { code: 'USD', rate: 1,    fmt: a => `$${a}` },
];

const CRYPTO_COINS = [
  { key: 'btc',  label: 'Bitcoin',  store: 'BTC',          network: 'Bitcoin network',  icon: '₿', address: '153R4TXbRmNDaymXM5ySmjF7hmWqbTu5fB', note: 'Send only BTC on the Bitcoin network.' },
  { key: 'usdt', label: 'USDT',     store: 'USDT (TRC20)', network: 'TRC20 (Tron)',     icon: '₮', address: 'TShrmLSuNgdKiLgCur492aW3Z5akyUxQx8', note: 'TRC20 network ONLY — another network will lose the funds.' },
  { key: 'eth',  label: 'Ethereum', store: 'ETH',          network: 'Ethereum (ERC20)', icon: 'Ξ', address: '0xb9b2e0b9d8f9cbb786730cf933043ed9f0da7f74', note: 'Ethereum mainnet (ERC20) only.' },
];

const S = {
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' },
  modal:      { width: '100%', maxWidth: 580, margin: 'auto', background: '#11181f', border: '1px solid #1e2a36', borderRadius: 16, padding: 24, color: '#e8edf3', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  header:     { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  title:      { fontSize: 20, fontWeight: 800 },
  sub:        { fontSize: 12, color: '#7a8a9a', marginTop: 2 },
  close:      { background: 'transparent', border: 'none', color: '#7a8a9a', fontSize: 24, lineHeight: 1, cursor: 'pointer' },
  curRow:     { display: 'flex', gap: 6, marginBottom: 16 },
  curBtn:     { padding: '6px 12px', borderRadius: 999, border: '1px solid #1e2a36', background: '#0d1117', color: '#9fb0c0', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  curBtnOn:   { padding: '6px 12px', borderRadius: 999, border: '1px solid #00e676', background: 'rgba(0,230,118,0.12)', color: '#00e676', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  packGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 },
  packCard:   { padding: 14, borderRadius: 12, border: '1px solid #1e2a36', background: '#0d1117', cursor: 'pointer', position: 'relative' },
  packCardOn: { padding: 14, borderRadius: 12, border: '2px solid #00e676', background: 'rgba(0,230,118,0.08)', cursor: 'pointer', position: 'relative' },
  packIcon:   { fontSize: 24 },
  packLabel:  { fontWeight: 700, marginTop: 4, fontSize: 15 },
  price:      { fontSize: 20, fontWeight: 800, color: '#00e676', marginTop: 6 },
  priceOld:   { textDecoration: 'line-through', color: '#7a8a9a', fontSize: 13, marginLeft: 6, fontWeight: 600 },
  badge:      { display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 999, background: 'rgba(240,180,41,0.15)', color: '#f0b429', fontSize: 11, fontWeight: 700 },
  featList:   { listStyle: 'none', padding: 0, margin: '10px 0 0', fontSize: 12, color: '#9fb0c0' },
  featItem:   { marginTop: 4 },
  sectionTitle: { fontWeight: 700, fontSize: 14, margin: '6px 0 10px' },
  methodRow:  { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  methodBtn:  { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, border: '1px solid #1e2a36', background: '#0d1117', color: '#e8edf3', cursor: 'pointer', fontWeight: 700, fontSize: 14, flex: 1, justifyContent: 'center' },
  methodBtnOn:{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, border: '1px solid #00e676', background: 'rgba(0,230,118,0.12)', color: '#00e676', cursor: 'pointer', fontWeight: 700, fontSize: 14, flex: 1, justifyContent: 'center' },
  box:        { marginTop: 14, padding: 16, borderRadius: 12, background: '#0d1117', border: '1px solid #1e2a36' },
  head:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconBox:    { fontSize: 20, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: '#11181f', border: '1px solid #1e2a36', color: '#00e676', flex: '0 0 auto' },
  hTitle:     { fontWeight: 700, color: '#e8edf3', fontSize: 14, lineHeight: 1.2 },
  net:        { fontSize: 11, color: '#7a8a9a', marginTop: 2 },
  coinRow:    { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  coinBtn:    { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, border: '1px solid #1e2a36', background: '#11181f', color: '#e8edf3', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  coinBtnOn:  { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, border: '1px solid #00e676', background: 'rgba(0,230,118,0.12)', color: '#00e676', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
  addrRow:    { display: 'flex', alignItems: 'center', gap: 8 },
  addr:       { flex: 1, fontFamily: 'monospace', fontSize: 13, color: '#00e676', wordBreak: 'break-all', background: '#11181f', border: '1px solid #1e2a36', borderRadius: 8, padding: '10px 12px' },
  copyBtn:    { whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: 8, border: '1px solid #00e676', background: 'transparent', color: '#00e676', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  note:       { marginTop: 12, fontSize: 12, color: '#f0b429', lineHeight: 1.5 },
  amountLine: { fontSize: 14, color: '#e8edf3', marginBottom: 10 },
  amountBig:  { fontWeight: 800, color: '#00e676' },
  payBtn:     { display: 'block', width: '100%', marginTop: 4, padding: '14px 18px', borderRadius: 10, border: 'none', background: '#0070ba', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 15, textAlign: 'center' },
  divider:    { height: 1, background: '#1e2a36', margin: '18px 0' },
  confirmTitle: { fontWeight: 700, fontSize: 13, marginBottom: 8 },
  confirmBtns: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  waBtn:      { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: '#25d366', color: '#04220f', textDecoration: 'none', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' },
  mailBtn:    { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#e8edf3', textDecoration: 'none', fontWeight: 700, fontSize: 13, border: '1px solid #1e2a36', cursor: 'pointer' },
  notifyBtn:  { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: 'transparent', color: '#00e676', fontWeight: 700, fontSize: 13, border: '1px solid #00e676', cursor: 'pointer' },
  okMsg:      { marginTop: 10, fontSize: 13, color: '#00e676', fontWeight: 600 },
  hint:       { fontSize: 12, color: '#7a8a9a', marginTop: 10, lineHeight: 1.5 },
};

function priceUSD(pack) { return pack.promoUsd != null ? pack.promoUsd : pack.usd; }
function convert(usd, cur) {
  const v = usd * cur.rate;
  return cur.code === 'MAD' ? Math.round(v) : Math.round(v * 100) / 100;
}

export default function PaymentDialog({ open, onClose }) {
  const [curCode, setCurCode]   = useState('MAD');
  const [packKey, setPackKey]   = useState('1year');
  const [method, setMethod]     = useState('');
  const [coin, setCoin]         = useState('btc');
  const [copied, setCopied]     = useState('');
  const [notified, setNotified] = useState(false);

  if (!open) return null;

  const cur     = CURRENCIES.find(c => c.code === curCode);
  const pack    = PACKS.find(p => p.key === packKey);
  const usd     = priceUSD(pack);
  const shown   = cur.fmt(convert(usd, cur));
  const oldShown = pack.promoUsd != null ? cur.fmt(convert(pack.usd, cur)) : null;
  const coinSel = CRYPTO_COINS.find(c => c.key === coin);
  const username = (typeof localStorage !== 'undefined' && localStorage.getItem('username')) || '';

  function copy(txt, tag) {
    try { navigator.clipboard.writeText(txt); } catch (e) {}
    setCopied(tag);
    setTimeout(() => setCopied(''), 1500);
  }

  function payPaypal() {
    // PayPal.me needs a PayPal-supported currency, so always charge the USD price.
    window.open(`${PAYPAL_ME}/${usd}USD`, '_blank', 'noopener');
  }

  const methodLabel = method === 'paypal' ? 'PayPal' : (method === 'crypto' ? `crypto (${coinSel.store})` : 'the selected method');
  const proofMsg = `Hello, I want the ${pack.label} pack (${shown}). My username is ${username || '(my username)'}. I paid via ${methodLabel}. Here is my payment proof:`;
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(proofMsg)}`;
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Payment proof — ' + pack.label)}&body=${encodeURIComponent(proofMsg)}`;

  async function notifyAdmin() {
    try {
      let device_id = localStorage.getItem('device_id');
      if (!device_id) {
        device_id = 'web-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
        localStorage.setItem('device_id', device_id);
      }
      await api.post('/request-activation', { device_id, user_name: username });
    } catch (e) { /* best effort */ }
    setNotified(true);
    setTimeout(() => setNotified(false), 4000);
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <div style={S.title}>🚀 Upgrade your plan</div>
            <div style={S.sub}>Pick a pack, then pay by PayPal or crypto.</div>
          </div>
          <button type="button" style={S.close} onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Currency switch */}
        <div style={S.curRow}>
          {CURRENCIES.map(c => (
            <button key={c.code} type="button"
              style={curCode === c.code ? S.curBtnOn : S.curBtn}
              onClick={() => setCurCode(c.code)}>
              {c.code}
            </button>
          ))}
        </div>

        {/* Pack cards */}
        <div style={S.packGrid}>
          {PACKS.map(p => {
            const pUsd = priceUSD(p);
            const pShown = cur.fmt(convert(pUsd, cur));
            const pOld = p.promoUsd != null ? cur.fmt(convert(p.usd, cur)) : null;
            return (
              <div key={p.key} style={packKey === p.key ? S.packCardOn : S.packCard}
                onClick={() => setPackKey(p.key)}>
                <div style={S.packIcon}>{p.icon}</div>
                <div style={S.packLabel}>{p.label}</div>
                <div style={S.price}>{pShown}{pOld && <span style={S.priceOld}>{pOld}</span>}</div>
                {p.badge && <div style={S.badge}>{p.badge}</div>}
                <ul style={S.featList}>
                  {p.features.map(f => (<li key={f} style={S.featItem}>✓ {f}</li>))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Payment method */}
        <div style={S.sectionTitle}>Choose how to pay {pack.label} · <span style={S.amountBig}>{shown}</span>{oldShown && <span style={S.priceOld}>{oldShown}</span>}</div>
        <div style={S.methodRow}>
          <button type="button" style={method === 'paypal' ? S.methodBtnOn : S.methodBtn} onClick={() => setMethod('paypal')}>🅿 PayPal</button>
          <button type="button" style={method === 'crypto' ? S.methodBtnOn : S.methodBtn} onClick={() => setMethod('crypto')}>🪙 Crypto</button>
        </div>

        {/* PayPal panel */}
        {method === 'paypal' && (
          <div style={S.box}>
            <div style={S.head}>
              <div style={S.iconBox}>🅿</div>
              <div>
                <div style={S.hTitle}>Pay with PayPal</div>
                <div style={S.net}>You will be redirected to paypal.me/Atouchi</div>
              </div>
            </div>
            <div style={S.amountLine}>Amount: <span style={S.amountBig}>${usd} USD</span> {curCode !== 'USD' && <span style={S.net}>(≈ {shown})</span>}</div>
            <button type="button" style={S.payBtn} onClick={payPaypal}>Pay ${usd} on PayPal →</button>
            <div style={S.hint}>PayPal is charged in USD. After paying, send your proof below so we can activate your pack.</div>
          </div>
        )}

        {/* Crypto panel */}
        {method === 'crypto' && (
          <div style={S.box}>
            <div style={S.coinRow}>
              {CRYPTO_COINS.map(c => (
                <button key={c.key} type="button"
                  style={coin === c.key ? S.coinBtnOn : S.coinBtn}
                  onClick={() => setCoin(c.key)}>
                  <span>{c.icon}</span>{c.label} · {c.store}
                </button>
              ))}
            </div>
            <div style={S.head}>
              <div style={S.iconBox}>{coinSel.icon}</div>
              <div>
                <div style={S.hTitle}>{coinSel.label} ({coinSel.store})</div>
                <div style={S.net}>{coinSel.network} · deposit address</div>
              </div>
            </div>
            <div style={S.amountLine}>Send the equivalent of <span style={S.amountBig}>{shown}</span> (≈ ${usd} USD) to:</div>
            <div style={S.addrRow}>
              <code style={S.addr}>{coinSel.address}</code>
              <button type="button" style={S.copyBtn} onClick={() => copy(coinSel.address, 'addr')}>
                {copied === 'addr' ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <div style={S.note}>⚠️ {coinSel.note}</div>
          </div>
        )}

        {/* Confirmation */}
        {method && (
          <>
            <div style={S.divider} />
            <div style={S.confirmTitle}>After paying, confirm so we can activate your pack:</div>
            <div style={S.confirmBtns}>
              <a style={S.waBtn} href={waHref} target="_blank" rel="noopener noreferrer">💬 WhatsApp proof</a>
              <a style={S.mailBtn} href={mailHref}>✉️ Email proof</a>
              <button type="button" style={S.notifyBtn} onClick={notifyAdmin}>🔔 Notify admin in app</button>
            </div>
            {notified && <div style={S.okMsg}>✓ Admin notified. We will activate your {pack.label} pack once payment is confirmed.</div>}
            <div style={S.hint}>Your account is activated manually after we confirm the payment.</div>
          </>
        )}
      </div>
    </div>
  );
}
