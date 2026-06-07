import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import translations from './translations';

// ─── Convert flat translations.js → react-intl message maps ───────────────
// react-intl expects { id: 'string value' } flat maps per locale
function toIntlMessages(localeObj) {
  const out = {};
  for (const [k, v] of Object.entries(localeObj)) {
    out[k] = typeof v === 'string' ? v : String(v);
  }
  return out;
}

const messages = {
  en: toIntlMessages(translations.en),
  ar: toIntlMessages(translations.ar),
  fr: toIntlMessages(translations.fr),
};

// ─── LangContext (keeps same public API: { lang, isRTL, t, toggleLang, setLang }) ──
const LangContext = createContext(null);
const SUPPORTED = ['en', 'ar', 'fr'];

// Inner component — lives inside <IntlProvider>, so can call useIntl()
function LangInner({ children, lang }) {
  const intl = useIntl();

  function t(key, values) {
    // Graceful fallback: if key not found return the key itself
    try {
      return intl.formatMessage({ id: key, defaultMessage: key }, values);
    } catch {
      return key;
    }
  }

  return (
    <LangContext.Provider value={{ lang, isRTL: lang === 'ar', t, intl }}>
      {children}
    </LangContext.Provider>
  );
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('tj_lang');
    return SUPPORTED.includes(stored) ? stored : 'en';
  });

  const isRTL = lang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    document.body.style.fontFamily = isRTL
      ? "'Cairo', 'Segoe UI', sans-serif"
      : "var(--font-sans, 'Inter', 'Segoe UI', sans-serif)";
    localStorage.setItem('tj_lang', lang);
  }, [lang, isRTL]);

  function setLang(l) {
    if (SUPPORTED.includes(l)) setLangState(l);
  }

  function toggleLang() {
    const idx = SUPPORTED.indexOf(lang);
    setLangState(SUPPORTED[(idx + 1) % SUPPORTED.length]);
  }

  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <IntlProvider
      locale={locale}
      messages={messages[lang] || messages.en}
      defaultLocale="en-US"
      onError={() => {}} // suppress missing-message warnings gracefully
    >
      <LangInner lang={lang}>
        {/* Expose setLang / toggleLang through a second context value */}
        <LangActionsContext.Provider value={{ lang, isRTL, toggleLang, setLang }}>
          {children}
        </LangActionsContext.Provider>
      </LangInner>
    </IntlProvider>
  );
}

const LangActionsContext = createContext(null);

// ─── useLang: same API as before ─────────────────────────────────────────
export function useLang() {
  const inner = useContext(LangContext);
  const actions = useContext(LangActionsContext);
  if (!inner || !actions) throw new Error('useLang must be used within LangProvider');
  return {
    lang: actions.lang,
    isRTL: actions.isRTL,
    t: inner.t,
    intl: inner.intl,       // bonus: expose full intl object for advanced use
    toggleLang: actions.toggleLang,
    setLang: actions.setLang,
  };
}
