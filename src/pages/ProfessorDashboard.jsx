import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Settings, Trash2, Bell, Star,
  AlertTriangle, Users, TrendingUp, MessageSquare, BarChart2,
  Upload, Plus, ChevronRight, ChevronDown, Search, Megaphone,
  FileText, Download, CheckSquare, GripVertical, X,
  Zap, Mail, Send, Check, Radio, ChevronUp, Filter,
  Pencil, Eye, EyeOff, Layers, Award, Home,
  Image as ImageIcon, Video, HardDrive, Film, Link, Play,
  Clapperboard, Trash,
} from 'lucide-react';
import { useProfile, CURRENT_INSTRUCTOR_ID, DEFAULT_COURSE_IMAGES } from '../context/ProfileContext';
import VimeoUploader from '../components/VimeoUploader';
import LiveControl from '../components/LiveControl';

// ─── Gráfico circular SVG ───────────────────────────────────────────────────
function CircularProgress({ value = 78, size = 100, stroke = 9, color = '#4A72B2' }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e2eef9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xl font-black text-[#00263B]">{value}%</span>
    </div>
  );
}

function RatingBar({ stars, count, max }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-slate-400 w-3">{stars}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#4A72B2] rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{count}</span>
    </div>
  );
}

function Stars({ count, size = 12 }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={size} className={i < Math.floor(count) ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />
      ))}
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-center gap-3 bg-[#00263B] text-white px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <Check size={15} className="text-emerald-400 flex-shrink-0" />
      <span className="text-sm font-black">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white"><X size={13} /></button>
    </div>
  );
}

