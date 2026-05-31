import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Voice helpers ─────────────────────────────────────────────────────────
function getBestVoice(lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const targets = {
    ar: ['ar-SA','ar-EG','ar-MA','ar-AE','ar','Arabic'],
    fr: ['fr-FR','fr-CA','fr-BE','fr'],
    en: ['en-US','en-GB','en'],
  };
  const tags = targets[lang] || targets.en;
  for (const tag of tags) {
    const v = voices.find(v => v.lang === tag || v.lang.startsWith(tag) || v.name.toLowerCase().includes(tag.toLowerCase()));
    if (v) return v;
  }
  return voices[0] || null;
}

function speak(text, lang, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const run = () => {
    try { window.speechSynthesis.resume(); } catch (_) {}
    if (lang === 'ar') {
      const parts = text.split(/[.،!?]/g).map(s => s.trim()).filter(Boolean);
      let i = 0;
      const playNext = () => {
        if (i >= parts.length) { onEnd?.(); return; }
        const u = new SpeechSynthesisUtterance(parts[i++]);
        const v = getBestVoice('ar');
        if (v) u.voice = v;
        u.lang = 'ar-SA'; u.rate = 0.85; u.pitch = 1; u.volume = 1;
        u.onend = playNext; u.onerror = playNext;
        window.speechSynthesis.speak(u);
      };
      playNext(); return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice(lang);
    if (voice) utt.voice = voice;
    utt.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utt.rate = 0.9; utt.pitch = 1; utt.volume = 1;
    if (onEnd) utt.onend = onEnd;
    window.speechSynthesis.speak(utt);
  };
  if (window.speechSynthesis.getVoices().length === 0) {
    let ran = false;
    const fallback = setTimeout(() => { if (!ran) { ran = true; run(); } }, 500);
    window.speechSynthesis.onvoiceschanged = () => {
      if (!ran) { ran = true; clearTimeout(fallback); }
      window.speechSynthesis.onvoiceschanged = null;
      run();
    };
  } else { run(); }
}

// ─── Language switcher ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code:'ar', label:'العربية', short:'AR', flag:'🇲🇦' },
  { code:'fr', label:'Français', short:'FR', flag:'🇫🇷' },
  { code:'en', label:'English', short:'EN', flag:'🇬🇧' },
];

