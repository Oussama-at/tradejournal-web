import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Messages hub:
//  - Support: user <-> admin. Users see one thread with support; admins see an inbox of all users.
//  - Direct: user <-> user private messages.

const ST = {
  wrap: { maxWidth: 940, margin: '0 auto', padding: '20px 16px' },
  h1: { fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 14px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: (active) => ({ padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, border: '1px solid ' + (active ? '#00e676' : 'rgba(255,255,255,0.12)'), background: active ? 'rgba(0,230,118,0.12)' : 'transparent', color: active ? '#00e676' : '#cdd6e0' }),
  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' },
  side: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8, maxHeight: '64vh', overflowY: 'auto' },
  convo: (active) => ({ padding: '10px 12px', borderRadius: 9, cursor: 'pointer', marginBottom: 5, background: active ? 'rgba(0,230,118,0.12)' : 'transparent', color: active ? '#00e676' : '#e8edf3' }),
  convoName: { fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 },
  convoLast: { fontSize: 12, opacity: 0.55, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badge: { background: '#00e676', color: '#06210f', borderRadius: 10, fontSize: 11, fontWeight: 800, padding: '1px 7px' },
  panel: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: '64vh' },
  thread: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 9 },
  mine: { alignSelf: 'flex-end', maxWidth: '78%', background: 'linear-gradient(135deg,#00e676,#00b45f)', color: '#06210f', padding: '9px 12px', borderRadius: '14px 14px 4px 14px', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  theirs: { alignSelf: 'flex-start', maxWidth: '78%', background: 'rgba(255,255,255,0.06)', color: '#e8edf3', padding: '9px 12px', borderRadius: '14px 14px 14px 4px', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.07)' },
  time: { fontSize: 10, opacity: 0.5, marginTop: 3 },
  composer: { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' },
  input: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 14, resize: 'none', fontFamily: 'inherit', outline: 'none' },
  send: { background: '#00e676', color: '#06210f', border: 'none', borderRadius: 10, padding: '0 18px', fontWeight: 800, cursor: 'pointer' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, fontSize: 14, textAlign: 'center', padding: 20 },
  search: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '9px 11px', fontSize: 13, marginBottom: 8, outline: 'none' },
  found: { padding: '8px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, color: '#e8edf3' },
  mini: { padding: 14, opacity: 0.5, fontSize: 13 },
};

