import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '📊', title: 'Trade Journal', desc: 'Log every trade with entry/exit, screenshots, market, session and result. Never miss a detail.' },
  { icon: '📈', title: 'P&L Analytics', desc: 'Real-time cumulative P&L charts, win rate, best/worst sessions and market performance breakdowns.' },
  { icon: '💰', title: 'Capital Tracking', desc: 'Track your capital evolution, ROI and withdrawals across multiple capital cycles.' },
  { icon: '📅', title: 'Calendar View', desc: 'Visual trade calendar showing your daily performance at a glance — spot patterns fast.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'Your data is yours. Encrypted sessions, device-locked access and security questions.' },
  { icon: '🌐', title: 'Access Anywhere', desc: 'Full web access from any device. Same powerful features as the desktop app, online.' },
];

const PACKS = [
  {
    key: 'trial',
    name: '24h Trial',
    price: 'FREE',
    isFree: true,
    desc: 'Tester la plateforme complète pendant 24 heures. Aucune carte requise.',
    features: ['Accès complet', 'Journal de trades', 'Graphiques P&L', 'Limité à 24 heures', 'Inscription par email'],
    disabledFeatures: [],
    cta: 'Démarrer l\'essai gratuit',
    ctaClass: 'btn-ghost',
  },
  {
    key: 'lifetime',
    name: 'Lifetime',
    price: '490',
    originalPrice: '700',
    discount: '-30%',
    currency: 'DH',
    period: ' une fois',
    desc: 'Payer une fois, utiliser pour toujours. Le compagnon de trading ultime.',
    features: ['Tout inclus', 'Accès à vie', 'Toutes les futures fonctionnalités', 'Aucun renouvellement', 'Support VIP'],
    disabledFeatures: [],
    cta: 'Profiter de la promo',
    ctaClass: 'btn-gold',
    lifetime: true,
    bestValue: true,
  },
];

