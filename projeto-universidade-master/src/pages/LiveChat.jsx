import { useState, useRef } from 'react';
import { Send, Mic, Video, Monitor, Hand, PhoneOff, Settings, X, ChevronLeft, MessageCircle, Menu, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const MESSAGES = [
  { id: 1, time: '11:20', text: 'Olá, tenho uma dúvida sobre a gestão de funcionários durante o processo?', own: false },
  { id: 2, time: '11:20', text: 'Olá, tenho uma dúvida sobre a gestão de funcionários durante o processo?', own: false },
  { id: 3, time: '11:20', text: 'Olá, tenho uma dúvida sobre a gestão de funcionários durante o processo?', own: true },
  { id: 4, time: '11:20', text: 'Olá, tenho uma dúvida sobre a gestão de funcionários durante o processo?', own: false },
  { id: 5, time: '11:20', text: 'Olá, tenho uma dúvida sobre a gestão de funcionários durante o processo?', own: false },
];

const PARTICIPANTS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
];

export default function LiveChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MESSAGES);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      text: message,
      own: true,
    }]);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative">

      {/* HEADER */}
      <div className="px-8 pt-6 pb-4 flex items-center gap-4">
        <Link
          to="/"
          className="w-10 h-10 bg-[#b9d2eb] rounded-xl flex items-center justify-center text-[#001A26] hover:bg-[#4A72B2] hover:text-white transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 bg-white rounded-[20px] border border-slate-100 shadow-sm px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black text-[#001A26]">Live sobre operação de loja</h1>
            <div className="flex gap-4 text-xs text-slate-400 font-semibold mt-0.5">
              <span>Iniciada: 11:30</span>
              <span>Previsão de término: 15:30</span>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-500 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* FLOATING CHAT TOGGLE BUTTON */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#001A26] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#4A72B2] transition-colors z-50"
        >
          <MessageCircle size={18} />
        </button>
      )}

      {/* MAIN CONTENT */}
      <div className="px-8 pb-8">
        <div className={`grid gap-6 ${chatOpen ? 'grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>

          {/* VIDEO AREA */}
          <div className="relative rounded-[32px] overflow-hidden bg-slate-200" style={{ minHeight: '520px' }}>
            
            {/* Vídeo principal — trocar src pelo iframe do Google Meet futuramente */}
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1400"
              className="w-full h-full object-cover absolute inset-0"
              alt="Palestrante"
              style={{ minHeight: '520px' }}
            />

            {/* PARTICIPANTES — lateral direita sobre o vídeo */}
            <div className="absolute right-5 top-5 flex flex-col gap-3 z-10">
              {PARTICIPANTS.map((src, i) => (
                <div
                  key={i}
                  className="w-[100px] h-[80px] rounded-2xl overflow-hidden border-2 border-white shadow-lg"
                >
                  <img src={src} className="w-full h-full object-cover" alt={`Participante ${i + 1}`} />
                </div>
              ))}
            </div>

            {/* CONTROLES — barra flutuante inferior */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-white/90 backdrop-blur-md px-8 py-3 rounded-full flex items-center gap-5 shadow-2xl border border-white/60">
                
                <button
                  onClick={() => setCamOn(!camOn)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    camOn ? 'bg-[#001A26] text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Video size={18} />
                </button>

                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
                    micOn ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-100 border-transparent text-slate-400'
                  }`}
                >
                  <Mic size={18} />
                </button>

                <button className="w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  <Monitor size={18} />
                </button>

                <button className="w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  <Hand size={18} />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <button className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                  <PhoneOff size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* CHAT */}
          {chatOpen && (
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '520px' }}>
              
              {/* Chat header */}
              <div className="px-6 py-5 flex justify-between items-center border-b border-slate-50">
                <h3 className="text-lg font-black text-[#001A26]">Chat</h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <p className="text-[10px] text-slate-300 font-semibold mb-1">{msg.time}</p>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium max-w-[90%] ${
                        msg.own
                          ? 'bg-white border border-slate-100 shadow-sm text-slate-600 ml-auto rounded-tr-none'
                          : 'bg-slate-100 text-slate-600 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="px-4 py-4 border-t border-slate-50">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-5 py-2.5">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Enviar uma mensagem"
                    className="flex-1 bg-transparent text-sm outline-none text-slate-600 placeholder:text-slate-300"
                  />
                  <button
                    onClick={sendMessage}
                    className="w-8 h-8 bg-[#001A26] rounded-full flex items-center justify-center text-white hover:bg-[#4A72B2] transition-colors flex-shrink-0"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOTA SOBRE INTEGRAÇÃO COM GOOGLE MEET */}
        {/* 
          Para integrar com Google Meet no futuro, substitua a <img> do vídeo principal por:
          
          <iframe
            src="https://meet.google.com/xxx-xxxx-xxx?embedded=true"
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full h-full absolute inset-0"
            style={{ border: 'none', minHeight: '520px' }}
          />
          
          Lembre de configurar o domínio no Google Workspace para permitir embeds.
        */}
      </div>
    </div>
  );
}