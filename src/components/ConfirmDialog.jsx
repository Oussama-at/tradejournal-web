import React, { useState, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────
   ConfirmDialog — drop-in replacement for window.confirm()

   Usage:
     const showConfirm = useConfirm();
     const ok = await showConfirm({ title: 'Delete trade?', message: 'This cannot be undone.', type: 'danger' });
     if (ok) { ... }

   Types: 'danger' | 'warning' | 'info'  (default: 'danger')
───────────────────────────────────────────────────────── */

const ConfirmContext = React.createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { title, message, type, resolve }

  const showConfirm = useCallback(({ title, message, confirmLabel, cancelLabel, type = 'danger' }) => {
    return new Promise(resolve => {
      setDialog({ title, message, confirmLabel, cancelLabel, type, resolve });
    });
  }, []);

  function handle(result) {
    dialog?.resolve(result);
    setDialog(null);
  }

  const COLORS = {
    danger:  { icon: '🗑', accent: '#ff4757', btnBg: '#ff4757', btnColor: '#fff' },
    warning: { icon: '⚠️', accent: '#f6d860', btnBg: '#f6d860', btnColor: '#080c10' },
    info:    { icon: 'ℹ️', accent: '#00b4d8', btnBg: '#00b4d8', btnColor: '#fff' },
  };
  const col = COLORS[dialog?.type] || COLORS.danger;

  return (
    <ConfirmContext.Provider value={showConfirm}>
      {children}

      {dialog && (
        <div
          onClick={e => { if (e.target === e.currentTarget) handle(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'fadeIn .15s ease',
          }}
        >
          <div style={{
            background: '#111820',
            border: `1px solid ${col.accent}33`,
            borderRadius: 14,
            padding: '32px 28px 24px',
            maxWidth: 400,
            width: '100%',
            boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px ${col.accent}22`,
            animation: 'slideUp .18s ease',
          }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `${col.accent}18`,
              border: `1.5px solid ${col.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, margin: '0 auto 16px',
            }}>
              {col.icon}
            </div>

            {/* Title */}
            <div style={{
              fontSize: 17, fontWeight: 800, color: '#e8edf3',
              textAlign: 'center', marginBottom: 8,
            }}>
              {dialog.title}
            </div>

            {/* Message */}
            {dialog.message && (
              <div style={{
                fontSize: 13, color: '#6a8a9a',
                textAlign: 'center', marginBottom: 24, lineHeight: 1.6,
              }}>
                {dialog.message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Cancel */}
              <button
                onClick={() => handle(false)}
                style={{
                  flex: 1, padding: '11px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, color: '#7a9ab0',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e8edf3'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7a9ab0'; }}
              >
                {dialog.cancelLabel || 'Cancel'}
              </button>

              {/* Confirm */}
              <button
                onClick={() => handle(true)}
                style={{
                  flex: 1, padding: '11px',
                  background: col.btnBg,
                  border: 'none',
                  borderRadius: 8, color: col.btnColor,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>

          {/* Animations */}
          <style>{`
            @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: none; opacity: 1 } }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => React.useContext(ConfirmContext);
