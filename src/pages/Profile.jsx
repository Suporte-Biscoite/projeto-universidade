import React, { useState, useRef, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { TODAS_LOJAS } from '../utils/stores';
import {
  Mail, Linkedin, Phone, Globe, Plus, Pencil, Star, Calendar,
  MapPin, Briefcase, ChevronLeft, ChevronRight, X, Save, Trash2,
  AlertTriangle, TrendingUp, Users, MessageSquare, Send, Bell, Check,
  BarChart2, Store, BookOpen, Shield, User, Camera,
} from 'lucide-react';
import { useProfile, DEFAULT_COURSE_IMAGES } from '../context/ProfileContext';
import { useNavigate } from 'react-router-dom';



// ─── Helpers ─────────────────────────────────────────────────────────────────
async function saveProfileToApi(data) {
  try {
    const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
    const logged = raw ? JSON.parse(raw) : null;
    if (!logged?.id) return;
    const res = await authFetch(`/api/users?id=${logged.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      const newLogged = { ...logged, ...updated };
      if (sessionStorage.getItem('biscoite_logged_user')) sessionStorage.setItem('biscoite_logged_user', JSON.stringify(newLogged));
      if (localStorage.getItem('biscoite_logged_user'))   localStorage.setItem('biscoite_logged_user', JSON.stringify(newLogged));
    } else {
      const err = await res.json().catch(() => ({}));
      console.error('saveProfileToApi error:', res.status, err);
    }
  } catch(e) { console.error('saveProfileToApi exception:', e); }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── SUBCOMPONENTE: Input reutilizável ─────────────────────────────────────
function InputLabel({ label, value, onChange, placeholder }) {
  return (
    <div className="w-full text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
        {label}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ''}
        className="w-full bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold text-[#00263B] outline-none focus:border-[#6385B7] transition-all"
      />
    </div>
  );
}

function SelectLabel({ label, value, onChange, options = [], placeholder = 'Selecione...' }) {
  return (
    <div className="w-full text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold text-[#00263B] outline-none focus:border-[#6385B7] transition-all appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Calcula tempo de empresa em anos/meses a partir de uma data de admissão
function CompanyTimeLabel({ value, onChange }) {
  const [mode, setMode] = useState('text'); // 'text' | 'date'
  const [admDate, setAdmDate] = useState('');

  const calcFromDate = (dateStr) => {
    if (!dateStr) return;
    const adm  = new Date(dateStr);
    const now  = new Date();
    let years  = now.getFullYear() - adm.getFullYear();
    let months = now.getMonth() - adm.getMonth();
    if (months < 0) { years--; months += 12; }
    const parts = [];
    if (years > 0)  parts.push(`${years} ano${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mês${months > 1 ? 'es' : ''}`);
    onChange(parts.join(' e ') || 'menos de 1 mês');
  };

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Tempo de Empresa
        </label>
        <button type="button" onClick={() => setMode(m => m === 'text' ? 'date' : 'text')}
          className="text-[9px] font-black text-[#6385B7] hover:text-[#00263B] uppercase tracking-widest transition-colors">
          {mode === 'text' ? '← calcular pela data' : '← digitar manualmente'}
        </button>
      </div>
      {mode === 'text' ? (
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="Ex: 2 anos e 3 meses"
          className="w-full bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold text-[#00263B] outline-none focus:border-[#6385B7] transition-all" />
      ) : (
        <div className="flex gap-2 items-center">
          <input type="date" value={admDate} onChange={e => { setAdmDate(e.target.value); calcFromDate(e.target.value); }}
            className="flex-1 bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold text-[#00263B] outline-none focus:border-[#6385B7] transition-all" />
          {value && <span className="text-xs font-bold text-emerald-600 whitespace-nowrap">{value}</span>}
        </div>
      )}
    </div>
  );
}
function CircularProgress({ value = 78, size = 100, stroke = 8 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e2eef9" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#4A72B2" strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-2xl font-black text-[#00263B]">{value}%</span>
    </div>
  );
}

// ─── SUBCOMPONENTE: Painel do Professor ────────────────────────────────────
function ProfessorPanel() {
  const navigate = useNavigate();
  const atRiskStudents = [
    { name: 'Maria Silva', course: 'Operações', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' },
    { name: 'João Costa', course: 'Vendas', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
    { name: 'Ana Pereira', course: 'Marketing', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200' },
  ];

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-[#00263B]">Painel do Professor</h3>
        
            <button 
            onClick={() => navigate('/professor')} // ← adiciona o onClick
            className="text-[#6385B7] text-xs font-black hover:underline uppercase tracking-widest">
              Ver tudo
            </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

        {/* Taxa de Conclusão */}
        <div className="flex flex-col items-center gap-3 p-5 bg-[#f8fafc] rounded-[24px] border border-slate-100">
          <CircularProgress value={78} size={90} stroke={7} />
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conclusão</p>
          </div>
        </div>

        {/* Nota Média */}
        <div className="flex flex-col items-center gap-3 p-5 bg-[#f8fafc] rounded-[24px] border border-slate-100">
          <div className="flex flex-col items-center gap-2 flex-1 justify-center">
            <p className="text-3xl font-black text-[#00263B]">4.8</p>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < 5 ? 'text-yellow-400' : 'text-slate-200'}
                  fill="currentColor"
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota Média de</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação</p>
          </div>
        </div>

        {/* Alunos em Risco */}
        <div className="flex flex-col gap-3 p-5 bg-[#f8fafc] rounded-[24px] border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-orange-400" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos em Risco</p>
          </div>
          <div className="space-y-2.5 flex-1">
            {atRiskStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <img
                  src={s.avatar}
                  className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                  alt={s.name}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-[#00263B] truncate">{s.name}</p>
                  <p className="text-[9px] text-slate-400 font-semibold truncate">{s.course}</p>
                </div>
                <button className="ml-auto flex-shrink-0 px-2 py-1 bg-[#E2F0FF] text-[#4A72B2] text-[8px] font-black rounded-lg uppercase hover:bg-[#4A72B2] hover:text-white transition-all">
                  Ver
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats extras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl">
          <div className="w-9 h-9 bg-[#E2F0FF] rounded-xl flex items-center justify-center">
            <Users size={16} className="text-[#4A72B2]" />
          </div>
          <div>
            <p className="text-lg font-black text-[#00263B]">154</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alunos ativos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-black text-[#00263B]">+12%</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Este mês</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMUNICAÇÃO (aluno e franqueado) ──────────────────────────────────────
const PROF_AVATAR = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200';
// ID fixo da conversa do usuário logado — em produção viria do JWT
const MY_CONV_ID = 1;

function ComunicacaoAluno({ userRole }) {
  const { conversations, sendMessage, markConvReadUser, announcements } = useProfile();
  const [tab, setTab] = useState('conversas');

  // Conversa do aluno/franqueado logado
  const conv = conversations.find(c => c.id === MY_CONV_ID);
  const messages = conv?.messages || [];
  const [msgInput, setMsgInput] = useState('');

  const sendMsg = () => {
    if (!msgInput.trim()) return;
    sendMessage(MY_CONV_ID, msgInput, 'user');
    setMsgInput('');
  };

  // Marca lido ao abrir a conversa
  const handleOpenConv = () => markConvReadUser(MY_CONV_ID);

  // ── Dúvidas (locais por enquanto) ──
  const [duvidas, setDuvidas] = useState([
    { id: 1, curso: 'Fase 1 - Básico', pergunta: 'Como funciona o checklist de abertura?', status: 'respondida', resposta: 'O checklist está no módulo 2, aula 3. Revise lá!', time: '2 dias atrás' },
  ]);
  const [novaDuvida, setNovaDuvida] = useState({ curso: '', pergunta: '' });
  const [duvidaSent, setDuvidaSent] = useState(false);

  const sendDuvida = () => {
    if (!novaDuvida.curso.trim() || !novaDuvida.pergunta.trim()) return;
    setDuvidas(prev => [{ id: Date.now(), ...novaDuvida, status: 'pendente', resposta: '', time: 'agora' }, ...prev]);
    setNovaDuvida({ curso: '', pergunta: '' });
    setDuvidaSent(true);
    setTimeout(() => setDuvidaSent(false), 2500);
  };

  // ── Avisos do contexto compartilhado ──
  const [avisosLidos, setAvisosLidos] = useState(new Set());
  const unreadAvisos = announcements.filter(a => !avisosLidos.has(a.id)).length;

  const CURSOS = ['Fase 1 - Básico', 'Operação cafeteria', 'Atendimento ao cliente', 'Marketing Digital', 'Páscoa 2026'];

  const roleLabel = userRole === 'franqueado' ? 'Franqueado' : 'Aluno';

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-7 pb-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#E2F0FF] rounded-2xl flex items-center justify-center">
            <MessageSquare size={18} className="text-[#6385B7]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#00263B]">Comunicação</h2>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Fale com seu professor</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-100">
          {[
            { id: 'conversas', label: 'Conversa',     badge: 0 },
            { id: 'duvidas',   label: 'Minhas Dúvidas', badge: duvidas.filter(d => d.status === 'pendente').length },
            { id: 'avisos',    label: 'Avisos',        badge: unreadAvisos },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'avisos') setAvisosLidos(new Set(announcements.map(a => a.id))); }}
              className={`pb-3 text-sm font-black transition-all border-b-2 -mb-px flex items-center gap-2 ${
                tab === t.id ? 'text-[#00263B] border-[#6385B7]' : 'text-slate-400 border-transparent hover:text-[#00263B]'
              }`}>
              {t.label}
              {t.badge > 0 && <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 pt-6">

        {/* ── TAB: Conversa ── */}
        {tab === 'conversas' && (
          <div className="flex gap-5">
            {/* Info do professor */}
            <div className="w-48 flex-shrink-0 space-y-3">
              <div className="bg-slate-50 rounded-2xl p-4 text-center space-y-2">
                <img src={PROF_AVATAR} className="w-14 h-14 rounded-full object-cover mx-auto border-2 border-white shadow" alt="Professor" />
                <p className="font-black text-[#00263B] text-sm">Prof. Karla</p>
                <p className="text-[10px] text-slate-400 font-medium">Professora · Admin</p>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-[9px] text-emerald-500 font-black">Online</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-300 font-medium text-center leading-relaxed px-1">
                Tire dúvidas, relate problemas ou peça orientação.
              </p>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col border border-slate-100 rounded-2xl overflow-hidden">
              <div className="flex-1 h-64 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                    {msg.from === 'prof' && <img src={PROF_AVATAR} className="w-7 h-7 rounded-full object-cover flex-shrink-0 self-end" alt="" />}
                    <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${msg.from === 'user' ? 'bg-[#6385B7] text-white' : 'bg-white border border-slate-100 text-[#00263B]'}`}>
                      <p className="text-xs font-medium">{msg.text}</p>
                      <p className={`text-[9px] mt-1 ${msg.from === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 flex gap-2 bg-white">
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()}
                  placeholder="Escreva uma mensagem para o professor..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#6385B7] font-medium placeholder-slate-300" />
                <button onClick={sendMsg} disabled={!msgInput.trim()}
                  className="w-10 h-10 bg-[#6385B7] text-white rounded-xl flex items-center justify-center hover:bg-[#00263B] transition-all disabled:opacity-40">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Dúvidas ── */}
        {tab === 'duvidas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Formulário */}
            <div className="space-y-4">
              <h3 className="font-black text-[#00263B] text-sm">Nova Dúvida</h3>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Curso</label>
                <select value={novaDuvida.curso} onChange={e => setNovaDuvida(p => ({ ...p, curso: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#00263B] outline-none focus:border-[#6385B7] font-medium bg-white">
                  <option value="">Selecione o curso...</option>
                  {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Dúvida</label>
                <textarea value={novaDuvida.pergunta} onChange={e => setNovaDuvida(p => ({ ...p, pergunta: e.target.value }))} rows={4}
                  placeholder="Descreva sua dúvida com detalhes..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#00263B] outline-none focus:border-[#6385B7] resize-none font-medium placeholder-slate-300" />
              </div>
              <button onClick={sendDuvida} disabled={!novaDuvida.curso || !novaDuvida.pergunta.trim()}
                className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                  duvidaSent ? 'bg-emerald-500 text-white' : 'bg-[#6385B7] hover:bg-[#00263B] text-white'
                }`}>
                {duvidaSent ? <><Check size={13} /> Enviada!</> : <><Send size={13} /> Enviar Dúvida</>}
              </button>
            </div>

            {/* Histórico */}
            <div className="space-y-3">
              <h3 className="font-black text-[#00263B] text-sm">Histórico</h3>
              {duvidas.length === 0 && <p className="text-slate-300 text-sm font-medium">Nenhuma dúvida enviada.</p>}
              {duvidas.map(d => (
                <div key={d.id} className={`rounded-2xl border p-4 space-y-2 ${d.status === 'respondida' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-[#6385B7] uppercase">{d.curso}</p>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${d.status === 'respondida' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-500'}`}>
                      {d.status === 'respondida' ? 'Respondida' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{d.pergunta}</p>
                  {d.resposta && (
                    <div className="bg-white rounded-xl px-3 py-2 border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-600 mb-0.5">Resposta do professor:</p>
                      <p className="text-xs text-slate-500 font-medium">{d.resposta}</p>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-300">{d.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Avisos ── */}
        {tab === 'avisos' && (
          <div className="space-y-3">
            {announcements.length === 0 && <p className="text-slate-300 text-sm font-medium text-center py-8">Nenhum aviso recebido.</p>}
            {announcements.map(aviso => (
              <div key={aviso.id} className={`rounded-2xl border px-5 py-4 flex gap-4 items-start transition-all ${avisosLidos.has(aviso.id) ? 'border-slate-100' : 'border-[#6385B7]/30 bg-[#E2F0FF]/30'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${avisosLidos.has(aviso.id) ? 'bg-slate-100' : 'bg-[#E2F0FF]'}`}>
                  <Bell size={14} className={avisosLidos.has(aviso.id) ? 'text-slate-400' : 'text-[#6385B7]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-[#00263B] text-sm">{aviso.titulo}</p>
                    <span className="text-[9px] text-slate-400 flex-shrink-0">{aviso.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{aviso.corpo}</p>
                </div>
                {!avisosLidos.has(aviso.id) && (
                  <div className="w-2 h-2 bg-[#6385B7] rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────
export default function Profile() {
  const { profileImage, updateProfileImage, userData, updateUserData, updateUserDataApi, systemRole: userRole, users, courses } = useProfile();

  // Carrega dados extras do perfil do banco ao montar
  React.useEffect(() => {
    const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
    const logged = raw ? JSON.parse(raw) : null;
    if (logged?.id) {
      const token = sessionStorage.getItem('biscoite_access_token') || localStorage.getItem('biscoite_access_token');
      fetch(`/api/users?id=${logged.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(u => {
          if (u.id) {
            updateUserData(prev => ({ ...prev,
              pronoun: u.pronoun || prev.pronoun || '',
              role: u.position || prev.role || '',
              time: u.company_time || prev.time || '',
              bio: u.bio || prev.bio || '',
              skills: u.skills || prev.skills || [],
            }));
            if (u.avatar_url && !u.avatar_url.startsWith('blob:')) updateProfileImage(u.avatar_url);
            if (u.banner_url && !u.banner_url.startsWith('blob:')) setBannerImage(u.banner_url);
          }
        }).catch(() => {});
    }
  }, []);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const bannerFileRef = useRef(null);

  const [bannerImage, setBannerImage] = useState(
    () => localStorage.getItem('biscoite_banner_image') || null
  );

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setBannerImage(base64);
    await saveProfileToApi({ banner_url: base64 });
  };

  const removeBanner = async () => {
    setBannerImage(null);
    await saveProfileToApi({ banner_url: null });
  };


  const [activeModal, setActiveModal] = useState(null);
  const [tempData, setTempData]       = useState(null);
  const [newSkill, setNewSkill]       = useState('');
  const [sectors, setSectors]         = useState([]);
  const [jobTitles, setJobTitles]     = useState([]);

  useEffect(() => {
    Promise.all([
      authFetch('/api/data?resource=sectors').then(r => r.ok ? r.json() : []),
      authFetch('/api/data?resource=job_titles').then(r => r.ok ? r.json() : []),
    ]).then(([s, j]) => {
      if (Array.isArray(s)) setSectors(s.map(i => i.name));
      if (Array.isArray(j)) setJobTitles(j.map(i => i.name));
    }).catch(() => {});
  }, []);

  const openModal = (type) => {
    const base = JSON.parse(JSON.stringify(userData));
    if (!base.skills) base.skills = ['marketing digital', 'logística', 'gestão de pessoas'];
    if (!base.contacts) base.contacts = { phone: '', email: '', linkedin: '', website: '' };
    setTempData(base);
    setNewSkill('');
    setActiveModal(type);
  };

  const handleSave = async () => {
    updateUserData(prev => ({ ...prev, ...tempData }));
    await saveProfileToApi({
      name:         tempData.name,
      unit:         tempData.unit,
      store_name:   tempData.unit,   // sincroniza store_name com unit (campo de loja)
      pronoun:      tempData.pronoun,
      position:     tempData.role,
      company_time: tempData.time,
      bio:          tempData.bio,
      skills:       tempData.skills,
      contacts:     tempData.contacts,
    });
    setActiveModal(null);
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setTempData(prev => ({ ...prev, skills: [...(prev.skills || []), newSkill.trim().toLowerCase()] }));
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setTempData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const addNewItem = (type) => {
    const id = Date.now();
    const newItems = { ...tempData };
    if (type === 'cert') newItems.certificates = [...(newItems.certificates || []), { id, title: 'Novo Certificado', area: 'Área', duration: 'Duração', date: 'Período' }];
    if (type === 'edu') newItems.education = [...(newItems.education || []), { id, institution: 'Nova Instituição', level: 'Nível', date: 'Período' }];
    if (type === 'exp') newItems.experience = [...(newItems.experience || []), { id, role: 'Novo Cargo', company: 'Empresa', date: 'Período' }];
    setTempData(newItems);
  };

  const removeItem = (type, id) => {
    const newItems = { ...tempData };
    if (type === 'cert') newItems.certificates = newItems.certificates.filter(c => c.id !== id);
    if (type === 'edu') newItems.education = newItems.education.filter(e => e.id !== id);
    if (type === 'exp') newItems.experience = newItems.experience.filter(ex => ex.id !== id);
    setTempData(newItems);
  };

  const skills = userData.skills || ['marketing digital', 'logística', 'gestão de pessoas'];
  const contacts = userData.contacts || { phone: '', email: '', linkedin: '', website: '' };

  // Cor do banner por role
  const bannerBg = {
    aluno:      'bg-[#E2F0FF]',
    franqueado: 'bg-[#e2eef9]',
    professor:  'bg-[#00263B]',
    gestor:     'bg-teal-800',
    loja:       'bg-orange-800',
    admin:      'bg-[#1a0033]',
  }[userRole] || 'bg-[#E2F0FF]';

  const ROLE_BADGE = {
    professor:  { label: 'Professor',  color: 'bg-[#4A72B2] text-white' },
    gestor:     { label: 'Gestor',     color: 'bg-teal-500 text-white' },
    loja:       { label: 'Líder Loja', color: 'bg-orange-400 text-white' },
    admin:      { label: 'Admin',      color: 'bg-purple-500 text-white' },
    franqueado: { label: 'Franqueado', color: 'bg-cyan-500 text-white' },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">

      {/* ── BANNER ── */}
      <div
        className={`relative h-44 ${bannerImage ? '' : bannerBg}`}
        style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        <div className="max-w-7xl mx-auto h-full relative px-4 sm:px-10">
          <div className="absolute bottom-2 sm:bottom-6 right-3 sm:right-10 flex gap-2">
            <button
              onClick={() => openModal('profile')}
              className="px-4 sm:px-8 py-1.5 sm:py-2 bg-[#6385B7] text-white font-black rounded-full text-xs sm:text-sm shadow-lg hover:scale-105 transition-all"
            >
              Editar perfil
            </button>
            <button
              onClick={() => navigate('/configuracoes')}
              className="px-4 sm:px-8 py-1.5 sm:py-2 bg-[#6385B7] text-white font-black rounded-full text-xs sm:text-sm shadow-lg hover:scale-105 transition-all"
            >
              Configurações
            </button>
          </div>

          {/* Badge de role no banner */}
          {ROLE_BADGE[userRole] && (
            <div className="absolute top-6 left-10">
              <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${ROLE_BADGE[userRole].color}`}>
                {ROLE_BADGE[userRole].label}
              </span>
            </div>
          )}

          {/* Foto de perfil */}
          <div className="absolute -bottom-20 left-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {profileImage ? (
                <img
                  src={profileImage}
                  className="w-44 h-44 rounded-full border-[6px] border-white shadow-xl object-cover"
                  alt="Perfil"
                />
              ) : (
                <div className="w-44 h-44 rounded-full border-[6px] border-white shadow-xl bg-slate-100 flex items-center justify-center">
                  <User size={72} className="text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                <Pencil size={32} className="text-white" />
              </div>
              <div className="absolute bottom-3 right-0 bg-[#6385B7] text-white text-[10px] px-4 py-1.5 rounded-full font-black border-2 border-white uppercase">
                {userData.time}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const base64 = await fileToBase64(file);
                updateProfileImage(base64);
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-10 pt-20 sm:pt-28 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="col-span-12 lg:col-span-3 space-y-6 pt-4">
          <div>
            <h1 className="text-3xl font-black text-[#00263B] leading-tight">
              {userData.name}
              <span className="text-[10px] font-bold text-slate-300 align-middle ml-2 uppercase">
                {userData.pronoun || 'elu/delu'}
              </span>
            </h1>

            <div className="flex flex-col gap-4 mt-6 text-slate-500 font-bold text-[13px]">
              <span className="flex items-center gap-3">
                <MapPin size={18} className="text-[#6385B7]" />
                {userData.unit || 'Unidade não definida'}
              </span>
              <span className="flex items-center gap-3">
                <Briefcase size={18} className="text-[#6385B7]" />
                {userData.role || 'Cargo não definido'}
              </span>
              <span className="flex items-center gap-3">
                <Calendar size={18} className="text-[#6385B7]" />
                {userData.time || 'Tempo de empresa'}
              </span>

              {/* Habilidades — apenas para aluno */}
              {userRole === 'aluno' && (
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-3">
                      <Star size={18} className="text-[#6385B7]" /> Habilidades
                    </span>
                    <button onClick={() => openModal('skills')} className="text-slate-300 hover:text-[#6385B7] transition-colors">
                      <Pencil size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                      <span key={s} className="px-3 py-1 border border-slate-200 text-[9px] font-black text-slate-400 rounded-full uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contatos */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contatos</p>
                <button onClick={() => openModal('contacts')}
                  className="text-[9px] font-black text-[#6385B7] hover:text-[#00263B] uppercase tracking-widest flex items-center gap-1 transition-colors">
                  <Pencil size={10} /> Editar
                </button>
              </div>
              {[
                { Icon: Phone,    key: 'phone',    label: 'Telefone', href: contacts.phone    ? `tel:${contacts.phone}` : null,       value: contacts.phone },
                { Icon: Mail,     key: 'email',    label: 'E-mail',   href: contacts.email    ? `mailto:${contacts.email}` : null,    value: contacts.email },
                { Icon: Linkedin, key: 'linkedin', label: 'LinkedIn', href: contacts.linkedin || null,                                 value: contacts.linkedin },
                { Icon: Globe,    key: 'website',  label: 'Site',     href: contacts.website  || null,                                 value: contacts.website },
              ].map(({ Icon, key, label, href, value }) => (
                value ? (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#E2F0FF] hover:bg-[#6385B7] group transition-all">
                    <Icon size={14} className="text-[#6385B7] group-hover:text-white flex-shrink-0" />
                    <span className="text-xs font-bold text-[#00263B] group-hover:text-white truncate">{value}</span>
                  </a>
                ) : (
                  <button key={key} onClick={() => openModal('contacts')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-[#E2F0FF] group transition-all w-full text-left">
                    <Icon size={14} className="text-slate-300 group-hover:text-[#6385B7] flex-shrink-0" />
                    <span className="text-xs text-slate-300 group-hover:text-[#6385B7]">Adicionar {label}</span>
                  </button>
                )
              ))}
            </div>
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="col-span-12 lg:col-span-9 space-y-8">

          {/* ══ ROLE: PROFESSOR ══ */}
          {userRole === 'professor' && (
            <>
              <ProfessorPanel />

              {/* Educação + Experiência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                  <div className="flex justify-between items-center mb-8 text-[#00263B]">
                    <h2 className="text-xl font-black">Educação</h2>
                    <div className="flex gap-3">
                      <button onClick={() => { openModal('edu'); setTimeout(() => addNewItem('edu'), 100); }} className="text-slate-200 hover:text-[#6385B7]"><Plus size={20} /></button>
                      <button onClick={() => openModal('edu')} className="text-slate-200 hover:text-[#6385B7]"><Pencil size={18} /></button>
                    </div>
                  </div>
                  {userData.education?.map(e => (
                    <div key={e.id} className="mb-6 last:mb-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase">{e.institution}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{e.level}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{e.date}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                  <div className="flex justify-between items-center mb-8 text-[#00263B]">
                    <h2 className="text-xl font-black">Experiência</h2>
                    <div className="flex gap-3">
                      <button onClick={() => { openModal('exp'); setTimeout(() => addNewItem('exp'), 100); }} className="text-slate-200 hover:text-[#6385B7]"><Plus size={20} /></button>
                      <button onClick={() => openModal('exp')} className="text-slate-200 hover:text-[#6385B7]"><Pencil size={18} /></button>
                    </div>
                  </div>
                  {userData.experience?.map(ex => (
                    <div key={ex.id} className="mb-6 last:mb-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase">{ex.role}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{ex.company}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{ex.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══ ROLE: ALUNO ══ */}
          {userRole === 'aluno' && (
            <>
              {/* Certificados */}
              <section className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-[#00263B]">Certificados</h2>
                  <div className="flex gap-4">
                    <button onClick={() => { openModal('cert'); setTimeout(() => addNewItem('cert'), 100); }} className="text-slate-300 hover:text-[#6385B7]"><Plus size={24} /></button>
                    <button onClick={() => openModal('cert')} className="text-slate-300 hover:text-[#6385B7]"><Pencil size={20} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {userData.certificates?.map((c, i) => (
                    <div key={i} className="border-l-2 border-slate-50 pl-6 first:border-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase leading-tight">{c.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{c.area} • {c.duration}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{c.date}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Educação + Experiência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                  <div className="flex justify-between items-center mb-8 text-[#00263B]">
                    <h2 className="text-xl font-black">Educação</h2>
                    <div className="flex gap-3">
                      <button onClick={() => { openModal('edu'); setTimeout(() => addNewItem('edu'), 100); }} className="text-slate-200 hover:text-[#6385B7]"><Plus size={20} /></button>
                      <button onClick={() => openModal('edu')} className="text-slate-200 hover:text-[#6385B7]"><Pencil size={18} /></button>
                    </div>
                  </div>
                  {userData.education?.map(e => (
                    <div key={e.id} className="mb-6 last:mb-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase">{e.institution}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{e.level}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{e.date}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                  <div className="flex justify-between items-center mb-8 text-[#00263B]">
                    <h2 className="text-xl font-black">Experiência</h2>
                    <div className="flex gap-3">
                      <button onClick={() => { openModal('exp'); setTimeout(() => addNewItem('exp'), 100); }} className="text-slate-200 hover:text-[#6385B7]"><Plus size={20} /></button>
                      <button onClick={() => openModal('exp')} className="text-slate-200 hover:text-[#6385B7]"><Pencil size={18} /></button>
                    </div>
                  </div>
                  {userData.experience?.map(ex => (
                    <div key={ex.id} className="mb-6 last:mb-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase">{ex.role}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{ex.company}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{ex.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══ ROLE: FRANQUEADO ══ */}
          {userRole === 'franqueado' && (
            <>
              {/* Certificados */}
              <section className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-[#00263B]">Certificados</h2>
                  <div className="flex gap-4">
                    <button onClick={() => { openModal('cert'); setTimeout(() => addNewItem('cert'), 100); }} className="text-slate-300 hover:text-[#6385B7]"><Plus size={24} /></button>
                    <button onClick={() => openModal('cert')} className="text-slate-300 hover:text-[#6385B7]"><Pencil size={20} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {userData.certificates?.map((c, i) => (
                    <div key={i} className="border-l-2 border-slate-50 pl-6 first:border-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase leading-tight">{c.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{c.area} • {c.duration}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{c.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ══ ROLE: GESTOR ══ */}
          {userRole === 'gestor' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 md:col-span-8 bg-white p-10 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 flex justify-around">
                  {[{ L: 'Lojas gerenciadas', V: '3' }, { L: 'Colaboradores', V: '47' }, { L: 'Conclusão média', V: '71%' }].map(s => (
                    <div key={s.L} className="text-center">
                      <p className="text-5xl font-black text-[#00263B]">{s.V}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">{s.L}</p>
                    </div>
                  ))}
                </div>
                <div className="col-span-12 md:col-span-4 bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50">
                  <div className="flex items-center gap-4 mb-3 text-[#00263B]">
                    <div className="bg-teal-500 p-2.5 rounded-xl text-white shadow-lg"><TrendingUp size={20} /></div>
                    <p className="text-lg font-black leading-none">+12% este mês</p>
                  </div>
                  <p className="text-xs text-slate-400">Crescimento no engajamento das lojas gerenciadas.</p>
                </div>
              </div>

              {/* Lojas sob gestão */}
              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-black text-[#00263B]">Lojas sob gestão</h2>
                  <button onClick={() => navigate('/gestor')} className="text-[#6385B7] text-xs font-black hover:underline uppercase tracking-widest">Ver painel</button>
                </div>
                {[
                  { name: 'Eldorado',  city: 'São Paulo', employees: 9,  completion: 82, color: 'bg-emerald-500' },
                  { name: 'Pinheiros', city: 'São Paulo', employees: 11, completion: 68, color: 'bg-[#4A72B2]' },
                  { name: 'Moema',     city: 'São Paulo', employees: 8,  completion: 45, color: 'bg-yellow-400' },
                ].map(store => (
                  <div key={store.name} className="flex items-center gap-4 py-3 border-t border-slate-50 first:border-0 first:pt-0">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Store size={18} className="text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#00263B]">{store.name}</p>
                      <p className="text-[10px] text-slate-400">{store.city} · {store.employees} colaboradores</p>
                    </div>
                    <div className="w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${store.color}`} style={{ width: `${store.completion}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{store.completion}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Certificados */}
              <section className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-[#00263B]">Certificados</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {userData.certificates?.map((c, i) => (
                    <div key={i} className="border-l-2 border-slate-50 pl-6 first:border-0">
                      <h3 className="font-bold text-[#00263B] text-sm uppercase leading-tight">{c.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{c.area} • {c.duration}</p>
                      <p className="text-[10px] text-slate-300 mt-1">{c.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ══ ROLE: LOJA ══ */}
          {userRole === 'loja' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
                <div className="col-span-12 md:col-span-8 bg-white p-10 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 flex justify-around">
                  {[{ L: 'Colaboradores', V: '9' }, { L: 'Conclusão média', V: '82%' }, { L: 'Ranking na rede', V: '#2' }].map(s => (
                    <div key={s.L} className="text-center">
                      <p className="text-5xl font-black text-[#00263B]">{s.V}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">{s.L}</p>
                    </div>
                  ))}
                </div>
                <div className="col-span-12 md:col-span-4 bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-400 p-2.5 rounded-xl text-white shadow-lg"><Store size={20} /></div>
                    <div>
                      <p className="text-base font-black text-[#00263B] leading-none">Loja Eldorado</p>
                      <p className="text-[10px] text-emerald-500 font-black mt-1">Ativa</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">São Paulo · SP</p>
                </div>
              </div>

              {/* Ranking da equipe */}
              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-black text-[#00263B]">Progresso da equipe</h2>
                  <button onClick={() => navigate('/loja')} className="text-[#6385B7] text-xs font-black hover:underline uppercase tracking-widest">Ver painel</button>
                </div>
                {[
                  { name: 'Ana Ferreira',  role: 'Coordenadora', pct: 100, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200' },
                  { name: 'Camila Santos', role: 'Atendente',     pct: 100, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200' },
                  { name: 'Beatriz Lima',  role: 'Atendente',     pct: 80,  avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200' },
                  { name: 'Rafael Costa',  role: 'Barista',       pct: 60,  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200' },
                  { name: 'Gabriel Rocha', role: 'Barista',       pct: 40,  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200' },
                ].map((emp, i) => (
                  <div key={emp.name} className="flex items-center gap-4 py-3 border-t border-slate-50 first:border-0 first:pt-0">
                    <span className={`text-xs font-black w-5 text-center flex-shrink-0 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-slate-300'}`}>#{i + 1}</span>
                    <img src={emp.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={emp.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#00263B] truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400">{emp.role}</p>
                    </div>
                    <div className="w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${emp.pct === 100 ? 'bg-emerald-500' : emp.pct >= 60 ? 'bg-[#4A72B2]' : 'bg-yellow-400'}`} style={{ width: `${emp.pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{emp.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cursos obrigatórios */}
              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50 space-y-5">
                <h2 className="text-xl font-black text-[#00263B]">Cursos obrigatórios</h2>
                {[
                  { name: 'Fase 1 - Básico',          done: 9, total: 9 },
                  { name: 'Operação cafeteria',        done: 7, total: 9 },
                  { name: 'Atendimento ao cliente',    done: 6, total: 9 },
                  { name: 'Marketing Digital',         done: 4, total: 9 },
                  { name: 'Páscoa 2026',               done: 3, total: 9 },
                ].map(course => {
                  const pct = Math.round((course.done / course.total) * 100);
                  return (
                    <div key={course.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-[#00263B]">{course.name}</span>
                        <span className="text-slate-400">{course.done}/{course.total} colaboradores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-[#4A72B2]' : 'bg-yellow-400'}`} style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ══ ROLE: ADMIN ══ */}
          {userRole === 'admin' && (
            <>
              {/* Visão geral */}
              <div className="bg-white p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-[#00263B]">Visão geral da plataforma</h2>
                  <button onClick={() => navigate('/admin')} className="text-[#6385B7] text-xs font-black hover:underline uppercase tracking-widest">Painel Admin</button>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                  {[
                    { icon: Users,    label: 'Usuários ativos',   value: users.filter(u => u.active).length, color: 'bg-blue-50 text-blue-500' },
                    { icon: Store,    label: 'Lojas na rede',     value: '8',                                color: 'bg-teal-50 text-teal-500' },
                    { icon: BookOpen, label: 'Cursos publicados', value: '12',                               color: 'bg-purple-50 text-purple-500' },
                    { icon: TrendingUp, label: 'Engajamento',     value: '71%',                              color: 'bg-emerald-50 text-emerald-500' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#00263B]">{value}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribuição por perfil */}
              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50 space-y-5">
                <h2 className="text-xl font-black text-[#00263B]">Distribuição por perfil</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { role: 'admin',      label: 'Admin',      color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
                    { role: 'professor',  label: 'Professor',  color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
                    { role: 'gestor',     label: 'Gestor',     color: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
                    { role: 'loja',       label: 'Líder Loja', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
                    { role: 'franqueado', label: 'Franqueado', color: 'bg-cyan-100 text-cyan-700',     dot: 'bg-cyan-500' },
                    { role: 'aluno',      label: 'Aluno',      color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
                  ].map(({ role, label, color, dot }) => (
                    <div key={role} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl ${color}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <div>
                        <p className="font-black text-lg leading-none">{users.filter(u => u.systemRole === role).length}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usuários recentes */}
              <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-50 space-y-1">
                <h2 className="text-xl font-black text-[#00263B] mb-4">Usuários cadastrados</h2>
                {users.slice(0, 7).map(u => {
                  const roleColors = { admin: 'bg-purple-100 text-purple-700', professor: 'bg-blue-100 text-blue-700', gestor: 'bg-teal-100 text-teal-700', loja: 'bg-orange-100 text-orange-700', franqueado: 'bg-cyan-100 text-cyan-700', aluno: 'bg-slate-100 text-slate-500' };
                  const roleLabels = { admin: 'Admin', professor: 'Professor', gestor: 'Gestor', loja: 'Líder', franqueado: 'Franqueado', aluno: 'Aluno' };
                  return (
                    <div key={u.id} className="flex items-center gap-4 py-3 border-t border-slate-50 first:border-0 first:pt-0">
                      <div className="w-9 h-9 rounded-full bg-[#e2eef9] flex items-center justify-center font-black text-[#4A72B2] text-xs flex-shrink-0">
                        {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#00263B] truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${roleColors[u.systemRole] || 'bg-slate-100 text-slate-500'}`}>
                        {roleLabels[u.systemRole] || u.systemRole}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${u.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-4">
                  <button onClick={() => navigate('/admin')} className="w-full py-3 rounded-xl text-xs font-black text-[#4A72B2] bg-[#e2eef9] hover:bg-[#4A72B2] hover:text-white transition-all">
                    Ver todos os usuários no painel →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MODAL ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[999] bg-[#00263B]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-[#00263B] uppercase tracking-tighter">
                Editando {
                  activeModal === 'profile' ? 'Perfil' :
                  activeModal === 'skills' ? 'Habilidades' :
                  activeModal === 'contacts' ? 'Contatos' :
                  activeModal === 'cert' ? 'Certificados' :
                  activeModal === 'edu' ? 'Educação' : 'Experiência'
                }
              </h2>
              <button onClick={() => setActiveModal(null)}>
                <X className="text-slate-300 hover:text-red-500" />
              </button>
            </div>

            <div className="space-y-6 pb-4">
              {activeModal === 'profile' && (
                <div className="space-y-4">
                  <InputLabel label="Nome" value={tempData.name} onChange={(v) => setTempData({ ...tempData, name: v })} />
                  <SelectLabel
                    label="Pronome"
                    value={tempData.pronoun}
                    onChange={(v) => setTempData({ ...tempData, pronoun: v })}
                    options={['ele/dele', 'ela/dela', 'elu/delu', 'ele/ela', 'outros']}
                    placeholder="Selecione seu pronome"
                  />
                  <SelectLabel
                    label="Unidade / Loja"
                    value={tempData.unit}
                    onChange={(v) => setTempData({ ...tempData, unit: v })}
                    options={TODAS_LOJAS}
                    placeholder="Selecione a loja"
                  />
                  <SelectLabel
                    label="Cargo"
                    value={tempData.role}
                    onChange={(v) => setTempData({ ...tempData, role: v })}
                    options={jobTitles}
                    placeholder="Selecione o cargo"
                  />
                  <CompanyTimeLabel
                    value={tempData.time}
                    onChange={(v) => setTempData({ ...tempData, time: v })}
                  />

                  {/* Banner */}
                  <div className="w-full text-left pt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">
                      Imagem do Banner
                    </label>
                    <div
                      className="w-full h-28 rounded-2xl border border-slate-200 overflow-hidden relative cursor-pointer group"
                      style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                      onClick={() => bannerFileRef.current.click()}
                    >
                      {!bannerImage && (
                        <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-300">
                          <Pencil size={20} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Clique para adicionar</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Trocar imagem</span>
                      </div>
                    </div>
                    <input ref={bannerFileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                    {bannerImage && (
                      <button onClick={removeBanner} className="mt-2 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1">
                        <X size={11} /> Remover banner
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'skills' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 min-h-[48px] p-4 border border-slate-200 rounded-2xl bg-slate-50">
                    {(tempData.skills || []).map(skill => (
                      <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[11px] font-black text-slate-500 rounded-full uppercase shadow-sm">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                      placeholder="Digite uma habilidade e pressione Enter"
                      className="flex-1 bg-white border border-slate-200 px-5 py-3 rounded-2xl font-bold text-[#00263B] outline-none focus:border-[#6385B7] transition-all text-sm"
                    />
                    <button onClick={addSkill} className="px-5 py-3 bg-[#6385B7] text-white rounded-2xl font-black text-sm hover:bg-[#00263B] transition-colors">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'contacts' && (
                <div className="space-y-4">
                  <InputLabel label="Telefone" value={tempData.contacts?.phone || ''} onChange={(v) => setTempData({ ...tempData, contacts: { ...tempData.contacts, phone: v } })} placeholder="(11) 99999-9999" />
                  <InputLabel label="E-mail" value={tempData.contacts?.email || ''} onChange={(v) => setTempData({ ...tempData, contacts: { ...tempData.contacts, email: v } })} placeholder="seu@email.com" />
                  <InputLabel label="LinkedIn" value={tempData.contacts?.linkedin || ''} onChange={(v) => setTempData({ ...tempData, contacts: { ...tempData.contacts, linkedin: v } })} placeholder="https://linkedin.com/in/seu-perfil" />
                  <InputLabel label="Site / Portfolio" value={tempData.contacts?.website || ''} onChange={(v) => setTempData({ ...tempData, contacts: { ...tempData.contacts, website: v } })} placeholder="https://seusite.com.br" />
                </div>
              )}

              {activeModal === 'cert' && tempData.certificates?.map((c, i) => (
                <div key={c.id} className="p-6 bg-slate-50 rounded-3xl space-y-4 relative border border-slate-100">
                  <button onClick={() => removeItem('cert', c.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <InputLabel label="Título" value={c.title} onChange={(v) => { let l = [...tempData.certificates]; l[i].title = v; setTempData({ ...tempData, certificates: l }); }} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputLabel label="Área" value={c.area} onChange={(v) => { let l = [...tempData.certificates]; l[i].area = v; setTempData({ ...tempData, certificates: l }); }} />
                    <InputLabel label="Duração" value={c.duration} onChange={(v) => { let l = [...tempData.certificates]; l[i].duration = v; setTempData({ ...tempData, certificates: l }); }} />
                  </div>
                  <InputLabel label="Período" value={c.date} onChange={(v) => { let l = [...tempData.certificates]; l[i].date = v; setTempData({ ...tempData, certificates: l }); }} />
                </div>
              ))}

              {activeModal === 'edu' && tempData.education?.map((e, i) => (
                <div key={e.id} className="p-6 bg-slate-50 rounded-3xl space-y-4 relative border border-slate-100">
                  <button onClick={() => removeItem('edu', e.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <InputLabel label="Instituição" value={e.institution} onChange={(v) => { let l = [...tempData.education]; l[i].institution = v; setTempData({ ...tempData, education: l }); }} />
                  <InputLabel label="Grau" value={e.level} onChange={(v) => { let l = [...tempData.education]; l[i].level = v; setTempData({ ...tempData, education: l }); }} />
                  <InputLabel label="Data" value={e.date} onChange={(v) => { let l = [...tempData.education]; l[i].date = v; setTempData({ ...tempData, education: l }); }} />
                </div>
              ))}

              {activeModal === 'exp' && tempData.experience?.map((ex, i) => (
                <div key={ex.id} className="p-6 bg-slate-50 rounded-3xl space-y-4 relative border border-slate-100">
                  <button onClick={() => removeItem('exp', ex.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <InputLabel label="Cargo" value={ex.role} onChange={(v) => { let l = [...tempData.experience]; l[i].role = v; setTempData({ ...tempData, experience: l }); }} />
                  <InputLabel label="Empresa" value={ex.company} onChange={(v) => { let l = [...tempData.experience]; l[i].company = v; setTempData({ ...tempData, experience: l }); }} />
                  <InputLabel label="Data" value={ex.date} onChange={(v) => { let l = [...tempData.experience]; l[i].date = v; setTempData({ ...tempData, experience: l }); }} />
                </div>
              ))}

              {['cert', 'edu', 'exp'].includes(activeModal) && (
                <button onClick={() => addNewItem(activeModal)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl font-black text-slate-300 hover:border-[#6385B7] hover:text-[#6385B7] transition-all uppercase text-xs">
                  + ADICIONAR NOVO
                </button>
              )}
            </div>

            <div className="flex gap-4 mt-6 sticky bottom-0 bg-white pt-4 pb-1 border-t border-slate-100 z-10">
              <button onClick={() => setActiveModal(null)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 bg-[#00263B] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-[#6385B7] transition-all flex items-center justify-center gap-2">
                <Save size={20} /> SALVAR TUDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}