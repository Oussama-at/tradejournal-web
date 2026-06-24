import React, { useState, useRef, useEffect } from 'react';

/*
 * Professional dark-themed date picker.
 * Drop-in replacement for <input type="date">.
 * Props: value (YYYY-MM-DD), onChange(YYYY-MM-DD), placeholder, min, max, disabled, style
 */

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function pad(n) { return String(n).padStart(2, '0'); }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function parseISO(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}
function fmtDisplay(s) {
  const d = parseISO(s);
  if (!d) return '';
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}
function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

export default function DatePicker({ value, onChange, placeholder = 'Select date', min, max, disabled, style }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parseISO(value) || new Date());
  const wrapRef = useRef(null);

  useEffect(() => { const d = parseISO(value); if (d) setView(d); }, [value]);

  useEffect(() => {
    function onDoc(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    if (open) { document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey); }
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const selected = parseISO(value);
  const minD = parseISO(min);
  const maxD = parseISO(max);
  const today = dateOnly(new Date());

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function isDisabled(d) {
    const dt = new Date(year, month, d);
    if (minD && dt < dateOnly(minD)) return true;
    if (maxD && dt > dateOnly(maxD)) return true;
    return false;
  }
  function pick(d) {
    if (isDisabled(d)) return;
    onChange(toISO(new Date(year, month, d)));
    setOpen(false);
  }
  function shiftMonth(delta) { setView(new Date(year, month + delta, 1)); }
  function shiftYear(delta) { setView(new Date(year + delta, month, 1)); }

  const S = {
    wrap: { position: 'relative', ...style },
    trigger: {
      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
      padding: '10px 12px', borderRadius: 10,
      border: `1px solid ${open ? '#00e676' : 'rgba(255,255,255,0.12)'}`,
      background: 'rgba(255,255,255,0.03)', color: value ? '#e8edf3' : '#7a8a9a',
      cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14,
      boxShadow: open ? '0 0 0 3px rgba(0,230,118,0.12)' : 'none',
      transition: 'border-color .15s, box-shadow .15s', opacity: disabled ? 0.6 : 1,
    },
    icon: { fontSize: 15, lineHeight: 1 },
    text: { flex: 1, textAlign: 'left' },
    clear: { color: '#7a8a9a', fontSize: 14, padding: '0 2px' },
    pop: {
      position: 'absolute', zIndex: 1000, top: 'calc(100% + 6px)', left: 0,
      width: 280, padding: 14, borderRadius: 14,
      background: '#11181f', border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 18px 48px rgba(0,0,0,0.55)',
    },
    head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    navBtn: {
      width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.04)', color: '#e8edf3', cursor: 'pointer', fontSize: 13,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    title: { fontWeight: 700, fontSize: 14, color: '#e8edf3' },
    navGroup: { display: 'flex', gap: 6 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
    dow: { textAlign: 'center', fontSize: 11, color: '#7a8a9a', padding: '4px 0', fontWeight: 600 },
    day: (active, isToday, dis) => ({
      height: 34, borderRadius: 8, border: 'none', cursor: dis ? 'not-allowed' : 'pointer',
      background: active ? '#00e676' : 'transparent',
      color: dis ? '#3d4853' : active ? '#08110a' : '#e8edf3',
      fontWeight: active ? 700 : 500, fontSize: 13,
      outline: isToday && !active ? '1px solid rgba(0,230,118,0.5)' : 'none',
    }),
    foot: { display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 8 },
    footBtn: {
      flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.04)', color: '#e8edf3', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
    },
  };

  return (
    <div style={S.wrap} ref={wrapRef}>
      <div
        style={S.trigger}
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(o => !o); } }}
      >
        <span style={S.icon}>📅</span>
        <span style={S.text}>{value ? fmtDisplay(value) : placeholder}</span>
        {value && !disabled && (
          <span style={S.clear} onClick={e => { e.stopPropagation(); onChange(''); }} title="Clear">✕</span>
        )}
      </div>

      {open && (
        <div style={S.pop}>
          <div style={S.head}>
            <div style={S.navGroup}>
              <button type="button" style={S.navBtn} onClick={() => shiftYear(-1)} title="Previous year">«</button>
              <button type="button" style={S.navBtn} onClick={() => shiftMonth(-1)} title="Previous month">‹</button>
            </div>
            <div style={S.title}>{MONTHS[month]} {year}</div>
            <div style={S.navGroup}>
              <button type="button" style={S.navBtn} onClick={() => shiftMonth(1)} title="Next month">›</button>
              <button type="button" style={S.navBtn} onClick={() => shiftYear(1)} title="Next year">»</button>
            </div>
          </div>

          <div style={S.grid}>
            {DOW.map(d => <div key={d} style={S.dow}>{d}</div>)}
            {cells.map((d, i) => d === null
              ? <div key={`e${i}`} />
              : (
                <button
                  key={d}
                  type="button"
                  disabled={isDisabled(d)}
                  style={S.day(sameDay(selected, new Date(year, month, d)), sameDay(today, new Date(year, month, d)), isDisabled(d))}
                  onClick={() => pick(d)}
                >
                  {d}
                </button>
              ))}
          </div>

          <div style={S.foot}>
            <button type="button" style={S.footBtn} onClick={() => { const n = new Date(); setView(n); if (!isDisabled(n.getDate()) || true) { onChange(toISO(n)); setOpen(false); } }}>Today</button>
            {value && <button type="button" style={S.footBtn} onClick={() => { onChange(''); setOpen(false); }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}
