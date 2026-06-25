// src/components/professor/ProfessorHelpers.jsx
import { Check, X, Star } from 'lucide-react';

// ─── Helpers centralizados — substitui todos os acessos diretos ao storage ──
function getLoggedUser() {
  try {
    const raw = sessionStorage.getItem('biscoite_logged_user')
             || localStorage.getItem('biscoite_logged_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getLoggedId() {
  return getLoggedUser()?.id ?? null;
}

// ─── Gráfico circular SVG ───────────────────────────────────────────────────
function CircularProgress({ value = 78, size = 100, stroke = 9, color = '#4A72B2' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2eef9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xl font-black text-[#00263B]">{value}%</span>
    </div>
  );
}

function RatingBar({ stars, count, max }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-slate-400 w-3">{stars}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#4A72B2] rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{count}</span>
    </div>
  );
}

function Stars({ count, size = 12 }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={size} className={i < Math.floor(count) ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />
      ))}
    </div>
  );
}

export { getLoggedUser, getLoggedId, CircularProgress, RatingBar, Stars, Toast };
