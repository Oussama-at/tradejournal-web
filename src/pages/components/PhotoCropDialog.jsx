/**
 * PhotoCropDialog  –  Professional image crop/resize/preview modal
 * Features:
 *  • Drag-to-pan + scroll/pinch-to-zoom the image within the crop frame
 *  • Circle / Square toggle
 *  • Zoom slider
 *  • Outputs a canvas-cropped Blob → ready for upload
 *  • Fully translated via react-intl (useLang)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLang } from '../lang/LangContext';

const CROP_SIZE = 260; // px of the visible crop square

export default function PhotoCropDialog({ file, onSave, onCancel }) {
  const { t } = useLang();

  const [shape, setShape] = useState('circle');   // 'circle' | 'square'
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // translate of image inside crop box
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);

  const imgRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, origPosX, origPosY }
  const objectUrl = useRef(null);
  const [src, setSrc] = useState('');

  // Create object URL from file
  useEffect(() => {
    if (!file) return;
    objectUrl.current = URL.createObjectURL(file);
    setSrc(objectUrl.current);
    return () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); };
  }, [file]);

  // When image loads, compute initial zoom so it fills the crop box
  const handleImgLoad = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.naturalWidth, h = el.naturalHeight;
    setImgSize({ w, h });
    // Scale to fill CROP_SIZE
    const initialZoom = Math.max(CROP_SIZE / w, CROP_SIZE / h);
    setZoom(initialZoom);
    setPos({ x: 0, y: 0 });
  }, []);

  // ── Drag to pan ──────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

    function onMove(ev) {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos(clamp({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }));
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos]);

  // Touch support
  const onTouchStart = useCallback((e) => {
    const t0 = e.touches[0];
    dragRef.current = { startX: t0.clientX, startY: t0.clientY, origX: pos.x, origY: pos.y };

    function onMove(ev) {
      const t1 = ev.touches[0];
      const dx = t1.clientX - dragRef.current.startX;
      const dy = t1.clientY - dragRef.current.startY;
      setPos(clamp({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }));
    }
    function onEnd() {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    }
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  }, [pos]);

  // Clamp position so image always covers the crop box
  function clamp({ x, y }) {
    if (!imgSize.w) return { x, y };
    const scaledW = imgSize.w * zoom;
    const scaledH = imgSize.h * zoom;
    const maxX = Math.max(0, (scaledW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (scaledH - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  // Recompute clamped pos when zoom changes
  useEffect(() => {
    setPos(p => clamp(p));
  // eslint-disable-next-line
  }, [zoom, imgSize]);

  // Zoom wheel
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const minZoom = Math.max(CROP_SIZE / imgSize.w, CROP_SIZE / imgSize.h);
    setZoom(z => Math.min(5, Math.max(minZoom, z + delta)));
  }, [imgSize]);

  // ── Export cropped image via canvas ──────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const OUTPUT = 400; // output image size
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      // Figure out where the image is in crop-box coordinates
      const scaledW = imgSize.w * zoom;
      const scaledH = imgSize.h * zoom;
      // Top-left of image within crop box (crop box is centred):
      const imgLeft = (CROP_SIZE - scaledW) / 2 + pos.x;
      const imgTop  = (CROP_SIZE - scaledH) / 2 + pos.y;

      // Map crop box (0,0)→(CROP_SIZE,CROP_SIZE) to source pixel coords
      const srcX = (0 - imgLeft) / zoom;
      const srcY = (0 - imgTop) / zoom;
      const srcW = CROP_SIZE / zoom;
      const srcH = CROP_SIZE / zoom;

      const img = imgRef.current;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT, OUTPUT);

      canvas.toBlob(blob => {
        if (blob) onSave(blob);
        setSaving(false);
      }, 'image/jpeg', 0.92);
    } catch {
      setSaving(false);
    }
  }

  const minZoom = imgSize.w
    ? Math.max(CROP_SIZE / imgSize.w, CROP_SIZE / imgSize.h)
    : 0.5;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'linear-gradient(160deg, #111820 0%, #0d1117 100%)',
        border: '1px solid rgba(0,230,118,0.2)',
        borderRadius: 20,
        padding: '28px 28px 24px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        position: 'relative',
      }}>
        {/* Header */}
        <button onClick={onCancel} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.06)', border: 'none',
          color: '#5a7a9a', fontSize: 18, cursor: 'pointer',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        >✕</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#e8edf3', marginBottom: 4 }}>
            {t('photo_dialog_title')}
          </div>
          <div style={{ fontSize: 12, color: '#5a7a9a' }}>
            {t('photo_dialog_sub')}
          </div>
        </div>

        {/* Crop preview box */}
        <div style={{
          width: CROP_SIZE, height: CROP_SIZE, margin: '0 auto 18px',
          position: 'relative', overflow: 'hidden', borderRadius: shape === 'circle' ? '50%' : 12,
          border: `2px solid rgba(0,230,118,0.5)`,
          boxShadow: '0 0 0 3000px rgba(0,0,0,0.55)',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onWheel={onWheel}
        >
          {/* Crop grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)
            `,
            backgroundSize: `${CROP_SIZE / 3}px ${CROP_SIZE / 3}px`,
          }} />

          {src && (
            <img
              ref={imgRef}
              src={src}
              alt="crop preview"
              onLoad={handleImgLoad}
              draggable={false}
              style={{
                position: 'absolute',
                width: imgSize.w * zoom,
                height: imgSize.h * zoom,
                top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <div style={{ fontSize: 11, color: '#3a5a7a', textAlign: 'center', marginBottom: 16 }}>
          🖱 Drag to reposition · Scroll to zoom
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Shape toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['circle', 'square'].map(s => (
              <button key={s} type="button"
                onClick={() => setShape(s)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                  border: shape === s ? '1px solid rgba(0,230,118,0.6)' : '1px solid var(--border, #1e2d3d)',
                  background: shape === s ? 'rgba(0,230,118,0.12)' : 'var(--bg3, #0d1f2d)',
                  color: shape === s ? '#00e676' : '#5a7a9a',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {s === 'circle'
                  ? <><span style={{ fontSize: 16 }}>◯</span> {t('photo_shape_circle')}</>
                  : <><span style={{ fontSize: 16 }}>⬜</span> {t('photo_shape_square')}</>
                }
              </button>
            ))}
          </div>

          {/* Zoom slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#5a7a9a', fontWeight: 600 }}>
                🔍 {t('photo_zoom')}
              </span>
              <span style={{ fontSize: 11, color: '#3a5a7a', fontFamily: 'monospace' }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <input type="range"
              min={Math.round(minZoom * 100)}
              max={500}
              step={1}
              value={Math.round(zoom * 100)}
              onChange={e => setZoom(Number(e.target.value) / 100)}
              style={{
                width: '100%', accentColor: '#00e676',
                background: 'transparent', cursor: 'pointer',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onCancel}
              style={{
                flex: 1, padding: '11px', borderRadius: 10,
                border: '1px solid var(--border, #1e2d3d)',
                background: 'var(--bg3, #0d1f2d)',
                color: '#5a7a9a', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t('photo_cancel')}
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !src}
              style={{
                flex: 2, padding: '11px', borderRadius: 10,
                background: saving ? 'rgba(0,230,118,0.3)' : 'linear-gradient(135deg,#00e676,#00c853)',
                border: 'none',
                color: '#080c10', fontWeight: 800, fontSize: 13, cursor: saving ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving
                ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Saving...</>
                : <>💾 {t('photo_save')}</>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
