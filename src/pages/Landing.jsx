import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lang/LangContext';

// ─── Language Switcher (navbar version) ─────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English',  short: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية',  short: 'AR', flag: '🇲🇦' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
];

function NavLangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
          background: open ? 'rgba(0,230,118,0.1)' : 'var(--bg3)',
          border: `1px solid ${open ? 'rgba(0,230,118,0.35)' : 'var(--border)'}`,
          color: open ? 'var(--green)' : 'var(--text)',
          fontFamily: 'var(--font-main)', fontSize: 13, fontWeight: 700,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span>{current.short}</span>
        <span style={{ fontSize: 10, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display:'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', minWidth: 140, zIndex: 300,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}>
          {LANGUAGES.map((l, i) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: l.code === lang ? 'rgba(0,230,118,0.08)' : 'transparent',
              border: 'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              color: l.code === lang ? 'var(--green)' : 'var(--text)',
              cursor: 'pointer', fontSize: 13, fontWeight: l.code === lang ? 700 : 500,
              fontFamily: 'var(--font-main)',
            }}>
              <span style={{ fontSize: 18 }}>{l.flag}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{l.label}</span>
              {l.code === lang && <span style={{ fontSize: 10, color: 'var(--green)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Video Presentation content per language ────────────────────────────────
const VIDEO_CONTENT = {
  ar: {
    dir: 'rtl',
    font: "'Cairo','Segoe UI',sans-serif",
    slides: [
      {
        id: 0, label: 'البداية',
        caption: 'مرحباً بك في TradeJournal PRO — المنصة الاحترافية للمتداولين الجادين.',
        voice: 'مرحباً بكم في TradeJournal PRO. المنصة الاحترافية المصممة للمتداولين الجادين الذين يريدون تحسين أدائهم. في هذا العرض سنكتشف معاً جميع ميزات المنصة.',
      },
      {
        id: 1, label: 'لوحة التحكم',
        caption: 'لوحة التحكم — نظرة شاملة على أدائك في لمحة واحدة.',
        voice: 'أول ما يستقبلك هو لوحة التحكم الرئيسية. في نظرة واحدة ترى إجمالي أرباحك، نسبة الفوز، عدد الصفقات، ورأس مالك الحالي. الرسم البياني التراكمي يُظهر تطور أدائك على مدار الشهر.',
      },
      {
        id: 2, label: 'تسجيل الصفقات',
        caption: 'تسجيل الصفقات — أدخل كل تفاصيل صفقتك بسهولة وسرعة.',
        voice: 'تسجيل الصفقات أصبح سهلاً وسريعاً. اختر السوق، حدد اتجاه الصفقة شراء أو بيع، أدخل سعر الدخول والخروج والمبلغ والجلسة. ستظهر لك معاينة فورية للأرباح قبل الحفظ.',
      },
      {
        id: 3, label: 'التحليلات',
        caption: 'تحليلات P&L — تعرّف على أنماطك وأفضل أوقات تداولك.',
        voice: 'قسم التحليلات يمنحك رؤية عميقة في أدائك. شاهد الأداء الشهري، وتعرّف على أي الجلسات تحقق لك أفضل النتائج. أفضل يوم وأسوأ يوم ونسبة الفوز الكلية أمامك دائماً.',
      },
      {
        id: 4, label: 'التقويم',
        caption: 'التقويم البصري — تتبع أنماطك اليومية بنظرة واحدة.',
        voice: 'التقويم البصري يُحوّل سجل صفقاتك إلى خريطة بصرية واضحة. الأيام الخضراء أيام فوز والحمراء خسارة. رصيد السلسلة الحالية يحفزك على الاستمرار.',
      },
      {
        id: 5, label: 'رأس المال',
        caption: 'إدارة رأس المال — تتبع نمو استثمارك وعوائدك بدقة.',
        voice: 'إدارة رأس المال أداة لا غنى عنها لأي متداول جاد. تتبع رأس مالك المبدئي والأرباح المحققة والمسحوبات. نسبة العائد على الاستثمار واضحة في كل وقت.',
      },
      {
        id: 6, label: 'الأسعار',
        caption: 'الأسعار — ابدأ مجاناً أو احصل على وصول مدى الحياة بسعر خاص.',
        voice: 'لديك خياران. الأول تجربة مجانية لمدة 24 ساعة كاملة بدون بطاقة ائتمانية. والثاني خطة مدى الحياة بسعر 700 درهم فقط بدلاً من 1000 درهم. خصم 30 بالمئة لفترة محدودة.',
      },
      {
        id: 7, label: 'الختام',
        caption: 'TradeJournal PRO — ابدأ اليوم وارتقِ بمستواك في التداول.',
        voice: 'هذا ملخص ما تقدمه منصة TradeJournal PRO. يوميات صفقات احترافية، تحليلات متقدمة، تقويم بصري وإدارة رأس مال. لا تنتظر. ابدأ تجربتك المجانية الآن وانضم إلى المتداولين المحترفين. شكراً لمشاهدتكم.',
      },
    ],
  },
  en: {
    dir: 'ltr',
    font: "var(--font-main,'Plus Jakarta Sans',sans-serif)",
    slides: [
      {
        id: 0, label: 'Intro',
        caption: 'Welcome to TradeJournal PRO — the professional platform for serious traders.',
        voice: 'Welcome to TradeJournal PRO. The professional trading platform built for serious traders who want to improve their performance. In this walkthrough we will explore all the key features of the platform.',
      },
      {
        id: 1, label: 'Dashboard',
        caption: 'Dashboard — your complete performance overview at a glance.',
        voice: 'The first thing you see when you log in is the main dashboard. In one view you see your total P&L, win rate, trade count, and current capital. The cumulative chart shows how your performance evolves throughout the month.',
      },
      {
        id: 2, label: 'Add Trade',
        caption: 'Log Trades — record every trade detail quickly and accurately.',
        voice: 'Logging trades is fast and simple. Choose your market, set the direction — buy or sell, enter your entry and close price, amount, and session. You get an instant preview of your profit or loss before saving.',
      },
      {
        id: 3, label: 'Analytics',
        caption: 'P&L Analytics — discover your patterns and best trading sessions.',
        voice: 'The analytics section gives you deep insight into your performance. View monthly results, and find out which sessions produce your best trades. Best day, worst day, and overall win rate are always visible.',
      },
      {
        id: 4, label: 'Calendar',
        caption: 'Visual Calendar — track your daily patterns at a glance.',
        voice: 'The visual calendar turns your trade log into a clear daily map. Green days are wins, red days are losses. Your current winning streak is tracked to keep you motivated.',
      },
      {
        id: 5, label: 'Capital',
        caption: 'Capital Tracking — monitor your investment growth and returns precisely.',
        voice: 'Capital tracking is an essential tool for any serious trader. Track your starting capital, realized profits, and withdrawals. Your return on investment is always visible and up to date.',
      },
      {
        id: 6, label: 'Pricing',
        caption: 'Pricing — start free or get lifetime access at a special price.',
        voice: 'You have two options. First, a fully free 24-hour trial with no credit card required. Second, the Lifetime plan at just 700 Dirhams instead of 1000. That is a 30 percent discount for a limited time.',
      },
      {
        id: 7, label: 'Ready',
        caption: 'TradeJournal PRO — start today and elevate your trading.',
        voice: 'That wraps up everything TradeJournal PRO has to offer. Professional trade journaling, advanced analytics, visual calendar, and capital management — all in one place. Do not wait. Start your free trial now and join professional traders. Thank you for watching.',
      },
    ],
  },
  fr: {
    dir: 'ltr',
    font: "var(--font-main,'Plus Jakarta Sans',sans-serif)",
    slides: [
      {
        id: 0, label: 'Intro',
        caption: 'Bienvenue sur TradeJournal PRO — la plateforme professionnelle pour traders sérieux.',
        voice: 'Bienvenue sur TradeJournal PRO. La plateforme de trading professionnelle conçue pour les traders sérieux qui souhaitent améliorer leurs performances. Dans cette présentation, nous allons explorer toutes les fonctionnalités clés.',
      },
      {
        id: 1, label: 'Tableau',
        caption: 'Tableau de bord — vue complète de vos performances en un coup d\'œil.',
        voice: 'La première chose que vous voyez en vous connectant est le tableau de bord principal. En un seul écran, vous voyez votre P&L total, taux de réussite, nombre de trades et capital actuel. Le graphique cumulatif montre l\'évolution de vos performances sur le mois.',
      },
      {
        id: 2, label: 'Trades',
        caption: 'Enregistrer un trade — saisissez tous les détails rapidement et avec précision.',
        voice: 'Enregistrer vos trades est rapide et simple. Choisissez votre marché, définissez la direction achat ou vente, saisissez le prix d\'entrée, de clôture, le montant et la session. Vous obtenez un aperçu instantané de votre gain ou perte avant de sauvegarder.',
      },
      {
        id: 3, label: 'Analyses',
        caption: 'Analyses P&L — découvrez vos modèles et meilleures sessions de trading.',
        voice: 'La section analyse vous donne un aperçu approfondi de vos performances. Consultez les résultats mensuels et découvrez quelles sessions produisent vos meilleurs trades. La meilleure journée, la pire journée et le taux de réussite global sont toujours visibles.',
      },
      {
        id: 4, label: 'Calendrier',
        caption: 'Calendrier visuel — suivez vos tendances quotidiennes d\'un simple regard.',
        voice: 'Le calendrier visuel transforme votre journal de trades en une carte quotidienne claire. Les jours verts sont des gains, les rouges des pertes. Votre série de victoires actuelle est suivie pour vous garder motivé.',
      },
      {
        id: 5, label: 'Capital',
        caption: 'Suivi du capital — surveillez la croissance de votre investissement avec précision.',
        voice: 'Le suivi du capital est un outil indispensable pour tout trader sérieux. Suivez votre capital initial, vos profits réalisés et vos retraits. Votre retour sur investissement est toujours visible et à jour.',
      },
      {
        id: 6, label: 'Tarifs',
        caption: 'Tarifs — commencez gratuitement ou obtenez un accès à vie à prix spécial.',
        voice: 'Vous avez deux options. D\'abord, un essai gratuit complet de 24 heures sans carte de crédit requise. Ensuite, le plan à vie à seulement 700 Dirhams au lieu de 1000. C\'est 30 pourcent de réduction pour une durée limitée.',
      },
      {
        id: 7, label: 'Prêt',
        caption: 'TradeJournal PRO — commencez aujourd\'hui et élevez votre trading.',
        voice: 'Voilà tout ce que TradeJournal PRO a à offrir. Journal de trades professionnel, analyses avancées, calendrier visuel et gestion du capital. N\'attendez plus. Commencez votre essai gratuit maintenant et rejoignez les traders professionnels. Merci de votre attention.',
      },
    ],
  },
};

// ─── FEATURES per lang ───────────────────────────────────────────────────────
const FEATURES_DATA = {
  ar: [
    { icon: '📊', title: 'يوميات الصفقات', desc: 'سجّل كل صفقة مع الدخول والخروج، لقطات الشاشة، السوق والجلسة والنتيجة. لا تفوّت أي تفصيل.', stat: '127+ صفقة' },
    { icon: '📈', title: 'تحليلات P&L', desc: 'رسوم P&L تراكمية، نسبة الفوز، أفضل وأسوأ جلسات وتفاصيل أداء الأسواق.', stat: '+68% نسبة فوز' },
    { icon: '💰', title: 'تتبع رأس المال', desc: 'تتبع تطور رأس مالك، العائد على الاستثمار والمسحوبات عبر دورات رأس مال متعددة.', stat: '+24% عائد' },
    { icon: '📅', title: 'تقويم بصري', desc: 'تقويم الصفقات البصري يُظهر أداءك اليومي في لمحة — اكتشف الأنماط بسرعة.', stat: '4 🔥 سلسلة' },
  ],
  en: [
    { icon: '📊', title: 'Trade Journal', desc: 'Log every trade with entry/exit, screenshots, market, session and result. Never miss a detail.', stat: '127+ trades' },
    { icon: '📈', title: 'P&L Analytics', desc: 'Real-time cumulative P&L charts, win rate, best/worst sessions and market performance breakdowns.', stat: '+68% win rate' },
    { icon: '💰', title: 'Capital Tracking', desc: 'Track your capital evolution, ROI and withdrawals across multiple capital cycles.', stat: '+24% ROI' },
    { icon: '📅', title: 'Calendar View', desc: 'Visual trade calendar showing your daily performance at a glance — spot patterns fast.', stat: '4 🔥 streak' },
  ],
  fr: [
    { icon: '📊', title: 'Journal de trades', desc: 'Enregistrez chaque trade avec entrée/sortie, captures, marché, session et résultat. Ne manquez aucun détail.', stat: '127+ trades' },
    { icon: '📈', title: 'Analyses P&L', desc: 'Graphiques P&L cumulatifs, taux de réussite, meilleures/pires sessions et analyses de marché.', stat: '+68% réussite' },
    { icon: '💰', title: 'Suivi du capital', desc: 'Suivez l\'évolution de votre capital, ROI et retraits sur plusieurs cycles.', stat: '+24% ROI' },
    { icon: '📅', title: 'Calendrier visuel', desc: 'Calendrier visuel affichant vos performances quotidiennes en un coup d\'œil.', stat: '4 🔥 série' },
  ],
};

const PACKS_DATA = {
  ar: {
    trial: { name: 'تجربة 24 ساعة', price: 'مجاناً', priceClass: 'free', desc: 'جرّب المنصة كاملة 24 ساعة. لا بطاقة مطلوبة.', features: ['وصول كامل', 'يوميات الصفقات', 'رسوم P&L', 'مقيّد بـ 24 ساعة'], cta: 'ابدأ التجربة المجانية', ctaClass: 'btn-ghost' },
    lifetime: { name: 'مدى الحياة', price: '700', orig: '1000', currency: 'DH', period: ' مرة واحدة', discount: '🔥 -30%', desc: 'ادفع مرة واحدة واستخدم للأبد.', features: ['كل شيء مشمول', 'وصول مدى الحياة', 'جميع الميزات المستقبلية', 'دعم VIP'], cta: 'احصل على العرض 💬', ctaClass: 'btn-gold', badge: 'الأفضل قيمة', whatsapp: true },
  },
  en: {
    trial: { name: '24h Trial', price: 'FREE', priceClass: 'free', desc: 'Try the full platform for 24 hours. No card required.', features: ['Full access', 'Trade journal', 'P&L charts', 'Limited to 24 hours'], cta: 'Start Free Trial', ctaClass: 'btn-ghost' },
    lifetime: { name: 'Lifetime', price: '700', orig: '1000', currency: 'DH', period: ' once', discount: '🔥 -30%', desc: 'Pay once, use forever. The ultimate trading companion.', features: ['Everything included', 'Lifetime access', 'All future features', 'VIP Support'], cta: 'Get the deal 💬', ctaClass: 'btn-gold', badge: 'Best Value', whatsapp: true },
  },
  fr: {
    trial: { name: 'Essai 24h', price: 'GRATUIT', priceClass: 'free', desc: 'Testez la plateforme complète pendant 24 heures. Aucune carte requise.', features: ['Accès complet', 'Journal de trades', 'Graphiques P&L', 'Limité à 24 heures'], cta: 'Commencer l\'essai gratuit', ctaClass: 'btn-ghost' },
    lifetime: { name: 'À vie', price: '700', orig: '1000', currency: 'DH', period: ' une fois', discount: '🔥 -30%', desc: 'Payez une fois, utilisez pour toujours.', features: ['Tout inclus', 'Accès à vie', 'Toutes les futures fonctionnalités', 'Support VIP'], cta: 'Profiter de la promo 💬', ctaClass: 'btn-gold', badge: 'Meilleure valeur', whatsapp: true },
  },
};

const UI_TEXT = {
  ar: {
    hero_eyebrow: 'يوميات التداول المحترف',
    hero_h1_1: 'سجّل. حلّل.',
    hero_h1_2: 'تداول بذكاء.',
    hero_sub: 'المنصة الاحترافية للمتداولين الجادين — تتبع صفقاتك، حلّل أداءك، ونمّي رأس مالك في مكان واحد.',
    cta_primary: '🚀 ابدأ مجاناً',
    cta_secondary: '▶ شاهد العرض',
    section_video_label: 'اكتشف المنصة',
    section_video_title: 'كل ما تحتاجه لتتبع صفقاتك',
    section_video_sub: 'شاهد كيف يساعدك TradeJournal PRO على الانضباط وتحليل الأنماط وتحسين أدائك.',
    section_features_label: 'الميزات',
    section_features_title: 'مصمّم للمتداولين الجادين',
    section_features_sub: 'كل ميزة صُممت بهدف واحد: مساعدتك لتكون متداولاً أفضل وأكثر ثباتاً.',
    section_pricing_label: 'الأسعار',
    section_pricing_title: 'اختر خطتك',
    section_pricing_sub: 'ابدأ مجاناً 24 ساعة، ثم اختر الخطة التي تناسبك. لا رسوم خفية.',
    pricing_whatsapp: '💬 الدفع عبر واتساب',
    cta_section_eyebrow: 'مقاعد محدودة',
    cta_section_h1_1: 'جاهز لترقية',
    cta_section_h1_2: 'تداولك؟',
    cta_section_sub: 'انضم إلى المتداولين الذين يستخدمون TradeJournal PRO للثبات والنمو. ابدأ مجاناً — لا حاجة لبطاقة.',
    footer_copy: '© 2025 TradeJournal PRO. جميع الحقوق محفوظة.',
    footer_signin: 'تسجيل الدخول',
    footer_pricing: 'الأسعار',
    signin: 'تسجيل الدخول',
    get_started: 'ابدأ الآن',
    already_have: 'لدي حساب بالفعل',
    video_voice_btn: '🔊 صوت',
    video_mute_btn: '🔇 كتم',
    video_script_btn: '📄 النص',
    stat1_val: '127+', stat1_lbl: 'متداول نشط',
    stat2_val: '68%',  stat2_lbl: 'متوسط نسبة الفوز',
    stat3_val: '+24%', stat3_lbl: 'متوسط العائد',
  },
  en: {
    hero_eyebrow: 'Professional Trading Journal',
    hero_h1_1: 'Track. Analyze.',
    hero_h1_2: 'Trade Smarter.',
    hero_sub: 'The professional trading journal for serious traders — log trades, analyze performance, and grow your capital in one place.',
    cta_primary: '🚀 Get Started Free',
    cta_secondary: '▶ Watch Demo',
    section_video_label: 'See It In Action',
    section_video_title: 'Everything you need to track your trades',
    section_video_sub: 'Watch how TradeJournal PRO helps traders stay disciplined, analyze patterns and improve their performance over time.',
    section_features_label: 'Features',
    section_features_title: 'Built for serious traders',
    section_features_sub: 'Every feature designed with one goal: help you become a better, more consistent trader.',
    section_pricing_label: 'Pricing',
    section_pricing_title: 'Choose your plan',
    section_pricing_sub: 'Start free for 24h, then pick a plan that fits your journey. No hidden fees.',
    pricing_whatsapp: '💬 Payment via WhatsApp',
    cta_section_eyebrow: 'Limited spots available',
    cta_section_h1_1: 'Ready to level up',
    cta_section_h1_2: 'your trading?',
    cta_section_sub: 'Join traders who use TradeJournal PRO to stay consistent and grow. Start free — no credit card needed.',
    footer_copy: '© 2025 TradeJournal PRO. All rights reserved.',
    footer_signin: 'Sign In',
    footer_pricing: 'Pricing',
    signin: 'Sign In',
    get_started: 'Get Started',
    already_have: 'Already have an account',
    video_voice_btn: '🔊 Voice',
    video_mute_btn: '🔇 Mute',
    video_script_btn: '📄 Script',
    stat1_val: '127+', stat1_lbl: 'Active traders',
    stat2_val: '68%',  stat2_lbl: 'Avg win rate',
    stat3_val: '+24%', stat3_lbl: 'Avg return',
  },
  fr: {
    hero_eyebrow: 'Journal de Trading Professionnel',
    hero_h1_1: 'Enregistrez. Analysez.',
    hero_h1_2: 'Tradez mieux.',
    hero_sub: 'La plateforme professionnelle pour traders sérieux — suivez vos trades, analysez vos performances et faites croître votre capital.',
    cta_primary: '🚀 Commencer gratuitement',
    cta_secondary: '▶ Voir la démo',
    section_video_label: 'Découvrez la plateforme',
    section_video_title: 'Tout ce dont vous avez besoin pour suivre vos trades',
    section_video_sub: 'Découvrez comment TradeJournal PRO aide les traders à rester disciplinés et à améliorer leurs performances.',
    section_features_label: 'Fonctionnalités',
    section_features_title: 'Conçu pour les traders sérieux',
    section_features_sub: 'Chaque fonctionnalité est conçue avec un objectif : vous aider à devenir un meilleur trader.',
    section_pricing_label: 'Tarifs',
    section_pricing_title: 'Choisissez votre plan',
    section_pricing_sub: 'Commencez gratuitement pendant 24h, puis choisissez le plan qui vous convient. Aucun frais caché.',
    pricing_whatsapp: '💬 Paiement via WhatsApp',
    cta_section_eyebrow: 'Places limitées',
    cta_section_h1_1: 'Prêt à améliorer',
    cta_section_h1_2: 'votre trading ?',
    cta_section_sub: 'Rejoignez les traders qui utilisent TradeJournal PRO pour rester cohérents et progresser. Commencez gratuitement.',
    footer_copy: '© 2025 TradeJournal PRO. Tous droits réservés.',
    footer_signin: 'Se connecter',
    footer_pricing: 'Tarifs',
    signin: 'Se connecter',
    get_started: 'Commencer',
    already_have: 'J\'ai déjà un compte',
    video_voice_btn: '🔊 Voix',
    video_mute_btn: '🔇 Muet',
    video_script_btn: '📄 Script',
    stat1_val: '127+', stat1_lbl: 'Traders actifs',
    stat2_val: '68%',  stat2_lbl: 'Taux de réussite moy.',
    stat3_val: '+24%', stat3_lbl: 'Rendement moyen',
  },
};

// ─── DEMO VIDEO PLAYER ───────────────────────────────────────────────────────
function DemoVideoPlayer({ lang }) {
  const content = VIDEO_CONTENT[lang] || VIDEO_CONTENT.en;
  const ui      = UI_TEXT[lang] || UI_TEXT.en;
  const slides  = content.slides;
  const DURATION = 7000;
  const TICK     = 80;

  const [current,  setCurrent]  = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [voiceOn,  setVoiceOn]  = useState(false);
  const [showScript, setShowScript] = useState(false);
  const timerRef   = useRef(null);
  const progRef    = useRef(0);
  const synthRef   = useRef(null);
  const prevLang   = useRef(lang);

  // Reset when lang changes
  useEffect(() => {
    if (prevLang.current !== lang) {
      stopVoice();
      prevLang.current = lang;
      progRef.current = 0;
      setProgress(0);
      setCurrent(0);
    }
  }, [lang]);

  const stopVoice = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakSlide = useCallback((idx, lc) => {
    if (!voiceOn) return;
    const c = VIDEO_CONTENT[lc] || VIDEO_CONTENT.en;
    const text = c.slides[idx]?.voice;
    if (!text || !window.speechSynthesis) return;
    stopVoice();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lc === 'ar' ? 'ar-SA' : lc === 'fr' ? 'fr-FR' : 'en-US';
    utt.rate = 0.92;
    utt.pitch = 1;
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [voiceOn, stopVoice]);

  const goSlide = useCallback((n, lc) => {
    const l = lc || lang;
    progRef.current = 0;
    setProgress(0);
    setCurrent(n);
    if (voiceOn) speakSlide(n, l);
  }, [lang, voiceOn, speakSlide]);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      progRef.current += TICK;
      const pct = Math.min(100, (progRef.current / DURATION) * 100);
      setProgress(pct);
      if (progRef.current >= DURATION) {
        progRef.current = 0;
        setCurrent(c => {
          const next = (c + 1) % slides.length;
          if (voiceOn) speakSlide(next, lang);
          return next;
        });
      }
    }, TICK);
  }, [slides.length, voiceOn, speakSlide, lang]);

  useEffect(() => {
    const t = setTimeout(() => { setPlaying(true); startTimer(); }, 1500);
    return () => { clearTimeout(t); clearInterval(timerRef.current); stopVoice(); };
  }, [startTimer, stopVoice]);

  const togglePlay = () => {
    if (playing) { clearInterval(timerRef.current); stopVoice(); setPlaying(false); }
    else { setPlaying(true); startTimer(); if (voiceOn) speakSlide(current, lang); }
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) { stopVoice(); }
    else if (playing) { speakSlide(current, lang); }
  };

  const seekProgress = (e, el) => {
    const rect = el.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progRef.current = pct * DURATION;
    setProgress(pct * 100);
  };

  const isRTL = lang === 'ar';
  const s = {
    bg:    { background: 'var(--bg)' },
    bg2:   { background: 'var(--bg2)' },
    bg3:   { background: 'var(--bg3)' },
    card3: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 },
    lbl:   { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 5 },
    val:   { fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 17, lineHeight: 1 },
    muted: { color: 'var(--muted)' },
    mono:  { fontFamily: 'var(--font-mono)' },
  };

  const StatCard = ({ lbl, val, color, sub }) => (
    <div style={{ ...s.card3, flex: 1 }}>
      <div style={s.lbl}>{lbl}</div>
      <div style={{ ...s.val, color }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
    </div>
  );

  const TradeRow = ({ market, type, win, amount, date }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 11, direction: 'ltr' }}>
      <span style={{ fontWeight: 800, width: 60, flexShrink: 0 }}>{market}</span>
      <span style={{ color: type === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 700, width: 32, flexShrink: 0 }}>{type}</span>
      <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: win ? 'rgba(0,230,118,0.12)' : 'rgba(255,71,87,0.12)', color: win ? 'var(--green)' : 'var(--red)' }}>{win ? 'WIN' : 'LOSE'}</span>
      <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>{date}</span>
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 800, color: win ? 'var(--green)' : 'var(--red)' }}>{amount}</span>
    </div>
  );

  const tl = {
    ar: { dash: 'لوحة التحكم', addTrade: 'إضافة صفقة', analytics: 'التحليلات', calendar: 'التقويم', capital: 'رأس المال', pricing: 'الأسعار', market: 'السوق', entry: 'سعر الدخول', close: 'سعر الإغلاق', amount: 'المبلغ', session: 'الجلسة', buy: 'شراء', sell: 'بيع', save: '💾 حفظ الصفقة', preview: 'معاينة', totalPnl: 'إجمالي P&L', winRate: 'نسبة الفوز', bestDay: 'أفضل يوم', worstDay: 'أسوأ يوم', monthly: 'الأداء الشهري', lonSession: 'لندن', nySession: 'نيويورك', asiSession: 'آسيا', junLabel: 'يونيو 2025', winLabel: 'فوز', loseLabel: 'خسارة', bestDayLbl: 'أفضل يوم', consistency: 'الاتساق', streak: 'السلسلة', activeCap: 'رأس المال الحالي', initCap: 'رأس المال المبدئي', profitReal: 'الأرباح المحققة', withdrawals: 'المسحوبات', trialName: 'تجربة مجانية', lifetimeName: 'مدى الحياة', freeLabel: 'مجاناً', discount: '🔥 -30%', bestVal: 'أفضل قيمة', via: '💬 واتساب', getPlan: 'احصل على العرض', start: 'ابدأ', allInc: '✓ وصول كامل\n✓ صفقات غير محدودة\n✓ تحليلات متقدمة', cumChart: 'P&L التراكمي' },
    en: { dash: 'Dashboard', addTrade: 'Add Trade', analytics: 'Analytics', calendar: 'Calendar', capital: 'Capital', pricing: 'Pricing', market: 'Market', entry: 'Entry Price', close: 'Close Price', amount: 'Amount ($)', session: 'Session', buy: 'BUY', sell: 'SELL', save: '💾 Save Trade', preview: 'pts preview', totalPnl: 'Total P&L', winRate: 'Win Rate', bestDay: 'Best Day', worstDay: 'Worst Day', monthly: 'Monthly Performance', lonSession: 'London', nySession: 'New York', asiSession: 'Asia', junLabel: 'June 2025', winLabel: 'WIN', loseLabel: 'LOSE', bestDayLbl: 'Best Day', consistency: 'Consistency', streak: 'Streak', activeCap: 'Active Capital', initCap: 'Starting Capital', profitReal: 'Realized Profit', withdrawals: 'Withdrawals', trialName: '24h Trial', lifetimeName: 'Lifetime', freeLabel: 'FREE', discount: '🔥 -30%', bestVal: 'Best Value', via: '💬 WhatsApp', getPlan: 'Get the deal', start: 'Start', allInc: '✓ Full access\n✓ Unlimited trades\n✓ Advanced analytics', cumChart: 'Cumulative P&L' },
    fr: { dash: 'Tableau', addTrade: 'Ajouter', analytics: 'Analyses', calendar: 'Calendrier', capital: 'Capital', pricing: 'Tarifs', market: 'Marché', entry: 'Prix entrée', close: 'Prix clôture', amount: 'Montant ($)', session: 'Session', buy: 'ACHAT', sell: 'VENTE', save: '💾 Sauvegarder', preview: 'pts aperçu', totalPnl: 'P&L Total', winRate: 'Taux réussite', bestDay: 'Meilleur jour', worstDay: 'Pire jour', monthly: 'Performance mensuelle', lonSession: 'Londres', nySession: 'New York', asiSession: 'Asie', junLabel: 'Juin 2025', winLabel: 'GAIN', loseLabel: 'PERTE', bestDayLbl: 'Meilleur jour', consistency: 'Consistance', streak: 'Série', activeCap: 'Capital actuel', initCap: 'Capital initial', profitReal: 'Profit réalisé', withdrawals: 'Retraits', trialName: 'Essai 24h', lifetimeName: 'À vie', freeLabel: 'GRATUIT', discount: '🔥 -30%', bestVal: 'Meilleure valeur', via: '💬 WhatsApp', getPlan: 'Profiter', start: 'Commencer', allInc: '✓ Accès complet\n✓ Trades illimités\n✓ Analyses avancées', cumChart: 'P&L Cumulatif' },
  };
  const L = tl[lang] || tl.en;

  const navLabels = [L.dash, L.addTrade, L.analytics, L.calendar, L.capital, L.pricing];

  const slideViews = [
    // 0 Dashboard
    <div key={0} style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', direction: 'ltr' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl="P&L" val="+$4,820" color="var(--green)" sub="↑ Jun" />
        <StatCard lbl="Win %" val="68.4%" color="var(--green)" sub="87W/40L" />
        <StatCard lbl="Trades" val="127" color="var(--blue)" sub="Jun" />
        <StatCard lbl="Capital" val="$24,820" color="var(--text)" sub="+24.1%" />
      </div>
      <div style={{ ...s.card3, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: 'var(--muted)' }}>{L.cumChart}</div>
        <svg width="100%" height="80" viewBox="0 0 500 80" preserveAspectRatio="none">
          <defs><linearGradient id="pg0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00e676" stopOpacity="0.22"/><stop offset="100%" stopColor="#00e676" stopOpacity="0"/></linearGradient></defs>
          <path d="M0 72 L40 65 L80 55 L120 60 L160 46 L200 36 L240 42 L280 28 L320 20 L360 24 L400 11 L460 6 L500 4 L500 80 L0 80Z" fill="url(#pg0)"/>
          <path d="M0 72 L40 65 L80 55 L120 60 L160 46 L200 36 L240 42 L280 28 L320 20 L360 24 L400 11 L460 6 L500 4" fill="none" stroke="#00e676" strokeWidth="2"/>
          <circle cx="500" cy="4" r="3.5" fill="#00e676"/>
        </svg>
      </div>
      <div style={s.card3}>
        <TradeRow market="NAS100" type="BUY"  win={true}  amount="+$320" date="14 Jun"/>
        <TradeRow market="XAUUSD" type="SELL" win={true}  amount="+$185" date="13 Jun"/>
        <TradeRow market="US30"   type="BUY"  win={false} amount="-$95"  date="12 Jun"/>
      </div>
    </div>,

    // 1 Add Trade
    <div key={1} style={{ display: 'flex', flexDirection: 'column', gap: 9, direction: 'ltr' }}>
      <div style={s.card3}>
        <div style={s.lbl}>{L.market}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['NAS100','XAUUSD','US30','EURUSD'].map(m => (
            <span key={m} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 800, background: m === 'NAS100' ? 'var(--green)' : 'var(--bg4)', color: m === 'NAS100' ? '#080c10' : 'var(--muted)' }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, padding: 10, borderRadius: 6, textAlign: 'center', fontWeight: 800, fontSize: 13, background: 'rgba(0,230,118,0.2)', color: 'var(--green)' }}>▲ {L.buy}</div>
        <div style={{ flex: 1, padding: 10, borderRadius: 6, textAlign: 'center', fontWeight: 800, fontSize: 13, background: 'var(--bg3)', color: 'var(--muted)' }}>▼ {L.sell}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[[L.entry,'17,842.50',true],[L.close,'18,012.00',false],[L.amount,'320.00',false],[L.session,'LON',false]].map(([lbl,val,focus]) => (
          <div key={lbl}><div style={s.lbl}>{lbl}</div><div style={{ background: 'var(--bg3)', border: `1px solid ${focus ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{val}</div></div>
        ))}
      </div>
      <div style={{ background: 'rgba(0,230,118,0.08)', borderRadius: 6, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>+169.50 {L.preview}</div>
      <div style={{ background: 'var(--green)', color: '#080c10', borderRadius: 6, padding: 10, textAlign: 'center', fontWeight: 900, fontSize: 13 }}>{L.save}</div>
    </div>,

    // 2 Analytics
    <div key={2} style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', direction: 'ltr' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl={L.totalPnl} val="+$4,820" color="var(--green)"/>
        <StatCard lbl={L.winRate}  val="68.4%"   color="var(--green)"/>
        <StatCard lbl={L.bestDay}  val="+$920"   color="var(--blue)"/>
        <StatCard lbl={L.worstDay} val="-$310"   color="var(--red)"/>
      </div>
      <div style={{ ...s.card3, flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, color: 'var(--muted)' }}>{L.monthly}</div>
        <svg width="100%" height="80" viewBox="0 0 520 80">
          <defs><linearGradient id="bg1a" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#00e676" stopOpacity="0.8"/><stop offset="100%" stopColor="#00e676" stopOpacity="0.4"/></linearGradient><linearGradient id="br1a" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ff4757" stopOpacity="0.8"/><stop offset="100%" stopColor="#ff4757" stopOpacity="0.4"/></linearGradient></defs>
          {[[10,28,46],[70,8,66],[130,48,26],[190,18,56],[250,34,40],[310,54,20],[370,6,68],[430,14,60]].map(([x,y,h],i) => (
            <rect key={i} x={x} y={y} width={38} height={h} rx={3} fill={[2,5].includes(i) ? 'url(#br1a)' : 'url(#bg1a)'}/>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[[L.lonSession,'$2,840',75,'var(--green)'],[L.nySession,'$1,520',45,'var(--blue)'],[L.asiSession,'$460',20,'var(--orange)']].map(([ss,v,w,c]) => (
          <div key={ss} style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{ss}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13, color: c }}>{v}</div>
            <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 99, marginTop: 5 }}><div style={{ width: `${w}%`, height: '100%', background: c, borderRadius: 99 }}/></div>
          </div>
        ))}
      </div>
    </div>,

    // 3 Calendar
    <div key={3} style={{ display: 'flex', flexDirection: 'column', gap: 10, direction: 'ltr' }}>
      <div style={s.card3}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>{L.junLabel}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(0,230,118,0.1)', borderRadius: 4, color: 'var(--green)', fontWeight: 800 }}>17 {L.winLabel}</span>
            <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,71,87,0.1)', borderRadius: 4, color: 'var(--red)', fontWeight: 800 }}>7 {L.loseLabel}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} style={{ fontSize: 9, textAlign: 'center', color: 'var(--muted)', fontWeight: 700, paddingBottom: 3 }}>{d}</div>)}
          {[null,null,null,null,null,null,null,'w','w','l','w','w',null,null,'w','l','w','w','w',null,null,'l','w','w','l','w',null,null,'w','w','l','w','w',null,null,'w'].map((v,i) => {
            const day = i - 6;
            return <div key={i} style={{ aspectRatio:1, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: v === 'w' ? 'rgba(0,230,118,0.15)' : v === 'l' ? 'rgba(255,71,87,0.12)' : 'var(--bg4)', color: v === 'w' ? 'var(--green)' : v === 'l' ? 'var(--red)' : 'var(--dim)', fontSize: 10, fontWeight: 600 }}>{day > 0 && day <= 30 ? day : ''}</div>;
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl={L.bestDayLbl}  val="+$920" color="var(--green)" sub="Thu 17"/>
        <StatCard lbl={L.consistency} val="70.8%" color="var(--blue)"  sub="profitable days"/>
        <StatCard lbl={L.streak}      val="4 🔥"  color="var(--orange)" sub="in a row"/>
      </div>
    </div>,

    // 4 Capital
    <div key={4} style={{ display: 'flex', flexDirection: 'column', gap: 10, direction: 'ltr' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl={L.activeCap} val="$24,820" color="var(--green)" sub="+$4,820"/>
        <StatCard lbl={L.initCap}   val="$20,000" color="var(--text)"  sub="ROI +24.1%"/>
      </div>
      <div style={s.card3}>
        {[[L.initCap,'$20,000',80,'var(--blue)'],[L.profitReal,'+$4,820',24,'var(--green)'],[L.withdrawals,'-$1,200',6,'var(--orange)']].map(([lbl,val,w,c]) => (
          <div key={lbl} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)' }}>{lbl}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: c }}>{val}</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 99 }}><div style={{ width: `${w}%`, height: '100%', background: c, borderRadius: 99 }}/></div>
          </div>
        ))}
      </div>
      <div style={{ ...s.card3, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '7px 12px', background: 'var(--bg4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
          {['Date','Start','Current','ROI'].map(h => <span key={h}>{h}</span>)}
        </div>
        {[['Jan 2025','$15,000','$18,200','+21.3%'],['Jun 2025','$20,000','$24,820','+24.1%']].map(([d,i,a,r]) => (
          <div key={d} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '9px 12px', fontSize: 11, borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>{d}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{i}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{a}</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>,

    // 5 Pricing
    <div key={5} style={{ display: 'flex', flexDirection: 'column', gap: 10, direction: 'ltr' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {[
          { name: L.trialName, price: L.freeLabel, priceColor: 'var(--green)', border: 'var(--border)', ctaBg: 'var(--bg4)', ctaColor: 'var(--text)', sub: '' },
          { name: L.lifetimeName, price: '700 DH', origPrice: '1000 DH', priceColor: 'var(--gold)', border: 'var(--gold)', ctaBg: 'linear-gradient(135deg,#f6d860,#e6b800)', ctaColor: '#080c10', note: L.bestVal, noteColor: 'var(--gold)', sub: '' },
        ].map(p => (
          <div key={p.name} style={{ background: 'var(--bg3)', border: `1px solid ${p.border}`, borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {p.note && <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: p.noteColor }}>{p.note}</div>}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)' }}>{p.name}</div>
            {p.origPrice && (<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 99 }}>{L.discount}</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dim)', textDecoration: 'line-through' }}>{p.origPrice}</span></div>)}
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 22, color: p.priceColor }}>{p.price}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>✓ {lang === 'ar' ? 'وصول كامل' : lang === 'fr' ? 'Accès complet' : 'Full access'}<br/>✓ {lang === 'ar' ? 'تحليلات' : lang === 'fr' ? 'Analyses' : 'Analytics'}</div>
            <div style={{ padding: '7px', borderRadius: 5, fontSize: 11, fontWeight: 700, textAlign: 'center', background: p.ctaBg, color: p.ctaColor }}>
              {p.name === L.lifetimeName ? `${L.via}` : L.start}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 12px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--muted)' }}>
        📧 {lang === 'ar' ? 'بعد التسجيل، تصلك بيانات الدخول تلقائياً على بريدك الإلكتروني.' : lang === 'fr' ? 'Après inscription, vos identifiants sont envoyés automatiquement par email.' : 'After registration, your login credentials are sent automatically by email.'}
      </div>
    </div>,
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', fontFamily: content.font }}>
      {/* Player chrome */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(8,12,16,0.95)', borderBottom: '1px solid var(--border)', direction: 'ltr' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, background: 'var(--green)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, color: '#080c10' }}>TJ</div>
            <span style={{ fontWeight: 800, fontSize: 12 }}>Trade<span style={{ color: 'var(--green)' }}>Journal</span> PRO</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => goSlide(i)} style={{ height: 6, borderRadius: 3, cursor: 'pointer', transition: 'all 0.3s', width: i === current ? 20 : 6, background: i === current ? 'var(--green)' : 'var(--bg4)' }}/>
            ))}
          </div>
        </div>

        {/* Main layout */}
        <div style={{ display: 'flex', height: 380, direction: 'ltr' }}>
          {/* Sidebar */}
          <div style={{ width: 140, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: '10px 0' }}>
            {navLabels.map((lbl, i) => (
              <div key={i} onClick={() => goSlide(i)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', fontSize: 11, cursor: 'pointer', color: i === current ? 'var(--green)' : 'var(--muted)', background: i === current ? 'rgba(0,230,118,0.07)' : 'transparent', borderLeft: `2px solid ${i === current ? 'var(--green)' : 'transparent'}`, transition: 'all 0.15s' }}>
                {lbl}
              </div>
            ))}
          </div>
          {/* Content */}
          <div style={{ flex: 1, padding: 14, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
            <div key={`${current}-${lang}`} style={{ animation: 'fadeUp 0.35s ease both' }}>
              <style>{'@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'}</style>
              {slideViews[current] || slideViews[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div style={{ background: 'rgba(13,17,23,0.98)', border: '1px solid var(--border)', borderTop: 'none', padding: '14px 18px', direction: isRTL ? 'rtl' : 'ltr' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 4, opacity: 0.7 }}>
          {lang === 'ar' ? 'التعليق' : lang === 'fr' ? 'Commentaire' : 'Caption'}
        </div>
        <div key={`cap-${current}-${lang}`} style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, animation: 'fadeUp 0.4s ease both' }}>
          {slides[current]?.caption}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', direction: 'ltr' }}>
        <button onClick={() => goSlide((current - 1 + slides.length) % slides.length)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}>‹</button>
        <button onClick={togglePlay} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--green)', border: 'none', cursor: 'pointer', color: '#080c10', fontSize: playing ? 12 : 14, fontWeight: 900 }}>
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={() => goSlide((current + 1) % slides.length)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg3)', cursor: 'pointer', color: 'var(--text)', fontSize: 14 }}>›</button>

        <div onClick={(e) => seekProgress(e, e.currentTarget)} style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 99, cursor: 'pointer' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--green)', borderRadius: 99, transition: 'width 0.08s linear', pointerEvents: 'none' }}/>
        </div>

        <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 36 }}>{current + 1}/{slides.length}</span>

        <button onClick={toggleVoice} title={voiceOn ? ui.video_mute_btn : ui.video_voice_btn} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${voiceOn ? 'rgba(0,230,118,0.4)' : 'var(--border)'}`, background: voiceOn ? 'rgba(0,230,118,0.1)' : 'var(--bg3)', color: voiceOn ? 'var(--green)' : 'var(--muted)', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
          {voiceOn ? ui.video_mute_btn : ui.video_voice_btn}
        </button>

        <button onClick={() => setShowScript(s => !s)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${showScript ? 'rgba(0,230,118,0.4)' : 'var(--border)'}`, background: showScript ? 'rgba(0,230,118,0.1)' : 'var(--bg3)', color: showScript ? 'var(--green)' : 'var(--muted)', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
          {ui.video_script_btn}
        </button>
      </div>

      {/* Script panel */}
      {showScript && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '20px', maxHeight: 320, overflowY: 'auto', direction: isRTL ? 'rtl' : 'ltr' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)', marginBottom: 14 }}>
            {lang === 'ar' ? 'نص التعليق الصوتي' : lang === 'fr' ? 'Script de narration' : 'Voiceover Script'}
          </div>
          {slides.map((sl, i) => (
            <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < slides.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', marginBottom: 4, letterSpacing: 1 }}>
                {lang === 'ar' ? `الشريحة ${i + 1} — ${sl.label}` : `Slide ${i + 1} — ${sl.label}`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>{sl.voice}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PACK CARD ───────────────────────────────────────────────────────────────
function PackCard({ pack, onSelect }) {
  return (
    <div className={`pack-card ${pack.lifetime ? 'lifetime' : ''}`} style={{ position: 'relative' }}>
      {pack.badge && <div className="pack-lifetime-tag">{pack.badge}</div>}
      <div className="pack-name">{pack.name}</div>
      {pack.discount && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ background: 'var(--red)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99 }}>{pack.discount}</span>
          {pack.orig && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--dim)', textDecoration: 'line-through' }}>{pack.orig} {pack.currency}</span>}
        </div>
      )}
      <div className={`pack-price ${pack.priceClass}`}>
        {pack.priceClass === 'free' ? pack.price : (
          <>{pack.price}<span style={{ fontSize: 18, fontWeight: 600, marginLeft: 4 }}>{pack.currency}</span><span className="pack-period">{pack.period}</span></>
        )}
      </div>
      <div className="pack-desc">{pack.desc}</div>
      <ul className="pack-features">
        {pack.features.map(f => <li key={f}>{f}</li>)}
      </ul>
      {pack.whatsapp && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 12px', background: 'rgba(246,216,96,0.06)', border: '1px solid rgba(246,216,96,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
          💬 {pack.whatsappNote}
        </div>
      )}
      <button className={`btn ${pack.ctaClass} pack-btn`} onClick={onSelect}>{pack.cta}</button>
    </div>
  );
}

// ─── MAIN LANDING ────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate   = useNavigate();
  const { lang }   = useLang();
  const pricingRef = useRef(null);
  const ui = UI_TEXT[lang] || UI_TEXT.en;
  const feats = FEATURES_DATA[lang] || FEATURES_DATA.en;
  const packs = PACKS_DATA[lang] || PACKS_DATA.en;
  const isRTL = lang === 'ar';

  const scrollToPricing = () => pricingRef.current?.scrollIntoView({ behavior: 'smooth' });

  const whatsappNote = lang === 'ar' ? 'الدفع عبر واتساب — تواصل معنا' : lang === 'fr' ? 'Paiement via WhatsApp — contactez-nous' : 'Payment via WhatsApp — contact us';

  return (
    <div className="landing" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* NAVBAR */}
      <nav className="land-nav">
        <div className="land-nav-logo">
          <div className="logo-box" style={{ fontFamily: 'var(--font-mono)' }}>TJ</div>
          <div className="logo-txt">Trade<span>Journal</span> PRO</div>
        </div>
        <div className="land-nav-actions">
          <NavLangSwitcher />
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>{ui.signin}</button>
          <button className="btn btn-primary" onClick={scrollToPricing}>{ui.get_started}</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="land-hero">
        <div className="land-hero-bg">
          <div className="land-orb land-orb1"/>
          <div className="land-orb land-orb2"/>
        </div>
        <div className="land-hero-content">
          <div className="land-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}/>
            {ui.hero_eyebrow}
          </div>
          <h1 className="land-h1">
            {ui.hero_h1_1}<br/><span className="accent">{ui.hero_h1_2}</span>
          </h1>
          <p className="land-sub">{ui.hero_sub}</p>
          <div className="land-hero-ctas">
            <button className="btn btn-primary" onClick={scrollToPricing}>{ui.cta_primary}</button>
            <button className="btn btn-ghost" onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}>
              {ui.cta_secondary}
            </button>
          </div>
        </div>
      </section>

      {/* VIDEO DEMO */}
      <section id="video-section" className="land-video-section">
        <div className="land-section-label">{ui.section_video_label}</div>
        <h2 className="land-section-title">{ui.section_video_title}</h2>
        <p className="land-section-sub">{ui.section_video_sub}</p>
        <div className="land-video-wrap" style={{ background: 'transparent', padding: 0, border: 'none' }}>
          <DemoVideoPlayer key={lang} lang={lang} />
        </div>
      </section>

      {/* FEATURES */}
      <section className="land-features-section">
        <div className="land-section-label">{ui.section_features_label}</div>
        <h2 className="land-section-title">{ui.section_features_title}</h2>
        <p className="land-section-sub">{ui.section_features_sub}</p>
        <div className="land-features-grid">
          {feats.map(f => (
            <div key={f.title} className="land-feature-card">
              <div className="land-feature-icon">{f.icon}</div>
              <div className="land-feature-title">{f.title}</div>
              <div className="land-feature-desc">{f.desc}</div>
              <div style={{ marginTop: 8, padding: '3px 10px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 5, fontSize: 11, color: 'var(--green)', fontWeight: 700, alignSelf: 'flex-start' }}>{f.stat}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="land-pricing-section" ref={pricingRef} id="pricing">
        <div style={{ textAlign: 'center' }}>
          <div className="land-section-label">{ui.section_pricing_label}</div>
          <h2 className="land-section-title">{ui.section_pricing_title}</h2>
          <p className="land-section-sub" style={{ margin: '0 auto', textAlign: 'center' }}>{ui.section_pricing_sub}</p>
        </div>
        <div className="land-pricing-grid" style={{ maxWidth: 720, margin: '48px auto 0', gridTemplateColumns: 'repeat(2,1fr)' }}>
          <PackCard pack={{ ...packs.trial }} onSelect={() => navigate(`/register?pack=trial`)} />
          <PackCard pack={{ ...packs.lifetime, whatsapp: true, whatsappNote }} onSelect={() => window.open('https://wa.me/212635925986?text=Bonjour%2C+je+veux+souscrire+au+pack+Lifetime+700DH', '_blank')} />
        </div>
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
          {ui.pricing_whatsapp}
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta-section">
        <div className="land-badge" style={{ margin: '0 auto 20px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }}/>
          {ui.cta_section_eyebrow}
        </div>
        <h1 className="land-h1">{ui.cta_section_h1_1}<br/><span className="accent">{ui.cta_section_h1_2}</span></h1>
        <p className="land-sub" style={{ margin: '0 auto 32px' }}>{ui.cta_section_sub}</p>
        <div className="land-hero-ctas">
          <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 15 }} onClick={scrollToPricing}>{ui.cta_primary}</button>
          <button className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => navigate('/login')}>{ui.already_have}</button>
        </div>
        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          {[ui.stat1_val, ui.stat2_val, ui.stat3_val].map((val, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 900, color: 'var(--green)' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{[ui.stat1_lbl, ui.stat2_lbl, ui.stat3_lbl][i]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="land-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-box" style={{ width: 28, height: 28, fontSize: 11, fontFamily: 'var(--font-mono)' }}>TJ</div>
          <span>TradeJournal PRO</span>
        </div>
        <div>{ui.footer_copy}</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>{ui.footer_signin}</span>
          <span style={{ cursor: 'pointer' }} onClick={scrollToPricing}>{ui.footer_pricing}</span>
        </div>
      </footer>
    </div>
  );
}
