import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * OnboardingGuide - professional floating "Getting Started" checklist.
 *
 * Shows new (non-admin) users the 4 steps to set up their account:
 *   1. Change password   2. Set security questions   3. Add capital   4. Add first trade
 *
 * Completion is detected from real data (security questions / capital / trades) plus a
 * localStorage flag for the password change (set by the Password page on success).
 * Once all steps are done the user can hide the guide permanently.
 */

function pwDoneKey(u) {
  return 'tj_onboard_pw_' + (u || '');
}
function dismissKey(u) {
  return 'tj_onboard_done_' + (u || '');
}

export default function OnboardingGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const username = user && user.username;
  const isAdmin = user && user.role === 'admin';

  const [steps, setSteps] = useState({ pw: false, sq: false, cap: false, trade: false });
  const [open, setOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    if (!username || isAdmin) return;
    const pw = localStorage.getItem(pwDoneKey(username)) === '1';
    let sq = false,
      cap = false,
      trade = false;
    try {
      const sqRes = await api.get('/secret-questions/' + encodeURIComponent(username));
      sq = !!(sqRes && sqRes.success && sqRes.data && sqRes.data.question_1 && sqRes.data.question_2);
    } catch (e) {
      /* ignore */
    }
    try {
      const capRes = await api.get('/capital/current');
      const d = capRes && capRes.data;
      cap = !!(d && Number(d.capital_depart) > 0);
    } catch (e) {
      /* ignore */
    }
    try {
      const trRes = await api.get('/trades');
      const list = Array.isArray(trRes && trRes.data)
        ? trRes.data
        : (trRes && trRes.data && trRes.data.trades) || [];
      trade = list.length > 0;
    } catch (e) {
      /* ignore */
    }
    setSteps({ pw, sq, cap, trade });
    setLoaded(true);
  }, [username, isAdmin]);

  useEffect(() => {
    check();
  }, [check, location.pathname]);

  useEffect(() => {
    const h = () => check();
    window.addEventListener('focus', h);
    window.addEventListener('onboard-refresh', h);
    return () => {
      window.removeEventListener('focus', h);
      window.removeEventListener('onboard-refresh', h);
    };
  }, [check]);

  useEffect(() => {
    if (username) setDismissed(localStorage.getItem(dismissKey(username)) === '1');
  }, [username]);

  if (!username || isAdmin || !loaded || dismissed) return null;

  const items = [
    { key: 'pw', n: 1, title: 'Secure your password', desc: 'Set your own private password', to: '/password', cta: 'Change' },
    { key: 'sq', n: 2, title: 'Set security questions', desc: 'Used to recover your account', to: '/profile?setup_security=1', cta: 'Set' },
    { key: 'cap', n: 3, title: 'Add your capital', desc: 'Enter your starting balance', to: '/capital', cta: 'Add' },
    { key: 'trade', n: 4, title: 'Log your first trade', desc: 'Start tracking your performance', to: '/add-trade', cta: 'Add' },
  ];
  const doneCount = items.filter((i) => steps[i.key]).length;
  const allDone = doneCount === items.length;
  const pct = (doneCount / items.length) * 100;
  const barFillStyle = Object.assign({}, S.barFill, { width: pct + '%' });

  function dismiss() {
    localStorage.setItem(dismissKey(username), '1');
    setDismissed(true);
  }

  if (!open) {
    return (
      <button style={S.pill} onClick={() => setOpen(true)}>
        🚀 Setup {doneCount}/{items.length}
      </button>
    );
  }

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div style={S.headTitle}>🚀 Getting Started</div>
        <button style={S.iconBtn} onClick={() => setOpen(false)} title="Minimize">
          –
        </button>
      </div>
      <div style={S.sub}>
        {allDone
          ? 'You are all set - happy trading! 🎉'
          : 'Complete these ' + items.length + ' steps to set up your account'}
      </div>
      <div style={S.barTrack}>
        <div style={barFillStyle} />
      </div>

      <div style={S.list}>
        {items.map((it) => {
          const done = steps[it.key];
          return (
            <div key={it.key} style={S.row}>
              <div style={done ? S.dotDone : S.dot}>{done ? '✓' : it.n}</div>
              <div style={S.rowMain}>
                <div style={done ? S.rowTitleDone : S.rowTitle}>{it.title}</div>
                <div style={S.rowDesc}>{it.desc}</div>
              </div>
              {done ? (
                <span style={S.doneTag}>Done</span>
              ) : (
                <button style={S.goBtn} onClick={() => navigate(it.to)}>
                  {it.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {allDone && (
        <button style={S.finishBtn} onClick={dismiss}>
          Finish &amp; hide guide
        </button>
      )}
    </div>
  );
}

const S = {
  card: { position: 'fixed', right: 20, bottom: 96, width: 340, maxWidth: 'calc(100vw - 40px)', background: '#11181f', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 14, padding: 16, zIndex: 1200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', color: '#e8edf3' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headTitle: { fontSize: 15, fontWeight: 700 },
  iconBtn: { background: 'transparent', border: 'none', color: '#7a8a9a', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0 },
  sub: { fontSize: 12, color: '#7a8a9a', marginTop: 2, marginBottom: 10 },
  barTrack: { height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 },
  barFill: { height: '100%', background: '#00e676', transition: 'width 0.4s ease' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' },
  dot: { width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,230,118,0.12)', color: '#00e676', border: '1px solid rgba(0,230,118,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  dotDone: { width: 24, height: 24, borderRadius: '50%', background: '#00e676', color: '#06210f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 },
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 13, fontWeight: 600, color: '#e8edf3' },
  rowTitleDone: { fontSize: 13, fontWeight: 600, color: '#7a8a9a', textDecoration: 'line-through' },
  rowDesc: { fontSize: 11, color: '#7a8a9a' },
  goBtn: { background: '#00e676', color: '#06210f', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  doneTag: { fontSize: 11, color: '#00e676', fontWeight: 700, flexShrink: 0 },
  finishBtn: { marginTop: 12, width: '100%', background: 'transparent', border: '1px solid rgba(0,230,118,0.4)', color: '#00e676', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  pill: { position: 'fixed', right: 20, bottom: 96, background: '#11181f', border: '1px solid rgba(0,230,118,0.4)', color: '#00e676', borderRadius: 22, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', zIndex: 1200, boxShadow: '0 8px 24px rgba(0,0,0,0.45)' },
};
