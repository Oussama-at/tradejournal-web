import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Admin help-article editor (CRUD). Articles are stored in the DB and shown in /help.

const BLANK = { title: '', category: 'General', body: '', lang: 'en', published: true, sort_order: 0 };

const ST = {
  wrap: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 20, alignItems: 'start' },
  h1: { fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 14px' },
  newBtn: { width: '100%', background: '#00e676', color: '#06210f', border: 'none', borderRadius: 9, padding: '10px', fontWeight: 800, cursor: 'pointer', marginBottom: 12 },
  row: (active) => ({ padding: '10px 12px', borderRadius: 9, cursor: 'pointer', marginBottom: 6, background: active ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: active ? '#00e676' : '#e8edf3' }),
  rowTitle: { fontSize: 14, fontWeight: 700 },
  rowMeta: { fontSize: 11, opacity: 0.55, marginTop: 2 },
  panel: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 },
  label: { fontSize: 12, opacity: 0.6, display: 'block', margin: '12px 0 5px' },
  input: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14, outline: 'none' },
  area: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '10px 12px', fontSize: 14, outline: 'none', minHeight: 240, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 },
  inline: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  col: { flex: 1, minWidth: 120 },
  check: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 14 },
  actions: { display: 'flex', gap: 10, marginTop: 18 },
  save: { background: '#00e676', color: '#06210f', border: 'none', borderRadius: 9, padding: '10px 18px', fontWeight: 800, cursor: 'pointer' },
  del: { background: 'transparent', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 9, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' },
  msg: { fontSize: 13, marginTop: 12, color: '#00e676' },
  empty: { opacity: 0.5, fontSize: 14, padding: 30, textAlign: 'center' },
};

export default function AdminHelp() {
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null); // article being edited (or BLANK for new)
  const [form, setForm] = useState(BLANK);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/admin/help/articles').then(res => {
      if (res && res.success) setList(res.data.articles || []);
    });
  }
  useEffect(load, []);

  function pick(a) { setSel(a); setForm({ ...BLANK, ...a }); setMsg(''); }
  function startNew() { setSel({ id: null }); setForm(BLANK); setMsg(''); }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.title.trim()) { setMsg('Title is required'); return; }
    setSaving(true); setMsg('');
    const payload = { title: form.title, category: form.category, body: form.body, lang: form.lang, published: !!form.published, sort_order: Number(form.sort_order) || 0 };
    try {
      const res = sel && sel.id
        ? await api.put('/admin/help/articles/' + sel.id, payload)
        : await api.post('/admin/help/articles', payload);
      if (res && res.success) {
        setMsg('Saved');
        load();
        if (res.data && res.data.article) pick(res.data.article);
      } else setMsg((res && res.message) || 'Failed to save');
    } catch (e) { setMsg('Failed to save'); }
    setSaving(false);
  }

  async function remove() {
    if (!sel || !sel.id) return;
    if (!window.confirm('Delete this article?')) return;
    const res = await api.delete('/admin/help/articles/' + sel.id);
    if (res && res.success) { setSel(null); setForm(BLANK); load(); }
  }

  return (
    <div style={ST.wrap}>
      <div>
        <h1 style={ST.h1}>Help Articles</h1>
        <button style={ST.newBtn} onClick={startNew}>{'+ New article'}</button>
        {list.length === 0 && <div style={ST.empty}>No articles yet.</div>}
        {list.map(a => (
          <div key={a.id} style={ST.row(sel && sel.id === a.id)} onClick={() => pick(a)}>
            <div style={ST.rowTitle}>{a.title}</div>
            <div style={ST.rowMeta}>{a.category + ' \u00B7 ' + a.lang + ' \u00B7 ' + (a.published ? 'Published' : 'Draft')}</div>
          </div>
        ))}
      </div>

      <div style={ST.panel}>
        {!sel ? <div style={ST.empty}>Select an article or create a new one.</div> : (
          <>
            <label style={ST.label}>Title</label>
            <input style={ST.input} value={form.title} onChange={e => set('title', e.target.value)} />

            <div style={ST.inline}>
              <div style={ST.col}>
                <label style={ST.label}>Category</label>
                <input style={ST.input} value={form.category} onChange={e => set('category', e.target.value)} />
              </div>
              <div style={ST.col}>
                <label style={ST.label}>Language</label>
                <select style={ST.input} value={form.lang} onChange={e => set('lang', e.target.value)}>
                  <option value="en">English</option>
                  <option value="fr">{'Fran\u00E7ais'}</option>
                  <option value="ar">{'\u0627\u0644\u0639\u0631\u0628\u064A\u0629'}</option>
                </select>
              </div>
              <div style={ST.col}>
                <label style={ST.label}>Sort order</label>
                <input style={ST.input} type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} />
              </div>
            </div>

            <label style={ST.label}>Body</label>
            <textarea style={ST.area} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Write the article content..." />

            <label style={ST.check}>
              <input type="checkbox" checked={!!form.published} onChange={e => set('published', e.target.checked)} />
              Published (visible to users)
            </label>

            <div style={ST.actions}>
              <button style={ST.save} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              {sel.id && <button style={ST.del} onClick={remove}>Delete</button>}
            </div>
            {msg && <div style={ST.msg}>{msg}</div>}
          </>
        )}
      </div>
    </div>
  );
}
