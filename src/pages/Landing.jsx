import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../lang/LangContext';
import CinematicDemoPlayer from '../components/CinematicDemoPlayer';

// ─── Language Switcher ───────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English',  short: 'EN', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية',  short: 'AR', flag: '🇲🇦' },
  { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
];

function NavLangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
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
        background: open ? 'rgba(0,230,118,0.1)' : 'var(--bg3)',
        border: `1px solid ${open ? 'rgba(0,230,118,0.35)' : 'var(--border)'}`,
        color: open ? 'var(--green)' : 'var(--text)',
        fontFamily:'var(--font-main)', fontSize:13, fontWeight:700, transition:'all 0.2s',
      }}>
        <span style={{ fontSize:16 }}>{current.flag}</span>
        <span>{current.short}</span>
        <span style={{ fontSize:10, opacity:0.6, transform: open?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block' }}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', minWidth:150, zIndex:300, boxShadow:'0 16px 40px rgba(0,0,0,0.5)' }}>
          {LANGUAGES.map((l, i) => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
              background: l.code === lang ? 'rgba(0,230,118,0.08)' : 'transparent',
              border:'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              color: l.code === lang ? 'var(--green)' : 'var(--text)',
              cursor:'pointer', fontSize:13, fontWeight: l.code === lang ? 700 : 500, fontFamily:'var(--font-main)',
            }}>
              <span style={{ fontSize:18 }}>{l.flag}</span>
              <span style={{ flex:1, textAlign:'left' }}>{l.label}</span>
              {l.code === lang && <span style={{ fontSize:10, color:'var(--green)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Content per language ────────────────────────────────────────────────────
const CONTENT = {
  ar: {
    heroEyebrow: 'المنصة الاحترافية للمتداولين',
    heroH1a: 'سجّل. حلّل.',
    heroH1b: 'تداول بذكاء.',
    heroSub: 'المنصة الاحترافية التي تحوّل طريقة تتبع صفقاتك. حلّل أداءك، اكتشف الأنماط، ونمّي رأس مالك.',
    ctaPrimary: '🚀 ابدأ مجاناً',
    ctaSecondary: '▶ شاهد العرض',
    videoLabel: 'اكتشف المنصة',
    videoTitle: 'كل ما تحتاجه لتتبع صفقاتك',
    videoSub: 'شاهد كيف يساعدك TradeJournal PRO على الانضباط، تحليل الأنماط، وتحسين أدائك يوماً بعد يوم.',
    featLabel: 'الميزات',
    featTitle: 'مصمّم للمتداولين الجادين',
    featSub: 'كل ميزة صُممت بهدف واحد: مساعدتك لتكون متداولاً أفضل وأكثر ثباتاً.',
    features: [
      { icon:'📊', title:'يوميات الصفقات', desc:'سجّل كل صفقة مع الدخول والخروج، لقطات الشاشة، السوق والجلسة. لا تفوّت أي تفصيل.' },
      { icon:'📈', title:'تحليلات الأداء', desc:'رسوم P&L تراكمية، نسبة الفوز، أفضل الجلسات والأسواق بتفاصيل دقيقة.' },
      { icon:'💰', title:'تتبع رأس المال', desc:'تتبع تطور رأس مالك، العائد على الاستثمار والمسحوبات عبر دورات متعددة.' },
      { icon:'📅', title:'تقويم بصري', desc:'خريطة بصرية لأداءك اليومي. اكتشف الأنماط والسلاسل الربحية بسرعة.' },
    ],
    pricingLabel: 'الأسعار',
    pricingTitle: 'اختر خطتك',
    pricingSub: 'ابدأ مجاناً 24 ساعة. ثم احصل على الوصول مدى الحياة بسعر استثنائي.',
    trial: { name:'تجربة مجانية', price:'مجاناً', cls:'free', desc:'24 ساعة وصول كامل. لا بطاقة مطلوبة.', features:['وصول كامل','يوميات الصفقات','تحليلات P&L','مقيّد بـ 24 ساعة'], cta:'ابدأ التجربة المجانية', ctaCls:'btn-ghost' },
    lifetime: { name:'مدى الحياة', price:'700', curr:'DH', period:' مرة واحدة', orig:'1000 DH', disc:'🔥 -30%', desc:'ادفع مرة واحدة واستخدم للأبد.', features:['كل شيء مشمول','وصول مدى الحياة','الميزات المستقبلية','دعم VIP'], cta:'احصل على العرض 💬', ctaCls:'btn-gold', badge:'الأفضل قيمة' },
    ctaEyebrow: 'مقاعد محدودة',
    ctaH1a: 'جاهز لترقية',
    ctaH1b: 'تداولك؟',
    ctaSub: 'انضم إلى المتداولين الذين يستخدمون TradeJournal PRO للثبات والنمو. ابدأ مجاناً — لا حاجة لبطاقة.',
    already: 'لدي حساب بالفعل',
    signin: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',
    stats: [{ v:'127+', l:'متداول نشط' }, { v:'68%', l:'متوسط نسبة الفوز' }, { v:'+24%', l:'متوسط العائد' }],
    footerCopy: '© 2025 TradeJournal PRO. جميع الحقوق محفوظة.',
    whatsappNote: 'الدفع عبر واتساب — تواصل معنا',
  },
  en: {
    heroEyebrow: 'Professional Trading Platform',
    heroH1a: 'Track. Analyze.',
    heroH1b: 'Trade Smarter.',
    heroSub: 'The professional trading journal for serious traders. Log trades, analyze performance, discover patterns, and grow your capital.',
    ctaPrimary: '🚀 Get Started Free',
    ctaSecondary: '▶ Watch Demo',
    videoLabel: 'See It In Action',
    videoTitle: 'Everything you need to master your trading',
    videoSub: 'Watch how TradeJournal PRO helps you stay disciplined, analyze patterns, and improve consistently over time.',
    featLabel: 'Features',
    featTitle: 'Built for serious traders',
    featSub: 'Every feature designed with one goal: help you become a better, more consistent trader.',
    features: [
      { icon:'📊', title:'Trade Journal', desc:'Log every trade with entry/exit, screenshots, market and session. Never miss a detail.' },
      { icon:'📈', title:'Performance Analytics', desc:'Cumulative P&L charts, win rate, best sessions and market performance breakdowns.' },
      { icon:'💰', title:'Capital Tracking', desc:'Track capital evolution, ROI and withdrawals across multiple capital cycles.' },
      { icon:'📅', title:'Visual Calendar', desc:'Visual daily performance map. Spot patterns and winning streaks instantly.' },
    ],
    pricingLabel: 'Pricing',
    pricingTitle: 'Choose your plan',
    pricingSub: 'Start free for 24h, then get lifetime access at an exceptional price. No hidden fees.',
    trial: { name:'24h Trial', price:'FREE', cls:'free', desc:'Full access for 24 hours. No card required.', features:['Full access','Trade journal','P&L analytics','Limited to 24h'], cta:'Start Free Trial', ctaCls:'btn-ghost' },
    lifetime: { name:'Lifetime', price:'700', curr:'DH', period:' once', orig:'1000 DH', disc:'🔥 -30%', desc:'Pay once, use forever. The ultimate trading companion.', features:['Everything included','Lifetime access','All future features','VIP Support'], cta:'Get the deal 💬', ctaCls:'btn-gold', badge:'Best Value' },
    ctaEyebrow: 'Limited spots available',
    ctaH1a: 'Ready to level up',
    ctaH1b: 'your trading?',
    ctaSub: 'Join traders who use TradeJournal PRO to stay consistent and grow. Start free — no credit card needed.',
    already: 'Already have an account',
    signin: 'Sign In',
    getStarted: 'Get Started',
    stats: [{ v:'127+', l:'Active traders' }, { v:'68%', l:'Avg win rate' }, { v:'+24%', l:'Avg return' }],
    footerCopy: '© 2025 TradeJournal PRO. All rights reserved.',
    whatsappNote: 'Payment via WhatsApp — contact us',
  },
  fr: {
    heroEyebrow: 'Plateforme de Trading Professionnelle',
    heroH1a: 'Enregistrez. Analysez.',
    heroH1b: 'Tradez mieux.',
    heroSub: 'La plateforme de trading professionnelle pour traders sérieux. Suivez vos trades, analysez vos performances et faites croître votre capital.',
    ctaPrimary: '🚀 Commencer gratuitement',
    ctaSecondary: '▶ Voir la démo',
    videoLabel: 'Découvrez la plateforme',
    videoTitle: 'Tout ce dont vous avez besoin pour maîtriser votre trading',
    videoSub: 'Découvrez comment TradeJournal PRO vous aide à rester discipliné, analyser vos tendances et progresser.',
    featLabel: 'Fonctionnalités',
    featTitle: 'Conçu pour les traders sérieux',
    featSub: 'Chaque fonctionnalité est conçue avec un seul objectif : vous aider à devenir un meilleur trader.',
    features: [
      { icon:'📊', title:'Journal de Trades', desc:'Enregistrez chaque trade avec entrée/sortie, captures, marché et session. Ne manquez aucun détail.' },
      { icon:'📈', title:'Analyses de Performance', desc:'Graphiques P&L cumulatifs, taux de réussite, meilleures sessions et analyses de marché.' },
      { icon:'💰', title:'Suivi du Capital', desc:'Suivez l\'évolution du capital, ROI et retraits sur plusieurs cycles.' },
      { icon:'📅', title:'Calendrier Visuel', desc:'Carte visuelle de votre performance quotidienne. Repérez les tendances instantanément.' },
    ],
    pricingLabel: 'Tarifs',
    pricingTitle: 'Choisissez votre plan',
    pricingSub: 'Commencez gratuitement 24h, puis obtenez un accès à vie à un prix exceptionnel.',
    trial: { name:'Essai 24h', price:'GRATUIT', cls:'free', desc:'Accès complet pendant 24h. Aucune carte requise.', features:['Accès complet','Journal de trades','Analyses P&L','Limité à 24h'], cta:'Commencer l\'essai gratuit', ctaCls:'btn-ghost' },
    lifetime: { name:'À vie', price:'700', curr:'DH', period:' une fois', orig:'1000 DH', disc:'🔥 -30%', desc:'Payez une fois, utilisez pour toujours.', features:['Tout inclus','Accès à vie','Futures fonctionnalités','Support VIP'], cta:'Profiter de la promo 💬', ctaCls:'btn-gold', badge:'Meilleure valeur' },
    ctaEyebrow: 'Places limitées',
    ctaH1a: 'Prêt à améliorer',
    ctaH1b: 'votre trading ?',
    ctaSub: 'Rejoignez les traders qui utilisent TradeJournal PRO pour rester cohérents et progresser.',
    already: 'J\'ai déjà un compte',
    signin: 'Se connecter',
    getStarted: 'Commencer',
    stats: [{ v:'127+', l:'Traders actifs' }, { v:'68%', l:'Taux de réussite moy.' }, { v:'+24%', l:'Rendement moyen' }],
    footerCopy: '© 2025 TradeJournal PRO. Tous droits réservés.',
    whatsappNote: 'Paiement via WhatsApp — contactez-nous',
  },
};

// ─── Pack Card ───────────────────────────────────────────────────────────────
function PackCard({ data, onSelect }) {
  return (
    <div className={`pack-card ${data.badge ? 'lifetime' : ''}`} style={{ position:'relative', marginTop: data.badge ? 12 : 0 }}>
      {data.badge && <div className="pack-lifetime-tag">{data.badge}</div>}
      <div className="pack-name">{data.name}</div>
      {data.disc && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ background:'var(--red)', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 10px', borderRadius:99 }}>{data.disc}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--dim)', textDecoration:'line-through' }}>{data.orig}</span>
        </div>
      )}
      <div className={`pack-price ${data.cls || 'gold'}`}>
        {data.cls === 'free' ? data.price : (
          <>{data.price}<span style={{ fontSize:18, fontWeight:600 }}> {data.curr}</span><span className="pack-period">{data.period}</span></>
        )}
      </div>
      <div className="pack-desc">{data.desc}</div>
      <ul className="pack-features">
        {data.features.map(f => <li key={f}>{f}</li>)}
      </ul>
      <button className={`btn ${data.ctaCls} pack-btn`} onClick={onSelect}>{data.cta}</button>
    </div>
  );
}

