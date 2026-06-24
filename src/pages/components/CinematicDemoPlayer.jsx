// ═══════════════════════════════════════════════════════════════
//  CinematicDemoPlayer — professional video-style animated demo
//  Arabic voice: uses speechSynthesis with proper lang + fallback
// ═══════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ── Voice helpers ─────────────────────────────────────────── */
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
    // Chrome bug: after cancel() synthesis can get stuck in paused state; resume() unblocks it
    try { window.speechSynthesis.resume(); } catch (_) {}

    // Always split Arabic text at sentence boundaries — Chrome silently cuts off
    // single long utterances in Arabic regardless of length
    if (lang === 'ar') {
      const parts = text.split(/[.،!?]/g).map(s => s.trim()).filter(Boolean);
      let i = 0;
      const playNext = () => {
        if (i >= parts.length) { onEnd?.(); return; }
        const u = new SpeechSynthesisUtterance(parts[i++]);
        const v = getBestVoice('ar');
        if (v) u.voice = v;
        u.lang = 'ar-SA'; u.rate = 0.85; u.pitch = 1; u.volume = 1;
        u.onend = playNext;
        u.onerror = playNext; // don't get stuck on a failed segment
        window.speechSynthesis.speak(u);
      };
      playNext();
      return;
    }

    const utt = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice(lang);
    if (voice) utt.voice = voice;
    utt.lang   = lang === 'fr' ? 'fr-FR' : 'en-US';
    utt.rate   = 0.9;
    utt.pitch  = 1;
    utt.volume = 1;
    if (onEnd) utt.onend = onEnd;
    window.speechSynthesis.speak(utt);
  };

  // Voices may not be loaded yet — wait for them with a timeout safety net
  if (window.speechSynthesis.getVoices().length === 0) {
    let ran = false;
    const fallback = setTimeout(() => { if (!ran) { ran = true; run(); } }, 500);
    window.speechSynthesis.onvoiceschanged = () => {
      if (!ran) { ran = true; clearTimeout(fallback); }
      window.speechSynthesis.onvoiceschanged = null;
      run();
    };
  } else {
    run();
  }
}

/* ── Scene data ─────────────────────────────────────────────── */
const SCENES = {
  ar: [
    { id:'intro',    dur:5500, title:'TradeJournal PRO',    subtitle:'يوميات التداول الاحترافية',
      voice:'مرحباً بكم في TradeJournal PRO. المنصة الاحترافية التي تحوّل طريقة تتبع صفقاتك وتحليل أدائك.' },
    { id:'dashboard', dur:7000, title:'لوحة التحكم',        subtitle:'نظرة شاملة — دفعة واحدة',
      voice:'لوحة التحكم تعطيك نظرة كاملة على أدائك في ثوانٍ. إجمالي الأرباح ونسبة الفوز وتطور رأس المال.' },
    { id:'addtrade',  dur:6500, title:'تسجيل الصفقات',      subtitle:'سريع ودقيق',
      voice:'سجّل كل صفقة في ثوانٍ. اختر السوق والاتجاه وأدخل الأسعار لترى معاينة فورية للربح أو الخسارة.' },
    { id:'analytics', dur:7000, title:'تحليل الأداء',       subtitle:'اكتشف أنماطك',
      voice:'التحليلات تكشف لك الحقيقة. أي الجلسات أفضل؟ أي الأسواق أكثر ربحاً؟ كل التفاصيل أمامك.' },
    { id:'calendar',  dur:6000, title:'التقويم البصري',     subtitle:'أداؤك يومياً',
      voice:'التقويم البصري يُظهر أيام الفوز والخسارة بلون واضح. اكتشف الأنماط والسلاسل الربحية بسرعة.' },
    { id:'pricing',   dur:6000, title:'الأسعار',             subtitle:'ابدأ مجاناً اليوم',
      voice:'ابدأ بتجربة مجانية 24 ساعة. أو احصل على الوصول مدى الحياة بسعر استثنائي. لا رسوم خفية.' },
  ],
  en: [
    { id:'intro',    dur:5500, title:'TradeJournal PRO',    subtitle:'Professional Trade Journaling',
      voice:'Welcome to TradeJournal PRO. The professional platform that transforms how you track trades and analyze performance.' },
    { id:'dashboard', dur:7000, title:'Dashboard',           subtitle:'Full Overview — at a Glance',
      voice:'The dashboard gives you a complete performance overview in seconds. Total P and L, win rate, and capital growth.' },
    { id:'addtrade',  dur:6500, title:'Log Trades',          subtitle:'Fast & Accurate',
      voice:'Log every trade in seconds. Choose market, direction, enter prices and get an instant preview of your profit or loss.' },
    { id:'analytics', dur:7000, title:'Performance Analytics', subtitle:'Discover Your Patterns',
      voice:'Analytics reveal the truth about your trading. Which sessions perform best? Which markets are most profitable?' },
    { id:'calendar',  dur:6000, title:'Visual Calendar',     subtitle:'Your Daily Performance',
      voice:'The visual calendar shows winning and losing days in clear color. Spot patterns and profitable streaks instantly.' },
    { id:'pricing',   dur:6000, title:'Pricing',             subtitle:'Start Free Today',
      voice:'Start with a free 24 hour trial. Or get lifetime access at an exceptional price. No hidden fees.' },
  ],
  fr: [
    { id:'intro',    dur:5500, title:'TradeJournal PRO',    subtitle:'Journal de Trading Professionnel',
      voice:'Bienvenue sur TradeJournal PRO. La plateforme professionnelle qui transforme votre façon de suivre vos trades.' },
    { id:'dashboard', dur:7000, title:'Tableau de Bord',    subtitle:'Vue complète — en un instant',
      voice:'Le tableau de bord vous donne une vue complète de vos performances en quelques secondes. P et L total, taux de réussite.' },
    { id:'addtrade',  dur:6500, title:'Enregistrer un Trade', subtitle:'Rapide et Précis',
      voice:'Enregistrez chaque trade en quelques secondes. Choisissez le marché, la direction, entrez les prix et obtenez un aperçu instantané.' },
    { id:'analytics', dur:7000, title:'Analyses de Performance', subtitle:'Découvrez vos Tendances',
      voice:'Les analyses révèlent la vérité sur votre trading. Quelles sessions performent le mieux? Quels marchés sont les plus rentables?' },
    { id:'calendar',  dur:6000, title:'Calendrier Visuel',  subtitle:'Votre Performance Quotidienne',
      voice:'Le calendrier visuel affiche les jours gagnants et perdants en couleur claire. Repérez instantanément vos tendances.' },
    { id:'pricing',   dur:6000, title:'Tarifs',             subtitle:'Commencez Gratuitement',
      voice:'Commencez avec un essai gratuit de 24 heures. Ou obtenez un accès à vie à un prix exceptionnel.' },
  ],
};

