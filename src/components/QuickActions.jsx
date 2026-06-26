import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../lang/LangContext';

// One-click command palette (press Ctrl/Cmd+K) + a floating quick-actions button.
// All actions are client-side navigations / shortcuts.

const ST = {
  fab: { position: 'fixed', bottom: 22, right: 88, zIndex: 2147482900, width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer', background: '#161b22', color: '#fff', fontSize: 22, boxShadow: '0 6px 18px rgba(0,0,0,0.4)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 2147483100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' },
  modal: { width: 'min(560px, calc(100vw - 32px))', background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' },
  search: { width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '16px 18px', fontSize: 15, outline: 'none' },
  list: { maxHeight: '50vh', overflowY: 'auto', padding: 8 },
  item: (active) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, cursor: 'pointer', background: active ? 'rgba(0,230,118,0.12)' : 'transparent', color: active ? '#00e676' : '#e8edf3' }),
  icon: { width: 22, textAlign: 'center', fontSize: 16 },
  label: { fontSize: 14, fontWeight: 600 },
  hint: { marginLeft: 'auto', fontSize: 11, opacity: 0.4 },
  empty: { padding: 24, textAlign: 'center', opacity: 0.5, fontSize: 13 },
};

export default function QuickActions() {
  const { user, logout } = useAuth();
  const { setLang, lang } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);

  const isAdmin = user?.role === 'admin';

  const actions = useMemo(() => {
    const go = (path) => () => { navigate(path); setOpen(false); };
    const base = [
      { id: 'add', icon: '\u2795', label: 'New trade', run: go('/add-trade') },
      { id: 'dash', icon: '\u25A6', label: 'Dashboard', run: go('/') },
      { id: 'trades', icon: '\u229F', label: 'My trades', run: go('/trades') },
      { id: 'chart', icon: '\u2197', label: 'Charts', run: go('/chart') },
      { id: 'capital', icon: '\u25CE', label: 'Capital', run: go('/capital') },
      { id: 'withdraw', icon: '\u2193', label: 'Withdraw', run: go('/withdraw') },
      { id: 'messages', icon: '\u2709', label: 'Messages', run: go('/messages') },
      { id: 'help', icon: '?', label: 'Help center', run: go('/help') },
      { id: 'profile', icon: '\u{1F464}', label: 'Profile', run: go('/profile') },
      { id: 'lang', icon: '\u{1F310}', label: 'Switch language (EN/AR/FR)', run: () => { setLang(lang === 'en' ? 'ar' : lang === 'ar' ? 'fr' : 'en'); setOpen(false); } },
      { id: 'logout', icon: '\u23FB', label: 'Log out', run: () => { setOpen(false); logout(); } },
    ];
    if (!isAdmin) base.splice(8, 0, { id: 'myplan', icon: '\u{1F4B3}', label: 'My plan', run: go('/my-plan') });
    if (isAdmin) base.push(
      { id: 'users', icon: '\u229E', label: 'Manage users', run: go('/users') },
      { id: 'subs', icon: '\u{1F4B3}', label: 'Subscriptions', run: go('/subscriptions') },
      { id: 'ahelp', icon: '\u{1F4DD}', label: 'Edit help articles', run: go('/admin/help') },
      { id: 'ranking', icon: '\u{1F3C6}', label: 'Ranking', run: go('/ranking') },
    );
    return base;
  }, [navigate, isAdmin, logout, setLang, lang]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? actions.filter(a => a.label.toLowerCase().includes(term)) : actions;
  }, [q, actions]);

  useEffect(() => { setIdx(0); }, [q, open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setOpen(o => !o); }
      else if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!user) return null;

  function onListKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[idx] && filtered[idx].run(); }
  }

  return (
    <>
      <button style={ST.fab} onClick={() => setOpen(true)} title="Quick actions (Ctrl+K)">{'\u26A1'}</button>
      {open && (
        <div style={ST.overlay} onClick={() => setOpen(false)}>
          <div style={ST.modal} onClick={e => e.stopPropagation()}>
            <input
              autoFocus
              style={ST.search}
              placeholder="Type a command or search...  (Ctrl+K)"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={onListKey}
            />
            <div style={ST.list}>
              {filtered.length === 0 && <div style={ST.empty}>No matching action</div>}
              {filtered.map((a, i) => (
                <div key={a.id} style={ST.item(i === idx)} onMouseEnter={() => setIdx(i)} onClick={a.run}>
                  <span style={ST.icon}>{a.icon}</span>
                  <span style={ST.label}>{a.label}</span>
                  {i === idx && <span style={ST.hint}>{'\u21B5 Enter'}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
