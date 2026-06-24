import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

export default function MessageFloatButton() {
  const [unread, setUnread]   = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Não mostrar na página de mensagens ou no painel do professor
  const hidden = location.pathname === '/mensagens' || location.pathname.startsWith('/professor');

  useEffect(() => {
    const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');
    if (!isAuth || hidden) return;

    const fetchUnread = async () => {
      try {
        const res = await authFetch('/api/data?resource=conversations');
        if (!res.ok) return;
        const data = await res.json();
        const total = (Array.isArray(data) ? data : [])
          .reduce((acc, c) => acc + (Number(c.unread) || 0), 0);
        setUnread(total);
        setVisible(total > 0); // só aparece quando tem não lidas
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [hidden]);

  if (hidden || !visible) return null;

  return (
    <button
      onClick={() => navigate('/mensagens')}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#001A26] hover:bg-[#4A72B2] text-white px-5 py-3.5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
    >
      <div className="relative">
        <MessageCircle size={20} />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <span className="text-sm font-bold">
        {unread} mensagem{unread !== 1 ? 's' : ''} nova{unread !== 1 ? 's' : ''}
      </span>
    </button>
  );
}