// ─── MAIN LANDING ────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate   = useNavigate();
  const { lang }   = useLang();
  const pricingRef = useRef(null);
  const C = CONTENT[lang] || CONTENT.en;
  const isRTL = lang === 'ar';

  const scrollTo = ref => ref.current?.scrollIntoView({ behavior:'smooth' });

  return (
    <div className="landing" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="land-nav">
        <div className="land-nav-logo">
          <div className="logo-box" style={{ fontFamily:'var(--font-mono)' }}>TJ</div>
          <div className="logo-txt">Trade<span>Journal</span> PRO</div>
        </div>
        <div className="land-nav-actions">
          <NavLangSwitcher />
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>{C.signin}</button>
          <button className="btn btn-primary" onClick={() => scrollTo(pricingRef)}>{C.getStarted}</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="land-hero">
        <div className="land-hero-bg">
          <div className="land-orb land-orb1"/>
          <div className="land-orb land-orb2"/>
        </div>
        <div className="land-hero-content">
          <div className="land-badge">
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', display:'inline-block' }}/>
            {C.heroEyebrow}
          </div>
          <h1 className="land-h1">{C.heroH1a}<br/><span className="accent">{C.heroH1b}</span></h1>
          <p className="land-sub">{C.heroSub}</p>
          <div className="land-hero-ctas">
            <button className="btn btn-primary" onClick={() => scrollTo(pricingRef)}>{C.ctaPrimary}</button>
            <button className="btn btn-ghost" onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior:'smooth' })}>{C.ctaSecondary}</button>
          </div>
        </div>
      </section>

      {/* ── VIDEO DEMO ─────────────────────────────────────────────── */}
      <section id="video-section" style={{ padding:'80px 0', background:'linear-gradient(180deg, var(--bg) 0%, #080e18 40%, var(--bg) 100%)', position:'relative', overflow:'hidden' }}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:400, background:'rgba(0,230,118,0.03)', filter:'blur(80px)', borderRadius:'50%', pointerEvents:'none' }}/>

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 40px' }}>
          {/* Section header */}
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div className="land-section-label">{C.videoLabel}</div>
            <h2 className="land-section-title" style={{ maxWidth:700, margin:'0 auto 16px' }}>{C.videoTitle}</h2>
            <p className="land-section-sub" style={{ maxWidth:560, margin:'0 auto' }}>{C.videoSub}</p>
          </div>

          {/* The cinematic player — full width, grand */}
          <CinematicDemoPlayer key={lang} lang={lang} />
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section className="land-features-section">
        <div className="land-section-label">{C.featLabel}</div>
        <h2 className="land-section-title">{C.featTitle}</h2>
        <p className="land-section-sub">{C.featSub}</p>
        <div className="land-features-grid">
          {C.features.map(f => (
            <div key={f.title} className="land-feature-card">
              <div className="land-feature-icon">{f.icon}</div>
              <div className="land-feature-title">{f.title}</div>
              <div className="land-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <section className="land-pricing-section" ref={pricingRef} id="pricing">
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div className="land-section-label">{C.pricingLabel}</div>
          <h2 className="land-section-title">{C.pricingTitle}</h2>
          <p className="land-section-sub" style={{ margin:'0 auto' }}>{C.pricingSub}</p>
        </div>
        <div className="land-pricing-grid" style={{ maxWidth:720, margin:'0 auto', gridTemplateColumns:'repeat(2,1fr)' }}>
          <PackCard data={C.trial}    onSelect={() => navigate('/register?pack=trial')} />
          <PackCard data={C.lifetime} onSelect={() => window.open('https://wa.me/212635925986?text=Bonjour%2C+je+veux+souscrire+au+pack+Lifetime+700DH','_blank')} />
        </div>
        <p style={{ textAlign:'center', fontSize:13, color:'var(--muted)', marginTop:24 }}>💬 {C.whatsappNote}</p>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="land-cta-section">
        <div className="land-badge" style={{ margin:'0 auto 20px' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', display:'inline-block' }}/>
          {C.ctaEyebrow}
        </div>
        <h1 className="land-h1">{C.ctaH1a}<br/><span className="accent">{C.ctaH1b}</span></h1>
        <p className="land-sub" style={{ margin:'0 auto 32px' }}>{C.ctaSub}</p>
        <div className="land-hero-ctas">
          <button className="btn btn-primary" style={{ padding:'14px 32px', fontSize:15 }} onClick={() => scrollTo(pricingRef)}>{C.ctaPrimary}</button>
          <button className="btn btn-ghost"   style={{ padding:'14px 32px', fontSize:15 }} onClick={() => navigate('/login')}>{C.already}</button>
        </div>
        <div style={{ display:'flex', gap:48, justifyContent:'center', marginTop:48, flexWrap:'wrap' }}>
          {C.stats.map(({ v, l }) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:36, fontWeight:900, color:'var(--green)' }}>{v}</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="land-footer">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, background:'var(--green)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:10, color:'#080c10', fontFamily:'var(--font-mono)' }}>TJ</div>
          <span>TradeJournal PRO</span>
        </div>
        <div>{C.footerCopy}</div>
        <div style={{ display:'flex', gap:20 }}>
          <span style={{ cursor:'pointer' }} onClick={() => navigate('/login')}>{C.signin}</span>
          <span style={{ cursor:'pointer' }} onClick={() => scrollTo(pricingRef)}>{C.pricingLabel}</span>
        </div>
      </footer>
    </div>
  );
}
