import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Floating AI assistant (Anthropic Claude via POST /ai/chat).
// Answers help/how-to, analyzes the user's own stats, and can navigate the app.

const ST = {
  fab: { position: 'fixed', bottom: 22, right: 22, zIndex: 2147483000, width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#00e676,#00b45f)', color: '#06210f', fontSize: 24, boxShadow: '0 6px 22px rgba(0,230,118,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  panel: { position: 'fixed', bottom: 88, right: 22, zIndex: 2147483000, width: 'min(380px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 130px))', background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, boxShadow: '0 18px 50px rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  head: { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,rgba(0,230,118,0.12),transparent)' },
  dot: { width: 9, height: 9, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 8px #00e676' },
  title: { fontWeight: 800, fontSize: 14, color: '#fff' },
  sub: { fontSize: 11, opacity: 0.55 },
  close: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#9aa', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  body: { flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  msgUser: { alignSelf: 'flex-end', maxWidth: '85%', background: 'linear-gradient(135deg,#00e676,#00b45f)', color: '#06210f', padding: '9px 12px', borderRadius: '14px 14px 4px 14px', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  msgBot: { alignSelf: 'flex-start', maxWidth: '90%', background: 'rgba(255,255,255,0.05)', color: '#e8edf3', padding: '9px 12px', borderRadius: '14px 14px 14px 4px', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.07)' },
  foot: { padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 },
  input: { flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 13.5, resize: 'none', fontFamily: 'inherit' },
  send: { background: '#00e676', color: '#06210f', border: 'none', borderRadius: 10, padding: '0 14px', fontWeight: 800, cursor: 'pointer', fontSize: 16 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 14px 6px' },
  chip: { background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)', color: '#00e676', borderRadius: 20, padding: '5px 10px', fontSize: 11.5, cursor: 'pointer' },
  actionBtn: { marginTop: 6, background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.35)', color: '#00e676', borderRadius: 8, padding: '6px 11px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
};

const SUGGESTIONS = [
  'How do I add a trade?',
  "What's my win rate?",
  'Analyze my recent trades',
  'Open my dashboard',
];

export default function ChatbotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState([
    { role: 'assistant', content: "Hi! I'm your TradeJournal assistant. Ask me how to use the app, about your own stats, or to take you somewhere." },
  ]);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, loading, open]);

  if (!user) return null;

  async function send(text) {
    const content = (text != null ? text : input).trim();
    if (!content || loading) return;
    const next = [...msgs, { role: 'user', content }];
    setMsgs(next);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', { messages: next.map(m => ({ role: m.role, content: m.content })) });
      if (res && res.success && res.data) {
        const reply = res.data.reply || '...';
        const action = res.data.action || null;
        setMsgs(m => [...m, { role: 'assistant', content: reply, action }]);
      } else {
        setMsgs(m => [...m, { role: 'assistant', content: (res && res.message) || 'Sorry, the assistant is unavailable right now.' }]);
      }
    } catch (e) {
      setMsgs(m => [...m, { role: 'assistant', content: 'Network error. Please try again.' }]);
    }
    setLoading(false);
  }

  function runAction(action) {
    if (!action) return;
    if (action.type === 'navigate' && action.path) {
      const path = String(action.path).replace(/\s*\(.*\)\s*$/, '').trim();
      navigate(path);
      setOpen(false);
    }
  }

  return (
    <>
      {open && (
        <div style={ST.panel}>
          <div style={ST.head}>
            <span style={ST.dot} />
            <div>
              <div style={ST.title}>AI Assistant</div>
              <div style={ST.sub}>Powered by AI</div>
            </div>
            <button style={ST.close} onClick={() => setOpen(false)}>{'\u00D7'}</button>
          </div>

          <div style={ST.body} ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} style={m.role === 'user' ? ST.msgUser : ST.msgBot}>
                {m.content}
                {m.action && m.action.type === 'navigate' && (
                  <div>
                    <button style={ST.actionBtn} onClick={() => runAction(m.action)}>
                      {'\u2192 Go to ' + String(m.action.path).replace(/\s*\(.*\)\s*$/, '')}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && <div style={ST.msgBot}>{'\u2026'}</div>}
          </div>

          {msgs.length <= 1 && (
            <div style={ST.chips}>
              {SUGGESTIONS.map(s => (
                <button key={s} style={ST.chip} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          <div style={ST.foot}>
            <textarea
              style={ST.input}
              rows={1}
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button style={ST.send} onClick={() => send()} disabled={loading}>{'\u2191'}</button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes tjFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
        @keyframes tjPulse { 0% { box-shadow:0 8px 22px rgba(0,230,118,0.45), 0 0 0 0 rgba(0,230,118,0.5); } 70% { box-shadow:0 8px 22px rgba(0,230,118,0.45), 0 0 0 16px rgba(0,230,118,0); } 100% { box-shadow:0 8px 22px rgba(0,230,118,0.45), 0 0 0 0 rgba(0,230,118,0); } }
        .tj-fab-chat { animation: tjPulse 2.6s ease-in-out infinite; transition: transform .2s ease, filter .2s ease; }
        .tj-fab-chat:hover { transform: translateY(-3px) scale(1.08); filter: brightness(1.1); }
        .tj-fab-chat:active { transform: scale(.95); }
        .tj-fab-chat .tj-fab-emoji { display:inline-block; animation: tjFloat 3.6s ease-in-out infinite; }
      `}</style>
      <button className="tj-fab-chat" style={ST.fab} onClick={() => setOpen(o => !o)} title="AI Assistant" aria-label="AI Assistant">
        <span className="tj-fab-emoji">{open ? '\u00D7' : '\uD83D\uDCAC'}</span>
      </button>
    </>
  );
}