function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Thread({ messages, isMine, emptyText }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages]);
  if (!messages || messages.length === 0) return <div style={ST.empty}>{emptyText}</div>;
  return (
    <div style={ST.thread} ref={ref}>
      {messages.map(m => (
        <div key={m.id} style={isMine(m) ? ST.mine : ST.theirs}>
          {m.body}
          <div style={ST.time}>{fmt(m.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

function Composer({ onSend }) {
  const [v, setV] = useState('');
  function go() { const t = v.trim(); if (!t) return; onSend(t); setV(''); }
  return (
    <div style={ST.composer}>
      <textarea style={ST.input} rows={1} placeholder="Write a message..." value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } }} />
      <button style={ST.send} onClick={go}>{'\u2191'}</button>
    </div>
  );
}

// ---- Support: regular user view (single thread with support) ----
function SupportUser() {
  const [messages, setMessages] = useState([]);
  const load = useCallback(() => {
    api.get('/support/messages').then(r => { if (r && r.success) setMessages(r.data.messages || []); });
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);
  async function send(body) {
    const r = await api.post('/support/messages', { body });
    if (r && r.success) setMessages(m => [...m, r.data.message]);
  }
  return (
    <div style={ST.panel}>
      <Thread messages={messages} isMine={m => m.sender_role === 'user'} emptyText="Send a message to our support team. We'll reply here." />
      <Composer onSend={send} />
    </div>
  );
}

// ---- Support: admin inbox view ----
function SupportAdmin() {
  const [threads, setThreads] = useState([]);
  const [sel, setSel] = useState(null);
  const [messages, setMessages] = useState([]);
  const loadThreads = useCallback(() => {
    api.get('/admin/support/threads').then(r => { if (r && r.success) setThreads(r.data.threads || []); });
  }, []);
  const loadMsgs = useCallback((uid) => {
    api.get('/admin/support/messages/' + uid).then(r => { if (r && r.success) setMessages(r.data.messages || []); });
  }, []);
  useEffect(() => { loadThreads(); const id = setInterval(loadThreads, 15000); return () => clearInterval(id); }, [loadThreads]);
  useEffect(() => { if (sel) loadMsgs(sel.user_id); }, [sel, loadMsgs]);
  async function send(body) {
    const r = await api.post('/admin/support/messages/' + sel.user_id, { body });
    if (r && r.success) setMessages(m => [...m, r.data.message]);
  }
  return (
    <div style={ST.layout}>
      <div style={ST.side}>
        {threads.length === 0 && <div style={ST.mini}>No support messages yet.</div>}
        {threads.map(t => (
          <div key={t.user_id} style={ST.convo(sel && sel.user_id === t.user_id)} onClick={() => setSel(t)}>
            <div style={ST.convoName}>{t.user_name}{t.unread > 0 && <span style={ST.badge}>{t.unread}</span>}</div>
            <div style={ST.convoLast}>{t.last_body}</div>
          </div>
        ))}
      </div>
      <div style={ST.panel}>
        {!sel ? <div style={ST.empty}>Select a conversation</div> : (
          <>
            <Thread messages={messages} isMine={m => m.sender_role === 'admin'} emptyText="No messages" />
            <Composer onSend={send} />
          </>
        )}
      </div>
    </div>
  );
}

// ---- Direct messages (user <-> user) ----
function DirectMessages({ myId }) {
  const [convos, setConvos] = useState([]);
  const [sel, setSel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);

  const loadConvos = useCallback(() => {
    api.get('/dm/conversations').then(r => { if (r && r.success) setConvos(r.data.conversations || []); });
  }, []);
  const loadMsgs = useCallback((uid) => {
    api.get('/dm/messages/' + uid).then(r => { if (r && r.success) setMessages(r.data.messages || []); });
  }, []);
  useEffect(() => { loadConvos(); const id = setInterval(loadConvos, 15000); return () => clearInterval(id); }, [loadConvos]);
  useEffect(() => { if (sel) loadMsgs(sel.user_id); }, [sel, loadMsgs]);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setFound([]); return; }
    const id = setTimeout(() => {
      api.get('/users/search?q=' + encodeURIComponent(term)).then(r => { if (r && r.success) setFound(r.data.users || []); });
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  async function send(body) {
    const r = await api.post('/dm/messages', { recipient_id: sel.user_id, body });
    if (r && r.success) { setMessages(m => [...m, r.data.message]); loadConvos(); }
  }
  function startWith(u) { setSel({ user_id: u.id, user_name: u.user_name }); setQ(''); setFound([]); }

  return (
    <div style={ST.layout}>
      <div style={ST.side}>
        <input style={ST.search} placeholder="Find a user to message..." value={q} onChange={e => setQ(e.target.value)} />
        {found.map(u => (
          <div key={'f' + u.id} style={ST.found} onClick={() => startWith(u)}>{'\u2709 ' + u.user_name}</div>
        ))}
        {found.length === 0 && convos.length === 0 && <div style={ST.mini}>No conversations yet. Search a user to start.</div>}
        {found.length === 0 && convos.map(c => (
          <div key={c.user_id} style={ST.convo(sel && sel.user_id === c.user_id)} onClick={() => setSel(c)}>
            <div style={ST.convoName}>{c.user_name}{c.unread > 0 && <span style={ST.badge}>{c.unread}</span>}</div>
            <div style={ST.convoLast}>{fmt(c.last_at)}</div>
          </div>
        ))}
      </div>
      <div style={ST.panel}>
        {!sel ? <div style={ST.empty}>Select or start a conversation</div> : (
          <>
            <Thread messages={messages} isMine={m => m.sender_id === myId} emptyText={'Start chatting with ' + sel.user_name} />
            <Composer onSend={send} />
          </>
        )}
      </div>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('support');
  const myId = user?.id ?? user?.user_id;

  return (
    <div style={ST.wrap}>
      <h1 style={ST.h1}>Messages</h1>
      <div style={ST.tabs}>
        <div style={ST.tab(tab === 'support')} onClick={() => setTab('support')}>{isAdmin ? 'Support inbox' : 'Support'}</div>
        <div style={ST.tab(tab === 'direct')} onClick={() => setTab('direct')}>Direct messages</div>
      </div>
      {tab === 'support' ? (isAdmin ? <SupportAdmin /> : <SupportUser />) : <DirectMessages myId={myId} />}
    </div>
  );
}
