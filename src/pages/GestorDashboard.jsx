import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, Users, TrendingUp, BarChart2, Search, X,
  ChevronRight, CheckCircle, Clock, BookOpen, AlertTriangle,
  Home, LogOut, Loader,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { authFetch } from '../utils/authFetch';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLoggedUser() {
  try {
    const raw = sessionStorage.getItem('biscoite_logged_user')
             || localStorage.getItem('biscoite_logged_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Componentes visuais ──────────────────────────────────────────────────────
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

function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = pct === 100
    ? 'bg-emerald-500'
    : pct >= 60 ? 'bg-[#4A72B2]'
    : pct >= 30 ? 'bg-yellow-400'
    : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function StatusBadge({ active }) {
  return active
    ? <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">Ativo</span>
    : <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full">Inativo</span>;
}

function InitialsAvatar({ name, size = 36 }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="rounded-full bg-[#e2eef9] flex items-center justify-center font-black text-[#4A72B2] flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

// ─── GestorDashboard ──────────────────────────────────────────────────────────
export default function GestorDashboard() {
  const navigate        = useNavigate();
  const { systemRole }  = useProfile();

  const loggedUser  = getLoggedUser();
  const storeName   = loggedUser?.store_name || null;

  const [activeTab, setActiveTab]         = useState('overview');
  const [search, setSearch]               = useState('');
  const [colaboradores, setColaboradores] = useState([]);
  const [progress, setProgress]           = useState({}); // { userId: { completed, total } }
  const [courses, setCourses]             = useState([]);
  const [courseProgress, setCourseProgress] = useState({}); // { courseId: { completed, total } }
  const [loading, setLoading]             = useState(true);

  // ── Busca colaboradores da mesma loja ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Todos os usuários ativos (admin pode ver todos, gestor filtra por loja)
      const usersRes = await authFetch('/api/users');
      if (!usersRes.ok) return;
      const allUsers = await usersRes.json();

      // Colaboradores da loja do gestor (ou todos os alunos se não tiver loja definida)
      const team = allUsers.filter(u =>
        u.active &&
        u.status === 'approved' &&
        (u.role === 'aluno' || u.role === 'gestor') &&
        u.id !== loggedUser?.id &&
        (storeName ? (u.store_name === storeName) : true)
      );

      setColaboradores(team);

      // Cursos publicados
      const coursesRes = await authFetch('/api/courses');
      const allCourses = coursesRes.ok ? await coursesRes.json() : [];
      const published  = Array.isArray(allCourses) ? allCourses.filter(c => c.published) : [];
      setCourses(published);

      // Progresso de cada colaborador (certificados = cursos concluídos)
      const certsRes  = await authFetch('/api/data?resource=certificates');
      const allCerts  = certsRes.ok ? await certsRes.json() : [];
      const certsData = Array.isArray(allCerts) ? allCerts : [];

      const progressMap = {};
      for (const u of team) {
        const userCerts = certsData.filter(c => c.user_id === u.id);
        progressMap[u.id] = {
          completed: userCerts.length,
          total:     published.length,
        };
      }
      setProgress(progressMap);

      // Progresso por curso (quantos colaboradores concluíram cada curso)
      const cpMap = {};
      for (const c of published) {
        const completedCount = certsData.filter(cert =>
          cert.course_id === c.id &&
          team.some(u => u.id === cert.user_id)
        ).length;
        cpMap[c.id] = { completed: completedCount, total: team.length };
      }
      setCourseProgress(cpMap);

    } catch (e) {
      console.error('[GestorDashboard]', e);
    } finally {
      setLoading(false);
    }
  }, [storeName, loggedUser?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Métricas ───────────────────────────────────────────────────────────────
  const totalColabs   = colaboradores.length;
  const activeColabs  = colaboradores.filter(u => u.active).length;
  const completedAll  = colaboradores.filter(u => {
    const p = progress[u.id];
    return p && p.total > 0 && p.completed >= p.total;
  }).length;
  const avgCompletion = totalColabs > 0
    ? Math.round(colaboradores.reduce((acc, u) => {
        const p = progress[u.id];
        return acc + (p && p.total > 0 ? (p.completed / p.total) * 100 : 0);
      }, 0) / totalColabs)
    : 0;

  // ── Colaboradores filtrados pela busca ─────────────────────────────────────
  const filteredColabs = colaboradores.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Alertas: sem nenhum curso iniciado ─────────────────────────────────────
  const alertas = colaboradores.filter(u => {
    const p = progress[u.id];
    return !p || p.completed === 0;
  });

  const handleLogout = () => {
    ['biscoite_auth', 'biscoite_access_token', 'biscoite_refresh_token', 'biscoite_logged_user']
      .forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    navigate('/login');
  };

  const navItems = [
    { id: 'overview',   label: 'Visão geral',   icon: BarChart2 },
    { id: 'employees',  label: 'Colaboradores',  icon: Users },
    { id: 'courses',    label: 'Cursos',         icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fd] flex">

      {/* ── SIDEBAR ── */}
      <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col py-8 px-6 fixed left-0 top-0 bottom-0 z-30">
        <div className="mb-10 text-center">
          <img src="/logo-biscoite.svg" alt="Logo" className="h-8 mx-auto mb-1" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Painel do Gestor</p>
        </div>

        {storeName && (
          <div className="mb-6 px-4 py-3 bg-[#e2eef9] rounded-2xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sua loja</p>
            <p className="text-xs font-black text-[#4A72B2] leading-tight">{storeName}</p>
          </div>
        )}

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
              <Icon size={18} /> {label}
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:bg-red-50 hover:text-red-400 transition-all"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* ── CONTEÚDO ── */}
      <main className="ml-64 flex-1 p-10 space-y-10 max-w-[1100px]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#001A26]">
              Olá, {loggedUser?.name?.split(' ')[0] || 'Gestor'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {storeName
                ? `Gestão de equipe · ${storeName}`
                : 'Painel de gestão de colaboradores'}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-500 hover:border-[#4A72B2] hover:text-[#4A72B2] transition-all"
          >
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader size={32} className="animate-spin text-[#4A72B2]" />
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users}       label="Colaboradores"   value={totalColabs}         sub={`${activeColabs} ativos`} color="bg-blue-50 text-blue-500" />
                  <StatCard icon={TrendingUp}  label="Conclusão média" value={`${avgCompletion}%`} sub="de todos os cursos"         color="bg-purple-50 text-purple-500" />
                  <StatCard icon={CheckCircle} label="Concluíram tudo" value={completedAll}         sub="colaboradores"             color="bg-emerald-50 text-emerald-500" />
                  <StatCard icon={BookOpen}    label="Cursos ativos"   value={courses.length}       sub="disponíveis"               color="bg-orange-50 text-orange-500" />
                </div>

                {/* Top colaboradores */}
                {colaboradores.length > 0 && (
                  <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-black text-[#001A26]">Colaboradores em destaque</h2>
                      <button onClick={() => setActiveTab('employees')} className="text-[10px] font-black text-[#4A72B2] hover:underline flex items-center gap-1">
                        Ver todos <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[...colaboradores]
                        .sort((a, b) => (progress[b.id]?.completed || 0) - (progress[a.id]?.completed || 0))
                        .slice(0, 5)
                        .map(u => {
                          const p = progress[u.id] || { completed: 0, total: courses.length };
                          return (
                            <div key={u.id} className="flex items-center gap-4 py-2">
                              <InitialsAvatar name={u.name} size={36} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#001A26] truncate">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{u.position || u.role || 'Colaborador'}</p>
                              </div>
                              <div className="w-32">
                                <ProgressBar value={p.completed} max={Math.max(p.total, 1)} />
                                <p className="text-[9px] text-slate-400 text-right mt-0.5">{p.completed}/{p.total} cursos</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Alertas */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-sm font-black text-[#001A26] mb-4">
                    Alertas de engajamento
                    {alertas.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-500 text-[9px] font-black rounded-full">{alertas.length}</span>
                    )}
                  </h2>
                  {alertas.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum alerta no momento. Todos os colaboradores iniciaram pelo menos um curso.</p>
                  ) : alertas.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center gap-3 py-3 border-t border-slate-100 first:border-0 first:pt-0">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={14} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#001A26]">{u.name}</p>
                        <p className="text-[10px] text-slate-400">Nenhum curso iniciado ainda</p>
                      </div>
                      <StatusBadge active={u.active} />
                    </div>
                  ))}
                  {alertas.length > 5 && (
                    <button onClick={() => setActiveTab('employees')} className="mt-3 text-[10px] font-black text-[#4A72B2] hover:underline">
                      Ver mais {alertas.length - 5} colaboradores →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── COLABORADORES ── */}
            {activeTab === 'employees' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 h-12">
                    <Search size={16} className="text-slate-300 flex-shrink-0" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar colaborador por nome ou e-mail..."
                      className="flex-1 text-sm bg-transparent outline-none text-slate-600 placeholder-slate-300"
                    />
                    {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-300" /></button>}
                  </div>
                </div>

                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Colaborador', 'Cargo', 'Progresso', 'Cursos', 'Status'].map(h => (
                          <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredColabs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                            {colaboradores.length === 0
                              ? 'Nenhum colaborador encontrado para esta loja.'
                              : 'Nenhum colaborador corresponde à busca.'}
                          </td>
                        </tr>
                      ) : filteredColabs.map(u => {
                        const p = progress[u.id] || { completed: 0, total: courses.length };
                        return (
                          <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {u.avatar_url
                                  ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt={u.name} />
                                  : <InitialsAvatar name={u.name} size={36} />
                                }
                                <div>
                                  <p className="text-sm font-bold text-[#001A26]">{u.name}</p>
                                  <p className="text-[10px] text-slate-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs text-slate-500">{u.position || '—'}</span>
                            </td>
                            <td className="px-4 py-4 min-w-[140px]">
                              <div className="space-y-1">
                                <ProgressBar value={p.completed} max={Math.max(p.total, 1)} />
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-[10px] font-bold text-slate-500">{p.completed}/{p.total}</span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge active={u.active} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CURSOS ── */}
            {activeTab === 'courses' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-[#001A26]">Progresso por curso</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Quantos colaboradores da sua equipe concluíram cada curso.
                  </p>
                </div>

                {courses.length === 0 ? (
                  <div className="bg-white rounded-[24px] p-12 text-center text-slate-400 border border-slate-100">
                    <BookOpen size={32} className="mx-auto mb-3 text-slate-200" />
                    <p className="font-bold">Nenhum curso publicado ainda.</p>
                  </div>
                ) : courses.map(course => {
                  const cp  = courseProgress[course.id] || { completed: 0, total: totalColabs };
                  const pct = cp.total > 0 ? Math.round((cp.completed / cp.total) * 100) : 0;
                  return (
                    <div key={course.id} className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        {course.thumbnail_url && (
                          <img src={course.thumbnail_url} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt={course.title} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-[#001A26] text-sm truncate">{course.title}</p>
                            <span className={`text-sm font-black ml-4 flex-shrink-0 ${pct >= 60 ? 'text-[#4A72B2]' : 'text-yellow-500'}`}>
                              {pct}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {course.category} · {course.level}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {cp.completed} de {cp.total} colaboradores concluíram
                          </p>
                        </div>
                      </div>
                      <ProgressBar value={cp.completed} max={Math.max(cp.total, 1)} />
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
