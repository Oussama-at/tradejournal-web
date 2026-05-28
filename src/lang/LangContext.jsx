import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translations';

const LangContext = createContext(null);

const SUPPORTED = ['en', 'ar', 'fr'];

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

  function t(key) {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }

  function setLang(l) {
    if (SUPPORTED.includes(l)) setLangState(l);
  }

  // Cycle: en → ar → fr → en
  function toggleLang() {
    const idx = SUPPORTED.indexOf(lang);
    setLangState(SUPPORTED[(idx + 1) % SUPPORTED.length]);
  }

  return (
    <LangContext.Provider value={{ lang, isRTL, t, toggleLang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
