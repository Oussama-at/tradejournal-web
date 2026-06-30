import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useLang } from '../lang/LangContext';

// Public/learner help center. Reads admin-managed articles from the DB.

const ST = {
  wrap: { maxWidth: 860, margin: '0 auto', padding: '24px 16px' },
  h1: { fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 4px' },
  lead: { opacity: 0.6, fontSize: 14, marginBottom: 20 },
  search: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', padding: '12px 14px', fontSize: 14, marginBottom: 22, outline: 'none' },
  cat: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, margin: '18px 0 8px' },
  card: { display: 'block', width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', color: '#e8edf3' },
  cardTitle: { fontSize: 15, fontWeight: 700 },
  back: { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#9aa', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', marginBottom: 16, fontSize: 13 },
  artTitle: { fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px' },
  meta: { fontSize: 12, opacity: 0.5, marginBottom: 18 },
  body: { fontSize: 15, lineHeight: 1.7, color: '#cdd6e0', whiteSpace: 'pre-wrap' },
  empty: { textAlign: 'center', opacity: 0.5, padding: 50 },
};

export default function HelpCenter() {
  const { t } = useLang();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => {
    let on = true;
    api.get('/help/articles').then(res => {
      if (on && res && res.success) setArticles(res.data.articles || []);
    }).finally(() => on && setLoading(false));
    return () => { on = false; };
  }, []);

  function openArticle(slug) {
    setActive({ loading: true });
    api.get('/help/articles/' + slug).then(res => {
      if (res && res.success) setActive(res.data.article);
      else setActive(null);
    });
  }

  if (active) {
    return (
      <div style={ST.wrap}>
        <button style={ST.back} onClick={() => setActive(null)}>{t('back_to_help')}</button>
        {active.loading ? <div style={ST.empty}>{t('loading')}</div> : (
          <>
            <h1 style={ST.artTitle}>{active.title}</h1>
            <div style={ST.meta}>{active.category}{active.author_name ? ' · ' + t('written_by') + ' ' + active.author_name : ''}</div>
            <div style={ST.body}>{active.body}</div>
          </>
        )}
      </div>
    );
  }

  const term = q.trim().toLowerCase();
  const filtered = term ? articles.filter(a => a.title.toLowerCase().includes(term) || (a.category || '').toLowerCase().includes(term)) : articles;
  const cats = [...new Set(filtered.map(a => a.category || 'General'))];

  return (
    <div style={ST.wrap}>
      <h1 style={ST.h1}>{t('nav_help')}</h1>
      <div style={ST.lead}>{t('help_center_lead')}</div>
      <input style={ST.search} placeholder={t('search_help')} value={q} onChange={e => setQ(e.target.value)} />

      {loading ? <div style={ST.empty}>{t('loading')}</div> :
        filtered.length === 0 ? <div style={ST.empty}>{t('no_articles')}</div> :
        cats.map(cat => (
          <div key={cat}>
            <div style={ST.cat}>{cat}</div>
            {filtered.filter(a => (a.category || 'General') === cat).map(a => (
              <button key={a.id} style={ST.card} onClick={() => openArticle(a.slug)}>
                <div style={ST.cardTitle}>{a.title}</div>
              </button>
            ))}
          </div>
        ))
      }
    </div>
  );
}
