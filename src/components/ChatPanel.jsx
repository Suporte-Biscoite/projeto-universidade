// src/components/ChatPanel.jsx
// Componente de chat reutilizável — usado no painel do professor e na página do aluno

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, ChevronLeft, Search, Loader, X } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

// ─── Bubble de mensagem ───────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const initials = (msg.sender_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-7 h-7 rounded-full bg-[#4A72B2] flex items-center justify-center text-white text-[9px] font-black flex-shrink-0 overflow-hidden">
        {msg.sender_avatar
          ? <img src={msg.sender_avatar} className="w-full h-full object-cover" alt={msg.sender_name} />
          : <span>{initials}</span>}
      </div>
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <p className={`text-[10px] font-bold mb-0.5 ${isOwn ? 'text-slate-300 mr-1' : 'text-slate-400 ml-1'}`}>
          {isOwn ? 'Você' : msg.sender_name}
        </p>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
          isOwn ? 'bg-[#4A72B2] text-white rounded-tr-none' : 'bg-slate-100 text-slate-600 rounded-tl-none'
        }`}>
          {msg.text}
        </div>
        <p className="text-[9px] text-slate-300 mt-0.5 mx-1">{time}</p>
      </div>
    </div>
  );
}

// ─── Item de conversa na lista ────────────────────────────────────────────────
function ConversationItem({ conv, isOwn, isSelected, onClick, currentUserId }) {
  const other = currentUserId === conv.student_id
    ? { name: conv.professor_name, avatar: conv.professor_avatar }
    : { name: conv.student_name,   avatar: conv.student_avatar  };

  const initials = (other.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const unread   = Number(conv.unread) || 0;
  const time     = conv.last_at
    ? new Date(conv.last_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${
      isSelected ? 'bg-[#e2eef9]' : 'hover:bg-slate-50'
    }`}>
      <div className="w-10 h-10 rounded-full bg-[#4A72B2] flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
        {other.avatar
          ? <img src={other.avatar} className="w-full h-full object-cover" alt={other.name} />
          : <span>{initials}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#4A72B2]' : 'text-[#001A26]'}`}>{other.name}</p>
          {time && <span className="text-[10px] text-slate-300 flex-shrink-0 ml-2">{time}</span>}
        </div>
        {conv.course_title && (
          <p className="text-[10px] text-slate-400 truncate">{conv.course_title}</p>
        )}
        {conv.last_message && (
          <p className="text-[11px] text-slate-400 truncate">{conv.last_message}</p>
        )}
      </div>
      {unread > 0 && (
        <span className="w-5 h-5 bg-[#4A72B2] text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">
          {unread}
        </span>
      )}
    </button>
  );
}