/* ── Sub-components for each scene ────────────────────────────── */
function SceneIntro({ lang, pct }) {
  const isAr = lang === 'ar';
  const words = isAr
    ? ['سجّل', 'حلّل', 'تداول بذكاء']
    : lang === 'fr'
    ? ['Enregistrez', 'Analysez', 'Tradez mieux']
    : ['Track', 'Analyze', 'Trade Smarter'];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:32, direction: isAr?'rtl':'ltr' }}>
      {/* Logo */}
      <div style={{ opacity: pct > 0.05 ? 1 : 0, transform: pct > 0.05 ? 'scale(1)' : 'scale(0.7)', transition:'all 0.6s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ width:80, height:80, background:'var(--green)', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#080c10', fontFamily:'var(--font-mono)', boxShadow:'0 0 60px rgba(0,230,118,0.4)' }}>TJ</div>
      </div>
      {/* Words appearing */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
        {words.map((w, i) => (
          <div key={w} style={{
            fontSize: i === 2 ? 'clamp(32px,5vw,56px)' : 'clamp(20px,3vw,32px)',
            fontWeight: i === 2 ? 900 : 700,
            color: i === 2 ? 'var(--green)' : 'var(--text)',
            opacity: pct > 0.15 + i * 0.18 ? 1 : 0,
            transform: pct > 0.15 + i * 0.18 ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s ease',
            letterSpacing: i === 2 ? '-1px' : 0,
            fontFamily: i === 2 ? 'var(--font-mono)' : 'var(--font-main)',
          }}>{w}</div>
        ))}
      </div>
      {/* Tagline */}
      <div style={{ opacity: pct > 0.65 ? 1 : 0, transition:'opacity 0.8s ease', fontSize:14, color:'var(--muted)', textAlign:'center', maxWidth:400, lineHeight:1.7 }}>
        {isAr ? 'المنصة الاحترافية للمتداولين الجادين' : lang === 'fr' ? 'La plateforme professionnelle pour traders sérieux' : 'The professional platform for serious traders'}
      </div>
      {/* Glow ring */}
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', border:'1px solid rgba(0,230,118,0.1)', opacity: pct > 0.3 ? 1 : 0, animation:'ringPulse 3s ease-in-out infinite', transition:'opacity 1s ease', pointerEvents:'none' }}/>
    </div>
  );
}