export default function Landing() {
  const navigate   = useNavigate();
  const pricingRef = useRef(null);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="land-nav">
        <div className="land-nav-logo">
          <div className="logo-box">TJ</div>
          <div className="logo-txt">Trade<span>Journal</span></div>
        </div>
        <div className="land-nav-actions">
          <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={scrollToPricing}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="land-hero">
        <div className="land-hero-bg">
          <div className="land-orb land-orb1" />
          <div className="land-orb land-orb2" />
        </div>
        <div className="land-hero-content">
          <div className="land-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Professional Trading Journal
          </div>
          <h1 className="land-h1">
            Track. Analyze.<br />
            <span className="accent">Trade Smarter.</span>
          </h1>
          <p className="land-sub">
            The professional trading journal used by serious traders.
            Log trades, analyze performance and grow your capital — all in one place.
          </p>
          <div className="land-hero-ctas">
            <button className="btn btn-primary" onClick={scrollToPricing}>
              🚀 Get Started Free
            </button>
            <button className="btn btn-ghost" onClick={() => {
              document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              ▶ Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Video Demo */}
      <section id="video-section" className="land-video-section">
        <div className="land-section-label">See It In Action</div>
        <h2 className="land-section-title">Everything you need to track your trades</h2>
        <p className="land-section-sub">
          Watch how TradeJournal PRO helps traders stay disciplined, analyze patterns
          and improve their performance over time.
        </p>
        <div className="land-video-wrap">
          <DemoPlayer />
        </div>
      </section>

      {/* Features */}
      <section className="land-features-section">
        <div className="land-section-label">Features</div>
        <h2 className="land-section-title">Built for serious traders</h2>
        <p className="land-section-sub">
          Every feature designed with one goal: help you become a better, more consistent trader.
        </p>
        <div className="land-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="land-feature-card">
              <div className="land-feature-icon">{f.icon}</div>
              <div className="land-feature-title">{f.title}</div>
              <div className="land-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="land-pricing-section" ref={pricingRef} id="pricing">
        <div style={{ textAlign: 'center' }}>
          <div className="land-section-label">Pricing</div>
          <h2 className="land-section-title">Choose your plan</h2>
          <p className="land-section-sub" style={{ margin: '0 auto 0', textAlign: 'center' }}>
            Start free for 24h, then pick a plan that fits your trading journey.
            No hidden fees. Cancel anytime.
          </p>
        </div>
        <div className="land-pricing-grid" style={{ maxWidth: 720, margin: '48px auto 0', gridTemplateColumns: 'repeat(2,1fr)' }}>
          {PACKS.map(pack => (
            <PackCard key={pack.key} pack={pack} onSelect={() => {
              if (pack.isFree) {
                navigate(`/register?pack=${pack.key}`);
              } else {
                window.open('https://wa.me/212635925986?text=Bonjour%2C+je+veux+souscrire+au+pack+Lifetime+490DH+%28promo+-30%25%29', '_blank');
              }
            }} />
          ))}
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--muted)' }}>
          💬 Paiement Lifetime via WhatsApp
        </div>
      </section>

      {/* CTA */}
      <section className="land-cta-section">
        <div className="land-badge" style={{ margin: '0 auto 20px' }}>Limited spots available</div>
        <h1 className="land-h1">Ready to level up<br /><span className="accent">your trading?</span></h1>
        <p className="land-sub" style={{ margin: '0 auto 32px' }}>
          Join traders who use TradeJournal PRO to stay consistent and grow.
          Start free — no credit card needed for the 24h trial.
        </p>
        <div className="land-hero-ctas">
          <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 15 }} onClick={scrollToPricing}>
            🚀 Start Free Today
          </button>
          <button className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: 15 }} onClick={() => navigate('/login')}>
            Already have an account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="land-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-box" style={{ width: 28, height: 28, fontSize: 11 }}>TJ</div>
          <span>TradeJournal PRO</span>
        </div>
        <div>© 2025 TradeJournal PRO. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign In</span>
          <span style={{ cursor: 'pointer' }} onClick={scrollToPricing}>Pricing</span>
        </div>
      </footer>
    </div>
  );
}

