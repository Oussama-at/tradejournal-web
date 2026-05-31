import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Voice helpers ────────────────────────────────────────────────────────────
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

// ─── Demo Scenes (Arabic only, voice-only — no script) ────────────────────────
const SCENES = [
  {
    id: 'intro',
    dur: 5500,
    title: 'TradeJournal PRO',
    subtitle: 'يوميات التداول الاحترافية',
    voice: 'مرحباً بكم في TradeJournal PRO. المنصة الاحترافية التي تحوّل طريقة تتبع صفقاتك وتحليل أدائك.',
    visual: 'intro',
  },
  {
    id: 'dashboard',
    dur: 7000,
    title: 'لوحة التحكم',
    subtitle: 'نظرة شاملة — دفعة واحدة',
    voice: 'لوحة التحكم تعطيك نظرة كاملة على أدائك في ثوانٍ. إجمالي الأرباح ونسبة الفوز وتطور رأس المال.',
    visual: 'dashboard',
  },
  {
    id: 'addtrade',
    dur: 6500,
    title: 'تسجيل الصفقات',
    subtitle: 'سريع ودقيق',
    voice: 'سجّل كل صفقة في ثوانٍ. اختر السوق والاتجاه وأدخل الأسعار لترى معاينة فورية للربح أو الخسارة.',
    visual: 'addtrade',
  },
  {
    id: 'analytics',
    dur: 7000,
    title: 'تحليل الأداء',
    subtitle: 'اكتشف أنماطك',
    voice: 'التحليلات تكشف لك الحقيقة. أي الجلسات أفضل؟ أي الأسواق أكثر ربحاً؟ كل التفاصيل أمامك.',
    visual: 'analytics',
  },
  {
    id: 'calendar',
    dur: 6000,
    title: 'التقويم البصري',
    subtitle: 'أداؤك يومياً',
    voice: 'التقويم البصري يُظهر أيام الفوز والخسارة بلون واضح. اكتشف الأنماط والسلاسل الربحية بسرعة.',
    visual: 'calendar',
  },
  {
    id: 'pricing',
    dur: 6000,
    title: 'الأسعار',
    subtitle: 'ابدأ مجاناً اليوم',
    voice: 'ابدأ بتجربة مجانية 24 ساعة. أو احصل على الوصول مدى الحياة بسعر استثنائي. لا رسوم خفية.',
    visual: 'pricing',
  },
];