function SceneDashboard({ lang, pct }) {
  const isAr = lang === 'ar';
  const cards = isAr
    ? [['إجمالي P&L','+$4,820','var(--green)'],['نسبة الفوز','68.4%','var(--green)'],['الصفقات','127','var(--blue)'],['رأس المال','$24,820','var(--text)']]
    : lang === 'fr'
    ? [['P&L Total','+$4,820','var(--green)'],['Taux Réussite','68.4%','var(--green)'],['Trades','127','var(--blue)'],['Capital','$24,820','var(--text)']]
    : [['Total P&L','+$4,820','var(--green)'],['Win Rate','68.4%','var(--green)'],['Trades','127','var(--blue)'],['Capital','$24,820','var(--text)']];
  const recentLabel = isAr ? 'آخر الصفقات' : lang === 'fr' ? 'Trades récents' : 'Recent Trades';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%', direction:'ltr' }}>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {cards.map(([lbl,val,col],i) => (
          <div key={lbl} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 12px',
            opacity: pct > 0.1 + i*0.1 ? 1 : 0, transform: pct > 0.1 + i*0.1 ? 'translateY(0)' : 'translateY(16px)', transition:'all 0.5s ease' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:6 }}>{lbl}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:20, color:col }}>{val}</div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:14, flex:1,
        opacity: pct > 0.5 ? 1 : 0, transform: pct > 0.5 ? 'translateY(0)' : 'translateY(12px)', transition:'all 0.6s ease' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
          {isAr ? 'P&L التراكمي — 2025' : lang === 'fr' ? 'P&L Cumulatif — 2025' : 'Cumulative P&L — 2025'}
        </div>
        <svg width="100%" height={70} viewBox="0 0 600 70" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
            </linearGradient>
            <clipPath id="progress-clip">
              <rect x="0" y="0" width={`${Math.min(100, pct * 200)}%`} height="100%"/>
            </clipPath>
          </defs>
          <path d="M0 65 L50 58 L100 50 L150 54 L200 42 L250 33 L300 38 L350 25 L400 18 L450 21 L500 10 L550 6 L600 3 L600 70 L0 70Z"
            fill="url(#cg)" clipPath="url(#progress-clip)"/>
          <path d="M0 65 L50 58 L100 50 L150 54 L200 42 L250 33 L300 38 L350 25 L400 18 L450 21 L500 10 L550 6 L600 3"
            fill="none" stroke="#00e676" strokeWidth="2.5" clipPath="url(#progress-clip)"/>
        </svg>
      </div>
      {/* Recent trades */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:12,
        opacity: pct > 0.7 ? 1 : 0, transition:'opacity 0.5s ease' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>{recentLabel}</div>
        {[['NAS100','BUY',true,'+$320'],['XAUUSD','SELL',true,'+$185'],['US30','BUY',false,'-$95']].map(([m,t,w,a],i)=>(
          <div key={m} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom: i<2 ? '1px solid var(--border)' : 'none', fontSize:11,
            opacity: pct > 0.75 + i*0.05 ? 1 : 0, transition:'opacity 0.4s ease' }}>
            <span style={{ fontWeight:800, width:56 }}>{m}</span>
            <span style={{ color: t==='BUY'?'var(--green)':'var(--red)', fontWeight:700, width:30 }}>{t}</span>
            <span style={{ padding:'1px 6px', borderRadius:3, fontSize:9, fontWeight:800, background: w?'rgba(0,230,118,0.12)':'rgba(255,71,87,0.12)', color: w?'var(--green)':'var(--red)' }}>{w?'WIN':'LOSE'}</span>
            <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontWeight:800, color: w?'var(--green)':'var(--red)' }}>{a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneAddTrade({ lang, pct }) {
  const isAr = lang === 'ar';
  const L = isAr
    ? { market:'السوق', direction:'الاتجاه', buy:'شراء ▲', sell:'بيع ▼', entry:'سعر الدخول', close:'سعر الإغلاق', amount:'المبلغ ($)', session:'الجلسة', preview:'معاينة', save:'💾 حفظ الصفقة' }
    : lang === 'fr'
    ? { market:'Marché', direction:'Direction', buy:'Achat ▲', sell:'Vente ▼', entry:'Prix d\'entrée', close:'Prix de clôture', amount:'Montant ($)', session:'Session', preview:'aperçu', save:'💾 Sauvegarder' }
    : { market:'Market', direction:'Direction', buy:'Buy ▲', sell:'Sell ▼', entry:'Entry Price', close:'Close Price', amount:'Amount ($)', session:'Session', preview:'pts preview', save:'💾 Save Trade' };
  const typing = (full, pStart, pEnd) => {
    const progress = Math.max(0, Math.min(1, (pct - pStart)/(pEnd - pStart)));
    return full.slice(0, Math.floor(full.length * progress));
  };
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, height:'100%', alignItems:'start', direction:'ltr' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:10, opacity: pct > 0.05 ? 1 : 0, transition:'opacity 0.5s' }}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:12 }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:8 }}>{L.market}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['NAS100','XAUUSD','US30','EURUSD','BTC'].map((m,i)=>(
              <span key={m} style={{ padding:'5px 10px', borderRadius:5, fontSize:11, fontWeight:800,
                background: m==='NAS100' ? 'var(--green)' : 'var(--bg4)',
                color: m==='NAS100' ? '#080c10' : 'var(--muted)',
                opacity: pct > 0.1 + i*0.06 ? 1 : 0, transform: pct > 0.1+i*0.06?'scale(1)':'scale(0.8)', transition:'all 0.4s ease' }}>{m}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, opacity: pct > 0.35 ? 1 : 0, transition:'opacity 0.5s' }}>
          <div style={{ flex:1, padding:10, borderRadius:8, textAlign:'center', fontWeight:900, fontSize:13, background:'rgba(0,230,118,0.18)', color:'var(--green)', border:'1px solid rgba(0,230,118,0.3)' }}>{L.buy}</div>
          <div style={{ flex:1, padding:10, borderRadius:8, textAlign:'center', fontWeight:700, fontSize:13, background:'var(--bg3)', color:'var(--muted)', border:'1px solid var(--border)' }}>{L.sell}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, opacity: pct > 0.45 ? 1 : 0, transition:'opacity 0.5s' }}>
          {[[L.entry,'17,842.50',true,0.45,0.65],[L.close,'18,012.00',false,0.52,0.72],[L.amount,'320.00',false,0],[L.session,'LON',false,0]].map(([lbl,val,focus,ps,pe])=>(
            <div key={lbl}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:4 }}>{lbl}</div>
              <div style={{ background:'var(--bg3)', border:`1px solid ${focus?'var(--blue)':'var(--border)'}`, borderRadius:6, padding:'7px 10px', fontFamily:'var(--font-mono)', fontSize:12 }}>
                {ps ? typing(val,ps,pe) : val}{ps && pct > ps && pct < pe ? <span style={{ animation:'blink 1s infinite', borderRight:'2px solid var(--blue)', marginLeft:1 }}>&nbsp;</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:10, padding:14,
          opacity: pct > 0.75 ? 1 : 0, transform: pct > 0.75 ? 'scale(1)' : 'scale(0.95)', transition:'all 0.5s cubic-bezier(.34,1.56,.64,1)' }}>
          <div style={{ fontSize:10, color:'var(--muted)', marginBottom:4 }}>{L.preview}</div>
          <div style={{ fontFamily:'var(--font-mono)', fontWeight:900, fontSize:24, color:'var(--green)' }}>+169.50 pts</div>
          <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:16, color:'var(--green)', marginTop:2 }}>+$320.00</div>
        </div>
        <div style={{ background:'var(--green)', color:'#080c10', borderRadius:8, padding:12, textAlign:'center', fontWeight:900, fontSize:14, cursor:'pointer',
          opacity: pct > 0.85 ? 1 : 0, transform: pct > 0.85 ? 'translateY(0)' : 'translateY(8px)', transition:'all 0.5s ease' }}>{L.save}</div>
        {/* Screenshot upload area */}
        <div style={{ background:'var(--bg3)', border:'2px dashed var(--border)', borderRadius:8, padding:14, textAlign:'center', color:'var(--muted)', fontSize:12,
          opacity: pct > 0.55 ? 1 : 0, transition:'opacity 0.5s' }}>
          📸 {isAr ? 'أضف لقطة الشاشة' : lang === 'fr' ? 'Ajouter une capture' : 'Add Screenshot'}
        </div>
      </div>
    </div>
  );
}