function DemoPlayer() {
  const SLIDES = [
    { id: 0, label: 'Dashboard' },
    { id: 1, label: 'Add Trade' },
    { id: 2, label: 'P&L Chart' },
    { id: 3, label: 'Calendrier' },
    { id: 4, label: 'Capital' },
    { id: 5, label: 'Packs' },
  ];

  const [current,  setCurrent]  = React.useState(0);
  const [playing,  setPlaying]  = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const timerRef   = React.useRef(null);
  const progressRef = React.useRef(0);
  const DURATION = 5000;
  const TICK     = 50;

  const goSlide = React.useCallback((n) => {
    setCurrent(n);
    progressRef.current = 0;
    setProgress(0);
  }, []);

  const nextSlide = React.useCallback(() => {
    setCurrent(c => { const n = (c + 1) % 6; progressRef.current = 0; setProgress(0); return n; });
  }, []);

  const startTimer = React.useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      progressRef.current += TICK;
      setProgress(Math.min(100, (progressRef.current / DURATION) * 100));
      if (progressRef.current >= DURATION) {
        progressRef.current = 0;
        setCurrent(c => (c + 1) % 6);
      }
    }, TICK);
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => { setPlaying(true); startTimer(); }, 1000);
    return () => { clearTimeout(t); clearInterval(timerRef.current); };
  }, [startTimer]);

  const togglePlay = () => {
    if (playing) {
      clearInterval(timerRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      startTimer();
    }
  };

  const seek = (e, el) => {
    const rect = el.getBoundingClientRect();
    const pct  = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    progressRef.current = pct * DURATION;
    setProgress(pct * 100);
  };

  const s = { /* shared inline styles */
    bg:    { background: 'var(--bg)' },
    bg2:   { background: 'var(--bg2)' },
    bg3:   { background: 'var(--bg3)' },
    card:  { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 },
    card3: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 },
    muted: { color: 'var(--muted)' },
    green: { color: 'var(--green)' },
    red:   { color: 'var(--red)' },
    blue:  { color: 'var(--blue)' },
    gold:  { color: 'var(--gold)' },
    mono:  { fontFamily: 'var(--font-mono)' },
    lbl:   { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 6 },
    val:   { fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, lineHeight: 1 },
    badge: (win) => ({
      padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 700, flexShrink: 0,
      background: win ? 'rgba(0,230,118,0.12)' : 'rgba(255,71,87,0.12)',
      color: win ? 'var(--green)' : 'var(--red)'
    }),
  };

  const StatCard = ({ lbl, val, color, sub }) => (
    <div style={{ ...s.card3, flex: 1 }}>
      <div style={s.lbl}>{lbl}</div>
      <div style={{ ...s.val, color }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  const TradeRow = ({ market, type, win, amount, date }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
      <span style={{ fontWeight: 700, width: 64, flexShrink: 0 }}>{market}</span>
      <span style={{ color: type === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 700, width: 34, flexShrink: 0 }}>{type}</span>
      <span style={s.badge(win)}>{win ? 'WIN' : 'LOSE'}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>{date}</span>
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, color: win ? 'var(--green)' : 'var(--red)' }}>{amount}</span>
    </div>
  );

  /* ── Slide content ── */
  const slides = [

    /* 0 — Dashboard */
    <div key={0} style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl="P&L Total"  val="+$4,820" color="var(--green)" sub="↑ ce mois" />
        <StatCard lbl="Win Rate"   val="68.4%"   color="var(--green)" sub="87W / 40L" />
        <StatCard lbl="Trades"     val="127"     color="var(--blue)"  sub="ce mois" />
        <StatCard lbl="Capital"    val="$24,820" color="var(--text)"  sub="+24.1% ROI" />
      </div>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Cumulative P&L — Juin 2025</div>
        <svg width="100%" height="90" viewBox="0 0 520 90" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dg0" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0 80 L40 74 L80 65 L120 70 L160 55 L200 44 L240 50 L280 35 L320 26 L360 30 L400 16 L450 10 L520 6 L520 90 L0 90Z" fill="url(#dg0)"/>
          <path d="M0 80 L40 74 L80 65 L120 70 L160 55 L200 44 L240 50 L280 35 L320 26 L360 30 L400 16 L450 10 L520 6" fill="none" stroke="#00e676" strokeWidth="2"/>
        </svg>
      </div>
      <div style={s.card}>
        <TradeRow market="NAS100" type="BUY"  win={true}  amount="+$320" date="14 Jun" />
        <TradeRow market="XAUUSD" type="SELL" win={true}  amount="+$185" date="13 Jun" />
        <TradeRow market="US30"   type="BUY"  win={false} amount="-$95"  date="12 Jun" />
      </div>
    </div>,

    /* 1 — Add Trade */
    <div key={1} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={s.card3}>
        <div style={{ ...s.lbl, marginBottom: 8 }}>Marché</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['NAS100','XAUUSD','US30','EURUSD','GBPUSD'].map(m => (
            <span key={m} style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700,
              background: m === 'NAS100' ? 'var(--green)' : 'var(--bg4)',
              color: m === 'NAS100' ? '#080c10' : 'var(--muted)' }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['BUY','SELL'].map(d => (
          <div key={d} style={{ flex: 1, padding: 10, borderRadius: 6, textAlign: 'center', fontWeight: 800, fontSize: 13,
            background: d === 'BUY' ? 'rgba(0,230,118,0.2)' : 'var(--bg3)',
            color: d === 'BUY' ? 'var(--green)' : 'var(--muted)' }}>{d === 'BUY' ? '▲ ' : '▼ '}{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[['Entry Price','17,842.50',true],['Close Price','18,012.00',false],['Amount ($)','320.00',false],['Session','LON',false]].map(([lbl,val,focus]) => (
          <div key={lbl}>
            <div style={s.lbl}>{lbl}</div>
            <div style={{ background: 'var(--bg3)', border: `1px solid ${focus ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(0,230,118,0.08)', borderRadius: 6, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
        +169.50 pts preview
      </div>
      <div style={{ background: 'var(--green)', color: '#080c10', borderRadius: 6, padding: 11, textAlign: 'center', fontWeight: 800, fontSize: 13 }}>
        💾 Save Trade
      </div>
    </div>,

    /* 2 — P&L Chart */
    <div key={2} style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl="Total P&L" val="+$4,820" color="var(--green)" />
        <StatCard lbl="Win Rate"  val="68.4%"   color="var(--green)" />
        <StatCard lbl="Best Day"  val="+$920"   color="var(--blue)"  />
        <StatCard lbl="Worst Day" val="-$310"   color="var(--red)"   />
      </div>
      <div style={{ ...s.card, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>P&L Mensuel</div>
        <svg width="100%" height="90" viewBox="0 0 520 90">
          <defs>
            <linearGradient id="bg1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#00e676" stopOpacity="0.8"/><stop offset="100%" stopColor="#00e676" stopOpacity="0.4"/></linearGradient>
            <linearGradient id="br1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ff4757" stopOpacity="0.8"/><stop offset="100%" stopColor="#ff4757" stopOpacity="0.4"/></linearGradient>
          </defs>
          {[[10,35,55],[70,10,80],[130,58,32],[190,22,68],[250,42,48],[310,66,24],[370,8,82],[430,18,72]].map(([x,y,h],i) => (
            <rect key={i} x={x} y={y} width={40} height={h} rx={4} fill={[2,5].includes(i) ? 'url(#br1)' : 'url(#bg1)'} />
          ))}
          {['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû'].map((m,i) => (
            <text key={m} x={30+i*60} y={88} textAnchor="middle" fontSize={9} fill="var(--muted)">{m}</text>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['LON','$2,840',75,'var(--green)'],['NY','$1,520',45,'var(--blue)'],['ASI','$460',20,'var(--orange)']].map(([s2,v,w,c]) => (
          <div key={s2} style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{s2} Session</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: c }}>{v}</div>
            <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 99, marginTop: 5 }}>
              <div style={{ width: `${w}%`, height: '100%', background: c, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>,

    /* 3 — Calendar */
    <div key={3} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...s.card3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Juin 2025</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(0,230,118,0.1)', borderRadius: 4, color: 'var(--green)', fontWeight: 700 }}>17 WIN</span>
            <span style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,71,87,0.1)',  borderRadius: 4, color: 'var(--red)',   fontWeight: 700 }}>7 LOSE</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {['L','M','M','J','V','S','D'].map(d => <div key={d} style={{ fontSize: 9, textAlign: 'center', color: 'var(--muted)', fontWeight: 700, paddingBottom: 4 }}>{d}</div>)}
          {[null,null,null,null,null,null,null,'w','w','l','w','w',null,null,'w','l','w','w','w',null,null,'l','w','w','l','w',null,null,'w','w','l','w','w',null,null,'w'].map((v,i) => {
            const day = i - 6;
            const c = v === 'w' ? 'rgba(0,230,118,0.15)' : v === 'l' ? 'rgba(255,71,87,0.12)' : 'var(--bg4)';
            const tc = v === 'w' ? 'var(--green)' : v === 'l' ? 'var(--red)' : 'var(--dim)';
            return <div key={i} style={{ aspectRatio:1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c, color: tc, fontSize: 10, fontWeight: 600 }}>
              {day > 0 && day <= 30 ? day : ''}
            </div>;
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl="Meilleur jour"  val="+$920" color="var(--green)" sub="Jeu 17 juin" />
        <StatCard lbl="Consistance"    val="70.8%" color="var(--blue)"  sub="Jours +profit" />
        <StatCard lbl="Streak actuel"  val="4 🔥"  color="var(--orange)" sub="Consécutifs" />
      </div>
    </div>,

    /* 4 — Capital */
    <div key={4} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard lbl="Capital actuel"  val="$24,820" color="var(--green)" sub="+$4,820 profit" />
        <StatCard lbl="Capital initial" val="$20,000" color="var(--text)"  sub="ROI +24.1%" />
      </div>
      <div style={s.card3}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Progression du capital</div>
        {[['Capital initial','$20,000',80,'var(--blue)'],['Profit réalisé','+$4,820',24,'var(--green)'],['Retraits','-$1,200',6,'var(--orange)']].map(([lbl,val,w,c]) => (
          <div key={lbl} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: 'var(--muted)' }}>{lbl}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: c }}>{val}</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 99 }}>
              <div style={{ width: `${w}%`, height: '100%', background: c, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '8px 14px', background: 'var(--bg3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.5px' }}>
          {['Date','Initial','Actuel','ROI'].map(h => <span key={h}>{h}</span>)}
        </div>
        {[['Jan 2025','$15,000','$18,200','+21.3%'],['Jun 2025','$20,000','$24,820','+24.1%']].map(([d,i,a,r]) => (
          <div key={d} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 14px', fontSize: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted)' }}>{d}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{i}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{a}</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>,

    /* 5 — Packs */
    <div key={5} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {[
          { name:'24h Trial', price:'FREE', priceColor:'var(--green)', border:'var(--border)', ctaBg:'var(--bg4)', ctaColor:'var(--text)', note:'', sub:'Accès complet · 24h · Sans carte' },
          { name:'Lifetime',  price:'490 DH', originalPrice:'700 DH', priceColor:'var(--gold)', border:'var(--gold)', ctaBg:'linear-gradient(135deg,#f6d860,#e6b800)', ctaColor:'#080c10', note:'MEILLEURE VALEUR', noteColor:'var(--gold)', sub:'Accès à vie · Tout inclus · Une seule fois' },
        ].map(p => (
          <div key={p.name} style={{ background: 'var(--bg3)', border: `1px solid ${p.border}`, borderRadius: 10, padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {p.note && <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: p.noteColor }}>{p.note}</div>}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)' }}>{p.name}</div>
            {p.originalPrice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: -4 }}>
                <span style={{ background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>🔥 -30%</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dim)', textDecoration: 'line-through' }}>{p.originalPrice}</span>
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 24, color: p.priceColor }}>{p.price}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5, flex: 1 }}>✓ Accès complet<br/>✓ Trades illimités<br/>✓ Analytics avancés</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>{p.sub}</div>
            <div style={{ padding: '7px', borderRadius: 5, fontSize: 11, fontWeight: 700, textAlign: 'center', background: p.ctaBg, color: p.ctaColor }}>
              {p.name === 'Lifetime' ? '💬 Via WhatsApp' : 'Commencer'}
            </div>
          </div>
        ))}
      </div>
      <div style={s.card3}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Paiement Lifetime</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ fontSize: 16 }}>💬</span>
          <span>WhatsApp (contactez-nous)</span>
        </div>
      </div>
      <div style={{ padding: '10px 14px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--muted)' }}>
        📧 Après inscription, votre <strong style={{ color: 'var(--text)' }}>username + mot de passe</strong> sont envoyés automatiquement par email.
      </div>
    </div>,
  ];

  const navLabels = ['▦ Dashboard','+ Add Trade','↗ P&L Chart','📅 Calendrier','◎ Capital','💳 Packs'];

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-main)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: 'rgba(8,12,16,0.95)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: 'var(--green)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: '#080c10' }}>TJ</div>
          <span style={{ fontWeight: 800, fontSize: 13 }}>Trade<span style={{ color: 'var(--green)' }}>Journal</span> PRO</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => goSlide(i)} style={{ height: 7, borderRadius: 4, cursor: 'pointer', transition: 'all 0.3s',
              width: i === current ? 22 : 7,
              background: i === current ? 'var(--green)' : 'var(--bg4)' }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{ width: 150, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: '10px 0' }}>
          {navLabels.map((lbl, i) => (
            <div key={i} onClick={() => goSlide(i)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
              color: i === current ? 'var(--green)' : 'var(--muted)',
              background: i === current ? 'rgba(0,230,118,0.07)' : 'transparent',
              borderLeft: `2px solid ${i === current ? 'var(--green)' : 'transparent'}`,
            }}>{lbl}</div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
          <div key={current} style={{ animation: 'fadeUp 0.35s ease both' }}>
            <style>{'@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}'}</style>
            {slides[current]}
          </div>
        </div>
      </div>

      {/* Playback bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <button onClick={togglePlay} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {playing
            ? <svg width="10" height="12" viewBox="0 0 10 12" fill="#080c10"><rect x="0" y="0" width="3.5" height="12"/><rect x="6.5" y="0" width="3.5" height="12"/></svg>
            : <svg width="11" height="13" viewBox="0 0 11 13" fill="#080c10" style={{ marginLeft: 1 }}><path d="M0 0L11 6.5L0 13Z"/></svg>
          }
        </button>
        <div onClick={(e) => seek(e, e.currentTarget)} style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 99, cursor: 'pointer' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--green)', borderRadius: 99, transition: 'width 0.05s linear', pointerEvents: 'none' }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>{SLIDES[current].label}</span>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{current + 1} / {SLIDES.length}</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {['‹','›'].map((a, i) => (
            <div key={a} onClick={i === 0 ? () => goSlide((current - 1 + 6) % 6) : nextSlide}
              style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--bg3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: 'var(--text)' }}>{a}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PackCard({ pack, onSelect }) {
  return (
    <div className={`pack-card ${pack.popular ? 'popular' : ''} ${pack.lifetime ? 'lifetime' : ''}`}>
      {pack.popular   && <div className="pack-popular-tag">MOST POPULAR</div>}
      {pack.bestValue && <div className="pack-lifetime-tag">MEILLEURE VALEUR</div>}

      <div className="pack-name">{pack.name}</div>

      {/* Promo badge + ancien prix barré */}
      {pack.discount && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            background: 'var(--red)', color: '#fff',
            fontSize: 11, fontWeight: 800, padding: '3px 10px',
            borderRadius: 99, letterSpacing: '0.5px',
          }}>🔥 {pack.discount}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 15,
            color: 'var(--dim)', textDecoration: 'line-through',
          }}>{pack.originalPrice} {pack.currency}</span>
        </div>
      )}

      <div className={`pack-price ${pack.isFree ? 'free' : ''} ${pack.lifetime ? 'gold' : ''}`}>
        {pack.isFree ? (
          'FREE'
        ) : (
          <>
            {pack.price}
            <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 4 }}>{pack.currency || '$'}</span>
            <span className="pack-period">{pack.period}</span>
          </>
        )}
      </div>

      <div className="pack-desc">{pack.desc}</div>

      <ul className="pack-features">
        {pack.features.map(f => <li key={f}>{f}</li>)}
        {(pack.disabledFeatures || []).map(f => <li key={f} className="no">{f}</li>)}
      </ul>

      {pack.lifetime && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px 12px', background: 'rgba(246,216,96,0.06)', border: '1px solid rgba(246,216,96,0.2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
          💬 Paiement via WhatsApp — contactez-nous pour payer
        </div>
      )}

      <button className={`btn ${pack.ctaClass} pack-btn`} onClick={onSelect}>
        {pack.cta}
      </button>
    </div>
  );
}