// ─── SVG Illustrations for each scene ─────────────────────────────────────────
function SceneVisual({ id }) {
  if (id === 'intro') return (
    <svg viewBox="0 0 560 300" style={{ width:'100%', height:'auto' }}>
      <defs>
        <linearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f6d860"/>
          <stop offset="100%" stopColor="#e6b800"/>
        </linearGradient>
        <linearGradient id="gGreen" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#00e67600"/>
          <stop offset="100%" stopColor="#00e676"/>
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[60,100,140,180,220,260].map(y => (
        <line key={y} x1="40" y1={y} x2="520" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {/* Candlesticks */}
      {[
        [80, 180, 220, 200, 160],
        [130, 160, 210, 170, 150],
        [180, 150, 200, 155, 140],
        [230, 155, 185, 160, 145],
        [280, 130, 175, 145, 120],
        [330, 120, 165, 135, 110],
        [380, 105, 150, 118, 100],
        [430, 95, 140, 108, 85],
        [480, 80, 130, 95, 72],
      ].map(([x, high, low, open, close], i) => {
        const isBull = close <= open;
        const color = isBull ? '#00e676' : '#ff4757';
        const bodyTop = Math.min(open, close);
        const bodyH = Math.abs(open - close) || 4;
        return (
          <g key={i}>
            <line x1={x} y1={high} x2={x} y2={low} stroke={color} strokeWidth="1.5" opacity="0.6"/>
            <rect x={x-6} y={bodyTop} width={12} height={bodyH} fill={color} rx="2" opacity="0.85"/>
          </g>
        );
      })}
      {/* Rising trend line */}
      <polyline points="80,200 130,175 180,155 230,155 280,140 330,130 380,115 430,103 480,90"
        fill="none" stroke="#00e676" strokeWidth="2" strokeDasharray="5,3" opacity="0.5"/>
      {/* Logo badge */}
      <rect x="200" y="100" width="160" height="70" rx="14" fill="#0d1117" stroke="rgba(246,216,96,0.4)" strokeWidth="1.5"/>
      <text x="280" y="130" textAnchor="middle" fill="#f6d860" fontSize="13" fontWeight="700" fontFamily="monospace">TradeJournal</text>
      <text x="280" y="152" textAnchor="middle" fill="#00e676" fontSize="18" fontWeight="900" fontFamily="monospace">PRO</text>
    </svg>
  );

  if (id === 'dashboard') return (
    <svg viewBox="0 0 560 300" style={{ width:'100%', height:'auto' }}>
      {/* Stat cards row */}
      {[
        { x:20, label:'إجمالي P&L', value:'+4,832 DH', color:'#00e676' },
        { x:160, label:'نسبة الفوز', value:'68%', color:'#5c9cf5' },
        { x:300, label:'رأس المال', value:'12,000 DH', color:'#f6d860' },
        { x:440, label:'عدد الصفقات', value:'47', color:'#ff9f43' },
      ].map(({ x, label, value, color }) => (
        <g key={x}>
          <rect x={x} y={20} width={120} height={64} rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          <text x={x+60} y={44} textAnchor="middle" fill="rgba(180,200,220,0.6)" fontSize="9" fontFamily="sans-serif">{label}</text>
          <text x={x+60} y={70} textAnchor="middle" fill={color} fontSize="15" fontWeight="800" fontFamily="monospace">{value}</text>
        </g>
      ))}
      {/* P&L line chart */}
      <rect x="20" y="104" width="330" height="170" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="35" y="125" fill="rgba(180,200,220,0.6)" fontSize="9" fontFamily="sans-serif">P&L التراكمي</text>
      {[130,155,180,205,230,255].map(y => (
        <line key={y} x1="35" y1={y} x2="340" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      <polyline points="40,240 80,225 120,215 160,200 200,185 240,165 280,140 320,120"
        fill="none" stroke="#00e676" strokeWidth="2"/>
      <polygon points="40,240 80,225 120,215 160,200 200,185 240,165 280,140 320,120 320,255 40,255"
        fill="url(#gGreen2)" opacity="0.15"/>
      <defs>
        <linearGradient id="gGreen2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00e676"/>
          <stop offset="100%" stopColor="#00e67600"/>
        </linearGradient>
      </defs>
      {/* Win rate donut */}
      <rect x="368" y="104" width="172" height="170" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="454" y="125" textAnchor="middle" fill="rgba(180,200,220,0.6)" fontSize="9" fontFamily="sans-serif">نسبة الفوز</text>
      <circle cx="454" cy="185" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
      <circle cx="454" cy="185" r="46" fill="none" stroke="#00e676" strokeWidth="12"
        strokeDasharray="196 288" strokeDashoffset="72" strokeLinecap="round"
        transform="rotate(-90 454 185)"/>
      <text x="454" y="180" textAnchor="middle" fill="#00e676" fontSize="18" fontWeight="800" fontFamily="monospace">68%</text>
      <text x="454" y="197" textAnchor="middle" fill="rgba(180,200,220,0.5)" fontSize="8" fontFamily="sans-serif">فوز</text>
    </svg>
  );

  if (id === 'addtrade') return (
    <svg viewBox="0 0 560 300" style={{ width:'100%', height:'auto' }}>
      <rect x="80" y="10" width="400" height="280" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="280" y="40" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">تسجيل صفقة جديدة</text>
      {/* Fields */}
      {[
        { y:60, label:'السوق', val:'EUR/USD' },
        { y:105, label:'الاتجاه', val:'شراء ↑', valColor:'#00e676' },
        { y:150, label:'سعر الدخول', val:'1.0842' },
        { y:195, label:'سعر الخروج', val:'1.0918' },
      ].map(({ y, label, val, valColor }) => (
        <g key={y}>
          <text x={470} y={y+14} textAnchor="end" fill="rgba(180,200,220,0.55)" fontSize="9" fontFamily="sans-serif">{label}</text>
          <rect x="100" y={y+22} width="360" height="30" rx="7" fill="#141b22" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
          <text x={450} y={y+43} textAnchor="end" fill={valColor || '#e8edf3'} fontSize="12" fontWeight="600" fontFamily="monospace">{val}</text>
        </g>
      ))}
      {/* P&L preview */}
      <rect x="100" y="244" width="360" height="32" rx="8" fill="rgba(0,230,118,0.1)" stroke="rgba(0,230,118,0.3)" strokeWidth="1"/>
      <text x="280" y="265" textAnchor="middle" fill="#00e676" fontSize="12" fontWeight="700" fontFamily="monospace">معاينة الربح: +760 DH ↑</text>
    </svg>
  );

  if (id === 'analytics') return (
    <svg viewBox="0 0 560 300" style={{ width:'100%', height:'auto' }}>
      {/* Bar chart — sessions */}
      <rect x="20" y="10" width="255" height="280" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="147" y="34" textAnchor="middle" fill="rgba(180,200,220,0.6)" fontSize="9" fontFamily="sans-serif">الأداء حسب الجلسة</text>
      {[
        { label:'لندن', v:82, color:'#5c9cf5' },
        { label:'نيويورك', v:65, color:'#ff9f43' },
        { label:'طوكيو', v:40, color:'#a29bfe' },
        { label:'بريطانيا', v:58, color:'#00e676' },
      ].map(({ label, v, color }, i) => {
        const bw = 44, bx = 35 + i * 55, barH = v * 1.6, by = 255 - barH;
        return (
          <g key={label}>
            <rect x={bx} y={by} width={bw} height={barH} rx="5" fill={color} opacity="0.8"/>
            <text x={bx + bw/2} y={270} textAnchor="middle" fill="rgba(180,200,220,0.5)" fontSize="8" fontFamily="sans-serif">{label}</text>
            <text x={bx + bw/2} y={by - 5} textAnchor="middle" fill={color} fontSize="9" fontWeight="700" fontFamily="monospace">{v}%</text>
          </g>
        );
      })}
      {/* Market breakdown */}
      <rect x="285" y="10" width="255" height="280" rx="10" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="412" y="34" textAnchor="middle" fill="rgba(180,200,220,0.6)" fontSize="9" fontFamily="sans-serif">الأسواق الأفضل أداءً</text>
      {[
        { label:'EUR/USD', pct:68, profit:'+1,840 DH', color:'#00e676' },
        { label:'GBP/JPY', pct:54, profit:'+920 DH', color:'#5c9cf5' },
        { label:'XAU/USD', pct:72, profit:'+2,100 DH', color:'#f6d860' },
        { label:'US30', pct:48, profit:'+430 DH', color:'#ff9f43' },
      ].map(({ label, pct, profit, color }, i) => {
        const y = 54 + i * 58;
        return (
          <g key={label}>
            <text x={510} y={y + 14} textAnchor="end" fill="#e8edf3" fontSize="10" fontWeight="600" fontFamily="monospace">{label}</text>
            <text x={510} y={y + 28} textAnchor="end" fill={color} fontSize="9" fontFamily="monospace">{profit}</text>
            <rect x="300" y={y + 34} width="220" height="5" rx="3" fill="rgba(255,255,255,0.07)"/>
            <rect x="300" y={y + 34} width={220 * pct / 100} height="5" rx="3" fill={color} opacity="0.7"/>
          </g>
        );
      })}
    </svg>
  );

  if (id === 'calendar') return (
    <svg viewBox="0 0 560 300" style={{ width:'100%', height:'auto' }}>
      <rect x="40" y="10" width="480" height="280" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <text x="280" y="40" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">أبريل 2025</text>
      {['أحد','اثن','ثلا','أرب','خمي','جمع','سبت'].map((d, i) => (
        <text key={d} x={72 + i*64} y={64} textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="9" fontFamily="sans-serif">{d}</text>
      ))}
      {[
        [null, null, 1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24, 25, 26],
        [27, 28, 29, 30, null, null, null],
      ].map((week, wi) =>
        week.map((day, di) => {
          if (!day) return null;
          const x = 44 + di * 64, y = 80 + wi * 44;
          const colors = {
            2: '#00e676', 3: '#00e676', 5: '#ff4757', 7: '#00e676',
            9: '#ff4757', 10: '#00e676', 11: '#00e676', 14: '#ff4757',
            15: '#00e676', 16: '#00e676', 17: '#ff9f43', 18: '#00e676',
            21: '#ff4757', 22: '#00e676', 23: '#00e676', 24: '#00e676',
            28: '#ff4757', 29: '#00e676', 30: '#00e676',
          };
          const c = colors[day];
          return (
            <g key={day}>
              {c && <rect x={x} y={y} width={56} height={34} rx="7" fill={c} opacity="0.15"/>}
              {c && <rect x={x} y={y} width={56} height={34} rx="7" fill="none" stroke={c} strokeWidth="1" opacity="0.4"/>}
              <text x={x+28} y={y+21} textAnchor="middle" fill={c || 'rgba(180,200,220,0.35)'} fontSize="11" fontWeight={c ? '700' : '400'} fontFamily="monospace">{day}</text>
            </g>
          );
        })
      )}
    </svg>
  );

  if (id === 'pricing') return (
    <svg viewBox="0 0 560 300" style={{ width:'100%', height:'auto' }}>
      {/* Trial card */}
      <rect x="30" y="20" width="228" height="260" rx="14" fill="#0d1117" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="144" y="56" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">تجربة مجانية</text>
      <text x="144" y="88" textAnchor="middle" fill="#5c9cf5" fontSize="22" fontWeight="900" fontFamily="monospace">مجاناً</text>
      <text x="144" y="108" textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="9" fontFamily="sans-serif">24 ساعة وصول كامل</text>
      {['وصول كامل','يوميات الصفقات','تحليلات P&L','مقيّد بـ 24 ساعة'].map((f, i) => (
        <g key={f}>
          <text x={200} y={140 + i*26} textAnchor="end" fill="rgba(180,200,220,0.7)" fontSize="10" fontFamily="sans-serif">{f}</text>
          <text x={215} y={140 + i*26} textAnchor="middle" fill={i < 3 ? '#00e676' : '#ff4757'} fontSize="11">✓</text>
        </g>
      ))}
      <rect x="50" y="254" width="188" height="16" rx="8" fill="#1e2d3d"/>
      <text x="144" y="267" textAnchor="middle" fill="#e8edf3" fontSize="9" fontFamily="sans-serif">ابدأ التجربة المجانية</text>
      {/* Lifetime card — highlighted */}
      <rect x="278" y="10" width="252" height="280" rx="14" fill="#0d1117" stroke="rgba(246,216,96,0.4)" strokeWidth="1.5"/>
      <rect x="340" y="2" width="128" height="20" rx="10" fill="#f6d860"/>
      <text x="404" y="16" textAnchor="middle" fill="#080c10" fontSize="9" fontWeight="800" fontFamily="sans-serif">الأفضل قيمة 🔥</text>
      <text x="404" y="52" textAnchor="middle" fill="#e8edf3" fontSize="13" fontWeight="700" fontFamily="sans-serif">مدى الحياة</text>
      <text x="404" y="58" textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="8" fontFamily="monospace" dy="16">1000 DH</text>
      <line x1="358" y1="74" x2="450" y2="74" stroke="rgba(180,200,220,0.3)" strokeWidth="0.5"/>
      <text x="404" y="100" textAnchor="middle" fill="#f6d860" fontSize="28" fontWeight="900" fontFamily="monospace">700 DH</text>
      <text x="404" y="118" textAnchor="middle" fill="rgba(180,200,220,0.4)" fontSize="9" fontFamily="sans-serif">دفعة واحدة للأبد</text>
      {['كل شيء مشمول','وصول مدى الحياة','الميزات المستقبلية','دعم VIP'].map((f, i) => (
        <g key={f}>
          <text x={455} y={148 + i*28} textAnchor="end" fill="#e8edf3" fontSize="10" fontFamily="sans-serif">{f}</text>
          <text x={470} y={148 + i*28} textAnchor="middle" fill="#f6d860" fontSize="11">✓</text>
        </g>
      ))}
      <rect x="298" y="260" width="212" height="20" rx="10" fill="url(#gGold2)"/>
      <defs>
        <linearGradient id="gGold2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f6d860"/>
          <stop offset="100%" stopColor="#e6b800"/>
        </linearGradient>
      </defs>
      <text x="404" y="274" textAnchor="middle" fill="#080c10" fontSize="10" fontWeight="800" fontFamily="sans-serif">احصل على العرض 💬</text>
    </svg>
  );

  return null;
}

// ─── Demo Player (Voice Only) ─────────────────────────────────────────────────
function DemoPlayer() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying]   = useState(false);
  const [pct, setPct]           = useState(0);
  const [voiceOn, setVoiceOn]   = useState(false);
  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const voiceRef  = useRef(false);
  const scene     = SCENES[sceneIdx];

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = useCallback((idx) => {
    stopTimer();
    const dur = SCENES[idx].dur;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(100, (elapsed / dur) * 100);
      setPct(p);
      if (p >= 100) {
        stopTimer();
        const next = (idx + 1) % SCENES.length;
        setSceneIdx(next);
        setPct(0);
        startTimer(next);
        if (voiceRef.current) speak(SCENES[next].voice, 'ar');
      }
    }, 60);
  }, []);

  const handlePlay = () => {
    if (playing) {
      stopTimer();
      window.speechSynthesis?.cancel();
      setPlaying(false);
    } else {
      setPlaying(true);
      setVoiceOn(true);
      voiceRef.current = true;
      speak(scene.voice, 'ar');
      startTimer(sceneIdx);
    }
  };

  const handleScene = (idx) => {
    stopTimer();
    window.speechSynthesis?.cancel();
    setSceneIdx(idx);
    setPct(0);
    if (playing) {
      startTimer(idx);
      if (voiceRef.current) speak(SCENES[idx].voice, 'ar');
    }
  };

  useEffect(() => () => { stopTimer(); window.speechSynthesis?.cancel(); }, []);

  return (
    <div style={{ background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, overflow:'hidden', maxWidth:680, margin:'0 auto' }}>
      {/* Header bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'#080c10' }}>
        <div style={{ display:'flex', gap:6 }}>
          {[0,1,2].map(i => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:['#ff5f57','#febc2e','#28c840'][i] }}/>)}
        </div>
        <div style={{ fontFamily:'monospace', fontSize:11, color:'rgba(180,200,220,0.4)', letterSpacing:1 }}>TradeJournal PRO — عرض تجريبي</div>
        <div style={{ fontSize:11, color: voiceOn ? '#00e676' : 'rgba(180,200,220,0.3)', fontFamily:'monospace' }}>
          {voiceOn ? '🔊 صوت مفعّل' : '🔇 صوت'}
        </div>
      </div>

      {/* Scene title */}
      <div style={{ textAlign:'center', padding:'20px 20px 8px', direction:'rtl' }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#e8edf3', fontFamily:'sans-serif' }}>{scene.title}</div>
        <div style={{ fontSize:12, color:'rgba(180,200,220,0.5)', marginTop:4 }}>{scene.subtitle}</div>
      </div>

      {/* Visual */}
      <div style={{ padding:'8px 20px', minHeight:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <SceneVisual id={scene.visual}/>
      </div>

      {/* Progress bar */}
      <div style={{ margin:'8px 20px', height:3, background:'rgba(255,255,255,0.06)', borderRadius:99 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'#00e676', borderRadius:99, transition:'width 0.1s linear' }}/>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 20px 16px', direction:'rtl' }}>
        <button onClick={handlePlay} style={{
          width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',
          background: playing ? 'rgba(255,71,87,0.15)' : 'var(--green, #00e676)',
          color: playing ? '#ff4757' : '#080c10', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap' }}>
          {SCENES.map((s, i) => (
            <button key={s.id} onClick={() => handleScene(i)} style={{
              padding:'4px 10px', borderRadius:20, border:`1px solid ${i === sceneIdx ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: i === sceneIdx ? 'rgba(0,230,118,0.1)' : 'transparent',
              color: i === sceneIdx ? '#00e676' : 'rgba(180,200,220,0.5)',
              fontSize:10, cursor:'pointer', fontFamily:'sans-serif', direction:'rtl',
            }}>
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent }) {
  return (
    <div style={{
      background:'#0d1117', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16,
      padding:28, direction:'rtl', transition:'border-color 0.2s, transform 0.2s',
      cursor:'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '40'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ width:48, height:48, borderRadius:12, background: accent + '18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:16 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#e8edf3', marginBottom:8, fontFamily:'sans-serif' }}>{title}</div>
      <div style={{ fontSize:13, color:'rgba(180,200,220,0.6)', lineHeight:1.7, fontFamily:'sans-serif' }}>{desc}</div>
    </div>
  );
}

// ─── Pack Card ────────────────────────────────────────────────────────────────
function PackCard({ data, onSelect, highlighted }) {
  return (
    <div style={{
      background:'#0d1117', border: highlighted ? '1.5px solid rgba(246,216,96,0.45)' : '1px solid rgba(255,255,255,0.08)',
      borderRadius:20, padding:32, direction:'rtl', position:'relative',
      boxShadow: highlighted ? '0 0 40px rgba(246,216,96,0.07)' : 'none',
    }}>
      {data.badge && (
        <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#f6d860,#e6b800)', color:'#080c10', fontSize:11, fontWeight:800, padding:'4px 18px', borderRadius:99 }}>{data.badge}</div>
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
          <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(180,200,220,0.8)', fontFamily:'sans-serif', flexDirection:'row-reverse' }}>
            <span style={{ color: highlighted ? '#f6d860' : '#00e676', fontSize:14 }}>✓</span>
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
        onMouseEnter={e => { e.currentTarget.style.opacity='0.88'; e.currentTarget.style.transform='translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='none'; }}
      >
        {data.cta}
      </button>
    </div>
  );
}

// ─── Animated stat counter ────────────────────────────────────────────────────
function StatNum({ value, label }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontFamily:'monospace', fontSize:38, fontWeight:900, color:'#00e676', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:'rgba(180,200,220,0.5)', marginTop:6, fontFamily:'sans-serif' }}>{label}</div>
    </div>
  );
}

// ─── MAIN LANDING ─────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate   = useNavigate();
  const pricingRef = useRef(null);
  const scrollTo   = ref => ref.current?.scrollIntoView({ behavior:'smooth' });

  const C = {
    heroEyebrow: 'المنصة الاحترافية للمتداولين',
    heroH1a: 'سجّل. حلّل.',
    heroH1b: 'تداول بذكاء.',
    heroSub: 'المنصة الاحترافية التي تحوّل طريقة تتبع صفقاتك. حلّل أداءك، اكتشف الأنماط، ونمّي رأس مالك.',
    ctaPrimary: '🚀 ابدأ مجاناً',
    ctaSecondary: '▶ شاهد العرض الصوتي',
    demoLabel: 'اكتشف المنصة',
    demoTitle: 'كل ما تحتاجه لتتبع صفقاتك',
    demoSub: 'اضغط على تشغيل لسماع شرح مباشر بالعربية مع رسوم توضيحية لكل ميزة.',
    featLabel: 'الميزات',
    featTitle: 'مصمّم للمتداولين الجادين',
    featSub: 'كل ميزة صُممت بهدف واحد: مساعدتك لتكون متداولاً أفضل وأكثر ثباتاً.',
    features: [
      { icon:'📊', title:'يوميات الصفقات', desc:'سجّل كل صفقة مع الدخول والخروج، لقطات الشاشة، السوق والجلسة. لا تفوّت أي تفصيل.', accent:'#5c9cf5' },
      { icon:'📈', title:'تحليلات الأداء', desc:'رسوم P&L تراكمية، نسبة الفوز، أفضل الجلسات والأسواق بتفاصيل دقيقة.', accent:'#00e676' },
      { icon:'💰', title:'تتبع رأس المال', desc:'تتبع تطور رأس مالك، العائد على الاستثمار والمسحوبات عبر دورات متعددة.', accent:'#f6d860' },
      { icon:'📅', title:'تقويم بصري', desc:'خريطة بصرية لأداءك اليومي. اكتشف الأنماط والسلاسل الربحية بسرعة.', accent:'#a29bfe' },
    ],
    pricingLabel: 'الأسعار',
    pricingTitle: 'اختر خطتك',
    pricingSub: 'ابدأ مجاناً 24 ساعة. ثم احصل على الوصول مدى الحياة بسعر استثنائي.',
    trial: {
      name:'تجربة مجانية', price:'مجاناً', cls:'free',
      desc:'24 ساعة وصول كامل. لا بطاقة مطلوبة.',
      features:['وصول كامل','يوميات الصفقات','تحليلات P&L','مقيّد بـ 24 ساعة'],
      cta:'ابدأ التجربة المجانية',
    },
    lifetime: {
      name:'مدى الحياة', price:'700', curr:'DH', period:' مرة واحدة',
      orig:'1000 DH', disc:'🔥 -30%',
      desc:'ادفع مرة واحدة واستخدم للأبد.',
      features:['كل شيء مشمول','وصول مدى الحياة','الميزات المستقبلية','دعم VIP'],
      cta:'احصل على العرض 💬', badge:'الأفضل قيمة',
    },
    stats: [{ v:'127+', l:'متداول نشط' }, { v:'68%', l:'متوسط نسبة الفوز' }, { v:'+24%', l:'متوسط العائد' }],
    ctaEyebrow: 'مقاعد محدودة',
    ctaH1: 'جاهز لترقية تداولك؟',
    ctaSub: 'انضم إلى المتداولين الذين يستخدمون TradeJournal PRO للثبات والنمو.',
    signin: 'تسجيل الدخول',
    getStarted: 'ابدأ الآن',
    footerCopy: '© 2025 TradeJournal PRO. جميع الحقوق محفوظة.',
    whatsappNote: 'الدفع عبر واتساب',
  };

  /* ── shared section label style */
  const sectionLabel = {
    display:'inline-flex', alignItems:'center', gap:7, fontSize:11, fontWeight:700,
    letterSpacing:1.5, textTransform:'uppercase', color:'#00e676',
    background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)',
    padding:'5px 14px', borderRadius:99, marginBottom:18, fontFamily:'monospace',
  };

  return (
    <div dir="rtl" style={{ background:'#080c10', color:'#e8edf3', minHeight:'100vh', fontFamily:'sans-serif', overflowX:'hidden' }}>

      {/* ── Background orbs ── */}
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,230,118,0.055) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', top:'40%', left:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(92,156,245,0.04) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', right:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(246,216,96,0.04) 0%, transparent 70%)' }}/>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,12,16,0.85)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'#00e676', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:11, color:'#080c10', fontFamily:'monospace', letterSpacing:-1 }}>TJ</div>
          <span style={{ fontWeight:800, fontSize:17 }}>Trade<span style={{ color:'#00e676' }}>Journal</span> PRO</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, direction:'ltr' }}>
          <button onClick={() => navigate('/login')} style={{ padding:'7px 18px', borderRadius:8, background:'#141b22', border:'1px solid rgba(255,255,255,0.08)', color:'#e8edf3', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'sans-serif' }}>{C.signin}</button>
          <button onClick={() => scrollTo(pricingRef)} style={{ padding:'8px 20px', borderRadius:8, background:'#00e676', border:'none', color:'#080c10', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'sans-serif' }}>{C.getStarted}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', padding:'100px 40px 80px', textAlign:'center' }}>
        <div style={sectionLabel}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#00e676', display:'inline-block' }}/>
          {C.heroEyebrow}
        </div>

        {/* Hero SVG chart illustration */}
        <div style={{ margin:'0 auto 40px', maxWidth:700, opacity:0.85 }}>
          <svg viewBox="0 0 700 140" style={{ width:'100%' }}>
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e676" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#00e676" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[30,60,90,120].map(y => <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>)}
            <polyline points="0,120 70,105 140,115 210,90 280,70 350,55 420,40 490,28 560,20 630,15 700,10"
              fill="none" stroke="#00e676" strokeWidth="2.5" strokeLinejoin="round"/>
            <polygon points="0,120 70,105 140,115 210,90 280,70 350,55 420,40 490,28 560,20 630,15 700,10 700,140 0,140"
              fill="url(#heroGrad)"/>
            {/* dots at peaks */}
            {[[350,55],[490,28],[700,10]].map(([x,y]) => (
              <circle key={x} cx={x} cy={y} r="4" fill="#00e676" opacity="0.8"/>
            ))}
          </svg>
        </div>

        <h1 style={{ fontSize:64, fontWeight:900, lineHeight:1.1, margin:'0 0 8px', letterSpacing:-2 }}>
          {C.heroH1a}<br/><span style={{ color:'#00e676' }}>{C.heroH1b}</span>
        </h1>
        <p style={{ fontSize:18, color:'rgba(180,200,220,0.65)', maxWidth:560, margin:'20px auto 36px', lineHeight:1.7 }}>{C.heroSub}</p>

        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => scrollTo(pricingRef)} style={{ padding:'14px 32px', borderRadius:12, background:'#00e676', border:'none', color:'#080c10', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'sans-serif' }}>{C.ctaPrimary}</button>
          <button onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'14px 32px', borderRadius:12, background:'#141b22', border:'1px solid rgba(255,255,255,0.12)', color:'#e8edf3', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'sans-serif' }}>{C.ctaSecondary}</button>
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:48, justifyContent:'center', marginTop:60, flexWrap:'wrap' }}>
          {C.stats.map(({ v, l }) => <StatNum key={l} value={v} label={l}/>)}
        </div>
      </section>

      {/* ── DECORATIVE DIVIDER ── */}
      <div style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto', padding:'0 40px' }}>
        <div style={{ height:1, background:'linear-gradient(90deg, transparent, rgba(0,230,118,0.3), transparent)' }}/>
      </div>

      {/* ── DEMO PLAYER ── */}
      <section id="demo-section" style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ ...sectionLabel, margin:'0 auto 18px' }}>{C.demoLabel}</div>
          <h2 style={{ fontSize:38, fontWeight:800, margin:'0 0 14px', letterSpacing:-1 }}>{C.demoTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(180,200,220,0.55)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>{C.demoSub}</p>
        </div>
        <DemoPlayer/>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ ...sectionLabel, margin:'0 auto 18px' }}>{C.featLabel}</div>
          <h2 style={{ fontSize:38, fontWeight:800, margin:'0 0 14px', letterSpacing:-1 }}>{C.featTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(180,200,220,0.55)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>{C.featSub}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20 }}>
          {C.features.map(f => <FeatureCard key={f.title} {...f}/>)}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ position:'relative', zIndex:1, background:'#0d1117', borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'28px 40px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-around', gap:24, flexWrap:'wrap' }}>
          {[
            { icon:'🔒', text:'بياناتك آمنة تماماً' },
            { icon:'⚡', text:'أداء سريع وموثوق' },
            { icon:'📱', text:'يعمل على جميع الأجهزة' },
            { icon:'🌍', text:'دعم متعدد الأسواق' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'rgba(180,200,220,0.6)' }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <section ref={pricingRef} id="pricing" style={{ position:'relative', zIndex:1, padding:'80px 40px', maxWidth:800, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ ...sectionLabel, margin:'0 auto 18px' }}>{C.pricingLabel}</div>
          <h2 style={{ fontSize:38, fontWeight:800, margin:'0 0 14px', letterSpacing:-1 }}>{C.pricingTitle}</h2>
          <p style={{ fontSize:15, color:'rgba(180,200,220,0.55)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>{C.pricingSub}</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:24 }}>
          <PackCard data={C.trial}    onSelect={() => navigate('/register?pack=trial')} highlighted={false}/>
          <PackCard data={C.lifetime} onSelect={() => window.open('https://wa.me/212635925986?text=Bonjour%2C+je+veux+souscrire+au+pack+Lifetime+700DH','_blank')} highlighted={true}/>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'rgba(180,200,220,0.35)', marginTop:20 }}>💬 {C.whatsappNote}</p>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 40px', textAlign:'center', background:'linear-gradient(180deg, transparent 0%, rgba(0,230,118,0.04) 50%, transparent 100%)' }}>
        <div style={{ maxWidth:640, margin:'0 auto' }}>
          <div style={{ ...sectionLabel, margin:'0 auto 20px' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#f6d860', display:'inline-block' }}/>
            {C.ctaEyebrow}
          </div>
          <h2 style={{ fontSize:44, fontWeight:900, letterSpacing:-1.5, marginBottom:16 }}>
            <span style={{ color:'#00e676' }}>{C.ctaH1}</span>
          </h2>
          <p style={{ fontSize:16, color:'rgba(180,200,220,0.55)', lineHeight:1.7, marginBottom:36 }}>{C.ctaSub}</p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => scrollTo(pricingRef)} style={{ padding:'15px 36px', borderRadius:12, background:'#00e676', border:'none', color:'#080c10', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'sans-serif' }}>{C.ctaPrimary}</button>
            <button onClick={() => navigate('/login')} style={{ padding:'15px 36px', borderRadius:12, background:'#141b22', border:'1px solid rgba(255,255,255,0.12)', color:'#e8edf3', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'sans-serif' }}>لدي حساب بالفعل</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid rgba(255,255,255,0.06)', padding:'28px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, background:'#00e676', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:10, color:'#080c10', fontFamily:'monospace' }}>TJ</div>
          <span style={{ fontSize:14, fontWeight:600 }}>TradeJournal PRO</span>
        </div>
        <div style={{ fontSize:12, color:'rgba(180,200,220,0.35)' }}>{C.footerCopy}</div>
        <div style={{ display:'flex', gap:20, fontSize:13, color:'rgba(180,200,220,0.5)' }}>
          <span style={{ cursor:'pointer' }} onClick={() => navigate('/login')}>{C.signin}</span>
          <span style={{ cursor:'pointer' }} onClick={() => scrollTo(pricingRef)}>{C.pricingLabel}</span>
        </div>
      </footer>
    </div>
  );
}
