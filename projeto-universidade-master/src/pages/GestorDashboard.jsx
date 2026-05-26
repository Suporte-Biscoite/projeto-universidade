import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Users, TrendingUp, BarChart2, Search, X,
  ChevronRight, CheckCircle, Clock, BookOpen, AlertTriangle,
  Home, Settings, Check, Star, LogOut, ChevronDown,
} from 'lucide-react';
import { useProfile, STORES } from '../context/ProfileContext';

// ─── Dados de progresso simulados por colaborador ─────────────────────────────
const EMPLOYEE_PROGRESS = {
  3:  { coursesCompleted: 3, coursesTotal: 5, lastActivity: '2 dias atrás',   avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', role: 'Atendente' },
  4:  { coursesCompleted: 1, coursesTotal: 5, lastActivity: '2 semanas atrás', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200', role: 'Barista' },
  5:  { coursesCompleted: 4, coursesTotal: 5, lastActivity: 'Hoje',            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200', role: 'Atendente' },
  6:  { coursesCompleted: 5, coursesTotal: 5, lastActivity: 'Ontem',           avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200', role: 'Coordenadora' },
  7:  { coursesCompleted: 2, coursesTotal: 5, lastActivity: '3 dias atrás',   avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200', role: 'Barista' },
  8:  { coursesCompleted: 5, coursesTotal: 5, lastActivity: 'Hoje',            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200', role: 'Atendente' },
  9:  { coursesCompleted: 0, coursesTotal: 5, lastActivity: '1 mês atrás',    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200', role: 'Repositor' },
  10: { coursesCompleted: 3, coursesTotal: 5, lastActivity: 'Hoje',            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200', role: 'Atendente' },
  11: { coursesCompleted: 4, coursesTotal: 5, lastActivity: 'Ontem',           avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200', role: 'Barista' },
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-[24px] p-6 flex items-start gap-4 shadow-sm border border-slate-100">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-[#001A26]">{value}</p>
        <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-300 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-[#4A72B2]' : pct >= 30 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Badge de status ──────────────────────────────────────────────────────────
function StatusBadge({ active }) {
  return active
    ? <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">Ativo</span>
    : <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full">Inativo</span>;
}

// ─── Store Overview Card ──────────────────────────────────────────────────────
function StoreCard({ store, employees, onClick, isSelected }) {
  const total = employees.length;
  const activeCount = employees.filter(e => e.active).length;
  const completedAll = employees.filter(e => {
    const p = EMPLOYEE_PROGRESS[e.id];
    return p && p.coursesCompleted === p.coursesTotal;
  }).length;
  const avgProgress = total > 0
    ? Math.round(employees.reduce((acc, e) => {
        const p = EMPLOYEE_PROGRESS[e.id];
        return acc + (p ? (p.coursesCompleted / p.coursesTotal) * 100 : 0);
      }, 0) / total)
    : 0;

  return (
    <button
      onClick={onClick}
      className={`text-left p-6 rounded-[24px] border-2 transition-all duration-200 w-full ${
        isSelected
          ? 'border-[#4A72B2] bg-[#e2eef9] shadow-md'
          : 'border-slate-100 bg-white hover:border-[#4A72B2]/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-black text-[#001A26] text-sm">{store.name}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{store.city} — {store.state}</p>
        </div>
        <Store size={18} className={isSelected ? 'text-[#4A72B2]' : 'text-slate-300'} />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-bold text-slate-400">
          <span>{total} colaboradores</span>
          <span>{activeCount} ativos</span>
        </div>
        <ProgressBar value={avgProgress} max={100} />
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-400">{completedAll} finalizaram todos os cursos</span>
          <span className={`font-bold ${avgProgress >= 60 ? 'text-[#4A72B2]' : 'text-yellow-500'}`}>{avgProgress}% médio</span>
        </div>
      </div>
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GestorDashboard() {
  const navigate = useNavigate();
  const { users, systemRole, setSystemRole } = useProfile();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [search, setSearch] = useState('');

  const isFranqueado = systemRole === 'franqueado';
  const roleLabel    = isFranqueado ? 'Franqueado'    : 'Gestor regional';
  const panelLabel   = isFranqueado ? 'Painel do Franqueado' : 'Painel do Gestor';
  const sidebarColor = isFranqueado ? 'text-cyan-500'  : 'text-slate-400';

  // Simula o gestor/franqueado logado
  const GESTOR_STORE_IDS = ['loja_eldorado', 'loja_pinheiros', 'loja_moema'];

  const managedStores = STORES.filter(s => GESTOR_STORE_IDS.includes(s.id));

  const getStoreEmployees = (storeId) =>
    users.filter(u => u.systemRole === 'aluno' && u.storeId === storeId);

  const allEmployees = managedStores.flatMap(s => getStoreEmployees(s.id));

  const displayedStore = selectedStoreId
    ? managedStores.find(s => s.id === selectedStoreId)
    : null;

  const displayedEmployees = (selectedStoreId
    ? getStoreEmployees(selectedStoreId)
    : allEmployees
  ).filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  // Métricas globais
  const totalEmployees = allEmployees.length;
  const activeEmployees = allEmployees.filter(e => e.active).length;
  const completedAll = allEmployees.filter(e => {
    const p = EMPLOYEE_PROGRESS[e.id];
    return p && p.coursesCompleted === p.coursesTotal;
  }).length;
  const avgCompletion = totalEmployees > 0
    ? Math.round(allEmployees.reduce((acc, e) => {
        const p = EMPLOYEE_PROGRESS[e.id];
        return acc + (p ? (p.coursesCompleted / p.coursesTotal) * 100 : 0);
      }, 0) / totalEmployees)
    : 0;

  const navItems = [
    { id: 'overview', label: 'Visão geral', icon: BarChart2 },
    { id: 'employees', label: 'Colaboradores', icon: Users },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fd] flex">

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col py-8 px-6 fixed left-0 top-0 bottom-0 z-30">
        <div className="mb-10 text-center">
          <img src="/logo-biscoite.svg" alt="Logo" className="h-8 mx-auto mb-1" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{panelLabel}</p>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === id
                  ? 'bg-[#e2eef9] text-[#4A72B2]'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-[#001A26]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="space-y-2 mt-8 pt-8 border-t border-slate-100">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-[#001A26] transition-all"
          >
            <Home size={18} /> Ir para Home
          </button>
          <button
            onClick={() => { setSystemRole('admin'); navigate('/'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-50 hover:text-red-400 transition-all"
          >
            <LogOut size={18} /> Sair do painel
          </button>
        </div>
      </aside>

      {/* ── CONTEÚDO ─────────────────────────────────────────────── */}
      <main className="ml-64 flex-1 p-10 space-y-10 max-w-[1100px]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#001A26]">Olá, {isFranqueado ? 'Franqueado' : 'Paula'}</h1>
            <p className="text-slate-400 text-sm mt-1">{roleLabel} · {managedStores.length} lojas sob sua responsabilidade</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {managedStores.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStoreId(prev => prev === s.id ? null : s.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    selectedStoreId === s.id
                      ? 'bg-[#4A72B2] text-white shadow-md'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-[#4A72B2]'
                  }`}
                >
                  {s.name.replace('Loja ', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Store}       label="Lojas gerenciadas" value={managedStores.length} color="bg-blue-50 text-blue-500" />
              <StatCard icon={Users}       label="Colaboradores"     value={totalEmployees}        sub={`${activeEmployees} ativos`} color="bg-emerald-50 text-emerald-500" />
              <StatCard icon={TrendingUp}  label="Conclusão média"   value={`${avgCompletion}%`}  sub="de todos os cursos" color="bg-purple-50 text-purple-500" />
              <StatCard icon={CheckCircle} label="Concluíram tudo"   value={completedAll}          sub="colaboradores" color="bg-orange-50 text-orange-500" />
            </div>

            {/* Store cards */}
            <div>
              <h2 className="text-lg font-black text-[#001A26] mb-4">Suas lojas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {managedStores.map(store => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    employees={getStoreEmployees(store.id)}
                    isSelected={selectedStoreId === store.id}
                    onClick={() => {
                      setSelectedStoreId(prev => prev === store.id ? null : store.id);
                      setActiveTab('employees');
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Alertas */}
            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-[#001A26]">Alertas de progresso</h2>
              {allEmployees
                .filter(e => {
                  const p = EMPLOYEE_PROGRESS[e.id];
                  return p && p.coursesCompleted === 0;
                })
                .map(e => {
                  const store = managedStores.find(s => s.id === e.storeId);
                  return (
                    <div key={e.id} className="flex items-center gap-3 py-3 border-t border-slate-100 first:border-0 first:pt-0">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={14} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#001A26]">{e.name}</p>
                        <p className="text-[10px] text-slate-400">{store?.name} · Nenhum curso iniciado</p>
                      </div>
                      <StatusBadge active={e.active} />
                    </div>
                  );
                })}
              {allEmployees.filter(e => { const p = EMPLOYEE_PROGRESS[e.id]; return p && p.coursesCompleted === 0; }).length === 0 && (
                <p className="text-xs text-slate-400">Nenhum alerta crítico no momento.</p>
              )}
            </div>
          </div>
        )}

        {/* ── EMPLOYEES TAB ─────────────────────────────────────── */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 h-12">
                <Search size={16} className="text-slate-300 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar colaborador..."
                  className="flex-1 text-sm bg-transparent outline-none text-slate-600 placeholder-slate-300"
                />
                {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-300" /></button>}
              </div>
              {selectedStoreId && (
                <button
                  onClick={() => setSelectedStoreId(null)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#4A72B2] bg-[#e2eef9] rounded-xl"
                >
                  {managedStores.find(s => s.id === selectedStoreId)?.name}
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Colaborador</th>
                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-4">Loja</th>
                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-4">Progresso</th>
                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-4">Última atividade</th>
                    <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEmployees.map(emp => {
                    const prog = EMPLOYEE_PROGRESS[emp.id] || { coursesCompleted: 0, coursesTotal: 5, lastActivity: '—', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200', role: 'Colaborador' };
                    const store = managedStores.find(s => s.id === emp.storeId);
                    return (
                      <tr key={emp.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={prog.avatar} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={emp.name} />
                            <div>
                              <p className="text-sm font-bold text-[#001A26]">{emp.name}</p>
                              <p className="text-[10px] text-slate-400">{prog.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-slate-500">{store?.name ?? '—'}</span>
                        </td>
                        <td className="px-4 py-4 min-w-[140px]">
                          <div className="space-y-1">
                            <ProgressBar value={prog.coursesCompleted} max={prog.coursesTotal} />
                            <p className="text-[10px] text-slate-400">{prog.coursesCompleted}/{prog.coursesTotal} cursos</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock size={11} /> {prog.lastActivity}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge active={emp.active} />
                        </td>
                      </tr>
                    );
                  })}
                  {displayedEmployees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Nenhum colaborador encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COURSES TAB ───────────────────────────────────────── */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-[#001A26]">Progresso por curso</h2>

            {['Fase 1 - Básico', 'Operação cafeteria', 'Páscoa 2026', 'Atendimento ao cliente', 'Marketing Digital'].map((course, ci) => {
              const enrolled = allEmployees.length;
              const completed = Math.round(enrolled * [0.8, 0.55, 0.3, 0.65, 0.45][ci]);
              const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
              return (
                <div key={course} className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-[#001A26] text-sm">{course}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{completed} de {enrolled} colaboradores concluíram</p>
                    </div>
                    <span className={`text-sm font-black ${pct >= 60 ? 'text-[#4A72B2]' : 'text-yellow-500'}`}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} max={100} />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