function SceneAnalytics({ lang, pct }) {
  const isAr = lang === 'ar';
  const L = { totalPnl: isAr?'إجمالي P&L':lang==='fr'?'P&L Total':'Total P&L', winRate: isAr?'نسبة الفوز':lang==='fr'?'Taux réussite':'Win Rate', bestDay:isAr?'أفضل يوم':lang==='fr'?'Meilleur jour':'Best Day', worstDay:isAr?'أسوأ يوم':lang==='fr'?'Pire jour':'Worst Day', sessions:isAr?'الجلسات':lang==='fr'?'Sessions':'Sessions' };
  const sessions = isAr?[['لندن',75,'var(--green)','$2,840'],['نيويورك',45,'var(--blue)','$1,520'],['آسيا',20,'var(--orange)','$460']]
    :lang==='fr'?[['Londres',75,'var(--green)','$2,840'],['New York',45,'var(--blue)','$1,520'],['Asie',20,'var(--orange)','$460']]
    :[['London',75,'var(--green)','$2,840'],['New York',45,'var(--blue)','$1,520'],['Asia',20,'var(--orange)','$460']];
  const bars = [[10,28,46,'g'],[70,8,66,'g'],[130,48,26,'r'],[190,18,56,'g'],[250,34,40,'g'],[310,54,20,'r'],[370,6,68,'g'],[430,14,60,'g']];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, height:'100%', direction:'ltr' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
        {[[L.totalPnl,'+$4,820','var(--green)'],[L.winRate,'68.4%','var(--green)'],[L.bestDay,'+$920','var(--blue)'],[L.worstDay,'-$310','var(--red)']].map(([lbl,val,col],i)=>(
          <div key={lbl} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12,
            opacity: pct > 0.08+i*0.08 ? 1 : 0, transform: pct > 0.08+i*0.08 ? 'translateY(0)':'translateY(12px)', transition:'all 0.5s ease' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:5 }}>{lbl}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:18, color:col }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, flex:1 }}>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:14,
          opacity: pct > 0.4 ? 1 : 0, transition:'opacity 0.6s' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.5 }}>
            {isAr?'الأداء الشهري':lang==='fr'?'Performance mensuelle':'Monthly Performance'}</div>
          <svg width="100%" height={100} viewBox="0 0 500 100">
            <defs><linearGradient id="bg1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#00e676" stopOpacity="0.85"/><stop offset="100%" stopColor="#00e676" stopOpacity="0.45"/></linearGradient><linearGradient id="br1" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ff4757" stopOpacity="0.85"/><stop offset="100%" stopColor="#ff4757" stopOpacity="0.45"/></linearGradient></defs>
            {bars.map(([x,y,h,c],i)=>{
              const animated_h = pct > 0.45 ? h : 0;
              const animated_y = y + (h - animated_h);
              return <rect key={i} x={x} y={animated_y} width={38} height={animated_h} rx={4} fill={c==='r'?'url(#br1)':'url(#bg1)'} style={{ transition:`height 0.8s ${i*0.08}s ease, y 0.8s ${i*0.08}s ease` }}/>;
            })}
          </svg>
        </div>
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:14, display:'flex', flexDirection:'column', gap:10,
          opacity: pct > 0.55 ? 1 : 0, transition:'opacity 0.6s' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:0.5 }}>{L.sessions}</div>
          {sessions.map(([s,w,c,v],i)=>(
            <div key={s} style={{ opacity: pct > 0.6+i*0.1 ? 1:0, transition:'opacity 0.5s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                <span style={{ color:'var(--muted)' }}>{s}</span>
                <span style={{ fontFamily:'var(--font-mono)', color:c, fontWeight:800, fontSize:11 }}>{v}</span>
              </div>
              <div style={{ height:4, background:'var(--bg4)', borderRadius:99 }}>
                <div style={{ height:'100%', borderRadius:99, background:c, transition:'width 1s ease', width: pct > 0.65 ? `${w}%` : '0%' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneCalendar({ lang, pct }) {
  const isAr = lang === 'ar';
  const calData = [null,null,null,null,null,null,null,'w','w','l','w','w',null,null,'w','l','w','w','w',null,null,'l','w','w','l','w',null,null,'w','w','l','w','w',null,null,'w'];
  const stats = isAr
    ? [['أفضل يوم','+$920','var(--green)'],['الاتساق','70.8%','var(--blue)'],['السلسلة','4 🔥','var(--orange)']]
    : lang === 'fr'
    ? [['Meilleur jour','+$920','var(--green)'],['Consistance','70.8%','var(--blue)'],['Série','4 🔥','var(--orange)']]
    : [['Best Day','+$920','var(--green)'],['Consistency','70.8%','var(--blue)'],['Streak','4 🔥','var(--orange)']];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, height:'100%', direction:'ltr' }}>
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:14,
        opacity: pct > 0.1 ? 1:0, transform: pct>0.1?'translateY(0)':'translateY(12px)', transition:'all 0.5s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <span style={{ fontWeight:800, fontSize:14 }}>{isAr?'يونيو 2025':lang==='fr'?'Juin 2025':'June 2025'}</span>
          <div style={{ display:'flex', gap:6 }}>
            <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(0,230,118,0.1)', borderRadius:4, color:'var(--green)', fontWeight:800 }}>17 {isAr?'فوز':lang==='fr'?'GAIN':'WIN'}</span>
            <span style={{ fontSize:10, padding:'2px 8px', background:'rgba(255,71,87,0.1)', borderRadius:4, color:'var(--red)', fontWeight:800 }}>7 {isAr?'خسارة':lang==='fr'?'PERTE':'LOSE'}</span>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
          {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} style={{ fontSize:9, textAlign:'center', color:'var(--muted)', fontWeight:700, paddingBottom:3 }}>{d}</div>)}
          {calData.map((v,i) => {
            const day = i - 6;
            const visible = pct > 0.2 + (i/calData.length)*0.5;
            return <div key={i} style={{ aspectRatio:1, borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:600,
              background: v==='w'?'rgba(0,230,118,0.18)':v==='l'?'rgba(255,71,87,0.14)':'var(--bg4)',
              color: v==='w'?'var(--green)':v==='l'?'var(--red)':'var(--dim)',
              opacity: visible ? 1 : 0, transform: visible ? 'scale(1)':'scale(0.5)', transition:`all 0.3s ${i*0.01}s ease` }}>{day>0&&day<=30?day:''}</div>;
          })}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {stats.map(([lbl,val,col],i)=>(
          <div key={lbl} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, padding:12,
            opacity: pct > 0.7+i*0.08?1:0, transform: pct>0.7+i*0.08?'translateY(0)':'translateY(10px)', transition:'all 0.5s ease' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:5 }}>{lbl}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:18, color:col }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenePricing({ lang, pct }) {
  const isAr = lang === 'ar';
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, height:'100%', alignItems:'start', direction:'ltr' }}>
      {/* Trial */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:12, padding:20,
        opacity: pct > 0.1 ? 1:0, transform: pct>0.1?'translateY(0)':'translateY(20px)', transition:'all 0.6s ease' }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:10 }}>
          {isAr?'تجربة مجانية':lang==='fr'?'Essai gratuit':'Free Trial'}
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontWeight:900, fontSize:36, color:'var(--green)', marginBottom:8 }}>
          {isAr?'مجاناً':lang==='fr'?'GRATUIT':'FREE'}
        </div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:16, lineHeight:1.6 }}>
          {isAr?'24 ساعة كاملة — لا بطاقة':lang==='fr'?'24h complètes — sans carte':'24 hours full access — no card'}
        </div>
        {(isAr?['وصول كامل','يوميات الصفقات','تحليلات P&L','مقيّد بـ 24 ساعة']:lang==='fr'?['Accès complet','Journal trades','Analyses P&L','Limité à 24h']:['Full access','Trade journal','P&L analytics','Limited to 24h']).map((f,i)=>(
          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--muted)', marginBottom:6,
            opacity: pct > 0.2+i*0.08?1:0, transition:'opacity 0.4s ease' }}>
            <span style={{ color:'var(--green)', fontWeight:900, fontSize:11 }}>✓</span>{f}
          </div>
        ))}
      </div>
      {/* Lifetime */}
      <div style={{ background:'linear-gradient(160deg,rgba(246,216,96,0.07) 0%,var(--bg3) 60%)', border:'2px solid var(--gold)', borderRadius:12, padding:20, position:'relative',
        opacity: pct > 0.3 ? 1:0, transform: pct>0.3?'translateY(0)':'translateY(20px)', transition:'all 0.6s 0.1s ease',
        boxShadow: pct > 0.5 ? '0 0 40px rgba(246,216,96,0.12)':'none' }}>
        <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'var(--gold)', color:'#080c10', fontSize:9, fontWeight:900, padding:'3px 14px', borderRadius:99, letterSpacing:1, textTransform:'uppercase' }}>
          {isAr?'الأفضل قيمة':lang==='fr'?'Meilleure valeur':'Best Value'}
        </div>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'var(--muted)', marginBottom:8, marginTop:8 }}>
          {isAr?'مدى الحياة':lang==='fr'?'À vie':'Lifetime'}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ background:'var(--red)', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99 }}>🔥 -30%</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--dim)', textDecoration:'line-through' }}>1000 DH</span>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontWeight:900, fontSize:36, color:'var(--gold)', marginBottom:8 }}>700 DH</div>
        {(isAr?['كل شيء مشمول','وصول مدى الحياة','الميزات المستقبلية','دعم VIP']:lang==='fr'?['Tout inclus','Accès à vie','Futures fonctionnalités','Support VIP']:['Everything included','Lifetime access','All future features','VIP Support']).map((f,i)=>(
          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--muted)', marginBottom:6,
            opacity: pct > 0.4+i*0.08?1:0, transition:'opacity 0.4s ease' }}>
            <span style={{ color:'var(--gold)', fontWeight:900, fontSize:11 }}>✓</span>{f}
          </div>
        ))}
        <div style={{ marginTop:12, background:'var(--gold)', color:'#080c10', borderRadius:8, padding:10, textAlign:'center', fontWeight:900, fontSize:13, cursor:'pointer',
          opacity: pct > 0.8?1:0, transition:'opacity 0.5s' }}>
          💬 {isAr?'احصل على العرض':lang==='fr'?'Profiter de la promo':'Get the deal'}
        </div>
      </div>
    </div>
  );
}

