import { useEffect, useRef, useState, useCallback } from 'react';

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export function useInactivityTimer(timeoutMinutes = 15, warningSeconds = 60) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown]     = useState(warningSeconds);
  const idleTimerRef  = useRef(null);
  const countdownRef  = useRef(null);
  const onLogoutRef   = useRef(null);
  const warningRef    = useRef(false); // ref síncrono para uso dentro dos event listeners

  const clearCountdown = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  const startCountdown = useCallback(() => {
    warningRef.current = true;
    setShowWarning(true);
    let secs = warningSeconds;
    setCountdown(secs);
    countdownRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearCountdown();
        onLogoutRef.current?.();
      }
    }, 1000);
  }, [warningSeconds]);

  // Chamado apenas pelo botão "Continuar sessão" — não por eventos do DOM
  const resetTimer = useCallback(() => {
    warningRef.current = false;
    setShowWarning(false);
    setCountdown(warningSeconds);
    clearCountdown();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(startCountdown, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, warningSeconds, startCountdown]);

  // Eventos do DOM resetam o timer SOMENTE se o aviso não estiver visível
  const handleActivity = useCallback(() => {
    if (warningRef.current) return; // ignora atividade enquanto aviso está aberto
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(startCountdown, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, startCountdown]);

  const registerLogout = (fn) => { onLogoutRef.current = fn; };

  useEffect(() => {
    EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    // Inicia o timer na montagem
    idleTimerRef.current = setTimeout(startCountdown, timeoutMinutes * 60 * 1000);
    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [handleActivity, startCountdown, timeoutMinutes]);

  return { showWarning, countdown, resetTimer, registerLogout };
}