// ─── Modal: Contatar aluno ───────────────────────────────────────────────────
function ContactModal({ student, onClose, onSent }) {
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);
  const send = () => {
    if (!msg.trim()) return;
    setDone(true);
    setTimeout(() => { onSent(); onClose(); }, 1100);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={student.avatar} className="w-10 h-10 rounded-full object-cover" alt={student.name} />
            <div>
              <p className="font-black text-[#00263B] text-sm">{student.name}</p>
              <p className="text-[10px] text-orange-400 font-semibold">{student.info}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>
        {done ? (
          <div className="flex flex-col items-center gap-2 py-6 text-emerald-500">
            <Check size={32} /><p className="font-black text-sm">Mensagem enviada!</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mensagem</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} autoFocus
                placeholder="Escreva uma mensagem para o aluno..." rows={4}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] resize-none font-medium placeholder-slate-300"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs hover:bg-slate-50">Cancelar</button>
              <button onClick={send} disabled={!msg.trim()}
                className="flex-1 py-3 rounded-xl bg-[#4A72B2] hover:bg-[#00263B] text-white font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                <Send size={13} /> Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Responder dúvida ─────────────────────────────────────────────────
function DuvidaModal({ duvida, onClose, onResolve }) {
  const [reply, setReply] = useState('');
  const [resolved, setResolved] = useState(false);
  const [thread, setThread] = useState([
    { from: 'aluno', text: duvida.texto, time: duvida.tempo },
  ]);
  const sendReply = () => {
    if (!reply.trim()) return;
    setThread(prev => [...prev, { from: 'prof', text: reply, time: 'agora' }]);
    setReply('');
  };
  const resolve = () => {
    setResolved(true);
    setTimeout(() => { onResolve(duvida.id); onClose(); }, 1000);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <p className="font-black text-[#00263B] text-sm">{duvida.aluno}</p>
            <p className="text-[10px] text-slate-400 font-medium">{duvida.aula}</p>
          </div>
          <div className="flex items-center gap-2">
            {!resolved && (
              <button onClick={resolve} className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-1">
                <Check size={11} /> Marcar como resolvida
              </button>
            )}
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
          </div>
        </div>
        <div className="h-56 overflow-y-auto px-7 py-4 space-y-3">
          {thread.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'prof' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.from === 'prof' ? 'bg-[#4A72B2] text-white' : 'bg-slate-100 text-[#00263B]'}`}>
                <p className="text-xs font-medium">{msg.text}</p>
                <p className={`text-[9px] mt-1 ${msg.from === 'prof' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
          {resolved && (
            <div className="flex justify-center">
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-full">Dúvida resolvida ✓</span>
            </div>
          )}
        </div>
        <div className="px-7 py-4 border-t border-slate-100 flex gap-2">
          <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()}
            placeholder="Responder..." className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
          <button onClick={sendReply} disabled={!reply.trim()}
            className="w-10 h-10 bg-[#4A72B2] text-white rounded-xl flex items-center justify-center hover:bg-[#00263B] transition-all disabled:opacity-40">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Notificação ──────────────────────────────────────────────────────
function NotifModal({ type, onClose, onSent }) {
  const cfg = {
    pendentes: { title: 'Notificar Alunos Pendentes', desc: 'Alunos que não concluíram o módulo atual', Icon: Bell },
    push:      { title: 'Push / E-mail de Lançamento', desc: 'Anunciar novo conteúdo ou curso',          Icon: Zap },
    avisos:    { title: 'Disparar Aviso de Atualização', desc: 'Informar mudanças na plataforma',        Icon: Mail },
  }[type];
  const [destino, setDestino] = useState('todos');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [done, setDone] = useState(false);
  const send = () => {
    if (!titulo.trim() || !corpo.trim()) return;
    setDone(true);
    setTimeout(() => { onSent({ titulo, corpo, destino }); onClose(); }, 1100);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E2F0FF] rounded-xl flex items-center justify-center">
              <cfg.Icon size={16} className="text-[#4A72B2]" />
            </div>
            <div>
              <p className="font-black text-[#00263B] text-sm">{cfg.title}</p>
              <p className="text-[10px] text-slate-400 font-medium">{cfg.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
        </div>
        {done ? (
          <div className="flex flex-col items-center gap-2 py-6 text-emerald-500">
            <Check size={32} /><p className="font-black text-sm">Enviado com sucesso!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Destinatários</label>
                <select value={destino} onChange={e => setDestino(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] font-medium bg-white">
                  <option value="todos">Todos os alunos</option>
                  <option value="alunos">Apenas Alunos</option>
                  <option value="franqueados">Apenas Franqueados</option>
                  <option value="pendentes">Alunos com módulo pendente</option>
                  <option value="risco">Alunos em risco</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Título</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Novo módulo disponível"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mensagem</label>
                <textarea value={corpo} onChange={e => setCorpo(e.target.value)} rows={3}
                  placeholder="Escreva o conteúdo da notificação..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] resize-none font-medium placeholder-slate-300" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs hover:bg-slate-50">Cancelar</button>
              <button onClick={send} disabled={!titulo.trim() || !corpo.trim()}
                className="flex-1 py-3 rounded-xl bg-[#4A72B2] hover:bg-[#00263B] text-white font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                <Send size={13} /> Disparar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ activeView, setActiveView, profileImage, userName, unreadComm }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
    { id: 'cursos',       label: 'Meus Cursos',  icon: BookOpen },
    { id: 'reels',        label: 'Reels',        icon: Clapperboard },
    { id: 'comunicacao',  label: 'Comunicação',  icon: MessageSquare, badge: unreadComm },
  ];

  return (
    <aside className="w-[200px] min-h-screen bg-white border-r border-slate-100 flex flex-col py-8 px-6 gap-8 flex-shrink-0">
      <button onClick={() => navigate('/')} className="block mx-auto">
        <img src="/logo-biscoite.svg" alt="Biscoitê" className="h-8 w-auto hover:opacity-75 transition-opacity mx-auto" />
      </button>

      <div className="relative">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 group w-full">
          <img src={profileImage} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" alt="perfil" />
          <span className="text-sm font-black text-[#00263B] group-hover:text-[#4A72B2] transition-colors truncate">{userName.split(' ')[0]}</span>
          <span className="text-slate-400 text-xs ml-auto">{dropdownOpen ? '▴' : '▾'}</span>
        </button>
        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute left-0 top-12 w-52 bg-[#F2F2F2] rounded-2xl shadow-2xl border border-white/20 overflow-hidden py-2 z-20">
              {[
                { label: 'Minha conta', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                { label: 'Carreira',    action: () => { navigate('/carreira'); setDropdownOpen(false); } },
                { label: 'Favoritos',   action: () => { navigate('/favoritos'); setDropdownOpen(false); } },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  className="block w-full text-left px-6 py-3.5 text-[#00263B] font-bold text-sm hover:bg-white/60 transition-colors">
                  {label}
                </button>
              ))}
              <div className="mx-6 h-px bg-slate-300/30" />
              <button onClick={() => {
                  ['biscoite_auth','biscoite_access_token','biscoite_refresh_token','biscoite_logged_user']
                    .forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
                  navigate('/login');
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-6 py-4 text-[#F27474] font-bold text-sm hover:bg-red-50 transition-colors">
                Log out
              </button>
            </div>
          </>
        )}
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setActiveView(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${
              activeView === id ? 'bg-[#E2F0FF] text-[#4A72B2]' : 'text-slate-400 hover:bg-slate-50 hover:text-[#00263B]'
            }`}>
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{badge}</span>
            )}
          </button>
        ))}
      </nav>

      <button onClick={() => navigate('/')}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-[#00263B] transition-all">
        <Home size={16} /> Ir para Home
      </button>
      <button onClick={() => navigate('/configuracoes')}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-[#00263B] transition-all">
        <Settings size={16} /> Configurações
      </button>
      <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
        <Trash2 size={16} /> Lixeira
      </button>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: OVERVIEW — totalmente interativo
// ═══════════════════════════════════════════════════════════════════════════
function OverviewView({ onNewComm }) {
  // ── filtros ──
  const [period, setPeriod] = useState('semana');
  const [filterOpen, setFilterOpen] = useState(false);
  const [engMode, setEngMode] = useState('modulo');
  const [hoveredBar, setHoveredBar] = useState(null);

  // ── modais ──
  const [contactStudent, setContactStudent] = useState(null);
  const [activeDuvida, setActiveDuvida] = useState(null);
  const [notifType, setNotifType] = useState(null);
  const [toast, setToast] = useState(null);

  // ── dúvidas ──
  const [duvidas, setDuvidas] = useState([
    { id: 1, aluno: 'João Silva',    aula: 'Dúvida na Aula de Precificação', tempo: '5 min atrás',  texto: 'Professor, não entendi o cálculo de precificação da aula 3. Como funciona a margem?' },
    { id: 2, aluno: 'Ana Lima',      aula: 'Dúvida na Aula de Operação',    tempo: '8 min atrás',  texto: 'Como faço para operar a máquina no modo manual?' },
    { id: 3, aluno: 'Carlos Matos',  aula: 'Dúvida sobre o Quiz',           tempo: '12 min atrás', texto: 'A questão 3 do quiz parece ter duas respostas corretas.' },
    { id: 4, aluno: 'Pedro Costa',   aula: 'Dúvida na Aula de Vendas',      tempo: '1h atrás',     texto: 'Qual a diferença entre venda ativa e receptiva?' },
  ]);

  // ── métricas por período ──
  const METRICS = {
    hoje:      { conclusao: 72, nota: 4.6, ativos: 23,   dias: 22, feedbacks: 45,   crescimento: '+2%' },
    semana:    { conclusao: 78, nota: 4.8, ativos: 154,  dias: 24, feedbacks: 890,  crescimento: '+8%' },
    mes:       { conclusao: 81, nota: 4.9, ativos: 892,  dias: 21, feedbacks: 3240, crescimento: '+15%' },
    trimestre: { conclusao: 79, nota: 4.7, ativos: 2341, dias: 25, feedbacks: 8970, crescimento: '+22%' },
  };
  const PERIOD_LABELS = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mês', trimestre: 'Este trimestre' };
  const m = METRICS[period];

  const ratingBars = [
    { stars: 5, count: Math.round(m.feedbacks * 0.72) },
    { stars: 4, count: Math.round(m.feedbacks * 0.13) },
    { stars: 3, count: Math.round(m.feedbacks * 0.06) },
    { stars: 2, count: Math.round(m.feedbacks * 0.02) },
    { stars: 1, count: 0 },
  ];

  // ── dados de engajamento por modo ──
  const ENG_DATA = {
    modulo: [
      { label: 'Módulo 1 — Intro',    value: 80, color: 'bg-[#4A72B2]' },
      { label: 'Módulo 2 — Operações', value: 55, color: 'bg-[#6385B7]' },
      { label: 'Módulo 3 — Vendas',    value: 30, color: 'bg-[#b9d2eb]' },
    ],
    curso: [
      { label: 'Marketing Digital',   value: 80, color: 'bg-[#4A72B2]' },
      { label: 'Vendas em Quiosques', value: 55, color: 'bg-[#6385B7]' },
      { label: 'Operação Máquinas',   value: 30, color: 'bg-[#b9d2eb]' },
    ],
  };
  const barData = ENG_DATA[engMode];

  const atRisk = [
    { name: 'Maria Souza', info: 'Sem acesso há 14 dias', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
    { name: 'João Gomes',  info: 'Parou há 3 dias · Fora do Prazo', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
  ];

  // barras de onde alunos param — pico na posição 7
  const stopBars = [40,70,55,90,60,85,45,30,50,65,80,35,55,70,40,60,75,50,45,65,30,55,80,45,60,70,40,55];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resolveDoubt = (id) => {
    setDuvidas(prev => prev.filter(d => d.id !== id));
    showToast('Dúvida marcada como resolvida');
  };

  return (
    <div className="space-y-8">
      {/* ── Controle de Live ── */}
      <LiveControl />

      {/* ── Cabeçalho com filtro de período ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-400">Visão geral · <span className="text-[#4A72B2]">{PERIOD_LABELS[period]}</span></p>
        <div className="relative">
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-500 hover:border-[#4A72B2] hover:text-[#4A72B2] transition-all">
            <Filter size={12} /> {PERIOD_LABELS[period]}
            {filterOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 min-w-[160px]">
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => { setPeriod(key); setFilterOpen(false); }}
                    className={`w-full text-left px-5 py-2.5 text-xs font-black transition-colors ${period === key ? 'text-[#4A72B2] bg-[#E2F0FF]' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ROW 1: 4 métricas */}
      <div className="grid grid-cols-4 gap-5">

        {/* Taxa de Conclusão */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4 hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Conclusão</p>
          <div className="flex justify-center">
            <CircularProgress value={m.conclusao} size={90} stroke={8} />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-[10px] text-slate-400 font-medium">76% média da plataforma</p>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${m.conclusao >= 76 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {m.conclusao >= 76 ? <TrendingUp size={9} /> : <AlertTriangle size={9} />}
              {m.conclusao >= 76 ? 'Acima da média' : 'Abaixo da média'}
            </div>
          </div>
        </div>

        {/* Nota Média */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota Média de Avaliação</p>
          <div className="flex items-center gap-2">
            <Stars count={m.nota} size={14} />
            <span className="text-2xl font-black text-[#00263B]">{m.nota}</span>
          </div>
          <p className="text-[9px] text-slate-300 font-semibold">Baseado em {m.feedbacks.toLocaleString('pt-BR')} feedbacks</p>
          <div className="space-y-1.5 mt-2">
            {ratingBars.map(b => <RatingBar key={b.stars} stars={b.stars} count={b.count} max={ratingBars[0].count || 1} />)}
          </div>
        </div>

        {/* Desempenho em Testes */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desempenho em Testes</p>
          <div className="flex items-end gap-1.5 h-20 mt-2">
            {barData.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group cursor-pointer"
                onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                <div className={`w-full rounded-t-lg transition-all duration-300 ${b.color} ${hoveredBar === i ? 'opacity-100 scale-y-105' : 'opacity-80'}`}
                  style={{ height: `${b.value}%` }} />
                {hoveredBar === i && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#00263B] text-white text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-10">
                    {b.value}%
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {barData.map((b, i) => (
              <span key={i} className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${b.color}`} />{b.label.split(' ')[0]}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-orange-50 rounded-xl px-3 py-2">
            <AlertTriangle size={11} className="text-orange-400 flex-shrink-0" />
            <p className="text-[9px] font-bold text-orange-500">Módulo 2 precisa de atenção.</p>
          </div>
        </div>

        {/* Tempo Médio de Conclusão */}
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 hover:shadow-md transition-shadow">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo Médio de Conclusão</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 bg-[#E2F0FF] rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart2 size={18} className="text-[#4A72B2]" />
            </div>
            <p className="text-4xl font-black text-[#00263B]">{m.dias} <span className="text-lg">dias</span></p>
          </div>
          <p className="text-[9px] text-slate-400 font-semibold">Média de todas as turmas</p>
          <div className="flex items-center gap-1 bg-emerald-50 rounded-xl px-3 py-2">
            <TrendingUp size={11} className="text-emerald-500 flex-shrink-0" />
            <p className="text-[9px] font-bold text-emerald-600">Crescimento {m.crescimento} vs. período anterior</p>
          </div>
        </div>
      </div>

      {/* ROW 2: Engajamento */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-black text-[#00263B]">Engajamento</h3>
          <div className="flex gap-2">
            {['modulo', 'curso'].map(mode => (
              <button key={mode} onClick={() => setEngMode(mode)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${engMode === mode ? 'bg-[#4A72B2] text-white' : 'border border-slate-200 text-slate-400 hover:border-[#4A72B2] hover:text-[#4A72B2]'}`}>
                {mode === 'modulo' ? 'Por módulo' : 'Por curso'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Alunos ativos */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos Ativos Agora</p>
            <div className="flex items-center gap-3">
              <p className="text-5xl font-black text-[#00263B]">{m.ativos.toLocaleString('pt-BR')}</p>
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-400 font-medium">Fazendo cursos com você agora</p>
            </div>
          </div>

          {/* Onde os alunos param */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onde os Alunos Param</p>
            <div className="flex items-end gap-0.5 h-16 mt-2">
              {stopBars.map((h, i) => (
                <div key={i}
                  className={`flex-1 rounded-sm cursor-pointer transition-all ${i === 7 ? 'bg-red-400' : 'bg-[#b9d2eb] hover:bg-[#4A72B2]'}`}
                  style={{ height: `${h}%` }}
                  title={`Minuto ${(i * 1.5).toFixed(1)} — ${h}% saíram`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <p className="text-[9px] font-bold text-red-400">Minuto 10:30 — Grande queda de retenção</p>
            </div>
          </div>

          {/* Alerta de risco */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos em Risco</p>
              <Bell size={14} className="text-slate-300" />
            </div>
            <div className="space-y-3">
              {atRisk.map((a, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <img src={a.avatar} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt={a.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#00263B] truncate">{a.name}</p>
                    <p className="text-[9px] text-orange-400 font-semibold truncate">{a.info}</p>
                  </div>
                  <button onClick={() => setContactStudent(a)}
                    className="flex-shrink-0 px-3 py-1 bg-[#4A72B2] text-white text-[9px] font-black rounded-lg hover:bg-[#00263B] transition-all">
                    Contatar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Gestão de Interação */}
      <div>
        <h3 className="text-base font-black text-[#00263B] mb-4">Gestão de Interação</h3>
        <div className="grid grid-cols-4 gap-5">

          {/* Fila de dúvidas */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fila de Dúvidas</p>
              {duvidas.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{duvidas.length}</span>
              )}
            </div>
            {duvidas.length === 0 ? (
              <div className="text-center py-4">
                <Check size={24} className="text-emerald-400 mx-auto mb-1" />
                <p className="text-[10px] text-slate-400 font-bold">Todas resolvidas!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {duvidas.slice(0, 4).map(d => (
                  <div key={d.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded-xl hover:bg-[#E2F0FF] transition-colors cursor-pointer"
                    onClick={() => setActiveDuvida(d)}>
                    <MessageSquare size={12} className="text-[#4A72B2] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-[#00263B] truncate">{d.aluno} — {d.aula}</p>
                      <p className="text-[8px] text-slate-300">{d.tempo}</p>
                    </div>
                    <button className="text-[8px] font-black text-[#4A72B2] flex-shrink-0 hover:underline">Abrir</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nível de Absorção */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-5 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Absorção</p>
            <div className="flex items-end gap-3 h-20">
              {[{ label: 'Franqueado', pct: 60, color: 'bg-[#b9d2eb]' }, { label: 'Funcionário', pct: 85, color: 'bg-[#4A72B2]' }].map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                  <div className="relative w-full">
                    <span className="absolute -top-5 w-full text-center text-[9px] font-black text-[#00263B] opacity-0 group-hover:opacity-100 transition-opacity">{b.pct}%</span>
                    <div className={`w-full ${b.color} rounded-t-lg transition-all`} style={{ height: `${b.pct * 0.8}px` }} />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400">{b.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 font-medium">Comparativo entre perfis</p>
          </div>

          {/* Notificar Alunos */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-5 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notificações</p>
            <button onClick={() => setNotifType('pendentes')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#4A72B2] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00263B] transition-all">
              <Bell size={13} /> Notificar Pendentes
            </button>
            <div className="space-y-2">
              <button onClick={() => setNotifType('push')}
                className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-500 hover:bg-[#E2F0FF] hover:text-[#4A72B2] transition-all">
                <Zap size={11} className="text-[#4A72B2]" /> Push / E-mail de Lançamento
              </button>
              <button onClick={() => setNotifType('avisos')}
                className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-500 hover:bg-[#E2F0FF] hover:text-[#4A72B2] transition-all">
                <Mail size={11} className="text-[#4A72B2]" /> Disparar Aviso de Atualização
              </button>
            </div>
          </div>

          {/* Exportação */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-5 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exportação para RH</p>
            <div className="space-y-2">
              <button onClick={() => showToast('PDF gerado com sucesso!')}
                className="w-full flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                <FileText size={13} className="text-red-400" /> Gerar PDF
              </button>
              <button onClick={() => showToast('Excel exportado com sucesso!')}
                className="w-full flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                <Download size={13} className="text-emerald-500" /> Gerar Excel
              </button>
            </div>
            <button onClick={() => showToast('Relatório de crescimento enviado para a Diretoria!')}
              className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-300 hover:border-[#4A72B2] hover:text-[#4A72B2] transition-all">
              Enviar para Diretoria
            </button>
          </div>
        </div>
      </div>

      {/* ── Modais ── */}
      {contactStudent && (
        <ContactModal student={contactStudent} onClose={() => setContactStudent(null)}
          onSent={() => { showToast(`Mensagem enviada para ${contactStudent.name}`); onNewComm(); }} />
      )}
      {activeDuvida && (
        <DuvidaModal duvida={activeDuvida} onClose={() => setActiveDuvida(null)} onResolve={resolveDoubt} />
      )}
      {notifType && (
        <NotifModal type={notifType} onClose={() => setNotifType(null)}
          onSent={({ titulo }) => { showToast(`"${titulo}" disparado com sucesso!`); onNewComm(); }} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: MEUS CURSOS — componentes auxiliares
// ═══════════════════════════════════════════════════════════════════════════
const CATS  = ['Operações','Vendas','Gestão','Marketing','IA','Franquias','Business'];
const LVLS  = ['Iniciante','Intermediário','Avançado'];
const FMTS  = ['Vídeo','Híbrido','Presencial'];
const L_TYPES = ['video','documento','quiz','ao vivo'];
const CAT_COLORS = {
  'Operações':'bg-emerald-100 text-emerald-700','Vendas':'bg-blue-100 text-blue-700',
  'Gestão':'bg-purple-100 text-purple-700','Marketing':'bg-orange-100 text-orange-700',
  'IA':'bg-pink-100 text-pink-700','Franquias':'bg-teal-100 text-teal-700','Business':'bg-cyan-100 text-cyan-700',
};
const KANBAN_COLORS = [
  'bg-purple-100 text-purple-700 border-purple-200','bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200','bg-pink-100 text-pink-700 border-pink-200',
  'bg-blue-100 text-blue-700 border-blue-200','bg-emerald-100 text-emerald-700 border-emerald-200',
];

function FieldInput({ label, value, onChange, placeholder, maxLength = 200, type = 'text', required = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value.slice(0, maxLength))} placeholder={placeholder} rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] resize-none font-medium placeholder-slate-300" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value.slice(0, maxLength))} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
      )}
    </div>
  );
}
function FieldSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function extractYouTubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function CourseFormModal({ initial, onSave, onClose, systemRole }) {
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    description: initial?.description || '',
    category:    initial?.category    || 'Operações',
    level:       initial?.level       || 'Iniciante',
    format:      initial?.format      || 'Vídeo',
    duration:    initial?.duration    || '',
    published:   initial?.published   ?? false,
    thumbnail:   initial?.thumbnail   || initial?.thumbnail_url || null,
    vimeoId:     initial?.vimeoId     || initial?.vimeo_id     || null,
    instructor:  initial?.instructor  || initial?.instructor_name || '',
    visibility:  initial?.visibility  || ['aluno','gestor','professor','admin'], // quem pode ver
  });
  const thumbInputRef = useRef(null);
  const isEdit = Boolean(initial?.id);

  const handleThumbFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, thumbnail: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#001A26] text-lg">{isEdit ? 'Editar curso' : 'Novo curso'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><X size={16} /></button>
        </div>

        {/* ── THUMBNAIL ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thumbnail / Capa do curso</label>
          <div
            onClick={() => thumbInputRef.current.click()}
            className="relative w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4A72B2] transition-colors cursor-pointer overflow-hidden group bg-slate-50"
          >
            {form.thumbnail ? (
              <>
                <img
                  src={form.thumbnail}
                  className="w-full h-full object-cover"
                  alt="thumbnail"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-full text-xs font-black text-[#001A26] shadow-lg">
                    <ImageIcon size={14} /> Trocar imagem
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <ImageIcon size={26} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-500">Clique para enviar a thumbnail</p>
                  <p className="text-[11px] text-slate-400 mt-1">JPG, PNG · Recomendado 16:9</p>
                </div>
              </div>
            )}
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
          </div>
          {form.thumbnail && (
            <button
              onClick={() => setForm(p => ({ ...p, thumbnail: null }))}
              className="text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-1"
            >
              <X size={11} /> Remover thumbnail customizada
            </button>
          )}

        </div>

        {/* ── VÍDEO (Vimeo) ── */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vídeo do curso</label>
          <VimeoUploader
            value={form.vimeoId}
            onChange={(id) => setForm(p => ({ ...p, vimeoId: id }))}
            courseTitle={form.title}
            courseDesc={form.description}
          />
        </div>

        <div className="border-t border-slate-100" />

        {/* ── METADADOS ── */}
        <FieldInput label="Título *" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Ex: Fase 2 - Intermediário" maxLength={100} required />
        <FieldInput label="Descrição" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Breve descrição do curso..." maxLength={500} type="textarea" />
        <div className="grid grid-cols-2 gap-4">
          <FieldSelect label="Categoria"  value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))}  options={CATS} />
          <FieldSelect label="Nível"      value={form.level}    onChange={v => setForm(p => ({ ...p, level: v }))}      options={LVLS} />
          <FieldSelect label="Formato"    value={form.format}   onChange={v => setForm(p => ({ ...p, format: v }))}     options={FMTS} />
          <FieldInput  label="Duração"    value={form.duration} onChange={v => setForm(p => ({ ...p, duration: v }))}   placeholder="Ex: 2h 30min" maxLength={20} />
        </div>
        {systemRole === 'admin' && (
          <FieldInput label="Instrutor" value={form.instructor} onChange={v => setForm(p => ({ ...p, instructor: v }))} placeholder="Nome do instrutor" maxLength={60} />
        )}
        {/* ── VISIBILIDADE POR PERFIL ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visível para</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'aluno',     label: 'Colaboradores', color: 'bg-slate-100 text-slate-600 border-slate-200' },
              { value: 'gestor',    label: 'Gestores',      color: 'bg-teal-100 text-teal-700 border-teal-200' },
              { value: 'professor', label: 'Professores',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { value: 'admin',     label: 'Admins',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
            ].map(({ value, label, color }) => {
              const active = form.visibility.includes(value);
              return (
                <button key={value} type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    visibility: active
                      ? p.visibility.filter(v => v !== value)
                      : [...p.visibility, value],
                  }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
                    active ? color : 'bg-white text-slate-300 border-slate-200 opacity-50'
                  }`}>
                  {active ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400">Selecione quais perfis podem visualizar este curso.</p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setForm(p => ({ ...p, published: !p.published }))}
            className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${form.published ? 'bg-[#4A72B2]' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-black text-[#001A26]">Publicar imediatamente</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
          <button
            onClick={() => { if (!form.title.trim()) return; onSave(form); onClose(); }}
            disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-xl bg-[#001A26] hover:bg-[#4A72B2] text-white font-black text-xs transition-colors disabled:opacity-40"
          >
            {isEdit ? 'Salvar alterações' : 'Criar curso'}
          </button>
        </div>
      </div>
    </div>
  );
}
function CourseDeleteModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="font-black text-[#001A26] text-sm leading-snug">{message}</p>
            <p className="text-slate-400 text-xs mt-1">Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs">Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICADOS — sub-tab do Meus Cursos
// ═══════════════════════════════════════════════════════════════════════════
const CERT_AREAS = ['Operações','Vendas','Gestão','Marketing','IA','Franquias','Business'];
const CERT_DURATIONS = ['Curta duração','Média duração','Longa duração'];
const CERT_BG_COLORS = ['#001A26','#7C3AED','#0F766E','#C2410C','#1D4ED8','#15803D'];
const CERT_ACCENT_COLORS = ['#4A72B2','#F59E0B','#34D399','#FB923C','#60A5FA','#86EFAC'];
const AREA_BADGE = {
  'Operações':'bg-emerald-100 text-emerald-700','Vendas':'bg-blue-100 text-blue-700',
  'Gestão':'bg-purple-100 text-purple-700','Marketing':'bg-orange-100 text-orange-700',
  'IA':'bg-pink-100 text-pink-700','Franquias':'bg-teal-100 text-teal-700','Business':'bg-cyan-100 text-cyan-700',
};

function CertPreview({ cert }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ background: cert.bgColor || '#001A26' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${cert.accentColor || '#4A72B2'}` }}>
        <div className="flex items-center gap-2">
          <Award size={16} style={{ color: cert.accentColor || '#4A72B2' }} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Universidade Biscoitê</span>
        </div>
        <span className="text-[8px] text-white/50 font-semibold">{cert.createdAt || ''}</span>
      </div>
      <div className="px-5 py-5 space-y-2">
        <p className="text-[9px] text-white/60 font-semibold uppercase tracking-widest">Certificado de Conclusão</p>
        <p className="text-sm font-black text-white leading-tight">{cert.title || 'Título do certificado'}</p>
        <p className="text-[9px] text-white/50 leading-relaxed line-clamp-2">{cert.description || 'Descrição do certificado...'}</p>
      </div>
      <div className="px-5 py-3 flex items-center justify-between border-t border-white/10">
        <div className="flex gap-1 flex-wrap">
          {(cert.tags || []).slice(0, 2).map(t => (
            <span key={t} className="text-[7px] font-black px-2 py-0.5 rounded-full text-white/70 border border-white/20">{t}</span>
          ))}
        </div>
        <span className="text-[8px] font-black" style={{ color: cert.accentColor || '#4A72B2' }}>{cert.instructorName || 'Professor'}</span>
      </div>
    </div>
  );
}

function CertTemplateModal({ initial, courses, onSave, onClose }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    area: initial?.area || 'Operações',
    tags: initial?.tags?.join(', ') || '',
    duration: initial?.duration || 'Curta duração',
    courseId: initial?.courseId || '',
    instructorName: initial?.instructorName || 'Karla Madeira',
    bgColor: initial?.bgColor || '#001A26',
    accentColor: initial?.accentColor || '#4A72B2',
    published: initial?.published ?? true,
  });
  const isEdit = Boolean(initial?.id);
  const previewCert = {
    ...form,
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    createdAt: initial?.createdAt || 'Abr 2026',
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-[#001A26] text-lg">{isEdit ? 'Editar Certificado' : 'Novo Certificado'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value.slice(0, 120) }))}
                placeholder="Certificado de Conclusão — Curso X"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value.slice(0, 500) }))}
                placeholder="Certifica que o aluno concluiu..." rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium resize-none placeholder-slate-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Área</label>
                <select value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                  {CERT_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração</label>
                <select value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                  {CERT_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Curso vinculado</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: Number(e.target.value) || '' }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                <option value="">Nenhum (manual)</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags (vírgula)</label>
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="operações, básico, biscoitê"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do instrutor</label>
              <input value={form.instructorName} onChange={e => setForm(p => ({ ...p, instructorName: e.target.value.slice(0, 60) }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor fundo</label>
                <div className="flex gap-2 flex-wrap">
                  {CERT_BG_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, bgColor: c }))}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${form.bgColor === c ? 'border-[#4A72B2] scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor destaque</label>
                <div className="flex gap-2 flex-wrap">
                  {CERT_ACCENT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, accentColor: c }))}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${form.accentColor === c ? 'border-[#001A26] scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${form.published ? 'bg-[#4A72B2]' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm font-black text-[#001A26]">Publicar (visível para alunos)</span>
            </label>
          </div>
          {/* Preview */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pré-visualização</p>
            <CertPreview cert={previewCert} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
          <button onClick={() => {
            if (!form.title.trim()) return;
            onSave({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
            onClose();
          }} disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-xl bg-[#001A26] hover:bg-[#4A72B2] text-white font-black text-xs transition-all disabled:opacity-40">
            {isEdit ? 'Salvar alterações' : 'Criar certificado'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueModal({ template, users, issuedCerts, onIssue, onClose }) {
  const [selUserId, setSelUserId] = useState('');
  const [stars, setStars] = useState(5);
  const [issued, setIssued] = useState(false);
  const eligible = users.filter(u => u.systemRole === 'aluno' || u.systemRole === 'franqueado');
  const alreadyIssued = issuedCerts.filter(ic => ic.templateId === template.id);
  const alreadyIds = new Set(alreadyIssued.map(ic => ic.userId));
  const handleIssue = () => {
    if (!selUserId) return;
    const u = users.find(u => u.id === Number(selUserId));
    onIssue(template.id, Number(selUserId), u?.name || '', u?.systemRole || 'aluno', stars);
    setIssued(true);
    setTimeout(() => { setIssued(false); setSelUserId(''); }, 1500);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] p-7 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-[#001A26] text-sm">{template.title}</p>
            <p className="text-[10px] text-slate-400 font-medium">Emitir certificado para aluno/franqueado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><X size={16} /></button>
        </div>
        {issued ? (
          <div className="flex flex-col items-center gap-2 py-6 text-emerald-500">
            <Check size={32} /><p className="font-black text-sm">Certificado emitido!</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecionar aluno/franqueado</label>
              <select value={selUserId} onChange={e => setSelUserId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                <option value="">Escolha um usuário...</option>
                {eligible.map(u => (
                  <option key={u.id} value={u.id} disabled={alreadyIds.has(u.id)}>
                    {u.name} ({u.systemRole}){alreadyIds.has(u.id) ? ' ✓ já emitido' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avaliação</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setStars(s)}>
                    <Star size={20} className={s <= stars ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
            {alreadyIssued.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Já emitido para</p>
                {alreadyIssued.map(ic => (
                  <div key={ic.id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-xs font-black text-emerald-700">{ic.userName}</span>
                    <span className="text-[9px] text-emerald-500 font-medium">{ic.issuedAt}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs hover:bg-slate-50">Cancelar</button>
              <button onClick={handleIssue} disabled={!selUserId}
                className="flex-1 py-3 rounded-xl bg-[#4A72B2] hover:bg-[#001A26] text-white font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                <Award size={13} /> Emitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CertificadosSubTab({ certTemplates, addCertTemplate, updateCertTemplate, deleteCertTemplate, issuedCerts, issueCertificate, revokeIssuedCert, courses, users, systemRole }) {
  const [modal, setModal] = useState(null); // null | 'add' | template obj
  const [issueModal, setIssueModal] = useState(null); // null | template obj
  const [confirmDel, setConfirmDel] = useState(null);

  const myCerts = systemRole === 'professor'
    ? certTemplates.filter(t => t.instructorId === CURRENT_INSTRUCTOR_ID)
    : certTemplates;

  return (
    <div className="space-y-6">
      {modal && (
        <CertTemplateModal
          initial={modal === 'add' ? null : modal}
          courses={courses}
          onSave={(data) => modal === 'add' ? addCertTemplate(data) : updateCertTemplate(modal.id, data)}
          onClose={() => setModal(null)}
        />
      )}
      {issueModal && (
        <IssueModal
          template={issueModal}
          users={users}
          issuedCerts={issuedCerts}
          onIssue={issueCertificate}
          onClose={() => setIssueModal(null)}
        />
      )}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-black text-[#001A26] text-sm">Excluir certificado?</p>
                <p className="text-slate-400 text-xs mt-1">Todos os certificados emitidos deste modelo também serão removidos.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
              <button onClick={() => { deleteCertTemplate(confirmDel); setConfirmDel(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-[#00263B]">Modelos de Certificado</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Crie e gerencie os certificados que serão emitidos para alunos e franqueados</p>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00263B] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all">
          <Plus size={14} /> Novo certificado
        </button>
      </div>

      {myCerts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-medium text-sm">
          Nenhum certificado criado ainda. Clique em "Novo certificado" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {myCerts.map(tmpl => {
            const issued = issuedCerts.filter(ic => ic.templateId === tmpl.id);
            return (
              <div key={tmpl.id} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-5">
                  <CertPreview cert={tmpl} />
                </div>
                <div className="px-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${AREA_BADGE[tmpl.area] || 'bg-slate-100 text-slate-600'}`}>{tmpl.area}</span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${tmpl.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tmpl.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                    <Award size={10} className="text-[#4A72B2]" />
                    <span>{issued.length} emitido{issued.length !== 1 ? 's' : ''}</span>
                    {tmpl.courseId && courses.find(c => c.id === tmpl.courseId) && (
                      <span className="ml-1">· {courses.find(c => c.id === tmpl.courseId)?.title}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIssueModal(tmpl)}
                      className="flex-1 py-2 rounded-xl bg-[#4A72B2] hover:bg-[#001A26] text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all">
                      <Award size={11} /> Emitir
                    </button>
                    <button onClick={() => setModal(tmpl)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDel(tmpl.id)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de emissões */}
      {issuedCerts.length > 0 && (
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-black text-[#00263B]">Histórico de Emissões</h4>
          <div className="space-y-2">
            {issuedCerts.map(ic => {
              const tmpl = certTemplates.find(t => t.id === ic.templateId);
              return (
                <div key={ic.id} className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-[#E2F0FF] flex items-center justify-center shrink-0">
                    <Award size={14} className="text-[#4A72B2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#001A26] truncate">{ic.userName}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate">{tmpl?.title || '—'}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= ic.stars ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />)}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium shrink-0">{ic.issuedAt}</span>
                  <button onClick={() => revokeIssuedCert(ic.id)} title="Revogar"
                    className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-colors">
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: MEUS CURSOS
// ═══════════════════════════════════════════════════════════════════════════
function MeusCursosView() {
  const {
    courses, modules, systemRole,
    addCourse, updateCourse, deleteCourse,
    addModule, updateModule, deleteModule, addLesson, updateLesson, deleteLesson,
    certTemplates, addCertTemplate, updateCertTemplate, deleteCertTemplate,
    issuedCerts, issueCertificate, revokeIssuedCert,
    users,
  } = useProfile();

  const [mainTab, setMainTab] = useState('gerenciamento');
  const [subTab, setSubTab] = useState('cursos');

  // ── Course CRUD state ──
  const [courseModal, setCourseModal] = useState(null);
  const [confirmDelCourse, setConfirmDelCourse] = useState(null);
  const [courseFilter, setCourseFilter] = useState('todos');

  // ── Module/Aula CRUD state ──
  const [selCourseId, setSelCourseId] = useState(null);
  const [expandedMod, setExpandedMod] = useState(null);
  const [newModTitle, setNewModTitle] = useState('');
  const [editingMod, setEditingMod] = useState(null);
  const [editModTitle, setEditModTitle] = useState('');
  const [newLesson, setNewLesson] = useState({ title: '', duration: '', type: 'video', vimeoId: null, visibility: ['aluno','gestor','professor','admin'] });
  const [uploadingLesson, setUploadingLesson] = useState(false);
  const [addingLessonTo, setAddingLessonTo] = useState(null);
  const [confirmDelMod, setConfirmDelMod] = useState(null);

  // ── Kanban expand state ──
  const [expandedKanbanMod, setExpandedKanbanMod] = useState({});

  // ── Quiz state ──
  const [quizQuestions, setQuizQuestions] = useState([
    { id: 1, text: 'Questão 1 — Aula 1' },
    { id: 2, text: 'Questão 2 — Aula 2' },
    { id: 3, text: 'Questão 3 — Aula 1' },
  ]);
  const [quizSearch, setQuizSearch] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('Como funciona o processo de abertura de loja?');
  const [quizAlts, setQuizAlts] = useState(['Checklist e aprovação do gestor', 'Apenas a chave do caixa', 'Sinal de wi-fi ativo']);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [newAlt, setNewAlt] = useState('');

  const myCourses = systemRole === 'professor'
    ? courses.filter(c => c.instructorId === CURRENT_INSTRUCTOR_ID)
    : courses;

  const filteredCourses = courseFilter === 'todos' ? myCourses
    : courseFilter === 'publicado' ? myCourses.filter(c => c.published)
    : myCourses.filter(c => !c.published);

  const courseModules = selCourseId
    ? modules.filter(m => String(m.courseId) === String(selCourseId) || String(m.course_id) === String(selCourseId)).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const handleAddMod = () => {
    if (!newModTitle.trim() || !selCourseId) return;
    addModule(selCourseId, newModTitle);
    setNewModTitle('');
  };

  const handleAddLesson = (moduleId) => {
    if (!newLesson.title.trim()) return;
    addLesson(moduleId, newLesson);
    setNewLesson({ title: '', duration: '', type: 'video', vimeoId: null, visibility: ['aluno','gestor','professor','admin'] });
    setAddingLessonTo(null);
  };

  const quizFiltered = quizQuestions.filter(q =>
    q.text.toLowerCase().includes(quizSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Modals */}
      {courseModal && (
        <CourseFormModal
          initial={courseModal === 'add' ? null : courseModal}
          systemRole={systemRole}
          onSave={(data) => courseModal === 'add' ? addCourse(data) : updateCourse(courseModal.id, data)}
          onClose={() => setCourseModal(null)}
        />
      )}
      {confirmDelCourse && (
        <CourseDeleteModal
          message="Tem certeza que deseja excluir este curso e todos os seus módulos?"
          onConfirm={() => { deleteCourse(confirmDelCourse); setConfirmDelCourse(null); }}
          onCancel={() => setConfirmDelCourse(null)}
        />
      )}
      {confirmDelMod && (
        <CourseDeleteModal
          message="Tem certeza que deseja excluir este módulo e todas as suas aulas?"
          onConfirm={() => { deleteModule(confirmDelMod); setConfirmDelMod(null); }}
          onCancel={() => setConfirmDelMod(null)}
        />
      )}

      {/* ── Main tabs ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-0">
        <div className="flex gap-6">
          {[['gerenciamento','Gerenciamento de Cursos'],['relatorios','Relatórios']].map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)}
              className={`pb-3 text-sm font-black transition-all border-b-2 -mb-px ${
                mainTab === id ? 'text-[#00263B] border-[#4A72B2]' : 'text-slate-400 border-transparent hover:text-[#00263B]'
              }`}>{label}</button>
          ))}
        </div>
        {mainTab === 'gerenciamento' && subTab === 'cursos' && (
          <button onClick={() => setCourseModal('add')}
            className="flex-shrink-0 mb-1 flex items-center gap-2 px-5 py-2.5 bg-[#00263B] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all">
            <Plus size={14} /> Novo curso
          </button>
        )}
        {mainTab === 'gerenciamento' && subTab === 'modulos' && selCourseId && (
          <button onClick={() => { if (!newModTitle.trim()) return; handleAddMod(); }}
            className="flex-shrink-0 mb-1 flex items-center gap-2 px-5 py-2.5 bg-[#00263B] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all opacity-40 cursor-default">
            <Plus size={14} /> Módulo
          </button>
        )}
      </div>

      {/* ── Gerenciamento ── */}
      {mainTab === 'gerenciamento' && (
        <div className="space-y-8">

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
            {[
              ['kanban',       <Layers size={13} />,      'Estrutura Visual'],
              ['cursos',       <BookOpen size={13} />,    'Lista de Cursos'],
              ['modulos',      <FileText size={13} />,    'Módulos & Aulas'],
              ['certificados', <Download size={13} />,    'Certificados'],
            ].map(([id, icon, label]) => (
              <button key={id} onClick={() => setSubTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  subTab === id ? 'bg-white text-[#00263B] shadow-sm' : 'text-slate-400 hover:text-[#00263B]'
                }`}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ── SUB-TAB: Estrutura Visual (Kanban) ── */}
          {subTab === 'kanban' && (
            <div>
              {myCourses.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium text-sm">
                  Nenhum curso criado ainda.
                  <button onClick={() => setSubTab('cursos')} className="ml-2 text-[#4A72B2] font-black underline">Criar agora</button>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {myCourses.map((course, ci) => {
                    const cMods = modules.filter(m => String(m.courseId || m.course_id) === String(course.id)).sort((a, b) => (a.order || 0) - (b.order || 0));
                    const color = KANBAN_COLORS[ci % KANBAN_COLORS.length];
                    return (
                      <div key={course.id} className="min-w-[220px] max-w-[220px] bg-white rounded-[20px] border border-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border truncate max-w-[130px] ${color}`}>{course.title}</span>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setCourseModal(course)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-[#4A72B2]"><Pencil size={11} /></button>
                            <button onClick={() => { setSelCourseId(course.id); setSubTab('modulos'); }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-[#4A72B2]"><Plus size={11} /></button>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                          {cMods.length === 0 && (
                            <p className="text-center text-[9px] text-slate-300 font-medium py-4">Sem módulos</p>
                          )}
                          {cMods.map(mod => {
                            const key = `${course.id}-${mod.id}`;
                            const isOpen = !!expandedKanbanMod[key];
                            return (
                              <div key={mod.id}>
                                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 cursor-pointer hover:bg-[#f0f6ff]"
                                  onClick={() => setExpandedKanbanMod(p => ({ ...p, [key]: !p[key] }))}>
                                  <GripVertical size={9} className="text-slate-300 shrink-0" />
                                  {isOpen ? <ChevronDown size={9} className="text-slate-400 shrink-0" /> : <ChevronRight size={9} className="text-slate-400 shrink-0" />}
                                  <span className="text-[9px] font-black text-[#00263B] flex-1 truncate">{mod.title}</span>
                                  <span className="text-[8px] text-slate-300 shrink-0">{mod.lessons.length}</span>
                                </div>
                                {isOpen && mod.lessons.map(lesson => (
                                  <div key={lesson.id} className="flex items-center gap-1.5 px-4 py-2 hover:bg-slate-50">
                                    <FileText size={8} className="text-[#4A72B2] shrink-0" />
                                    <span className="text-[9px] font-medium text-slate-500 flex-1 truncate">{lesson.title}</span>
                                    <span className="text-[8px] text-slate-300 shrink-0">{lesson.duration}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-3 py-2 border-t border-slate-50 flex items-center gap-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${course.published ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {course.published ? 'Publicado' : 'Rascunho'}
                          </span>
                          <span className="text-[8px] text-slate-300 ml-auto">{cMods.length} mód.</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB: Lista de Cursos ── */}
          {subTab === 'cursos' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {['todos','publicado','rascunho'].map(f => (
                  <button key={f} onClick={() => setCourseFilter(f)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      courseFilter === f ? 'bg-[#4A72B2] text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-[#4A72B2] hover:text-[#4A72B2]'
                    }`}>{f}
                  </button>
                ))}
              </div>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium text-sm">Nenhum curso encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {filteredCourses.map(course => (
                    <div key={course.id} className="bg-white rounded-2xl px-6 py-5 border border-slate-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[#001A26] text-sm truncate">{course.title}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CAT_COLORS[course.category] || 'bg-slate-100 text-slate-600'}`}>{course.category}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {course.published ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {course.instructor} · {course.level} · {course.duration} · {course.format}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateCourse(course.id, { published: !course.published })}
                          title={course.published ? 'Despublicar' : 'Publicar'}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                          {course.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setCourseModal(course)}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { setSelCourseId(course.id); setSubTab('modulos'); }}
                          title="Gerenciar módulos"
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                          <Layers size={14} />
                        </button>
                        <button onClick={() => setConfirmDelCourse(course.id)}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB: Módulos & Aulas ── */}
          {subTab === 'modulos' && (
            <div className="space-y-5">
              {/* Seletor de curso */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 max-w-xs space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o curso</label>
                  <select value={selCourseId || ''} onChange={e => { setSelCourseId(e.target.value || null); setExpandedMod(null); }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                    <option value="">Escolha um curso...</option>
                    {myCourses.map(c => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
                  </select>
                </div>
                {selCourseId && (
                  <div className="flex gap-2 flex-1">
                    <input value={newModTitle} onChange={e => setNewModTitle(e.target.value.slice(0, 100))}
                      placeholder="Nome do novo módulo..."
                      onKeyDown={e => e.key === 'Enter' && handleAddMod()}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                    <button onClick={handleAddMod} disabled={!newModTitle.trim()}
                      className="px-5 py-3 bg-[#00263B] hover:bg-[#4A72B2] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all disabled:opacity-40">
                      <Plus size={14} /> Módulo
                    </button>
                  </div>
                )}
              </div>

              {!selCourseId && (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  Selecione um curso para gerenciar os módulos.
                </div>
              )}

              {selCourseId && courseModules.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  Nenhum módulo ainda. Crie o primeiro acima.
                </div>
              )}

              {selCourseId && courseModules.length > 0 && (
                <div className="space-y-3">
                  {courseModules.map((mod, idx) => (
                    <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4">
                        <GripVertical size={14} className="text-slate-300 shrink-0" />
                        <span className="w-6 h-6 rounded-lg bg-[#e2eef9] text-[#4A72B2] text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        {editingMod === mod.id ? (
                          <input autoFocus value={editModTitle} onChange={e => setEditModTitle(e.target.value.slice(0, 100))}
                            onKeyDown={e => { if (e.key === 'Enter') { updateModule(mod.id, editModTitle); setEditingMod(null); } if (e.key === 'Escape') setEditingMod(null); }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#4A72B2] text-sm font-black text-[#001A26] outline-none" />
                        ) : (
                          <span className="flex-1 font-black text-[#001A26] text-sm">{mod.title}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{mod.lessons.length} aulas</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {editingMod === mod.id ? (
                            <>
                              <button onClick={() => { updateModule(mod.id, editModTitle); setEditingMod(null); }} className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100"><Check size={13} /></button>
                              <button onClick={() => setEditingMod(null)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100"><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingMod(mod.id); setEditModTitle(mod.title); }} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#e2eef9] hover:text-[#4A72B2] flex items-center justify-center"><Pencil size={12} /></button>
                              <button onClick={() => setConfirmDelMod(mod.id)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"><Trash2 size={12} /></button>
                            </>
                          )}
                          <button onClick={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                            {expandedMod === mod.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      {expandedMod === mod.id && (
                        <div className="border-t border-slate-50 px-5 py-4 space-y-3">
                          {mod.lessons.length === 0 && <p className="text-xs text-slate-400 font-medium">Nenhuma aula ainda.</p>}
                          {mod.lessons.map((lesson, li) => (
                            <div key={lesson.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                              <span className="text-[10px] font-bold text-slate-400 w-4">{li + 1}</span>
                              <span className="flex-1 text-sm font-medium text-[#001A26]">{lesson.title}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{lesson.duration}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-500">{lesson.type}</span>
                              <button onClick={() => deleteLesson(mod.id, lesson.id)} className="w-6 h-6 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 size={11} /></button>
                            </div>
                          ))}
                          {addingLessonTo === mod.id ? (
                            <div className="space-y-3 pt-2">
                              <div className="grid grid-cols-2 gap-3">
                                <input autoFocus type="text" placeholder="Título da aula" value={newLesson.title}
                                  onChange={e => setNewLesson(p => ({ ...p, title: e.target.value.slice(0, 100) }))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                                <input type="text" placeholder="Duração (ex: 10 min)" value={newLesson.duration}
                                  onChange={e => setNewLesson(p => ({ ...p, duration: e.target.value.slice(0, 20) }))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                              </div>
                              <div className="flex items-center gap-3">
                                <select value={newLesson.type} onChange={e => setNewLesson(p => ({ ...p, type: e.target.value }))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                                  {L_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="flex gap-2 ml-auto shrink-0">
                                  <button onClick={() => { setAddingLessonTo(null); setNewLesson({ title: '', duration: '', type: 'video', vimeoId: null, visibility: ['aluno','gestor','professor','admin'] }); }}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-500 hover:bg-slate-50">Cancelar</button>
                                  <button onClick={() => handleAddLesson(mod.id)} disabled={!newLesson.title.trim()}
                                    className="px-4 py-2 rounded-xl bg-[#001A26] hover:bg-[#4A72B2] text-white text-xs font-black transition-all disabled:opacity-40">Adicionar</button>
                                </div>
                              </div>
                              {/* Upload de vídeo Vimeo para a aula */}
                              <div className="mt-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vídeo da aula (opcional)</p>
                                <VimeoUploader
                                  value={newLesson.vimeoId}
                                  onChange={(id) => setNewLesson(p => ({ ...p, vimeoId: id }))}
                                  courseTitle={newLesson.title}
                                />
                              </div>
                              {/* Visibilidade da aula */}
                              <div className="mt-3 space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visível para</p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {[
                                    { value: 'aluno', label: 'Colaboradores' },
                                    { value: 'gestor', label: 'Gestores' },
                                    { value: 'professor', label: 'Professores' },
                                    { value: 'admin', label: 'Admins' },
                                  ].map(({ value, label }) => {
                                    const active = (newLesson.visibility || []).includes(value);
                                    return (
                                      <button key={value} type="button"
                                        onClick={() => setNewLesson(p => ({
                                          ...p,
                                          visibility: active
                                            ? (p.visibility || []).filter(v => v !== value)
                                            : [...(p.visibility || []), value],
                                        }))}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all ${
                                          active ? 'bg-[#4A72B2] text-white border-[#4A72B2]' : 'bg-white text-slate-300 border-slate-200'
                                        }`}>
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setAddingLessonTo(mod.id)} className="flex items-center gap-2 text-xs font-black text-[#4A72B2] hover:text-[#001A26] transition-colors pt-1">
                              <Plus size={13} /> Adicionar aula
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB: Certificados ── */}
          {subTab === 'certificados' && (
            <CertificadosSubTab
              certTemplates={certTemplates}
              addCertTemplate={addCertTemplate}
              updateCertTemplate={updateCertTemplate}
              deleteCertTemplate={deleteCertTemplate}
              issuedCerts={issuedCerts}
              issueCertificate={issueCertificate}
              revokeIssuedCert={revokeIssuedCert}
              courses={myCourses}
              users={users}
              systemRole={systemRole}
            />
          )}

          {/* ── Quiz + Acesso (oculto na aba Certificados) ── */}
          {subTab !== 'certificados' && <>

          {/* ── Gerador de Quiz + Configurações de Acesso ── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quiz */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
              <h4 className="text-sm font-black text-[#00263B]">Gerador de Quiz</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco de Questões</p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Search size={11} className="text-slate-300" />
                      <input value={quizSearch} onChange={e => setQuizSearch(e.target.value)} placeholder="Buscar"
                        className="flex-1 bg-transparent text-[10px] outline-none text-slate-500" />
                    </div>
                    <button onClick={() => {
                      const t = prompt('Título da questão:');
                      if (t?.trim()) setQuizQuestions(p => [...p, { id: Date.now(), text: t.trim() }]);
                    }} className="w-8 h-8 bg-[#4A72B2] text-white rounded-xl flex items-center justify-center hover:bg-[#00263B] transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quizFiltered.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl hover:bg-[#E2F0FF] transition-colors cursor-pointer group/q">
                        <CheckSquare size={11} className="text-[#4A72B2]" />
                        <span className="text-[9px] font-semibold text-slate-500 flex-1">{q.text}</span>
                        <button onClick={() => setQuizQuestions(p => p.filter(x => x.id !== q.id))}
                          className="opacity-0 group-hover/q:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pergunta</p>
                  <textarea value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)}
                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-2 text-[9px] text-slate-500 outline-none resize-none focus:border-[#4A72B2]" />
                  <div className="space-y-1.5">
                    {quizAlts.map((alt, i) => (
                      <div key={i} className="flex items-center gap-2 group/alt">
                        <input type="radio" name="quiz_alt" checked={quizCorrect === i} onChange={() => setQuizCorrect(i)} className="accent-[#4A72B2]" />
                        <span className="text-[9px] text-slate-400 font-medium flex-1">{alt}</span>
                        <button onClick={() => setQuizAlts(p => p.filter((_, j) => j !== i))}
                          className="opacity-0 group-hover/alt:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                    {newAlt !== undefined && (
                      <div className="flex gap-1 pt-1">
                        <input value={newAlt} onChange={e => setNewAlt(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && newAlt.trim()) { setQuizAlts(p => [...p, newAlt.trim()]); setNewAlt(''); } }}
                          placeholder="+ Nova alternativa (Enter)"
                          className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-[9px] outline-none focus:border-[#4A72B2] placeholder-slate-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações de Acesso */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
              <h4 className="text-sm font-black text-[#00263B]">Configurações de Acesso</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trilhas de Pré-requisito</p>
                  <div className="flex gap-2 flex-wrap">
                    {myCourses.slice(0, 3).map((c, i) => (
                      <div key={c.id} className="relative">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-[8px] font-black border-2 border-white shadow-sm ${KANBAN_COLORS[i % KANBAN_COLORS.length]}`}>
                          {c.title.slice(0, 4)}
                        </div>
                        <span className="absolute -bottom-1 left-0 right-0 text-center text-[7px] font-black text-slate-500 bg-white rounded-full mx-1 py-0.5 truncate">{c.title.split(' ')[0]}</span>
                      </div>
                    ))}
                    {myCourses.length === 0 && <p className="text-[9px] text-slate-300 font-medium">Nenhum curso disponível.</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" className="accent-[#4A72B2]" defaultChecked />
                    <span className="text-[9px] text-slate-400 font-medium">Requer conclusão do pré-requisito</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segmentação</p>
                  {['Diretores','Vendedores','Apenas Franqueados','Apenas Funcionários'].map((seg) => (
                    <div key={seg} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl hover:bg-[#E2F0FF] transition-colors cursor-pointer">
                      <span className="text-[9px] font-semibold text-slate-500">{seg}</span>
                      <ChevronRight size={10} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </>}
        </div>
      )}

      {mainTab === 'relatorios' && <RelatoriosView />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: RELATÓRIOS
// ═══════════════════════════════════════════════════════════════════════════
function RelatoriosView() {
  const courses = [
    { title: 'Vendas em quiosques',  stars: 3,   alunos: '+500 alunos',  taxa: '70%', desempenho: '7.5/10', tempo: '2 sem.', area: 'Vendas',    areaColor: 'bg-purple-100 text-purple-700', tagColor: 'bg-purple-500', cardBg: 'bg-purple-50' },
    { title: 'Operação de máquinas', stars: 3.5, alunos: '+800 alunos',  taxa: '70%', desempenho: '7.5/10', tempo: '4 sem.', area: 'Operações', areaColor: 'bg-teal-100 text-teal-700',    tagColor: 'bg-teal-500',   cardBg: 'bg-teal-50' },
    { title: 'Marketing Digital',    stars: 5,   alunos: '+1000 alunos', taxa: '70%', desempenho: '7.5/10', tempo: '1 sem.', area: 'Marketing', areaColor: 'bg-orange-100 text-orange-700',tagColor: 'bg-orange-500', cardBg: 'bg-orange-50' },
    { title: 'Franquias Biscoitê',   stars: 3.5, alunos: '+800 alunos',  taxa: '70%', desempenho: '7.5/10', tempo: '4 sem.', area: 'Operações', areaColor: 'bg-teal-100 text-teal-700',    tagColor: 'bg-teal-400',   cardBg: 'bg-teal-50/60' },
  ];
  return (
    <div className="space-y-4">
      {courses.map((c, i) => (
        <div key={i} className={`${c.cardBg} rounded-[24px] p-6 relative overflow-hidden`}>
          <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 ${c.tagColor} text-white rounded-full text-[10px] font-black uppercase`}>
            <Megaphone size={10} /> {c.area}
          </div>
          <div className="flex items-center gap-8">
            <div className="min-w-[180px]">
              <span className={`text-[9px] font-black px-2 py-1 rounded-full ${c.areaColor} mb-2 inline-block`}>Professor Karla</span>
              <h4 className="text-base font-black text-[#00263B] leading-tight">{c.title}</h4>
              <div className="mt-1"><Stars count={c.stars} size={11} /></div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex -space-x-1">
                  {[...Array(3)].map((_, j) => <div key={j} className="w-5 h-5 rounded-full bg-[#b9d2eb] border-2 border-white" />)}
                </div>
                <span className="text-[10px] font-bold text-slate-500">{c.alunos}</span>
              </div>
            </div>
            <div className="flex gap-8 flex-1">
              {[
                { label: 'Taxa de Conclusão', value: c.taxa },
                { label: 'Desempenho Médio em Testes', value: c.desempenho },
                { label: 'Tempo Médio de Conclusão', value: c.tempo },
              ].map((m, j) => (
                <div key={j} className="text-center">
                  <p className="text-3xl font-black text-[#00263B]">{m.value}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 max-w-[80px] leading-tight">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: COMUNICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════
function ComunicacaoView({ onRead }) {
  const { conversations, sendMessage, markConvReadProf, announcements, addAnnouncement } = useProfile();
  const [commTab, setCommTab] = useState('conversas');
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [msgInput, setMsgInput] = useState('');
  const [newAnn, setNewAnn] = useState({ titulo: '', corpo: '', destino: 'todos' });
  const [annSent, setAnnSent] = useState(false);
  const [toast, setToast] = useState(null);

  const [duvidas, setDuvidas] = useState([
    { id: 1, aluno: 'João Silva',   aula: 'Aula de Precificação', tempo: '5 min',  texto: 'Não entendi o cálculo de margem de lucro na aula 3.', status: 'pendente' },
    { id: 2, aluno: 'Ana Lima',     aula: 'Operação de Máquinas', tempo: '8 min',  texto: 'Como opero a máquina no modo manual?', status: 'pendente' },
    { id: 3, aluno: 'Carlos Matos', aula: 'Quiz — Módulo 2',      tempo: '12 min', texto: 'A questão 3 parece ter duas respostas corretas.', status: 'pendente' },
    { id: 4, aluno: 'Pedro Costa',  aula: 'Aula de Vendas',       tempo: '1h',     texto: 'Qual a diferença entre venda ativa e receptiva?', status: 'respondida' },
  ]);
  const [activeDuvida, setActiveDuvida] = useState(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || null;

  const selectConv = (conv) => {
    setSelectedConvId(conv.id);
    markConvReadProf(conv.id);
    onRead();
  };

  const sendMsg = () => {
    if (!msgInput.trim() || !selectedConvId) return;
    sendMessage(selectedConvId, msgInput, 'prof');
    setMsgInput('');
  };

  const sendAnn = () => {
    if (!newAnn.titulo.trim() || !newAnn.corpo.trim()) return;
    addAnnouncement(newAnn);
    setNewAnn({ titulo: '', corpo: '', destino: 'todos' });
    setAnnSent(true);
    setTimeout(() => setAnnSent(false), 2500);
    setToast('Aviso publicado com sucesso!');
    setTimeout(() => setToast(null), 3000);
  };

  const resolveDoubt = (id) => {
    setDuvidas(prev => prev.map(d => d.id === id ? { ...d, status: 'respondida' } : d));
    setActiveDuvida(null);
    setToast('Dúvida marcada como resolvida');
    setTimeout(() => setToast(null), 3000);
  };

  const DEST_LABELS = { todos: 'Todos', alunos: 'Alunos', franqueados: 'Franqueados', pendentes: 'Pendentes', risco: 'Em risco' };

  const pendenteDuvidas = duvidas.filter(d => d.status === 'pendente');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-100">
        {[
          { id: 'conversas', label: 'Conversas',    badge: conversations.reduce((s, c) => s + c.unreadProf, 0) },
          { id: 'avisos',    label: 'Avisos',        badge: 0 },
          { id: 'duvidas',   label: 'Dúvidas',       badge: pendenteDuvidas.length },
        ].map(t => (
          <button key={t.id} onClick={() => setCommTab(t.id)}
            className={`pb-3 text-sm font-black transition-all border-b-2 -mb-px flex items-center gap-2 ${
              commTab === t.id ? 'text-[#00263B] border-[#4A72B2]' : 'text-slate-400 border-transparent hover:text-[#00263B]'
            }`}>
            {t.label}
            {t.badge > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: Conversas ── */}
      {commTab === 'conversas' && (
        <div className="flex gap-5 h-[520px]">
          {/* Lista */}
          <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => selectConv(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                  selectedConv?.id === conv.id ? 'bg-[#E2F0FF]' : 'bg-white border border-slate-100 hover:border-[#4A72B2]/30'
                }`}>
                <div className="relative flex-shrink-0">
                  <img src={conv.avatar} className="w-10 h-10 rounded-full object-cover" alt={conv.name} />
                  {conv.unreadProf > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{conv.unreadProf}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-[#00263B] truncate">{conv.name}</p>
                    <span className="text-[8px] text-slate-300 flex-shrink-0 ml-1">{conv.lastTime}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium truncate">{conv.lastMsg}</p>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${conv.role === 'franqueado' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{conv.role === 'franqueado' ? 'Franqueado' : 'Aluno'}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Thread */}
          {selectedConv ? (
            <div className="flex-1 bg-white rounded-[24px] border border-slate-100 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                <img src={selectedConv.avatar} className="w-9 h-9 rounded-full object-cover" alt={selectedConv.name} />
                <div>
                  <p className="font-black text-[#00263B] text-sm">{selectedConv.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{selectedConv.role}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {selectedConv.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from === 'prof' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${msg.from === 'prof' ? 'bg-[#4A72B2] text-white' : 'bg-slate-100 text-[#00263B]'}`}>
                      <p className="text-xs font-medium">{msg.text}</p>
                      <p className={`text-[9px] mt-1 ${msg.from === 'prof' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                <button onClick={sendMsg} disabled={!msgInput.trim()}
                  className="w-10 h-10 bg-[#4A72B2] text-white rounded-xl flex items-center justify-center hover:bg-[#00263B] transition-all disabled:opacity-40">
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-[24px] border border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-3">
              <MessageSquare size={40} />
              <p className="font-black text-sm">Selecione uma conversa</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Avisos ── */}
      {commTab === 'avisos' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Composer */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
            <h3 className="font-black text-[#00263B] text-sm">Novo Aviso</h3>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Destinatários</label>
              <select value={newAnn.destino} onChange={e => setNewAnn(p => ({ ...p, destino: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] font-medium bg-white">
                <option value="todos">Todos os alunos</option>
                <option value="alunos">Apenas Alunos</option>
                <option value="franqueados">Apenas Franqueados</option>
                <option value="pendentes">Alunos com módulo pendente</option>
                <option value="risco">Alunos em risco</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Título</label>
              <input value={newAnn.titulo} onChange={e => setNewAnn(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Novo conteúdo disponível"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Mensagem</label>
              <textarea value={newAnn.corpo} onChange={e => setNewAnn(p => ({ ...p, corpo: e.target.value }))} rows={4}
                placeholder="Escreva o conteúdo do aviso..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#00263B] outline-none focus:border-[#4A72B2] resize-none font-medium placeholder-slate-300" />
            </div>
            <button onClick={sendAnn} disabled={!newAnn.titulo.trim() || !newAnn.corpo.trim()}
              className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                annSent ? 'bg-emerald-500 text-white' : 'bg-[#4A72B2] hover:bg-[#00263B] text-white'
              }`}>
              {annSent ? <><Check size={13} /> Publicado!</> : <><Send size={13} /> Publicar Aviso</>}
            </button>
          </div>

          {/* Histórico */}
          <div className="space-y-3">
            <h3 className="font-black text-[#00263B] text-sm">Histórico de Avisos</h3>
            {announcements.map(ann => (
              <div key={ann.id} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 space-y-2 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <p className="font-black text-[#00263B] text-sm">{ann.titulo}</p>
                  <span className="text-[9px] text-slate-400">{ann.time}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{ann.corpo}</p>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black px-2 py-0.5 bg-[#E2F0FF] text-[#4A72B2] rounded-full">{DEST_LABELS[ann.destino] || ann.destino}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{ann.lidos} lidos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Dúvidas ── */}
      {commTab === 'duvidas' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-black text-slate-400">{pendenteDuvidas.length} pendente{pendenteDuvidas.length !== 1 ? 's' : ''}</span>
            <span className="text-slate-200">·</span>
            <span className="text-xs font-black text-emerald-500">{duvidas.filter(d => d.status === 'respondida').length} respondidas</span>
          </div>
          {duvidas.map(d => (
            <div key={d.id} className={`bg-white rounded-2xl border px-6 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${d.status === 'respondida' ? 'border-emerald-100 opacity-60' : 'border-slate-100'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-[#00263B] text-sm">{d.aluno}</p>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${d.status === 'respondida' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-500'}`}>
                    {d.status === 'respondida' ? 'Respondida' : 'Pendente'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{d.aula} · {d.tempo}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{d.texto}</p>
              </div>
              {d.status === 'pendente' && (
                <button onClick={() => setActiveDuvida(d)}
                  className="flex-shrink-0 px-4 py-2 bg-[#4A72B2] text-white text-[10px] font-black rounded-xl hover:bg-[#00263B] transition-all flex items-center gap-1.5">
                  <MessageSquare size={11} /> Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeDuvida && (
        <DuvidaModal duvida={activeDuvida} onClose={() => setActiveDuvida(null)} onResolve={resolveDoubt} />
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: REELS
// ═══════════════════════════════════════════════════════════════════════════
const REEL_TAGS = ['Dica', 'Novidade', 'Aviso', 'Evento', 'Vendas', 'Operações', 'IA', 'Motivação'];

function extractYTId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function ReelsView() {
  const { reels, addReel, deleteReel, profileImage, instructorProfiles } = useProfile();
  const myReels = reels.filter(r => r.instructorId === CURRENT_INSTRUCTOR_ID);

  const [showForm, setShowForm]       = useState(false);
  const [caption, setCaption]         = useState('');
  const [tag, setTag]                 = useState('Dica');
  const [videoTab, setVideoTab]       = useState('youtube'); // 'youtube' | 'local'
  const [videoUrl, setVideoUrl]       = useState('');
  const [videoFile, setVideoFile]     = useState(null);
  const [thumbnail, setThumbnail]     = useState('');
  const [thumbFile, setThumbFile]     = useState(null);
  const [hoveredId, setHoveredId]     = useState(null);
  const [toast, setToast]             = useState(null);
  const thumbInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const ytId = extractYTId(videoUrl);
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
  const previewThumb = thumbFile ? thumbnail : (ytThumb || thumbnail);

  const handleThumbFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { setThumbFile(file); setThumbnail(e.target.result); };
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
  };

  const handleSubmit = () => {
    if (!caption.trim()) return;
    const finalThumb = previewThumb || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400';
    const finalVideoUrl = videoTab === 'youtube' ? videoUrl : videoUrl;
    const finalVideoType = videoTab === 'youtube' ? 'youtube' : 'local';
    addReel({ caption, tag, thumbnail: finalThumb, videoUrl: finalVideoUrl, videoType: finalVideoUrl ? finalVideoType : null });
    setShowForm(false);
    setCaption(''); setTag('Dica'); setVideoUrl(''); setVideoFile(null); setThumbnail(''); setThumbFile(null); setVideoTab('youtube');
    setToast('Reel publicado com sucesso!');
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="space-y-8 max-w-[900px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm mt-1">Publique vídeos curtos visíveis para todos na Home</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#4A72B2] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#001A26] transition-colors shadow-lg shadow-blue-100 text-sm"
        >
          <Plus size={15} /> Novo Reel
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-slate-100">
              <h3 className="font-black text-[#001A26] text-lg">Novo Reel</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X size={15} className="text-slate-500" />
              </button>
            </div>

            <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Thumbnail */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Thumbnail</p>
                <div
                  className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group border-2 border-dashed border-slate-200 hover:border-[#4A72B2] transition-colors"
                  onClick={() => thumbInputRef.current?.click()}
                >
                  {previewThumb ? (
                    <>
                      <img src={previewThumb} className="w-full h-full object-cover" alt="thumb" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-bold">Trocar imagem</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                      <ImageIcon size={24} />
                      <p className="text-xs font-medium">Clique para adicionar thumbnail</p>
                      <p className="text-[10px] text-slate-300">ou cole a URL do YouTube abaixo para importar automaticamente</p>
                    </div>
                  )}
                </div>
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => handleThumbFile(e.target.files?.[0])} />
              </div>

              {/* Legenda */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Legenda</p>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="O que você quer compartilhar com os alunos?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-[#4A72B2] outline-none text-sm text-slate-700 resize-none"
                />
                <p className="text-[10px] text-slate-300 text-right mt-1">{caption.length}/200</p>
              </div>

              {/* Tag */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {REEL_TAGS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${tag === t ? 'bg-[#4A72B2] text-white border-[#4A72B2]' : 'border-slate-200 text-slate-500 hover:border-[#4A72B2] hover:text-[#4A72B2]'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vídeo */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Vídeo (opcional)</p>
                <div className="flex gap-2 mb-3">
                  {[['youtube', 'YouTube'], ['local', 'Arquivo local']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setVideoTab(val); setVideoUrl(''); setVideoFile(null); }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${videoTab === val ? 'bg-[#e2eef9] text-[#4A72B2] border-[#4A72B2]' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {videoTab === 'youtube' ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-[#4A72B2]">
                    <Link size={14} className="text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="Cole o link do YouTube aqui"
                      className="flex-1 text-sm outline-none text-slate-700 bg-transparent"
                    />
                    {ytId && <span className="text-[10px] text-emerald-500 font-bold whitespace-nowrap">✓ válido</span>}
                  </div>
                ) : (
                  <div>
                    {videoFile ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50">
                        <Film size={14} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-700 flex-1 truncate">{videoFile.name}</span>
                        <button onClick={() => { setVideoFile(null); setVideoUrl(''); }} className="text-slate-400 hover:text-red-400"><X size={13} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4A72B2] text-slate-400 text-xs font-medium transition-colors"
                      >
                        Selecionar arquivo de vídeo
                      </button>
                    )}
                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                      onChange={e => handleVideoFile(e.target.files?.[0])} />
                  </div>
                )}
              </div>
            </div>

            <div className="px-7 pb-7 pt-4 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!caption.trim()}
                className="flex-1 py-3 rounded-2xl bg-[#4A72B2] text-white font-bold text-sm hover:bg-[#001A26] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Publicar Reel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de reels */}
      {myReels.length === 0 ? (
        <div className="py-24 text-center text-slate-300 space-y-3">
          <Clapperboard size={40} className="mx-auto" />
          <p className="font-bold text-slate-400">Você ainda não publicou nenhum reel</p>
          <p className="text-sm text-slate-300">Clique em "Novo Reel" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {myReels.map(reel => {
            const isHovered = hoveredId === reel.id;
            const thumb = reel.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400';
            return (
              <div
                key={reel.id}
                className="relative rounded-[20px] overflow-hidden aspect-[9/14] group cursor-pointer shadow-sm"
                onMouseEnter={() => setHoveredId(reel.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <img src={thumb} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={reel.caption} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Tag */}
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 text-[#4A72B2] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{reel.tag}</span>
                </div>

                {/* Delete btn */}
                <button
                  onClick={() => deleteReel(reel.id)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <Trash size={10} />
                </button>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
                  <p className="text-white text-[11px] font-bold leading-snug line-clamp-2">{reel.caption}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-[9px]">{reel.views} views · {reel.time}</span>
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
                      <Play size={8} fill="#001A26" className="text-[#001A26] translate-x-[1px]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function ProfessorDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [unreadComm, setUnreadComm] = useState(3);
  const { profileImage, userData } = useProfile();

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'comunicacao') setUnreadComm(0);
  };

  const viewTitle = {
    overview:    'Painel do Professor',
    cursos:      'Painel do Professor',
    reels:       'Meus Reels',
    comunicacao: 'Comunicação',
  }[activeView];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="sticky top-0 h-screen flex-shrink-0 z-10">
        <Sidebar
          activeView={activeView}
          setActiveView={handleViewChange}
          profileImage={profileImage}
          userName={userData.name}
          unreadComm={unreadComm}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 w-full px-10 py-8 max-w-[1440px]">
          <h1 className="text-2xl font-black text-[#00263B] mb-6">{viewTitle}</h1>
          {activeView === 'overview'    && <OverviewView onNewComm={() => setUnreadComm(p => p + 1)} />}
          {activeView === 'cursos'      && <MeusCursosView />}
          {activeView === 'reels'       && <ReelsView />}
          {activeView === 'comunicacao' && <ComunicacaoView onRead={() => setUnreadComm(0)} />}
        </main>

        <footer className="bg-[#00263B] text-white pt-12 pb-6 mt-auto">
          <div className="max-w-[1400px] mx-auto px-8 space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-xl">Biscoitê</span>
                <div className="h-5 w-px bg-slate-500" />
                <span className="text-slate-400 text-xs uppercase tracking-widest">Open Academy</span>
              </div>
              <h3 className="text-base font-medium">Assine nossa newsletter</h3>
              <div className="flex w-full max-w-sm gap-2">
                <input type="email" placeholder="Seu Email"
                  className="flex-1 bg-transparent border border-slate-700 rounded-xl px-4 py-2.5 outline-none text-sm focus:border-[#4A72B2]" />
                <button className="bg-[#b9d2eb] hover:bg-[#4A72B2] text-[#001A26] hover:text-white px-6 py-2.5 rounded-xl font-bold transition-all text-sm">
                  Assine
                </button>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex gap-6 text-xs text-slate-400 font-bold uppercase">
                <a href="#" className="hover:text-white transition-colors">Ajuda</a>
                <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Termos & Condições</a>
              </div>
              <p className="text-[10px] text-slate-500">© Biscoitê 2026 CNPJ: 35.689.008/0001-91. Todos os direitos reservados</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