const SCENE_VIEWS = { intro: SceneIntro, dashboard: SceneDashboard, addtrade: SceneAddTrade, analytics: SceneAnalytics, calendar: SceneCalendar, pricing: ScenePricing };

/* ── Main Player ────────────────────────────────────────────── */
export default function CinematicDemoPlayer({ lang = 'en' }) {
  const scenes = SCENES[lang] || SCENES.en;
  const [sceneIdx, setSceneIdx]   = useState(0);
  const [playing,  setPlaying]    = useState(false);
  const [pct,      setPct]        = useState(0);
  const [voiceOn,  setVoiceOn]    = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const timerRef  = useRef(null);
  const pctRef    = useRef(0);
  const sceneRef  = useRef(0);
  const playRef   = useRef(false);
  const voiceRef  = useRef(false);

  const TICK = 40;

  const stopTimer = useCallback(() => clearInterval(timerRef.current), []);

  const goScene = useCallback((idx, autoPlay) => {
    window.speechSynthesis?.cancel();
    stopTimer();
    setTransitioning(true);
    setTimeout(() => {
      sceneRef.current = idx;
      pctRef.current   = 0;
      setSceneIdx(idx);
      setPct(0);
      setTransitioning(false);
      if (autoPlay || playRef.current) {
        startScene(idx);
        if (voiceRef.current) {
          speak(scenes[idx].voice, lang);
        }
      }
    }, 350);
  }, [scenes, lang, stopTimer]);

  const startScene = useCallback((idx) => {
    clearInterval(timerRef.current);
    const dur = scenes[idx]?.dur || 7000;
    timerRef.current = setInterval(() => {
      pctRef.current += TICK / dur;
      const p = Math.min(1, pctRef.current);
      setPct(p);
      if (p >= 1) {
        clearInterval(timerRef.current);
        const next = (sceneRef.current + 1) % scenes.length;
        goScene(next, true);
      }
    }, TICK);
  }, [scenes, goScene]);

  const togglePlay = () => {
    const next = !playRef.current;
    playRef.current = next;
    setPlaying(next);
    if (next) {
      startScene(sceneRef.current);
      if (voiceRef.current) speak(scenes[sceneRef.current].voice, lang);
    } else {
      stopTimer();
      window.speechSynthesis?.cancel();
    }
  };

  const toggleVoice = () => {
    const next = !voiceRef.current;
    voiceRef.current = next;
    setVoiceOn(next);
    if (next) {
      // Speak current scene if playback is running
      if (playRef.current) speak(scenes[sceneRef.current].voice, lang);
    } else {
      window.speechSynthesis?.cancel();
    }
  };

  useEffect(() => {
    // Pre-load voices so the first speak() call is instant
    if (window.speechSynthesis) {
      const preload = () => window.speechSynthesis.getVoices();
      preload();
      if ('onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.addEventListener('voiceschanged', preload);
      }
    }
    // Auto-start after 1.5s
    const t = setTimeout(() => {
      playRef.current = true;
      setPlaying(true);
      startScene(0);
      // If user already enabled voice before the timer fired, start speaking now
      if (voiceRef.current) speak(scenes[0].voice, lang);
    }, 1500);
    return () => {
      clearTimeout(t);
      stopTimer();
      window.speechSynthesis?.cancel();
      if (window.speechSynthesis && 'onvoiceschanged' in window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', () => {});
      }
    };
  }, []);

  // Reset on lang change
  useEffect(() => {
    stopTimer(); window.speechSynthesis?.cancel();
    sceneRef.current = 0; pctRef.current = 0;
    setSceneIdx(0); setPct(0); setTransitioning(false);
    if (playRef.current) {
      setTimeout(() => {
        startScene(0);
        if (voiceRef.current) speak(SCENES[lang][0].voice, lang);
      }, 400);
    }
  }, [lang]);

  const currentScene = scenes[sceneIdx];
  const SceneView = SCENE_VIEWS[currentScene?.id] || SceneDashboard;
  const isAr = lang === 'ar';

  return (
    <div style={{ width:'100%', fontFamily:'var(--font-main)' }}>
      <style>{`
        @keyframes ringPulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.15);opacity:0.6} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes sceneIn { from{opacity:0;transform:scale(0.98)} to{opacity:1;transform:scale(1)} }
        @keyframes sceneOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.02)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* ─── PLAYER WRAPPER ─── */}
      <div style={{ background:'#050810', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden',
        boxShadow:'0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,230,118,0.06)', position:'relative' }}>

        {/* Scanline effect */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(transparent,rgba(0,230,118,0.06),transparent)', animation:'scanline 4s linear infinite', pointerEvents:'none', zIndex:20 }}/>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px',
          background:'rgba(5,8,16,0.95)', borderBottom:'1px solid rgba(255,255,255,0.06)', direction:'ltr' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', gap:5 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c=><div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }}/>)}
            </div>
            <div style={{ width:1, height:16, background:'rgba(255,255,255,0.1)', margin:'0 4px' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:20, height:20, background:'var(--green)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:9, color:'#080c10', fontFamily:'var(--font-mono)' }}>TJ</div>
              <span style={{ fontSize:12, fontWeight:700 }}>Trade<span style={{ color:'var(--green)' }}>Journal</span> PRO</span>
            </div>
          </div>
          {/* Scene pills */}
          <div style={{ display:'flex', gap:4 }}>
            {scenes.map((sc,i)=>(
              <div key={i} onClick={()=>{ sceneRef.current=i; goScene(i,playRef.current); }} style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, cursor:'pointer',
                background: i===sceneIdx ? 'rgba(0,230,118,0.15)':'transparent',
                border: `1px solid ${i===sceneIdx?'rgba(0,230,118,0.4)':'rgba(255,255,255,0.06)'}`,
                color: i===sceneIdx ? 'var(--green)':'var(--muted)', transition:'all 0.2s' }}>
                {sc.title.length > 8 ? sc.title.slice(0,8)+'…' : sc.title}
              </div>
            ))}
          </div>
        </div>

        {/* ─── APP SHELL ─── */}
        <div style={{ display:'flex', height:480, background:'var(--bg)' }}>

          {/* Sidebar */}
          <div style={{ width:160, flexShrink:0, background:'var(--bg2)', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', padding:'16px 0' }}>
            <div style={{ padding:'0 14px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:8 }}>
              <div style={{ fontWeight:800, fontSize:13 }}>Trade<span style={{ color:'var(--green)' }}>Journal</span></div>
              <div style={{ fontSize:10, color:'var(--muted)' }}>PRO</div>
            </div>
            {scenes.map((sc,i)=>(
              <div key={i} onClick={()=>{ sceneRef.current=i; goScene(i,playRef.current); }} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', fontSize:11, cursor:'pointer',
                color: i===sceneIdx ? 'var(--green)':'var(--muted)',
                background: i===sceneIdx ? 'rgba(0,230,118,0.07)':'transparent',
                borderLeft: `2px solid ${i===sceneIdx?'var(--green)':'transparent'}`,
                transition:'all 0.15s' }}>
                <span style={{ fontSize:14 }}>{['📊','📈','📝','🔍','📅','💰'][i]}</span>
                <span style={{ lineHeight:1.3 }}>{sc.title}</span>
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, padding:20, overflowY:'auto', overflowX:'hidden', minWidth:0, position:'relative' }}>
            {/* Scene title */}
            <div style={{ marginBottom:14, direction: isAr?'rtl':'ltr' }}>
              <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--green)', marginBottom:4, opacity:0.7 }}>{currentScene?.subtitle}</div>
              <div style={{ fontSize:20, fontWeight:800 }}>{currentScene?.title}</div>
            </div>

            {/* Scene content */}
            <div style={{ animation: transitioning ? 'sceneOut 0.35s ease both' : 'sceneIn 0.4s ease both' }}>
              <SceneView lang={lang} pct={pct} />
            </div>

            {/* Progress overlay at bottom */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'rgba(255,255,255,0.04)' }}>
              <div style={{ height:'100%', background:'var(--green)', transition:'width 0.04s linear', width:`${pct*100}%`,
                boxShadow:'0 0 8px rgba(0,230,118,0.6)' }}/>
            </div>
          </div>
        </div>

        {/* ─── CAPTION BAR ─── */}
        <div style={{ padding:'14px 20px', background:'rgba(5,8,16,0.97)', borderTop:'1px solid rgba(255,255,255,0.06)', direction: isAr?'rtl':'ltr' }}>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1.5px', color:'var(--green)', textTransform:'uppercase', marginBottom:4, opacity:0.6 }}>
            {isAr?'التعليق':lang==='fr'?'Commentaire':'Caption'}
          </div>
          <div key={`${sceneIdx}-${lang}`} style={{ fontSize:14, color:'var(--text)', lineHeight:1.7, animation:'sceneIn 0.4s ease both' }}>
            {currentScene?.voice?.slice(0, Math.floor((currentScene.voice.length) * Math.min(1, pct * 2.5)))}
            {pct < 0.4 && <span style={{ animation:'blink 1s infinite', borderRight:'2px solid var(--green)', marginLeft:2 }}>&nbsp;</span>}
          </div>
        </div>

        {/* ─── CONTROLS ─── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', background:'rgba(5,8,16,0.99)', borderTop:'1px solid rgba(255,255,255,0.05)', direction:'ltr' }}>
          <button onClick={()=>{ const p=(sceneIdx-1+scenes.length)%scenes.length; sceneRef.current=p; goScene(p,playRef.current); }}
            style={{ width:30, height:30, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', cursor:'pointer', color:'var(--text)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>

          <button onClick={togglePlay}
            style={{ width:36, height:36, borderRadius:'50%', background: playing ? 'var(--green)':'rgba(0,230,118,0.15)', border:`1px solid ${playing?'var(--green)':'rgba(0,230,118,0.3)'}`, cursor:'pointer', color: playing?'#080c10':'var(--green)', fontSize:12, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
            {playing ? '⏸' : '▶'}
          </button>

          <button onClick={()=>{ const n=(sceneIdx+1)%scenes.length; sceneRef.current=n; goScene(n,playRef.current); }}
            style={{ width:30, height:30, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', cursor:'pointer', color:'var(--text)', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>

          {/* Seek bar */}
          <div onClick={e=>{ const r=e.currentTarget.getBoundingClientRect(); pctRef.current=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)); setPct(pctRef.current); }}
            style={{ flex:1, height:4, background:'rgba(255,255,255,0.08)', borderRadius:99, cursor:'pointer', position:'relative' }}>
            <div style={{ height:'100%', background:'var(--green)', borderRadius:99, width:`${pct*100}%`, transition:'width 0.04s linear', pointerEvents:'none',
              boxShadow:'0 0 6px rgba(0,230,118,0.5)' }}/>
          </div>

          <span style={{ fontSize:11, color:'var(--muted)', minWidth:40, textAlign:'center', fontFamily:'var(--font-mono)' }}>{sceneIdx+1}/{scenes.length}</span>

          {/* Voice button */}
          <button onClick={toggleVoice}
            style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${voiceOn?'rgba(0,230,118,0.4)':'rgba(255,255,255,0.1)'}`,
              background: voiceOn?'rgba(0,230,118,0.1)':'rgba(255,255,255,0.04)',
              color: voiceOn?'var(--green)':'var(--muted)', fontSize:11, cursor:'pointer', fontWeight:700, transition:'all 0.2s' }}>
            {voiceOn ? '🔊' : '🔇'} {isAr?(voiceOn?'صوت مفعّل':'تفعيل الصوت'):lang==='fr'?(voiceOn?'Son activé':'Activer son'):(voiceOn?'Voice ON':'Voice')}
          </button>

          {/* Script */}
          <button onClick={()=>setShowScript(s=>!s)}
            style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${showScript?'rgba(0,230,118,0.4)':'rgba(255,255,255,0.1)'}`,
              background: showScript?'rgba(0,230,118,0.1)':'rgba(255,255,255,0.04)',
              color: showScript?'var(--green)':'var(--muted)', fontSize:11, cursor:'pointer', fontWeight:700, transition:'all 0.2s' }}>
            📄 {isAr?'النص':lang==='fr'?'Script':'Script'}
          </button>
        </div>

        {/* Script panel */}
        {showScript && (
          <div style={{ background:'rgba(5,8,16,0.99)', borderTop:'1px solid rgba(255,255,255,0.05)', padding:20, maxHeight:280, overflowY:'auto', direction: isAr?'rtl':'ltr' }}>
            <div style={{ fontSize:13, fontWeight:800, color:'var(--green)', marginBottom:16 }}>
              {isAr?'نص التعليق الصوتي الكامل':lang==='fr'?'Script de narration complet':'Full Voiceover Script'}
            </div>
            {scenes.map((sc,i)=>(
              <div key={i} style={{ marginBottom:14, paddingBottom:14, borderBottom: i<scenes.length-1?'1px solid rgba(255,255,255,0.05)':'none' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'var(--green)', marginBottom:4, letterSpacing:1 }}>
                  {isAr?`${i+1}. ${sc.title}`:lang==='fr'?`${i+1}. ${sc.title}`:`${i+1}. ${sc.title}`}
                </div>
                <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.8 }}>{sc.voice}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
