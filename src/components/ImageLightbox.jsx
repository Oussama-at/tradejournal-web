import React, { useEffect, useState, useCallback } from 'react';

// Secure in-app image viewer: keeps the image inside the app (no raw URL tab),
// supports zoom in/out, reset, and download.

const ST = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 2147483200,
    background: 'rgba(3,6,10,0.92)', backdropFilter: 'blur(4px)',
    display: 'flex', flexDirection: 'column',
  },
  bar: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  title: { color: '#cdd6e0', fontSize: 13, fontWeight: 600, marginRight: 'auto', maxWidth: '50vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  btn: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#e8edf3', borderRadius: 9, padding: '8px 12px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1,
  },
  dl: {
    background: 'linear-gradient(135deg,#00e676,#00b45f)', border: 'none', color: '#06210f',
    borderRadius: 9, padding: '8px 14px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
  },
  close: {
    background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.4)', color: '#ff6b7a',
    borderRadius: 9, padding: '8px 12px', fontSize: 16, fontWeight: 800, cursor: 'pointer', lineHeight: 1,
  },
  stage: { flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  zoom: { color: '#9aa', fontSize: 12, minWidth: 46, textAlign: 'center' },
};

export default function ImageLightbox({ src, name = 'screenshot', onClose }) {
  const [scale, setScale] = useState(1);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose && onClose();
    if (e.key === '+' || e.key === '=') setScale(s => Math.min(5, s + 0.25));
    if (e.key === '-') setScale(s => Math.max(0.25, s - 0.25));
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = prev; };
  }, [handleKey]);

  async function download() {
    try {
      const res = await fetch(src, { mode: 'cors' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (name || 'screenshot').replace(/[^\w.-]+/g, '_') + (/\.[a-z0-9]+$/i.test(name || '') ? '' : '.jpg');
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) {
      const a = document.createElement('a');
      a.href = src; a.download = name || 'screenshot'; a.target = '_blank';
      document.body.appendChild(a); a.click(); a.remove();
    }
  }

  if (!src) return null;

  const imgStyle = {
    maxWidth: scale <= 1 ? '100%' : 'none',
    maxHeight: scale <= 1 ? '100%' : 'none',
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    transition: 'transform 0.12s ease',
    borderRadius: 8,
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    cursor: scale >= 2 ? 'zoom-out' : 'zoom-in',
  };

  return (
    <div style={ST.overlay} onClick={onClose}>
      <div style={ST.bar} onClick={e => e.stopPropagation()}>
        <div style={ST.title}>{name}</div>
        <button style={ST.btn} onClick={() => setScale(s => Math.max(0.25, s - 0.25))} title="Zoom out">{'\u2212'}</button>
        <div style={ST.zoom}>{Math.round(scale * 100)}%</div>
        <button style={ST.btn} onClick={() => setScale(s => Math.min(5, s + 0.25))} title="Zoom in">+</button>
        <button style={ST.btn} onClick={() => setScale(1)} title="Reset">{'\u21BA'}</button>
        <button style={ST.dl} onClick={download}>{'\u2193'} Download</button>
        <button style={ST.close} onClick={onClose} title="Close">{'\u00D7'}</button>
      </div>
      <div style={ST.stage} onClick={onClose}>
        <img
          src={src}
          alt={name}
          onClick={e => { e.stopPropagation(); setScale(s => (s >= 2 ? 1 : s + 1)); }}
          style={imgStyle}
        />
      </div>
    </div>
  );
}
