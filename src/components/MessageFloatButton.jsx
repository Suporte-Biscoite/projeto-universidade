import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChevronLeft, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import ChatPanel from './ChatPanel';

export default function MessageFloatButton() {
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  // Esconde no painel do professor (tem chat próprio) e na página de mensagens
  const hidden = location.pathname === '/mensagens' || location.pathname.startsWith('/professor');

  // Pega userId do storage
  const currentUserId = (() => {
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
      return raw ? JSON.parse(raw)?.id : null;
    } catch { return null; }
  })();

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
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [hidden]);

  if (hidden || !currentUserId) return null;

  return (
    <>
      {/* Mini chat popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 shadow-2xl rounded-[24px] overflow-hidden border border-slate-100">
          <ChatPanel currentUserId={currentUserId} compact />
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          open ? 'bg-slate-600' : 'bg-[#001A26] hover:bg-[#4A72B2]'
        }`}
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
