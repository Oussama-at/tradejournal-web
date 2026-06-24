/**
 * PhotoSuccessToast  –  slides in from top-right after photo upload
 */
import React, { useEffect, useState } from 'react';

export default function PhotoSuccessToast({ message, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mount → animate in
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      top: 20, right: 20,
      zIndex: 99998,
      background: 'linear-gradient(135deg, #0d2b1a, #0a1f13)',
      border: '1px solid rgba(0,230,118,0.45)',
      borderRadius: 14,
      padding: '14px 20px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,230,118,0.1)',
      display: 'flex', alignItems: 'center', gap: 12,
      minWidth: 260, maxWidth: 340,
      transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      transform: visible ? 'translateX(0) scale(1)' : 'translateX(calc(100% + 30px)) scale(0.9)',
      opacity: visible ? 1 : 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(0,230,118,0.15)',
        border: '2px solid rgba(0,230,118,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>✓</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00e676', marginBottom: 2 }}>
          {message}
        </div>
        <div style={{ fontSize: 11, color: '#3a6a4a' }}>
          Profile updated successfully
        </div>
      </div>
    </div>
  );
}