function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:8, cursor:'pointer',
        background: open ? 'rgba(0,230,118,0.1)' : '#141b22',
        border:`1px solid ${open ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.1)'}`,
        color: open ? '#00e676' : '#e8edf3', fontFamily:'sans-serif', fontSize:13, fontWeight:700,
        transition:'all 0.2s',
      }}>
        <span style={{ fontSize:16 }}>{current.flag}</span>
        <span>{current.short}</span>
        <span style={{ fontSize:10, opacity:0.6, transform: open?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#0d1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, overflow:'hidden', minWidth:150, zIndex:300, boxShadow:'0 16px 40px rgba(0,0,0,0.6)' }}>
          {LANGUAGES.map((l, i) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
              background: l.code === lang ? 'rgba(0,230,118,0.08)' : 'transparent',
              border:'none', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              color: l.code === lang ? '#00e676' : '#e8edf3',
              cursor:'pointer', fontSize:13, fontWeight: l.code === lang ? 700 : 500, fontFamily:'sans-serif',
            }}>
              <span style={{ fontSize:18 }}>{l.flag}</span>
              <span style={{ flex:1, textAlign:'left' }}>{l.label}</span>
              {l.code === lang && <span style={{ fontSize:10, color:'#00e676' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── All content per language ───────────────────────────────────────────────
const CONTENT = {
  ar: {
    dir: 'rtl',
    heroEyebrow: 'المنصة الاحترافية للمتداولين',
    heroH1a: 'سجّل. حلّل.',
    heroH1b: 'تداول بذكاء.',
    heroSub: 'المنصة الاحترافية التي تحوّل طريقة تتبع صفقاتك. حلّل أداءك، اكتشف الأنماط، ونمّي رأس مالك.',
    ctaPrimary: '🚀 ابدأ مجاناً',
    ctaSecondary: '▶ شاهد العرض الصوتي',
    demoLabel: 'اكتشف المنصة',
    demoTitle: 'كل ما تحتاجه لتتبع صفقاتك',
    demoSub: 'اضغط على تشغيل لسماع شرح مباشر بالعربية مع رسوم توضيحية لكل ميزة.',
    voiceLabel: '🔊 صوت عربي',
    featLabel: 'الميزات',
    featTitle: 'مصمّم للمتداولين الجادين',
    featSub: 'كل ميزة صُممت بهدف واحد: مساعدتك لتكون متداولاً أفضل وأكثر ثباتاً.',
    features: [
      { icon:'📊', title:'يوميات الصفقات', desc:'سجّل كل صفقة مع الدخول والخروج، لقطات الشاشة، السوق والجلسة. لا تفوّت أي تفصيل.', accent:'#5c9cf5' },
      { icon:'📈', title:'تحليلات الأداء', desc:'رسوم P&L تراكمية، نسبة الفوز، أفضل الجلسات والأسواق بتفاصيل دقيقة.', accent:'#00e676' },
      { icon:'💰', title:'تتبع رأس المال', desc:'تتبع تطور رأس مالك، العائد على الاستثمار والمسحوبات عبر دورات متعددة.', accent:'#f6d860' },
      { icon:'📅', title:'تقويم بصري', desc:'خريطة بصرية لأداءك اليومي. اكتشف الأنماط والسلاسل الربحية بسرعة.', accent:'#a29bfe' },
    ],
    trustItems: [
      { icon:'🔒', text:'بياناتك آمنة تماماً' },
      { icon:'⚡', text:'أداء سريع وموثوق' },
      { icon:'📱', text:'يعمل على جميع الأجهزة' },
      { icon:'🌍', text:'دعم متعدد الأسواق' },
    ],
    pricingLabel: 'الأسعار',
    pricingTitle: 'اختر خطتك',
    pricingSub: 'ابدأ مجاناً 24 ساعة. ثم احصل على الوصول مدى الحياة بسعر استثنائي.',
    trial: { name:'تجربة مجانية', price:'مجاناً', cls:'free', desc:'24 ساعة وصول كامل. لا بطاقة مطلوبة.', features:['وصول كامل','يوميات الصفقات','تحليلات P&L','مقيّد بـ 24 ساعة'], cta:'ابدأ التجربة المجانية' },
    lifetime: { name:'مدى الحياة', price:'700', curr:'DH', period:' مرة واحدة', orig:'1000 DH', disc:'🔥 -30%', desc:'ادفع مرة واحدة واستخدم للأبد.', features:['كل شيء مشمول','وصول مدى الحياة','الميزات المستقبلية','دعم VIP'], cta:'احصل على العرض 💬', badge:'الأفضل قيمة' },
    ctaEyebrow: 'مقاعد محدودة',
    ctaH1: 'جاهز لترقية تداولك؟',
    ctaSub: 'انضم إلى المتداولين الذين يستخدمون TradeJournal PRO للثبات والنمو.',
    already: 'لدي حساب بالفعل',
    signin: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',
    stats: [{ v:'127+', l:'متداول نشط' }, { v:'68%', l:'متوسط نسبة الفوز' }, { v:'+24%', l:'متوسط العائد' }],
    footerCopy: '© 2025 TradeJournal PRO. جميع الحقوق محفوظة.',
    whatsappNote: 'الدفع عبر واتساب',
    scenes: [
      { id:'intro',     dur:5500, title:'TradeJournal PRO',  subtitle:'يوميات التداول الاحترافية',    voice:'مرحباً بكم في TradeJournal PRO. المنصة الاحترافية التي تحوّل طريقة تتبع صفقاتك وتحليل أدائك.' },
      { id:'dashboard', dur:7000, title:'لوحة التحكم',       subtitle:'نظرة شاملة — دفعة واحدة',      voice:'لوحة التحكم تعطيك نظرة كاملة على أدائك في ثوانٍ. إجمالي الأرباح ونسبة الفوز وتطور رأس المال.' },
      { id:'addtrade',  dur:6500, title:'تسجيل الصفقات',     subtitle:'سريع ودقيق',                   voice:'سجّل كل صفقة في ثوانٍ. اختر السوق والاتجاه وأدخل الأسعار لترى معاينة فورية للربح أو الخسارة.' },
      { id:'analytics', dur:7000, title:'تحليل الأداء',      subtitle:'اكتشف أنماطك',                 voice:'التحليلات تكشف لك الحقيقة. أي الجلسات أفضل؟ أي الأسواق أكثر ربحاً؟ كل التفاصيل أمامك.' },
      { id:'calendar',  dur:6000, title:'التقويم البصري',    subtitle:'أداؤك يومياً',                 voice:'التقويم البصري يُظهر أيام الفوز والخسارة بلون واضح. اكتشف الأنماط والسلاسل الربحية بسرعة.' },
      { id:'pricing',   dur:6000, title:'الأسعار',            subtitle:'ابدأ مجاناً اليوم',            voice:'ابدأ بتجربة مجانية 24 ساعة. أو احصل على الوصول مدى الحياة بسعر استثنائي. لا رسوم خفية.' },
    ],
  },
  fr: {
    dir: 'ltr',
    heroEyebrow: 'Plateforme de Trading Professionnelle',
    heroH1a: 'Enregistrez. Analysez.',
    heroH1b: 'Tradez mieux.',
    heroSub: 'La plateforme de trading professionnelle pour traders sérieux. Suivez vos trades, analysez vos performances et faites croître votre capital.',
    ctaPrimary: '🚀 Commencer gratuitement',
    ctaSecondary: '▶ Voir la démo vocale',
    demoLabel: 'Découvrez la plateforme',
    demoTitle: 'Tout ce dont vous avez besoin',
    demoSub: 'Appuyez sur play pour une démonstration audio en français avec illustrations pour chaque fonctionnalité.',
    voiceLabel: '🔊 Voix française',
    featLabel: 'Fonctionnalités',
    featTitle: 'Conçu pour les traders sérieux',
    featSub: 'Chaque fonctionnalité est conçue avec un seul objectif : vous aider à devenir un meilleur trader.',
    features: [
      { icon:'📊', title:'Journal de Trades', desc:'Enregistrez chaque trade avec entrée/sortie, captures, marché et session. Ne manquez aucun détail.', accent:'#5c9cf5' },
      { icon:'📈', title:'Analyses de Performance', desc:'Graphiques P&L cumulatifs, taux de réussite, meilleures sessions et analyses de marché détaillées.', accent:'#00e676' },
      { icon:'💰', title:'Suivi du Capital', desc:"Suivez l'évolution du capital, ROI et retraits sur plusieurs cycles de capital.", accent:'#f6d860' },
      { icon:'📅', title:'Calendrier Visuel', desc:'Carte visuelle de votre performance quotidienne. Repérez les tendances et séries gagnantes.', accent:'#a29bfe' },
    ],
    trustItems: [
      { icon:'🔒', text:'Vos données sont sécurisées' },
      { icon:'⚡', text:'Performance rapide et fiable' },
      { icon:'📱', text:'Fonctionne sur tous les appareils' },
      { icon:'🌍', text:'Multi-marchés supportés' },
    ],
    pricingLabel: 'Tarifs',
    pricingTitle: 'Choisissez votre plan',
    pricingSub: 'Commencez gratuitement 24h, puis obtenez un accès à vie à un prix exceptionnel.',
    trial: { name:'Essai 24h', price:'GRATUIT', cls:'free', desc:'Accès complet pendant 24h. Aucune carte requise.', features:['Accès complet','Journal de trades','Analyses P&L','Limité à 24h'], cta:"Commencer l'essai gratuit" },
    lifetime: { name:'À vie', price:'700', curr:'DH', period:' une fois', orig:'1000 DH', disc:'🔥 -30%', desc:'Payez une fois, utilisez pour toujours.', features:['Tout inclus','Accès à vie','Futures fonctionnalités','Support VIP'], cta:'Profiter de la promo 💬', badge:'Meilleure valeur' },
    ctaEyebrow: 'Places limitées',
    ctaH1: 'Prêt à améliorer votre trading ?',
    ctaSub: 'Rejoignez les traders qui utilisent TradeJournal PRO pour rester cohérents et progresser.',
    already: "J'ai déjà un compte",
    signin: 'Se connecter',
    getStarted: 'Commencer',
    stats: [{ v:'127+', l:'Traders actifs' }, { v:'68%', l:'Taux de réussite moy.' }, { v:'+24%', l:'Rendement moyen' }],
    footerCopy: '© 2025 TradeJournal PRO. Tous droits réservés.',
    whatsappNote: 'Paiement via WhatsApp',
    scenes: [
      { id:'intro',     dur:5500, title:'TradeJournal PRO',        subtitle:'Journal de trading professionnel', voice:'Bienvenue sur TradeJournal PRO. La plateforme professionnelle qui transforme votre façon de suivre vos trades et analyser vos performances.' },
      { id:'dashboard', dur:7000, title:'Tableau de bord',         subtitle:'Vue complète en un coup d\'œil',   voice:'Le tableau de bord vous donne une vue complète de vos performances en quelques secondes. P et L total, taux de réussite et croissance du capital.' },
      { id:'addtrade',  dur:6500, title:'Enregistrer un trade',    subtitle:'Rapide et précis',                 voice:'Enregistrez chaque trade en quelques secondes. Choisissez le marché, la direction, entrez les prix et obtenez un aperçu instantané de votre profit ou perte.' },
      { id:'analytics', dur:7000, title:'Analyses de performance', subtitle:'Découvrez vos tendances',          voice:'Les analyses révèlent la vérité sur votre trading. Quelles sessions performent le mieux ? Quels marchés sont les plus rentables ?' },
      { id:'calendar',  dur:6000, title:'Calendrier visuel',       subtitle:'Votre performance au quotidien',   voice:'Le calendrier visuel affiche les jours gagnants et perdants en couleur claire. Repérez instantanément vos tendances et séries gagnantes.' },
      { id:'pricing',   dur:6000, title:'Tarifs',                  subtitle:'Commencez gratuitement',          voice:"Commencez avec un essai gratuit de 24 heures. Ou obtenez un accès à vie à un prix exceptionnel. Aucuns frais cachés." },
    ],
  },
  en: {
    dir: 'ltr',
    heroEyebrow: 'Professional Trading Platform',
    heroH1a: 'Track. Analyze.',
    heroH1b: 'Trade Smarter.',
    heroSub: 'The professional trading journal for serious traders. Log trades, analyze performance, discover patterns, and grow your capital.',
    ctaPrimary: '🚀 Get Started Free',
    ctaSecondary: '▶ Watch Voice Demo',
    demoLabel: 'See It In Action',
    demoTitle: 'Everything you need to master trading',
    demoSub: 'Press play for a voice-guided demo in English with visual illustrations for every feature.',
    voiceLabel: '🔊 English voice',
    featLabel: 'Features',
    featTitle: 'Built for serious traders',
    featSub: 'Every feature designed with one goal: help you become a better, more consistent trader.',
    features: [
      { icon:'📊', title:'Trade Journal', desc:'Log every trade with entry/exit, screenshots, market and session. Never miss a detail.', accent:'#5c9cf5' },
      { icon:'📈', title:'Performance Analytics', desc:'Cumulative P&L charts, win rate, best sessions and market performance breakdowns.', accent:'#00e676' },
      { icon:'💰', title:'Capital Tracking', desc:'Track capital evolution, ROI and withdrawals across multiple capital cycles.', accent:'#f6d860' },
      { icon:'📅', title:'Visual Calendar', desc:'Visual daily performance map. Spot patterns and winning streaks instantly.', accent:'#a29bfe' },
    ],
    trustItems: [
      { icon:'🔒', text:'Your data is fully secure' },
      { icon:'⚡', text:'Fast and reliable performance' },
      { icon:'📱', text:'Works on all devices' },
      { icon:'🌍', text:'Multi-market support' },
    ],
    pricingLabel: 'Pricing',
    pricingTitle: 'Choose your plan',
    pricingSub: 'Start free for 24h, then get lifetime access at an exceptional price. No hidden fees.',
    trial: { name:'24h Trial', price:'FREE', cls:'free', desc:'Full access for 24 hours. No card required.', features:['Full access','Trade journal','P&L analytics','Limited to 24h'], cta:'Start Free Trial' },
    lifetime: { name:'Lifetime', price:'700', curr:'DH', period:' once', orig:'1000 DH', disc:'🔥 -30%', desc:'Pay once, use forever. The ultimate trading companion.', features:['Everything included','Lifetime access','All future features','VIP Support'], cta:'Get the deal 💬', badge:'Best Value' },
    ctaEyebrow: 'Limited spots available',
    ctaH1: 'Ready to level up your trading?',
    ctaSub: 'Join traders who use TradeJournal PRO to stay consistent and grow.',
    already: 'Already have an account',
    signin: 'Sign In',
    getStarted: 'Get Started',
    stats: [{ v:'127+', l:'Active traders' }, { v:'68%', l:'Avg win rate' }, { v:'+24%', l:'Avg return' }],
    footerCopy: '© 2025 TradeJournal PRO. All rights reserved.',
    whatsappNote: 'Payment via WhatsApp',
    scenes: [
      { id:'intro',     dur:5500, title:'TradeJournal PRO',        subtitle:'Professional Trade Journaling',    voice:'Welcome to TradeJournal PRO. The professional platform that transforms how you track trades and analyze performance.' },
      { id:'dashboard', dur:7000, title:'Dashboard',               subtitle:'Full Overview at a Glance',        voice:'The dashboard gives you a complete performance overview in seconds. Total P and L, win rate, and capital growth.' },
      { id:'addtrade',  dur:6500, title:'Log Trades',              subtitle:'Fast & Accurate',                  voice:'Log every trade in seconds. Choose market, direction, enter prices and get an instant preview of your profit or loss.' },
      { id:'analytics', dur:7000, title:'Performance Analytics',   subtitle:'Discover Your Patterns',           voice:'Analytics reveal the truth about your trading. Which sessions perform best? Which markets are most profitable?' },
      { id:'calendar',  dur:6000, title:'Visual Calendar',         subtitle:'Your Daily Performance',           voice:'The visual calendar shows winning and losing days in clear color. Spot patterns and profitable streaks instantly.' },
      { id:'pricing',   dur:6000, title:'Pricing',                 subtitle:'Start Free Today',                 voice:'Start with a free 24 hour trial. Or get lifetime access at an exceptional price. No hidden fees.' },
    ],
  },
};

// ─── SVG Illustrations for each scene ──────────────────────────────────────
function SceneVisual({ id }) {
  if (id === 'intro') return (
    <svg viewBox="0 0 560 280" style={{ width:'100%', height:'auto' }}>
      <defs>
        <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e676" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[60,100,140,180,220].map(y => <line key={y} x1="40" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
      {[
        [80,180,220,200,160],[130,160,210,170,150],[180,150,200,155,140],
        [230,155,185,160,145],[280,130,175,145,120],[330,120,165,135,110],
        [380,105,150,118,100],[430,95,140,108,85],[480,80,130,95,72],
      ].map(([x,high,low,open,close],i) => {
        const bull = close <= open, color = bull ? '#00e676' : '#ff4757';
        const bTop = Math.min(open,close), bH = Math.abs(open-close)||4;
        return <g key={i}><line x1={x} y1={high} x2={x} y2={low} stroke={color} strokeWidth="1.5" opacity="0.6"/><rect x={x-6} y={bTop} width={12} height={bH} fill={color} rx="2" opacity="0.85"/></g>;
      })}
      <polyline points="80,200 130,175 180,155 230,155 280,140 330,130 380,115 430,103 480,90" fill="none" stroke="#00e676" strokeWidth="2" strokeDasharray="5,3" opacity="0.5"/>
      <polygon points="80,200 130,175 180,155 230,155 280,140 330,130 380,115 430,103 480,90 480,235 80,235" fill="url(#gGreen)"/>
      <rect x="196" y="96" width="168" height="72" rx="14" fill="#0d1117" stroke="rgba(246,216,96,0.4)" strokeWidth="1.5"/>
      <text x="280" y="126" textAnchor="middle" fill="#f6d860" fontSize="13" fontWeight="700" fontFamily="monospace">TradeJournal</text>
      <text x="280" y="152" textAnchor="middle" fill="#00e676" fontSize="20" fontWeight="900" fontFamily="monospace">PRO</text>
    </svg>
  );

  if (id === 'dashboard') return (
    <svg viewBox="0 0 560 290" style={{ width:'100%', height:'auto' }}>
      <defs>
        <linearGradient id="gPL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e676" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[{x:10,label:'P&L',value:'+4,832 DH',color:'#00e676'},{x:145,label:'Win Rate',value:'68%',color:'#5c9cf5'},{x:280,label:'Capital',value:'12,000 DH',color:'#f6d860'},{x:415,label:'Trades',value:'47',color:'#ff9f43'}].map(({x,label,value,color})=>(
        <g key={x}><rect x={x} y={10} width={128} height={62} rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/><text x={x+64} y={33} textAnchor="middle" fill="rgba(180,200,220,0.5)" fontSize="9" fontFamily="sans-serif">{label}</text><text x={x+64} y={58} textAnchor="middle" fill={color} fontSize="14" fontWeight="800" fontFamily="monospace">{value}</text></g>
      ))}
      <rect x="10" y="84" width="330" height="190" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="26" y="105" fill="rgba(180,200,220,0.5)" fontSize="9" fontFamily="sans-serif">Cumulative P&L</text>
      {[115,140,165,190,215,240,265].map(y=><line key={y} x1="26" y1={y} x2="332" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
      <polyline points="30,255 75,240 120,228 165,210 210,190 255,168 300,142 330,120" fill="none" stroke="#00e676" strokeWidth="2"/>
      <polygon points="30,255 75,240 120,228 165,210 210,190 255,168 300,142 330,120 330,265 30,265" fill="url(#gPL)"/>
      <rect x="355" y="84" width="195" height="190" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="452" y="105" textAnchor="middle" fill="rgba(180,200,220,0.5)" fontSize="9" fontFamily="sans-serif">Win Rate</text>
      <circle cx="452" cy="178" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14"/>
      <circle cx="452" cy="178" r="52" fill="none" stroke="#00e676" strokeWidth="14" strokeDasharray="222 327" strokeDashoffset="82" strokeLinecap="round" transform="rotate(-90 452 178)"/>
      <text x="452" y="174" textAnchor="middle" fill="#00e676" fontSize="20" fontWeight="800" fontFamily="monospace">68%</text>
      <text x="452" y="192" textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="9" fontFamily="sans-serif">win</text>
    </svg>
  );

  if (id === 'addtrade') return (
    <svg viewBox="0 0 560 280" style={{ width:'100%', height:'auto' }}>
      <rect x="80" y="6" width="400" height="268" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="280" y="36" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">New Trade</text>
      {[{y:52,label:'Market',val:'EUR/USD'},{y:97,label:'Direction',val:'BUY ↑',vc:'#00e676'},{y:142,label:'Entry Price',val:'1.0842'},{y:187,label:'Exit Price',val:'1.0918'}].map(({y,label,val,vc})=>(
        <g key={y}><text x={462} y={y+14} textAnchor="end" fill="rgba(180,200,220,0.5)" fontSize="9" fontFamily="sans-serif">{label}</text><rect x="100" y={y+20} width="360" height="30" rx="7" fill="#141b22" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/><text x={448} y={y+41} textAnchor="end" fill={vc||'#e8edf3'} fontSize="12" fontWeight="600" fontFamily="monospace">{val}</text></g>
      ))}
      <rect x="100" y="236" width="360" height="30" rx="8" fill="rgba(0,230,118,0.1)" stroke="rgba(0,230,118,0.3)" strokeWidth="1"/>
      <text x="280" y="256" textAnchor="middle" fill="#00e676" fontSize="12" fontWeight="700" fontFamily="monospace">Preview P/L: +760 DH ↑</text>
    </svg>
  );

  if (id === 'analytics') return (
    <svg viewBox="0 0 560 280" style={{ width:'100%', height:'auto' }}>
      <rect x="10" y="10" width="262" height="260" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="141" y="32" textAnchor="middle" fill="rgba(180,200,220,0.5)" fontSize="9" fontFamily="sans-serif">Performance by Session</text>
      {[{label:'London',v:82,color:'#5c9cf5'},{label:'New York',v:65,color:'#ff9f43'},{label:'Tokyo',v:40,color:'#a29bfe'},{label:'Asian',v:58,color:'#00e676'}].map(({label,v,color},i)=>{
        const bx=28+i*58, bH=v*1.7, by=242-bH;
        return <g key={label}><rect x={bx} y={by} width={46} height={bH} rx="5" fill={color} opacity="0.8"/><text x={bx+23} y={258} textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="8" fontFamily="sans-serif">{label}</text><text x={bx+23} y={by-5} textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">{v}%</text></g>;
      })}
      <rect x="286" y="10" width="264" height="260" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="418" y="32" textAnchor="middle" fill="rgba(180,200,220,0.5)" fontSize="9" fontFamily="sans-serif">Top Markets</text>
      {[{label:'EUR/USD',pct:68,profit:'+1,840 DH',color:'#00e676'},{label:'GBP/JPY',pct:54,profit:'+920 DH',color:'#5c9cf5'},{label:'XAU/USD',pct:72,profit:'+2,100 DH',color:'#f6d860'},{label:'US30',pct:48,profit:'+430 DH',color:'#ff9f43'}].map(({label,pct,profit,color},i)=>{
        const y=52+i*56;
        return <g key={label}><text x={536} y={y+14} textAnchor="end" fill="#e8edf3" fontSize="10" fontWeight="600" fontFamily="monospace">{label}</text><text x={536} y={y+28} textAnchor="end" fill={color} fontSize="9" fontFamily="monospace">{profit}</text><rect x="300" y={y+34} width="232" height="5" rx="3" fill="rgba(255,255,255,0.07)"/><rect x="300" y={y+34} width={232*pct/100} height="5" rx="3" fill={color} opacity="0.7"/></g>;
      })}
    </svg>
  );

  if (id === 'calendar') return (
    <svg viewBox="0 0 560 280" style={{ width:'100%', height:'auto' }}>
      <rect x="30" y="8" width="500" height="264" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="280" y="36" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">April 2025</text>
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i)=><text key={d} x={58+i*66} y={58} textAnchor="middle" fill="rgba(180,200,220,0.35)" fontSize="9" fontFamily="sans-serif">{d}</text>)}
      {[[null,null,1,2,3,4,5],[6,7,8,9,10,11,12],[13,14,15,16,17,18,19],[20,21,22,23,24,25,26],[27,28,29,30,null,null,null]].map((week,wi)=>
        week.map((day,di)=>{
          if(!day) return null;
          const x=30+di*66, y=68+wi*42;
          const colorMap={2:'#00e676',3:'#00e676',5:'#ff4757',7:'#00e676',9:'#ff4757',10:'#00e676',11:'#00e676',14:'#ff4757',15:'#00e676',16:'#00e676',17:'#ff9f43',18:'#00e676',21:'#ff4757',22:'#00e676',23:'#00e676',24:'#00e676',28:'#ff4757',29:'#00e676',30:'#00e676'};
          const c=colorMap[day];
          return <g key={day}>{c&&<rect x={x+2} y={y+2} width={58} height={32} rx="7" fill={c} opacity="0.13"/>}{c&&<rect x={x+2} y={y+2} width={58} height={32} rx="7" fill="none" stroke={c} strokeWidth="1" opacity="0.4"/>}<text x={x+31} y={y+23} textAnchor="middle" fill={c||'rgba(180,200,220,0.3)'} fontSize="11" fontWeight={c?'700':'400'} fontFamily="monospace">{day}</text></g>;
        })
      )}
    </svg>
  );

  if (id === 'pricing') return (
    <svg viewBox="0 0 560 280" style={{ width:'100%', height:'auto' }}>
      <defs><linearGradient id="gGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#f6d860"/><stop offset="100%" stopColor="#e6b800"/></linearGradient></defs>
      <rect x="20" y="18" width="234" height="250" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="137" y="52" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">Free Trial</text>
      <text x="137" y="86" textAnchor="middle" fill="#5c9cf5" fontSize="24" fontWeight="900" fontFamily="monospace">FREE</text>
      <text x="137" y="104" textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="9" fontFamily="sans-serif">24h full access</text>
      {['Full access','Trade journal','P&L analytics','24h only'].map((f,i)=><g key={f}><text x={190} y={136+i*26} textAnchor="end" fill="rgba(180,200,220,0.7)" fontSize="10" fontFamily="sans-serif">{f}</text><text x={205} y={136+i*26} fill={i<3?'#00e676':'#ff4757'} fontSize="11">✓</text></g>)}
      <rect x="40" y="248" width="194" height="16" rx="8" fill="#1e2d3d"/>
      <text x="137" y="261" textAnchor="middle" fill="#e8edf3" fontSize="9" fontFamily="sans-serif">Start Free Trial</text>
      <rect x="268" y="8" width="272" height="268" rx="14" fill="#0d1117" stroke="rgba(246,216,96,0.45)" strokeWidth="1.5"/>
      <rect x="340" y="0" width="128" height="20" rx="10" fill="url(#gGold)"/>
      <text x="404" y="14" textAnchor="middle" fill="#080c10" fontSize="9" fontWeight="800" fontFamily="sans-serif">Best Value 🔥</text>
      <text x="404" y="50" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">Lifetime</text>
      <text x="404" y="70" textAnchor="middle" fill="rgba(180,200,220,0.35)" fontSize="9" fontFamily="monospace">1000 DH</text>
      <line x1="340" y1="76" x2="468" y2="76" stroke="rgba(180,200,220,0.2)" strokeWidth="0.5"/>
      <text x="404" y="104" textAnchor="middle" fill="#f6d860" fontSize="30" fontWeight="900" fontFamily="monospace">700 DH</text>
      <text x="404" y="122" textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="9" fontFamily="sans-serif">one-time forever</text>
      {['Everything included','Lifetime access','All future features','VIP Support'].map((f,i)=><g key={f}><text x={460} y={148+i*28} textAnchor="end" fill="#e8edf3" fontSize="10" fontFamily="sans-serif">{f}</text><text x={474} y={148+i*28} fill="#f6d860" fontSize="11">✓</text></g>)}
      <rect x="288" y="252" width="232" height="18" rx="9" fill="url(#gGold)"/>
      <text x="404" y="265" textAnchor="middle" fill="#080c10" fontSize="10" fontWeight="800" fontFamily="sans-serif">Get the deal 💬</text>
    </svg>
  );

  return null;
}

// ─── Demo Player — driven by lang prop ─────────────────────────────────────
function DemoPlayer({ lang, scenes }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing,  setPlaying]  = useState(false);
  const [pct,      setPct]      = useState(0);
  const [voiceOn,  setVoiceOn]  = useState(false);
  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const voiceRef  = useRef(false);
  const langRef   = useRef(lang);
  langRef.current = lang;

  const stopTimer = () => { clearInterval(timerRef.current); timerRef.current = null; };

  const startTimer = useCallback((idx, sceneList) => {
    stopTimer();
    const dur = sceneList[idx].dur;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const p = Math.min(100, ((Date.now() - startRef.current) / dur) * 100);
      setPct(p);
      if (p >= 100) {
        stopTimer();
        const next = (idx + 1) % sceneList.length;
        setSceneIdx(next);
        setPct(0);
        startTimer(next, sceneList);
        if (voiceRef.current) speak(sceneList[next].voice, langRef.current);
      }
    }, 60);
  }, []);

  // When language changes while playing — restart current scene with new voice
  const prevLangRef = useRef(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      window.speechSynthesis?.cancel();
      setSceneIdx(0);
      setPct(0);
      stopTimer();
      setPlaying(false);
      setVoiceOn(false);
      voiceRef.current = false;
    }
  }, [lang]);

  useEffect(() => () => { stopTimer(); window.speechSynthesis?.cancel(); }, []);

  const handlePlay = () => {
    if (playing) {
      stopTimer(); window.speechSynthesis?.cancel();
      setPlaying(false);
    } else {
      setPlaying(true); setVoiceOn(true); voiceRef.current = true;
      speak(scenes[sceneIdx].voice, lang);
      startTimer(sceneIdx, scenes);
    }
  };

  const handleScene = (idx) => {
    stopTimer(); window.speechSynthesis?.cancel();
    setSceneIdx(idx); setPct(0);
    if (playing) {
      startTimer(idx, scenes);
      if (voiceRef.current) speak(scenes[idx].voice, lang);
    }
  };

  const scene = scenes[sceneIdx];
  const isRTL = lang === 'ar';

  return (
    <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, overflow:'hidden', maxWidth:700, margin:'0 auto' }}>
      {/* Mac-style header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'#080c10' }}>
        <div style={{ display:'flex', gap:6 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }}/>)}
        </div>
        <div style={{ fontFamily:'monospace', fontSize:11, color:'rgba(180,200,220,0.35)', letterSpacing:1 }}>
          TradeJournal PRO — {isRTL ? 'عرض تجريبي' : lang === 'fr' ? 'Démo' : 'Demo'}
        </div>
        <div style={{ fontSize:11, color: voiceOn ? '#00e676' : 'rgba(180,200,220,0.25)', fontFamily:'monospace', direction:'ltr' }}>
          {voiceOn
            ? (lang === 'ar' ? '🔊 صوت عربي' : lang === 'fr' ? '🔊 Voix FR' : '🔊 EN Voice')
            : '🔇'}
        </div>
      </div>

      {/* Scene title */}
      <div style={{ textAlign:'center', padding:'20px 20px 8px', direction: isRTL ? 'rtl' : 'ltr' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#e8edf3', fontFamily:'sans-serif' }}>{scene.title}</div>
        <div style={{ fontSize:12, color:'rgba(180,200,220,0.45)', marginTop:4 }}>{scene.subtitle}</div>
      </div>

      {/* Visual illustration */}
      <div style={{ padding:'8px 20px', minHeight:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <SceneVisual id={scene.id}/>
      </div>

      {/* Progress bar */}
      <div style={{ margin:'8px 20px', height:3, background:'rgba(255,255,255,0.06)', borderRadius:99 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'#00e676', borderRadius:99, transition:'width 0.1s linear' }}/>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 20px 16px', direction: isRTL ? 'rtl' : 'ltr' }}>
        <button onClick={handlePlay} style={{
          width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:0,
          background: playing ? 'rgba(255,71,87,0.15)' : '#00e676',
          color: playing ? '#ff4757' : '#080c10', fontSize:14,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap' }}>
          {scenes.map((s,i) => (
            <button key={s.id} onClick={() => handleScene(i)} style={{
              padding:'4px 10px', borderRadius:20, cursor:'pointer', fontSize:10,
              border:`1px solid ${i===sceneIdx ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: i===sceneIdx ? 'rgba(0,230,118,0.1)' : 'transparent',
              color: i===sceneIdx ? '#00e676' : 'rgba(180,200,220,0.45)',
              fontFamily:'sans-serif',
            }}>
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Card ───────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent, isRTL }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:'#0d1117', border:`1px solid ${hov ? accent+'40' : 'rgba(255,255,255,0.07)'}`,
      borderRadius:16, padding:28, direction: isRTL ? 'rtl' : 'ltr',
      transform: hov ? 'translateY(-3px)' : 'none', transition:'all 0.2s', cursor:'default',
    }}>
      <div style={{ width:48, height:48, borderRadius:12, background:accent+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#e8edf3', marginBottom:8, fontFamily:'sans-serif' }}>{title}</div>
      <div style={{ fontSize:13, color:'rgba(180,200,220,0.6)', lineHeight:1.7, fontFamily:'sans-serif' }}>{desc}</div>
    </div>
  );
}

// ─── Pack Card ──────────────────────────────────────────────────────────────
function PackCard({ data, onSelect, highlighted, isRTL }) {
  return (
    <div style={{
      background:'#0d1117', borderRadius:20, padding:32, direction: isRTL ? 'rtl' : 'ltr',
      position:'relative', transition:'transform 0.2s',
      border: highlighted ? '1.5px solid rgba(246,216,96,0.45)' : '1px solid rgba(255,255,255,0.08)',
      boxShadow: highlighted ? '0 0 40px rgba(246,216,96,0.07)' : 'none',
    }}>
      {data.badge && (
        <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#f6d860,#e6b800)', color:'#080c10', fontSize:11, fontWeight:800, padding:'4px 18px', borderRadius:99, whiteSpace:'nowrap' }}>{data.badge}</div>
      )}
      <div style={{ fontSize:16, fontWeight:700, color:'#e8edf3', marginBottom:12, fontFamily:'sans-serif' }}>{data.name}</div>
      {data.disc && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ background:'#ff4757', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 10px', borderRadius:99 }}>{data.disc}</span>
          <span style={{ fontSize:12, color:'rgba(180,200,220,0.4)', textDecoration:'line-through', fontFamily:'monospace' }}>{data.orig}</span>
        </div>
      )}
      <div style={{ marginBottom:12 }}>
        {data.cls === 'free'
          ? <span style={{ fontSize:28, fontWeight:900, color:'#5c9cf5', fontFamily:'monospace' }}>{data.price}</span>
          : <><span style={{ fontSize:32, fontWeight:900, color:'#f6d860', fontFamily:'monospace' }}>{data.price}</span>
              <span style={{ fontSize:16, color:'rgba(180,200,220,0.5)', fontFamily:'monospace' }}> {data.curr}</span>
              <span style={{ fontSize:12, color:'rgba(180,200,220,0.4)', fontFamily:'sans-serif' }}>{data.period}</span></>
        }
      </div>
      <div style={{ fontSize:13, color:'rgba(180,200,220,0.5)', marginBottom:20, fontFamily:'sans-serif' }}>{data.desc}</div>
      <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px', display:'flex', flexDirection:'column', gap:10 }}>
        {data.features.map(f => (
          <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(180,200,220,0.8)', fontFamily:'sans-serif', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <span style={{ color: highlighted ? '#f6d860' : '#00e676', fontSize:14, flexShrink:0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <button onClick={onSelect} style={{
        width:'100%', padding:'13px 0', borderRadius:12, border:'none', cursor:'pointer',
        background: highlighted ? 'linear-gradient(135deg,#f6d860,#e6b800)' : '#141b22',
        color: highlighted ? '#080c10' : '#e8edf3', fontWeight:700, fontSize:14, fontFamily:'sans-serif',
        transition:'opacity 0.2s, transform 0.2s',
      }}
        onMouseEnter={e=>{ e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
        onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}
      >
        {data.cta}
      </button>
    </div>
  );
}

// ─── MAIN LANDING ───────────────────────────────────────────────────────────
export default function Landing() {
  const navigate    = useNavigate();
  const [lang, setLang] = useState('ar');   // default Arabic
  const pricingRef  = useRef(null);
  const scrollTo    = ref => ref.current?.scrollIntoView({ behavior:'smooth' });

  const C    = CONTENT[lang] || CONTENT.ar;
  const isRTL = lang === 'ar';

  const sectionLabel = {
    display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontWeight:700,
    letterSpacing:1.2, textTransform:'uppercase', color:'#00e676',
    background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)',
    padding:'5px 14px', borderRadius:99, marginBottom:18, fontFamily:'monospace',
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{ background:'#080c10', color:'#e8edf3', minHeight:'100vh', fontFamily:'sans-serif', overflowX:'hidden' }}>

      {/* ── Fixed background orbs ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,230,118,0.055) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', top:'40%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(92,156,245,0.04) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(246,216,96,0.04) 0%, transparent 70%)' }}/>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,12,16,0.88)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'#00e676', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:11, color:'#080c10', fontFamily:'monospace', letterSpacing:-1 }}>TJ</div>
          <span style={{ fontWeight:800, fontSize:17 }}>Trade<span style={{ color:'#00e676' }}>Journal</span> PRO</span>
        </div>
        {/* Actions — always LTR order */}
        <div style={{ display:'flex', alignItems:'center', gap:10, direction:'ltr' }}>
          <LangSwitcher lang={lang} setLang={setLang}/>
          <button onClick={() => navigate('/login')} style={{ padding:'7px 18px', borderRadius:8, background:'#141b22', border:'1px solid rgba(255,255,255,0.1)', color:'#e8edf3', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'sans-serif' }}>{C.signin}</button>
          <button onClick={() => scrollTo(pricingRef)} style={{ padding:'8px 20px', borderRadius:8, background:'#00e676', border:'none', color:'#080c10', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'sans-serif' }}>{C.getStarted}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', padding:'100px 40px 80px', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
          <div style={sectionLabel}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#00e676', display:'inline-block' }}/>
            {C.heroEyebrow}
          </div>
        </div>

        {/* Hero chart SVG */}
        <div style={{ margin:'0 auto 40px', maxWidth:680, opacity:0.9 }}>
          <svg viewBox="0 0 700 130" style={{ width:'100%' }}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e676" stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[30,60,90,120].map(y=><line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>)}
            <polyline points="0,118 70,104 140,112 210,88 280,68 350,52 420,38 490,26 560,18 630,13 700,8" fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinejoin="round"/>
            <polygon points="0,118 70,104 140,112 210,88 280,68 350,52 420,38 490,26 560,18 630,13 700,8 700,130 0,130" fill="url(#heroFill)"/>
            {[[350,52],[490,26],[700,8]].map(([x,y])=><circle key={x} cx={x} cy={y} r="4" fill="#00e676" opacity="0.8"/>)}
          </svg>
        </div>

        <h1 style={{ fontSize: isRTL ? 60 : 56, fontWeight:900, lineHeight:1.1, margin:'0 0 8px', letterSpacing: isRTL ? -1 : -2 }}>
          {C.heroH1a}<br/><span style={{ color:'#00e676' }}>{C.heroH1b}</span>
        </h1>
        <p style={{ fontSize:17, color:'rgba(180,200,220,0.62)', maxWidth:560, margin:'20px auto 36px', lineHeight:1.75 }}>{C.heroSub}</p>

        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => scrollTo(pricingRef)} style={{ padding:'14px 32px', borderRadius:12, background:'#00e676', border:'none', color:'#080c10', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'sans-serif' }}>{C.ctaPrimary}</button>
          <button onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'14px 32px', borderRadius:12, background:'#141b22', border:'1px solid rgba(255,255,255,0.12)', color:'#e8edf3', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'sans-serif' }}>{C.ctaSecondary}</button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:48, justifyContent:'center', marginTop:60, flexWrap:'wrap' }}>
          {C.stats.map(({ v, l }) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'monospace', fontSize:38, fontWeight:900, color:'#00e676', lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(180,200,220,0.45)', marginTop:6, fontFamily:'sans-serif' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', padding:'0 40px' }}>
        <div style={{ height:1, background:'linear-gradient(90deg, transparent, rgba(0,230,118,0.25), transparent)' }}/>
      </div>

      {/* ── DEMO PLAYER ── */}
      <section id="demo-section" style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
            <div style={sectionLabel}>{C.demoLabel}</div>
          </div>
          <h2 style={{ fontSize:36, fontWeight:800, margin:'0 0 14px', letterSpacing: isRTL ? -0.5 : -1 }}>{C.demoTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(180,200,220,0.52)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>{C.demoSub}</p>
        </div>
        {/* key=lang forces full re-mount when language changes */}
        <DemoPlayer key={lang} lang={lang} scenes={C.scenes}/>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
            <div style={sectionLabel}>{C.featLabel}</div>
          </div>
          <h2 style={{ fontSize:36, fontWeight:800, margin:'0 0 14px', letterSpacing: isRTL ? -0.5 : -1 }}>{C.featTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(180,200,220,0.52)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>{C.featSub}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20 }}>
          {C.features.map(f => <FeatureCard key={f.title} {...f} isRTL={isRTL}/>)}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ position:'relative', zIndex:1, background:'#0d1117', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'26px 40px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-around', gap:20, flexWrap:'wrap' }}>
          {C.trustItems.map(({ icon, text }) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(180,200,220,0.55)' }}>
              <span style={{ fontSize:18 }}>{icon}</span>{text}
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <section ref={pricingRef} id="pricing" style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:820, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
            <div style={sectionLabel}>{C.pricingLabel}</div>
          </div>
          <h2 style={{ fontSize:36, fontWeight:800, margin:'0 0 14px', letterSpacing: isRTL ? -0.5 : -1 }}>{C.pricingTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(180,200,220,0.52)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>{C.pricingSub}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(270px, 1fr))', gap:28 }}>
          <PackCard data={C.trial}    onSelect={() => navigate('/register?pack=trial')} highlighted={false} isRTL={isRTL}/>
          <PackCard data={C.lifetime} onSelect={() => window.open('https://wa.me/212635925986?text=Bonjour%2C+je+veux+souscrire+au+pack+Lifetime+700DH','_blank')} highlighted={true} isRTL={isRTL}/>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'rgba(180,200,220,0.3)', marginTop:20 }}>💬 {C.whatsappNote}</p>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 40px', textAlign:'center', background:'linear-gradient(180deg, transparent 0%, rgba(0,230,118,0.04) 50%, transparent 100%)' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <div style={{ ...sectionLabel, borderColor:'rgba(246,216,96,0.3)', color:'#f6d860', background:'rgba(246,216,96,0.07)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#f6d860', display:'inline-block' }}/>
              {C.ctaEyebrow}
            </div>
          </div>
          <h2 style={{ fontSize:42, fontWeight:900, letterSpacing: isRTL ? -0.5 : -1.5, marginBottom:16, color:'#00e676' }}>{C.ctaH1}</h2>
          <p style={{ fontSize:16, color:'rgba(180,200,220,0.52)', lineHeight:1.75, marginBottom:36 }}>{C.ctaSub}</p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => scrollTo(pricingRef)} style={{ padding:'15px 36px', borderRadius:12, background:'#00e676', border:'none', color:'#080c10', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'sans-serif' }}>{C.ctaPrimary}</button>
            <button onClick={() => navigate('/login')} style={{ padding:'15px 36px', borderRadius:12, background:'#141b22', border:'1px solid rgba(255,255,255,0.12)', color:'#e8edf3', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'sans-serif' }}>{C.already}</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,0.06)', padding:'26px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, background:'#00e676', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:10, color:'#080c10', fontFamily:'monospace' }}>TJ</div>
          <span style={{ fontSize:14, fontWeight:600 }}>TradeJournal PRO</span>
        </div>
        <div style={{ fontSize:12, color:'rgba(180,200,220,0.3)' }}>{C.footerCopy}</div>
        <div style={{ display:'flex', gap:20, fontSize:13, color:'rgba(180,200,220,0.45)', direction:'ltr' }}>
          <span style={{ cursor:'pointer' }} onClick={() => navigate('/login')}>{C.signin}</span>
          <span style={{ cursor:'pointer' }} onClick={() => scrollTo(pricingRef)}>{C.pricingLabel}</span>
        </div>
      </footer>

    </div>
  );
}
