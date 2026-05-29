import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio } from 'lucide-react';

const POLL_INTERVAL = 30_000; // verifica a cada 30 segundos

export default function LiveFloatButton() {
  const navigate                = useNavigate();
  const [live, setLive]         = useState(null);  // null = ainda carregando
  const [visible, setVisible]   = useState(false);

  const checkLive = useCallback(async () => {
    try {
      const res  = await fetch('/api/live');
      const data = await res.json();
      setLive(data);
      setVisible(data.is_active === true);
    } catch {
      setVisible(false);
    }
  }, []);

  // Verifica ao montar e depois a cada 30s
  useEffect(() => {
    checkLive();
    const interval = setInterval(checkLive, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkLive]);

  // Não renderiza nada enquanto carrega ou se não há live
  if (!visible) return null;

  return (
    <button
      onClick={() => navigate('/live')}
      className="fixed bottom-8 left-8 z-50 group"
      aria-label="Assistir live"
    >
      <div className="relative flex items-center gap-3 bg-[#001A26] text-white px-5 py-3.5 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
        {/* Anel pulsante */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
        </span>

        {/* Avatar do instrutor se disponível */}
        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-[#4A72B2] flex items-center justify-center flex-shrink-0">
          <Radio size={18} className="text-white" />
        </div>

        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest bg-red-500 px-2 py-0.5 rounded-full">
              AO VIVO
            </span>
          </div>
          <p className="text-xs font-bold mt-0.5 max-w-[140px] truncate">
            {live?.title || 'Live Biscoitê'}
          </p>
        </div>
      </div>
    </button>
  );
}