// ─── Chat Panel Principal ─────────────────────────────────────────────────────
export default function ChatPanel({ currentUserId, compact = false }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [showList, setShowList]           = useState(true);
  const messagesContainerRef              = useRef(null);
  const pollRef                           = useRef(null);
  const lastMsgTime                       = useRef(null);

  // Carrega conversas
  useEffect(() => {
    authFetch('/api/data?resource=conversations')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setConversations(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Carrega mensagens ao selecionar conversa
  useEffect(() => {
    if (!selectedConv) return;
    setMessages([]);
    lastMsgTime.current = null;

    const loadMessages = async () => {
      const res = await authFetch(`/api/data?resource=conversations&id=${selectedConv.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) lastMsgTime.current = data[data.length - 1].created_at;
      }
      // Marca como lidas
      authFetch(`/api/data?resource=conversations&action=read&id=${selectedConv.id}`, { method: 'POST' }).catch(() => {});
      // Atualiza contador
      setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, unread: 0 } : c));
    };

    loadMessages();
    // Polling 5s para novas mensagens
    pollRef.current = setInterval(async () => {
      const res = await authFetch(`/api/data?resource=conversations&id=${selectedConv.id}`).catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        const newMsgs = data.filter(m => !ids.has(m.id));
        if (newMsgs.length === 0) return prev;
        if (messagesContainerRef.current) {
          setTimeout(() => {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }, 50);
        }
        return [...prev, ...newMsgs];
      });
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [selectedConv?.id]);

  // Scroll ao carregar
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedConv?.id, messages.length > 0]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedConv || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const res = await authFetch('/api/data?resource=conversations&action=message', {
        method: 'POST',
        body: JSON.stringify({ conversationId: selectedConv.id, text }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setConversations(prev => prev.map(c =>
          c.id === selectedConv.id ? { ...c, last_message: text, last_at: new Date().toISOString() } : c
        ));
        setTimeout(() => {
          if (messagesContainerRef.current)
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }, 50);
      }
    } catch {}
    setSending(false);
  };

  const filteredConvs = conversations.filter(c => {
    const other = currentUserId === c.student_id ? c.professor_name : c.student_name;
    return (other || '').toLowerCase().includes(search.toLowerCase());
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (Number(c.unread) || 0), 0);

  return (
    <div className={`flex bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden ${compact ? 'h-[500px]' : 'h-[600px]'}`}>

      {/* LISTA DE CONVERSAS */}
      <div className={`flex flex-col border-r border-slate-100 ${compact ? 'w-56' : 'w-72'} ${!showList && 'hidden sm:flex'}`}>
        <div className="px-4 py-4 border-b border-slate-50">
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-[#001A26] text-sm">Mensagens</p>
            {totalUnread > 0 && (
              <span className="bg-[#4A72B2] text-white text-[9px] font-black px-2 py-0.5 rounded-full">{totalUnread}</span>
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <Search size={13} className="text-slate-300" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." className="flex-1 text-xs bg-transparent outline-none text-slate-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={20} className="animate-spin text-slate-300" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold">Nenhuma conversa ainda</p>
            </div>
          ) : filteredConvs.map(conv => (
            <ConversationItem
              key={conv.id}
              conv={conv}
              currentUserId={currentUserId}
              isSelected={selectedConv?.id === conv.id}
              onClick={() => { setSelectedConv(conv); setShowList(false); }}
            />
          ))}
        </div>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className={`flex-1 flex flex-col ${showList && 'hidden sm:flex'}`}>
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300">
            <MessageCircle size={40} />
            <p className="text-sm font-bold text-slate-400">Selecione uma conversa</p>
          </div>
        ) : (
          <>
            {/* Header da conversa */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => { setShowList(true); setSelectedConv(null); }}
                className="sm:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                <ChevronLeft size={16} />
              </button>
              {(() => {
                const other = currentUserId === selectedConv.student_id
                  ? { name: selectedConv.professor_name, avatar: selectedConv.professor_avatar }
                  : { name: selectedConv.student_name,   avatar: selectedConv.student_avatar };
                const initials = (other.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <>
                    <div className="w-9 h-9 rounded-full bg-[#4A72B2] flex items-center justify-center text-white text-xs font-black overflow-hidden flex-shrink-0">
                      {other.avatar ? <img src={other.avatar} className="w-full h-full object-cover" alt={other.name} /> : initials}
                    </div>
                    <div>
                      <p className="font-black text-[#001A26] text-sm">{other.name}</p>
                      {selectedConv.course_title && (
                        <p className="text-[10px] text-slate-400">{selectedConv.course_title}</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Mensagens */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
                  <MessageCircle size={28} />
                  <p className="text-xs font-bold">Nenhuma mensagem ainda. Diga olá!</p>
                </div>
              ) : messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === currentUserId} />
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-4 py-2.5">
                <input type="text" value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-300" />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-8 h-8 bg-[#001A26] rounded-full flex items-center justify-center text-white hover:bg-[#4A72B2] transition-colors disabled:opacity-40 flex-shrink-0">
                  <Send size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
