import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import ChatPanel from './ChatPanel';

// Lê userId do storage de forma síncrona
function getStoredUserId() {
  try {
    const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.id || null;
  } catch { return null; }
}

const HIDDEN_PATHS = ['/professor', '/gestor', '/admin', '/login', '/registrar', '/mensagens'];

export default function MessageFloatButton({ externalOpen, onOpenChange }) {
  const [unread, setUnread]     = useState(0);
  const [open, setOpen]         = useState(false);
  const [userId]                = useState(() => getStoredUserId());
  const location                = useLocation();

  // Sincroniza com estado externo do MainLayout
  const isOpen   = externalOpen !== undefined ? externalOpen : open;
  const setIsOpen = (v) => { setOpen(v); onOpenChange?.(v); };
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
      {isOpen && (
        <>
          {/* Overlay mobile */}
          <div className="fixed inset-0 z-[199] bg-black/20 sm:hidden" onClick={() => setIsOpen(false)} />
          {/* Popup */}
          <div
            className="fixed z-[200] shadow-2xl rounded-[24px] overflow-hidden border border-slate-200 bg-white"
            style={{
              bottom: '88px',
              right: '16px',
              left: '16px',
              maxWidth: '480px',
              marginLeft: 'auto',
              height: 'min(520px, calc(100vh - 120px))',
            }}
          >
            <ChatPanel currentUserId={userId} compact />
          </div>
        </>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-slate-700' : 'bg-[#001A26] hover:bg-[#4A72B2]'
        }`}
        aria-label="Mensagens"
      >
        {isOpen
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} className="text-white" />
        }
        {!isOpen && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  );
}
