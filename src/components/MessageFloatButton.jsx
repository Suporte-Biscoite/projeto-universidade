import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import ChatPanel from './ChatPanel';

// Lê userId do storage de forma síncrona
function getStoredUserId() {
  try {
    const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
    return raw ? JSON.parse(raw)?.id || null : null;
  } catch { return null; }
}

const HIDDEN_PATHS = ['/professor', '/gestor', '/admin', '/login', '/registrar', '/mensagens'];

export default function MessageFloatButton() {
  const [unread, setUnread]     = useState(0);
  const [open, setOpen]         = useState(false);
  const [userId]                = useState(() => getStoredUserId()); // síncrono
  const location                = useLocation();

  const hidden = HIDDEN_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (hidden || !userId) return;

    const fetchUnread = () => {
      authFetch('/api/data?resource=conversations')
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          const total = (Array.isArray(data) ? data : [])
            .reduce((acc, c) => acc + (Number(c.unread) || 0), 0);
          setUnread(total);
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [hidden, userId]);

  if (!userId || hidden) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-[200] w-80 sm:w-96 shadow-2xl rounded-[24px] overflow-hidden border border-slate-200 bg-white"
          style={{ maxHeight: '520px' }}>
          <ChatPanel currentUserId={userId} compact />
        </div>
      )}

      <button
        onClick={() => setOpen(p => !p)}
        className={`fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
          open ? 'bg-slate-700' : 'bg-[#001A26] hover:bg-[#4A72B2]'
        }`}
        aria-label="Mensagens"
      >
        {open
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />
        }
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
