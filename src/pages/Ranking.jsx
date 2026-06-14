import React from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COLORS = { gold: '#d4af37', silver: '#c0c0c0', bronze: '#cd7f32' };

function medal(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '#' + rank;
}

function Avatar({ src, name, size }) {
  const s = size || 40;
  const style = {
    width: s,
    height: s,
    borderRadius: '50%',
    objectFit: 'cover',
    background: 'rgba(255,255,255,0.10)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    flexShrink: 0,
    fontSize: Math.round(s * 0.4),
    border: '1px solid rgba(255,255,255,0.12)',
  };
  const initials = (name || 'U').charAt(0).toUpperCase();
  if (src) return <img src={src} alt={name} style={style} />;
  return <div style={style}>{initials}</div>;
}

// Shared loader hook
export function useRanking() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const load = React.useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get('/ranking')
      .then((r) => {
        if (r && r.success) setRows((r.data && r.data.ranking) || []);
        else setError((r && r.message) || 'Failed to load ranking');
      })
      .catch(() => setError('Failed to load ranking'))
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);
  return { rows, loading, error, reload: load };
}

// ── Animated top-3 podium ────────────────────────────────
function Podium({ top }) {
  const order = [top[1], top[0], top[2]]; // visual: 2nd, 1st, 3rd
  const heights = { 1: 120, 2: 88, 3: 66 };
  const ST = {
    wrap: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 18,
      padding: '20px 0 8px',
      flexWrap: 'wrap',
    },
    col: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 96 },
    medalIcon: { fontSize: 26, lineHeight: 1 },
    name: {
      fontWeight: 700,
      fontSize: 14,
      textAlign: 'center',
      maxWidth: 120,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    score: { fontSize: 12, opacity: 0.7 },
    bar: {
      width: 92,
      borderRadius: '10px 10px 0 0',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: 8,
      color: '#111',
      fontWeight: 800,
      marginTop: 4,
    },
  };
  const barColor = (rank) => (rank === 1 ? COLORS.gold : rank === 2 ? COLORS.silver : COLORS.bronze);
  return (
    <div style={ST.wrap}>
      {order.map((u, i) => {
        if (!u) return <div key={'e' + i} style={ST.col} />;
        const cls = 'podium-item p' + u.rank + (u.rank === 1 ? ' rank-glow' : '');
        const barStyle = Object.assign({}, ST.bar, { height: heights[u.rank], background: barColor(u.rank) });
        return (
          <div key={u.id} className={cls} style={ST.col}>
            <div style={ST.medalIcon}>{medal(u.rank)}</div>
            <Avatar src={u.profile_pic} name={u.user_name} size={56} />
            <div style={ST.name}>{u.user_name}</div>
            <div style={ST.score}>Score {u.score}</div>
            <div style={barStyle}>{u.rank}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Full admin ranking page ────────────────────────────
export function Ranking() {
  const { rows, loading, error, reload } = useRanking();
  const ST = {
    head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12, flexWrap: 'wrap' },
    title: { fontSize: 18, fontWeight: 700 },
    sub: { opacity: 0.7, fontSize: 13, marginBottom: 4 },
    info: { opacity: 0.7, padding: 16 },
    err: { color: '#f87171', padding: 16 },
    uname: { fontWeight: 600 },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: 8 },
    thL: { textAlign: 'left', padding: '10px 12px', opacity: 0.7, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
    thR: { textAlign: 'right', padding: '10px 12px', opacity: 0.7, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
    td: { padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' },
    tdR: { padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'right' },
    userCell: { display: 'flex', alignItems: 'center', gap: 10 },
    rankBadge: { fontWeight: 800, width: 36, display: 'inline-block', textAlign: 'center' },
    btn: { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 600 },
    scorePill: { fontWeight: 800, color: COLORS.gold },
  };
  const top3 = rows.slice(0, 3);
  return (
    <div>
      <div className="page-header">
        <div className="page-title">🏆 Users Ranking</div>
      </div>
      <div className="card">
        <div style={ST.head}>
          <div>
            <div style={ST.title}>Leaderboard</div>
            <div style={ST.sub}>Ranked by a combined score: 40% win rate + 30% total trades + 30% winning volume.</div>
          </div>
          <button style={ST.btn} onClick={reload}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={ST.info}>Loading ranking…</div>
        ) : error ? (
          <div style={ST.err}>{error}</div>
        ) : rows.length === 0 ? (
          <div style={ST.info}>No trades recorded yet.</div>
        ) : (
          <div>
            <Podium top={top3} />
            <table style={ST.table}>
              <thead>
                <tr>
                  <th style={ST.thL}>Rank</th>
                  <th style={ST.thL}>User</th>
                  <th style={ST.thR}>Win rate</th>
                  <th style={ST.thR}>Total trades</th>
                  <th style={ST.thR}>Winning volume</th>
                  <th style={ST.thR}>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td style={ST.td}>
                      <span style={ST.rankBadge}>{medal(u.rank)}</span>
                    </td>
                    <td style={ST.td}>
                      <div style={ST.userCell}>
                        <Avatar src={u.profile_pic} name={u.user_name} size={36} />
                        <span style={ST.uname}>{u.user_name}</span>
                      </div>
                    </td>
                    <td style={ST.tdR}>{u.win_rate}%</td>
                    <td style={ST.tdR}>{u.total_trades}</td>
                    <td style={ST.tdR}>{u.sum_win}</td>
                    <td style={ST.tdR}><span style={ST.scorePill}>{u.score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Login pop-up shown to admins & users on connect ────────────
export function RankingPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem('tj_ranking_seen')) return;
    api
      .get('/ranking')
      .then((r) => {
        if (r && r.success) {
          const list = (r.data && r.data.ranking) || [];
          setRows(list);
          if (list.length > 0) setOpen(true);
        }
        sessionStorage.setItem('tj_ranking_seen', '1');
      })
      .catch(() => {});
  }, [user]);

  if (!open) return null;
  const top = rows.slice(0, 5);
  const isAdmin = user && user.role === 'admin';
  const ST = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.66)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 4000,
      padding: 16,
    },
    modal: {
      width: 'min(440px, 95vw)',
      background: '#15171c',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    },
    title: { fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 2 },
    sub: { textAlign: 'center', opacity: 0.65, fontSize: 13, marginBottom: 14 },
    row: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      marginBottom: 8,
      background: 'rgba(255,255,255,0.04)',
    },
    rowTop: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      marginBottom: 8,
      background: 'rgba(212,175,55,0.10)',
      border: '1px solid rgba(212,175,55,0.35)',
    },
    rank: { fontWeight: 800, width: 30, textAlign: 'center', fontSize: 16 },
    nameWrap: { fontWeight: 700, flex: 1, overflow: 'hidden' },
    nameText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    meta: { fontSize: 12, opacity: 0.7, fontWeight: 400 },
    score: { fontWeight: 800, color: COLORS.gold },
    actions: { display: 'flex', gap: 10, marginTop: 8 },
    btnGhost: { flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: 'inherit', cursor: 'pointer', fontWeight: 700 },
  };
  const btnPrimary = { flex: 1, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, background: COLORS.gold, color: '#111' };
  return (
    <div style={ST.backdrop} onClick={() => setOpen(false)}>
      <div className="ranking-pop" style={ST.modal} onClick={(e) => e.stopPropagation()}>
        <div style={ST.title}>🏆 Top Traders</div>
        <div style={ST.sub}>Ranked by win rate, total trades & winning volume</div>
        {top.map((u) => (
          <div key={u.id} style={u.rank <= 3 ? ST.rowTop : ST.row}>
            <span style={ST.rank}>{medal(u.rank)}</span>
            <Avatar src={u.profile_pic} name={u.user_name} size={38} />
            <div style={ST.nameWrap}>
              <div style={ST.nameText}>{u.user_name}</div>
              <div style={ST.meta}>{u.win_rate}% WR · {u.total_trades} trades</div>
            </div>
            <span style={ST.score}>{u.score}</span>
          </div>
        ))}
        <div style={ST.actions}>
          {isAdmin ? (
            <button
              style={btnPrimary}
              onClick={() => {
                setOpen(false);
                navigate('/ranking');
              }}
            >
              View full ranking
            </button>
          ) : null}
          <button style={ST.btnGhost} onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Twitter-style profile photo viewer (view / change) ───────
export function PhotoViewModal({ avatarSrc, initials, userName, onClose, onChange }) {
  const ST = {
    backdrop: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 4200,
      padding: 20,
    },
    close: {
      position: 'absolute',
      top: 16,
      right: 20,
      fontSize: 30,
      lineHeight: 1,
      color: '#fff',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
    },
    photo: {
      width: 'min(360px, 80vw)',
      height: 'min(360px, 80vw)',
      borderRadius: '50%',
      objectFit: 'cover',
      boxShadow: '0 10px 50px rgba(0,0,0,0.6)',
      background: 'rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 90,
      fontWeight: 800,
      color: '#fff',
      border: '3px solid rgba(255,255,255,0.15)',
    },
    name: { color: '#fff', marginTop: 16, fontSize: 18, fontWeight: 700 },
    actions: { display: 'flex', gap: 12, marginTop: 18 },
    btn: { padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, background: '#22c55e', color: '#062b12' },
    btnGhost: { padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  };
  const stop = (e) => e.stopPropagation();
  return (
    <div style={ST.backdrop} onClick={onClose}>
      <button style={ST.close} onClick={onClose} aria-label="Close">×</button>
      {avatarSrc ? (
        <img src={avatarSrc} alt={userName} style={ST.photo} onClick={stop} />
      ) : (
        <div style={ST.photo} onClick={stop}>{initials}</div>
      )}
      <div style={ST.name} onClick={stop}>{userName}</div>
      <div style={ST.actions} onClick={stop}>
        <button
          style={ST.btn}
          onClick={() => {
            onClose();
            if (onChange) onChange();
          }}
        >
          Change photo
        </button>
        {avatarSrc ? (
          <button style={ST.btnGhost} onClick={() => window.open(avatarSrc, '_blank')}>
            Open full size
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default Ranking;
