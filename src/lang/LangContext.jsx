import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translations';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('tj_lang') || 'en');

  const isRTL = lang === 'ar';

  // Apply RTL direction and font to document root
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

  function toggleLang() {
    setLang(l => l === 'en' ? 'ar' : 'en');
  }

  return (
    <LangContext.Provider value={{ lang, isRTL, t, toggleLang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
