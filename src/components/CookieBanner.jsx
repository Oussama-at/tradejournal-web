/**
 * CookieBanner — GDPR-style cookie consent banner.
 *
 * Features:
 *  • Compact bottom bar with "Accept All", "Reject All", "Customize"
 *  • Expandable panel for per-category toggles
 *  • Preferences persisted via getConsent / saveConsent (localStorage)
 *  • Necessary cookies are always on and cannot be toggled
 *  • Fires a custom event 'cookie-consent-saved' after decision
 */
import React, { useState, useEffect } from 'react';
import { useLang } from '../lang/LangContext';
import { getConsent, saveConsent, hasDecided } from '../utils/cookies';
import api from '../services/api';

// ── Toggle Switch ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#00e676' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? '#00c853' : 'rgba(255,255,255,0.15)'}`,
        transition: 'all 0.25s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? '#080c10' : 'rgba(255,255,255,0.5)',
        transition: 'left 0.25s',
      }} />
    </div>
  );
}

// ── Category row ───────────────────────────────────────────────────────────
function CookieRow({ label, desc, checked, onChange, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, padding: '12px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#e8edf3', marginBottom: 3 }}>
          {label} {disabled && <span style={{ fontSize: 10, color: '#3a6a4a', fontWeight: 400 }}>(always on)</span>}
        </div>
        <div style={{ fontSize: 11, color: '#5a7a9a', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ── CookieBanner ───────────────────────────────────────────────────────────
export default function CookieBanner() {
  const { t } = useLang();
  const [visible,   setVisible]   = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [consent,   setConsent]   = useState(() => getConsent());
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!hasDecided()) {
      // Small delay so the banner doesn't flash on first paint
      const id = setTimeout(() => {
        setAnimating(true);
        setVisible(true);
      }, 800);
      return () => clearTimeout(id);
    }
  }, []);

  function getVisitorId() {
    try {
      let id = localStorage.getItem('tj_visitor_id');
      if (!id) {
        id = 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('tj_visitor_id', id);
      }
      return id;
    } catch (e) {
      return null;
    }
  }

  function logConsent(c, decision) {
    try {
      api.post('/cookie-consent', {
        visitor_id: getVisitorId(),
        user_name: localStorage.getItem('username') || null,
        analytics: !!c.analytics,
        preferences: !!c.preferences,
        savedLogin: !!c.savedLogin,
        decision,
      }).catch(() => {});
    } catch (e) {}
  }

  function dismiss(updatedConsent, decision) {
    saveConsent(updatedConsent);
    logConsent(updatedConsent, decision);
    window.dispatchEvent(new CustomEvent('cookie-consent-saved', { detail: updatedConsent }));
    setAnimating(false);
    setTimeout(() => setVisible(false), 400);
  }

  function acceptAll() {
    const c = { ...consent, analytics: true, preferences: true, savedLogin: true };
    setConsent(c);
    dismiss(c, 'accept_all');
  }

  function rejectAll() {
    const c = { ...consent, analytics: false, preferences: false, savedLogin: false };
    setConsent(c);
    dismiss(c, 'reject_all');
  }

  function savePrefs() {
    dismiss(consent, 'custom');
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99990,
      padding: '0 16px 16px',
      transform: animating ? 'translateY(0)' : 'translateY(calc(100% + 24px))',
      transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
      pointerEvents: animating ? 'auto' : 'none',
    }}>
      <div style={{
        maxWidth: 820, margin: '0 auto',
        background: 'linear-gradient(160deg, #111820 0%, #0d1117 100%)',
        border: '1px solid rgba(0,230,118,0.2)',
        borderRadius: 18,
        boxShadow: '0 -4px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}>

        {/* ── Compact bar ── */}
        <div style={{
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          {/* Cookie icon + text */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🍪</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#e8edf3' }}>
                {t('cookie_title')}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#5a7a9a', lineHeight: 1.5, maxWidth: 460 }}>
              {t('cookie_desc')}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.05)', color: '#8aabb8',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              ⚙ {t('cookie_customize')}
            </button>
            <button
              onClick={rejectAll}
              style={{
                padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                fontWeight: 600, border: '1px solid rgba(255,71,87,0.3)',
                background: 'rgba(255,71,87,0.08)', color: '#ff5757',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,71,87,0.08)'}
            >
              {t('cookie_reject_all')}
            </button>
            <button
              onClick={acceptAll}
              style={{
                padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                fontWeight: 800, border: 'none',
                background: 'linear-gradient(135deg,#00e676,#00c853)',
                color: '#080c10', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ✓ {t('cookie_accept_all')}
            </button>
          </div>
        </div>

        {/* ── Expanded customise panel ── */}
        <div style={{
          maxHeight: expanded ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{
            padding: '0 24px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ paddingTop: 4 }}>
              <CookieRow
                label={t('cookie_necessary')}
                desc={t('cookie_necessary_desc')}
                checked={true}
                disabled={true}
                onChange={() => {}}
              />
              <CookieRow
                label={t('cookie_analytics')}
                desc={t('cookie_analytics_desc')}
                checked={consent.analytics}
                onChange={v => setConsent(c => ({ ...c, analytics: v }))}
              />
              <CookieRow
                label={t('cookie_preferences')}
                desc={t('cookie_preferences_desc')}
                checked={consent.preferences}
                onChange={v => setConsent(c => ({ ...c, preferences: v }))}
              />
              <CookieRow
                label={t('cookie_saved_login')}
                desc={t('cookie_saved_login_desc')}
                checked={consent.savedLogin}
                onChange={v => setConsent(c => ({ ...c, savedLogin: v }))}
              />
            </div>
            <button
              onClick={savePrefs}
              style={{
                marginTop: 16, padding: '10px 28px', borderRadius: 8, cursor: 'pointer',
                border: 'none', background: 'linear-gradient(135deg,#00e676,#00c853)',
                color: '#080c10', fontWeight: 800, fontSize: 14,
              }}
            >
              💾 {t('cookie_save_prefs')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
