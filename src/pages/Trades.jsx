import React, { useState, useEffect } from 'react';
import { useLang } from '../lang/LangContext';
import api from '../services/api';
import { useConfirm } from '../components/ConfirmDialog';

// Inline sortable headers for Trades table
function SortableTh({ label, colIdx, sortCol, sortDir, onSort }) {
  const isActive = sortCol === colIdx;
  return (
    <th onClick={() => onSort(colIdx)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        <span style={{ fontSize: 10, opacity: isActive ? 1 : 0.3, color: isActive ? 'var(--green)' : 'inherit' }}>
          {isActive ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  );
}

export default function Trades() {
  const { t } = useLang();
  const showConfirm = useConfirm();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', period: 'All', search: '' });
  const [editTrade, setEditTrade] = useState(null);

  const PERIODS = [
    { val: 'All',        label: t('all') },
    { val: 'Today',      label: t('today') },
    { val: 'This Week',  label: t('this_week') },
    { val: 'This Month', label: t('this_month') },
    { val: 'Last Month', label: t('last_month') },
  ];

  useEffect(() => { load(); }, [page, filters]);

  async function load() {
    setLoading(true);
    try {
      let url = `/trades?page=${page}&limit=50`;
      if (filters.search) url += `&market=${encodeURIComponent(filters.search)}`;
      if (filters.type !== 'All') url += `&type=${filters.type.toLowerCase()}`;
      if (filters.status !== 'All') url += `&status=${filters.status.toLowerCase()}`;
      if (filters.period === 'Today') url += '&filter=Daily';
      else if (filters.period === 'This Week') url += '&filter=Weekly';
      else if (filters.period === 'This Month') url += '&filter=Monthly';
      else if (filters.period === 'Last Month') url += '&filter=LastMonth';

      const res = await api.get(url);
      setTrades(res?.data?.trades || []);
      setTotal(res?.data?.total || 0);
      setTotalPages(Math.max(1, Math.ceil((res?.data?.total || 0) / 50)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function deleteTrade(id) {
    const ok = await showConfirm({
      title: `${t('delete')} #${id}?`,
      message: t('delete_trade_confirm') || 'This trade will be permanently removed.',
      type: 'danger', confirmLabel: t('delete'), cancelLabel: t('cancel'),
    });
    if (!ok) return;
    await api.delete(`/trades/${id}`);
    load();
  }

  async function saveEdit(body) {
    await api.put(`/trades/${editTrade.id_trade || editTrade.id}`, body);
    setEditTrade(null);
    load();
  }

  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(idx) {
    if (sortCol === idx) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir('asc'); }
    } else { setSortCol(idx); setSortDir('asc'); }
  }

  const SORT_KEYS = ['id', 'date_trade', 'marcher', 'type_trd', 'point_entree', 'point_sortie', 'nbr_contrat', 'status', 'montant', 'sessions'];
  const sortedTrades = sortCol === null ? trades : [...trades].sort((a, b) => {
    const key = SORT_KEYS[sortCol];
    if (!key) return 0;
    const av = a[key] ?? '';
    const bv = b[key] ?? '';
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('trades_title')}</div>
        <div className="page-sub">{total} {t('total_trades_label')}</div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input className="input" placeholder={t('search_market')} value={filters.search}
              onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
          </div>
          <select className="select" style={{ width: 'auto' }} value={filters.type}
            onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
            {[{ val: 'All', lbl: t('all') }, { val: 'Buy', lbl: t('buy') }, { val: 'Sell', lbl: t('sell') }]
              .map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.status}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
            {[{ val: 'All', lbl: t('all') }, { val: 'Win', lbl: t('win') }, { val: 'Lose', lbl: t('lose') }]
              .map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filters.period}
            onChange={e => { setFilters(f => ({ ...f, period: e.target.value })); setPage(1); }}>
            {PERIODS.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={() => { setFilters({ type: 'All', status: 'All', period: 'All', search: '' }); setPage(1); }}>
            {t('reset')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {['#', t('col_date'), t('col_market'), t('col_type'), t('col_entry'),
                  t('col_close'), t('col_qty'), t('col_status'), t('col_amount'), t('col_session')].map((h, i) => (
                  <SortableTh key={h} label={h} colIdx={i} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                ))}
                <th>{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>}
              {!loading && trades.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--dim)', padding: 32 }}>{t('no_trades_found')}</td></tr>}
              {!loading && sortedTrades.map(tr => {
                const id = tr.id_trade || tr.id;
                return (
                  <tr key={id} style={{ background: tr.status === 'win' ? 'rgba(0,230,118,0.025)' : 'rgba(255,71,87,0.025)' }}>
                    <td className="muted mono" style={{ fontSize: 12 }}>{id}</td>
                    <td className="muted">{tr.date_trade}</td>
                    <td style={{ fontWeight: 700 }}>{tr.marcher}</td>
                    <td className={tr.type_trd === 'buy' ? 'green bold' : 'red bold'}>{tr.type_trd?.toUpperCase()}</td>
                    <td className="mono">{tr.point_entree}</td>
                    <td className="mono">{tr.point_sortie}</td>
                    <td className="mono muted">{tr.nbr_contrat} {tr.qty_type?.includes('lot') ? 'L' : ''}</td>
                    <td>
                      <span className={`badge ${tr.status === 'win' ? 'badge-green' : 'badge-red'}`}>
                        {tr.status === 'win' ? t('win')?.toUpperCase() : t('lose')?.toUpperCase()}
                      </span>
                    </td>
                    <td className={`mono bold ${tr.status === 'win' ? 'green' : 'red'}`}>
                      {tr.status === 'win' ? '+' : '-'}{Math.abs(tr.montant).toFixed(2)}$
                    </td>
                    <td className="muted">{{ LON: t('session_lon'), NY: t('session_ny'), ASI: t('session_asi') }[tr.sessions] || tr.sessions}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={() => setEditTrade(tr)}>{t('edit')}</button>
                        <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 11 }}
                          onClick={() => deleteTrade(id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('prev')}</button>
          <span className="page-info">{t('page_of')} {page} {t('of')} {totalPages} · {total} {t('total_trades_label')}</span>
          <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>{t('next')}</button>
        </div>
      </div>

      {editTrade && <EditModal trade={editTrade} onClose={() => setEditTrade(null)} onSave={saveEdit} />}
    </div>
  );
}

function EditModal({ trade, onClose, onSave }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    marcher: trade.marcher || '',
    type_trd: trade.type_trd || 'buy',
    point_entree: trade.point_entree || 0,
    point_sortie: trade.point_sortie || 0,
    montant: trade.montant || 0,
    nbr_contrat: trade.nbr_contrat || 1,
    qty_type: trade.qty_type || 'contract mini',
    status: trade.status || 'win',
    type_close: trade.type_close || 'Target',
    sessions: trade.sessions || 'LON',
  });
  const [newImage, setNewImage]   = useState(null);
  const [preview, setPreview]     = useState(null);
  const [uploading, setUploading] = useState(false);
  const existingImg = trade.path || trade.image || null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    let body = { ...form };
    if (newImage) {
      setUploading(true);
      try {
        const upRes = await api.uploadFile('/upload', newImage);
        if (upRes?.success) {
          body.image      = upRes.data.url;
          body.image_name = upRes.data.image_name || newImage.name;
        }
      } catch (e) { console.error('Image upload failed:', e); }
      setUploading(false);
    }
    onSave(body);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: 560, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 700 }}>{t('edit_trade')} #{trade.id_trade || trade.id}</div>
          <button className="btn btn-ghost" style={{ padding: '3px 8px' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            [t('market'), 'marcher', 'text'],
            [t('entry'),  'point_entree', 'number'],
            [t('col_close'), 'point_sortie', 'number'],
            [t('amount'), 'montant', 'number'],
            [t('qty'),    'nbr_contrat', 'number'],
          ].map(([label, key, type]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input className="input" type={type} value={form[key]}
                onChange={e => set(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)} />
            </div>
          ))}
          {[
            [t('type'),     'type_trd',   ['buy', 'sell']],
            [t('status'),   'status',     ['win', 'lose']],
            [t('close_by'), 'type_close', [t('target'), t('stop_loss'), t('manual')]],
            [t('session'),  'sessions',   ['LON', 'NY', 'ASI']],
          ].map(([label, key, opts]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              {key === 'sessions' ? (
                <select className="select" value={form[key]} onChange={e => set(key, e.target.value)}>
                  <option value="LON">{t('session_lon')}</option>
                  <option value="NY">{t('session_ny')}</option>
                  <option value="ASI">{t('session_asi')}</option>
                </select>
              ) : (
                <select className="select" value={form[key]} onChange={e => set(key, e.target.value)}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
            {t('screenshot')}
          </label>
          {existingImg && !preview && (
            <div style={{ marginBottom: 10 }}>
              <img src={existingImg} alt="Trade screenshot"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}
                onClick={() => window.open(existingImg, '_blank')} />
              <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>{t('current_screenshot')}</div>
            </div>
          )}
          {preview && (
            <div style={{ marginBottom: 10 }}>
              <img src={preview} alt="New screenshot"
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8,
                  border: '1px solid rgba(0,230,118,0.3)' }} />
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>
                {t('new_img_selected')}: {newImage?.name}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', flex: 1 }}>
              <div className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => document.getElementById('edit-img-input').click()}>
                {newImage ? t('change_image') : existingImg ? t('replace_screenshot') : t('add_screenshot')}
              </div>
              <input id="edit-img-input" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setNewImage(f); setPreview(URL.createObjectURL(f)); }
                }} />
            </label>
            {(newImage || (existingImg && !preview)) && (
              <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => { setNewImage(null); setPreview(null); setForm(f => ({ ...f, image: '', image_name: '' })); }}>
                {t('remove')}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
          <button className="btn btn-primary" disabled={uploading} onClick={handleSave}>
            {uploading ? t('uploading') : t('save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
}
