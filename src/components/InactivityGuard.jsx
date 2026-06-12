// src/components/InactivityGuard.jsx
// Detecta inatividade e redireciona para login
// FIX: limpa completamente o estado ao fazer logout por inatividade

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const STORAGE_KEYS = [
  'biscoite_auth', 'biscoite_access_token',
  'biscoite_refresh_token', 'biscoite_logged_user',
];

function clearSession() {
  STORAGE_KEYS.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

const PUBLIC_ROUTES = ['/login', '/registrar', '/recuperar-senha', '/redefinir-senha'];

export default function InactivityGuard({ children, timeoutMinutes = 15 }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const timeoutRef  = useRef(null);
  const warningRef  = useRef(null);
  const countRef    = useRef(null);

  const isPublic = PUBLIC_ROUTES.includes(location.pathname);
  const isAuth   = !!(sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth'));

  const doLogout = useCallback(() => {
    clearSession();
    setWarning(false);
    setCountdown(60);
    [timeoutRef, warningRef, countRef].forEach(r => { if (r.current) clearTimeout(r.current); });
    navigate('/login', { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (isPublic || !isAuth) return;
    setWarning(false);
    setCountdown(60);
    [timeoutRef, warningRef, countRef].forEach(r => { if (r.current) clearTimeout(r.current); });

    // Aviso 1 min antes do timeout
    warningRef.current = setTimeout(() => {
      setWarning(true);
      setCountdown(60);
    }, (timeoutMinutes * 60 - 60) * 1000);

    // Logout automático
    timeoutRef.current = setTimeout(() => {
      doLogout();
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, isPublic, isAuth, doLogout]);

  // Contagem regressiva quando aviso está visível
  useEffect(() => {
    if (!warning) return;
    countRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { doLogout(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countRef.current);
  }, [warning, doLogout]);

  // Escuta eventos de atividade
  useEffect(() => {
    if (isPublic || !isAuth) return;
    const events = ['mousemove','keydown','click','scroll','touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      [timeoutRef, warningRef, countRef].forEach(r => { if (r.current) clearTimeout(r.current); });
    };
  }, [resetTimer, isPublic, isAuth]);

  // FIX 5: Limpa o modal quando o usuário já está em rota pública (após logout manual)
  useEffect(() => {
    if (isPublic) {
      setWarning(false);
      [timeoutRef, warningRef, countRef].forEach(r => { if (r.current) clearTimeout(r.current); });
    }
  }, [isPublic]);

  return (
    <>
      {children}
      {warning && !isPublic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⏱️</span>
            </div>
            <div>
              <h3 className="font-black text-[#001A26] text-lg">Sessão expirando</h3>
              <p className="text-slate-500 text-sm mt-1">
                Você será desconectado em <span className="font-black text-amber-500">{countdown}s</span> por inatividade.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={doLogout}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50"
              >
                Sair agora
              </button>
              <button
                onClick={resetTimer}
                className="flex-1 py-3 rounded-xl bg-[#4A72B2] hover:bg-[#001A26] text-white font-black text-sm transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
