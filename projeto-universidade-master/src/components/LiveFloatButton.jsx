import { useRef, useState } from 'react';
import { X, Radio, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Draggable from 'react-draggable';

export default function LiveFloatButton() {
  const navigate = useNavigate();
  const nodeRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Controle para distinguir drag de click
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleDrag = (e) => {
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    // Se moveu mais de 5px em qualquer direção, considera como drag
    if (dx > 5 || dy > 5) {
      isDragging.current = true;
    }
  };

  const handleDragStop = () => {
    // Não faz nada aqui — a navegação fica no onClick
  };

  const handleClick = () => {
    if (isDragging.current) {
      isDragging.current = false;
      return; // Era drag, não navega
    }
    navigate('/live');
  };

  // ESTADO MINIMIZADO — pílula discreta
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-10 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-[#00263B] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 hover:bg-[#001A26] transition-all font-bold text-xs group border border-white/20"
        >
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <Radio size={12} className="relative text-white" />
          </div>
          <span>Live em andamento</span>
          <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform opacity-60" />
        </button>
      </div>
    );
  }

  // ESTADO ABERTO — bolinha arrastável
  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="body"
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        ref={nodeRef}
        className="fixed top-40 left-10 z-[9999] cursor-grab active:cursor-grabbing"
      >
        <div className="relative h-[88px] w-[88px]">

          {/* ANEL EXTERNO cinza claro */}
          <div className="absolute inset-0 rounded-full bg-slate-200/80 scale-[1.18]" />

          {/* BOLINHA PRINCIPAL */}
          <div
            onClick={handleClick}
            className="relative h-full w-full rounded-full overflow-hidden shadow-xl border-[3px] border-white cursor-pointer z-10 bg-slate-100"
          >
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200"
              className="w-full h-full object-cover pointer-events-none"
              alt="Live"
            />

            {/* Tag LIVE vermelha */}
            <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-[9px] text-white font-black text-center py-1 uppercase tracking-wider flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
          </div>

          {/* Botão X para minimizar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="absolute -top-1 -right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-slate-100 hover:bg-slate-50 transition-colors z-20"
          >
            <X size={11} className="text-slate-400" />
          </button>
        </div>
      </div>
    </Draggable>
  );
}