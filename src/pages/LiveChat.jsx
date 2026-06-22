import { useState, useEffect, useRef } from 'react';
import { Send, X, ChevronLeft, MessageCircle, Radio, Loader, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { useProfile } from '../context/ProfileContext';

// ─── Detecta tipo de stream e renderiza player correto ───────────────────────
function StreamPlayer({ streamUrl, title }) {
  if (!streamUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/40">
        <Radio size={48} />
        <p className="font-bold text-sm">Aguardando stream...</p>
        <p className="text-xs">O professor ainda não configurou a URL do stream.</p>
      </div>
    );
  }

  // Vimeo
  const vimeoMatch = streamUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0`}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        title={title}
      />
    );
  }

  // YouTube
  const ytMatch = streamUrl.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen"
        title={title}
      />
    );
  }

  // URL genérica (Google Meet, Zoom, etc) — abre em nova aba
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/60">
      <Radio size={48} className="text-red-400 animate-pulse" />
      <p className="font-bold text-sm text-white">Live em andamento</p>
      <a href={streamUrl} target="_blank" rel="noreferrer"
        className="px-6 py-3 bg-[#4A72B2] text-white rounded-xl font-bold text-sm hover:bg-white hover:text-[#001A26] transition-colors">
        Acessar stream externo ↗
      </a>
    </div>
  );
}

// ─── LiveChat ─────────────────────────────────────────────────────────────────
export default function LiveChat() {
  const { userData, profileImage } = useProfile();
  // ID do usuário logado para identificar mensagens próprias
  const loggedUserId = (() => {
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
      return raw ? JSON.parse(raw)?.id : null;
    } catch { return null; }
  })();

  const [live, setLive]           = useState(null);
  const [loadingLive, setLoadingLive] = useState(true);
  const [messages, setMessages]   = useState([]);
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [chatOpen, setChatOpen]   = useState(true);
  const lastMsgTime               = useRef(null);
  const messagesEndRef            = useRef(null);
  const messagesContainerRef      = useRef(null);
  const pollRef                   = useRef(null);

  // Busca live ativa
  useEffect(() => {
    authFetch('/api/live')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.is_active) {
          setLive(data);
          // Inicia lastMsgTime com o started_at da live para não pegar msgs antigas
          lastMsgTime.current = null;
          setMessages([]);
        }
      })
      .finally(() => setLoadingLive(false));
  }, []);

  // Busca mensagens e faz polling a cada 5s
  useEffect(() => {
    if (!live?.id) return;

    const fetchMessages = async () => {
      try {
        // Usa started_at como after inicial para ignorar msgs de lives anteriores
        const after = lastMsgTime.current || live.started_at;
        const url = `/api/live?action=messages&liveId=${live.id}&after=${encodeURIComponent(after)}`;
        const res = await authFetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const newMsgs = data.filter(m => !ids.has(m.id));
            if (newMsgs.length === 0) return prev; // sem mudança, sem re-render
            return [...prev, ...newMsgs];
          });
          lastMsgTime.current = data[data.length - 1].created_at;
        }
      } catch {}
    };

    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [live?.id]);

  // Scroll para última mensagem apenas quando chegam novas
  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      prevMsgCount.current = messages.length;
      // Scroll só dentro do container do chat, não da página inteira
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !live?.id || sending) return;
    setSending(true);
    const text = message.trim();
    setMessage('');
    try {
      const res = await authFetch('/api/live?action=message', {
        method: 'POST',
        body: JSON.stringify({ liveId: live.id, text }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        // Adiciona direto com user_id para isOwn funcionar corretamente
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, own: true, user_id: loggedUserId }];
        });
        if (lastMsgTime.current === null || newMsg.created_at > lastMsgTime.current) {
          lastMsgTime.current = newMsg.created_at;
        }
      }
    } catch {}
    setSending(false);
  };

  // Loading
  if (loadingLive) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="animate-spin text-[#4A72B2]" />
    </div>
  );

  // Sem live ativa
  if (!live) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
          <Radio size={28} className="text-slate-300" />
        </div>
        <h2 className="text-xl font-black text-[#001A26]">Nenhuma live ativa</h2>
        <p className="text-sm text-slate-400">Quando uma live for iniciada, ela aparecerá aqui automaticamente.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#001A26] text-white rounded-xl font-bold text-sm hover:bg-[#4A72B2] transition-colors">
          <ChevronLeft size={16} /> Voltar para home
        </Link>
      </div>
    </div>
  );

  const startedAt = new Date(live.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* HEADER */}
      <div className="px-4 sm:px-8 pt-6 pb-4 flex items-center gap-4">
        <Link to="/" className="w-10 h-10 bg-[#b9d2eb] rounded-xl flex items-center justify-center text-[#001A26] hover:bg-[#4A72B2] hover:text-white transition-colors flex-shrink-0">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 bg-white rounded-[20px] border border-slate-100 shadow-sm px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-[#001A26]">{live.title || 'Live Biscoitê'}</h1>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Iniciada às {startedAt}</p>
          </div>
          <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full hidden sm:block">
            🔴 AO VIVO
          </span>
        </div>
      </div>

      {/* CHAT TOGGLE — mobile */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#001A26] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#4A72B2] transition-colors z-50">
          <MessageCircle size={18} />
        </button>
      )}

      {/* MAIN CONTENT */}
      <div className="px-4 sm:px-8 pb-8">
        <div className={`grid gap-4 sm:gap-6 ${chatOpen ? 'grid-cols-1 lg:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>

          {/* PLAYER */}
          <div className="relative rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#001A26]" style={{ minHeight: '400px' }}>
            <StreamPlayer streamUrl={live.stream_url} title={live.title} />
          </div>

          {/* CHAT */}
          {chatOpen && (
            <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '400px', maxHeight: '600px' }}>

              {/* Chat header */}
              <div className="px-5 sm:px-6 py-4 sm:py-5 flex justify-between items-center border-b border-slate-50 flex-shrink-0">
                <div>
                  <h3 className="text-base font-black text-[#001A26]">Chat ao vivo</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{messages.length} mensagens</p>
                </div>
                <button onClick={() => setChatOpen(false)}
                  className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                  <X size={15} />
                </button>
              </div>

              {/* Mensagens */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-8">
                    <MessageCircle size={28} />
                    <p className="text-xs font-bold">Seja o primeiro a comentar!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.own || (loggedUserId && msg.user_id === loggedUserId);
                    const initials = (msg.user_name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
                    return (
                      <div key={msg.id} className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-[#4A72B2] flex items-center justify-center text-white text-[9px] font-black flex-shrink-0 overflow-hidden">
                          {isOwn
                            ? (profileImage
                                ? <img src={profileImage} className="w-full h-full object-cover" alt={userData?.name} />
                                : <span>{(userData?.name || 'U').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}</span>)
                            : (msg.avatar_url
                                ? <img src={msg.avatar_url} className="w-full h-full object-cover" alt={msg.user_name} />
                                : <span>{initials}</span>)
                          }
                        </div>
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                          <p className={`text-[10px] font-bold mb-0.5 ${isOwn ? 'text-slate-300 mr-1' : 'text-slate-400 ml-1'}`}>
                            {isOwn ? 'Você' : msg.user_name}
                          </p>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
                            isOwn
                              ? 'bg-[#4A72B2] text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-600 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <p className="text-[9px] text-slate-300 mt-0.5 mx-1">
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

              </div>

              {/* Input */}
              <div className="px-4 py-4 border-t border-slate-50 flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-4 py-2.5">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Enviar mensagem..."
                    className="flex-1 bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-300"
                  />
                  <button onClick={sendMessage} disabled={!message.trim() || sending}
                    className="w-8 h-8 bg-[#001A26] rounded-full flex items-center justify-center text-white hover:bg-[#4A72B2] transition-colors flex-shrink-0 disabled:opacity-40">
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
