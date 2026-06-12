import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, Settings, BarChart2, Home, LogOut,
  Plus, Pencil, X, Check, ToggleLeft, ToggleRight,
  Search, AlertTriangle, Store, UserPlus, Clock, Lock,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import ApprovalsPanel from '../components/ApprovalsPanel';

const ROLE_CONFIG = {
  admin:     { label: 'Admin',     color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  professor: { label: 'Professor', color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  gestor:    { label: 'Gestor',    color: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
  aluno:     { label: 'Aluno',     color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.aluno;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CreateUserForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', systemRole: 'aluno' });
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    onAdd(form);
    setDone(true);
    setTimeout(() => { setDone(false); onClose(); }, 1400);
  };

  return (
    <div className="bg-white rounded-[24px] border-2 border-[#4A72B2]/20 p-7 space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-black text-[#001A26]">Criar novo usuário</p>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500"><X size={18} /></button>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome completo *</label>
          <input autoFocus value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: João Silva"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#4A72B2]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail *</label>
          <input type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="joao@biscoite.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#4A72B2]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfil</label>
          <select value={form.systemRole}
            onChange={e => setForm(p => ({ ...p, systemRole: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#4A72B2] bg-white">
            {Object.entries(ROLE_CONFIG).map(([r, cfg]) => (
              <option key={r} value={r}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs">Cancelar</button>
        <button onClick={handleSubmit} disabled={!form.name.trim() || !form.email.trim()}
          className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${done ? 'bg-emerald-500 text-white' : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'}`}>
          {done ? <><Check size={13} /> Criado!</> : <><Plus size={13} /> Criar usuário</>}
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { systemRole, users, updateUser, addUser } = useProfile();
  const [activeTab, setActiveTab] = useState('aprovacoes');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState('');

  const handleLogout = () => {
    ['biscoite_auth', 'biscoite_access_token', 'biscoite_refresh_token', 'biscoite_logged_user']
      .forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    navigate('/login');
  };

  if (systemRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f6f9fd] flex items-center justify-center">
        <div className="bg-white rounded-[32px] p-12 text-center space-y-5 shadow-sm max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto">
            <Lock size={28} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-black text-[#001A26]">Acesso restrito</h2>
          <p className="text-slate-400 text-sm">Esta área é exclusiva para administradores da plataforma.</p>
          <button onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#001A26] text-white rounded-xl font-bold text-sm hover:bg-[#4A72B2] transition-colors">
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.systemRole === filterRole;
    return matchSearch && matchRole;
  });

  const countByRole = Object.keys(ROLE_CONFIG).reduce((acc, r) => {
    acc[r] = users.filter(u => u.systemRole === r).length;
    return acc;
  }, {});

  const navItems = [
    { id: 'aprovacoes', label: 'Aprovações', icon: Clock },
    { id: 'usuarios',   label: 'Usuários',   icon: Users },
    { id: 'lojas',      label: 'Lojas',      icon: Store },
    { id: 'relatorio',  label: 'Relatório',  icon: BarChart2 },
    { id: 'config',     label: 'Config',     icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fd] flex">

      {/* SIDEBAR */}
      <aside className="w-64 min-h-screen bg-[#001A26] flex flex-col py-8 px-6 fixed left-0 top-0 bottom-0 z-30">
        <div className="mb-10 text-center">
          <img src="/logo-biscoite.svg" alt="Logo" className="h-8 mx-auto mb-1 brightness-0 invert" />
          <div className="mt-3 inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-500/30">
            <Shield size={10} /> PAINEL ADMIN
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="space-y-2 mt-8 pt-8 border-t border-white/10">
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-white/40 hover:bg-white/5 hover:text-white/70 transition-all">
            <Home size={18} /> Ir para Home
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="ml-64 flex-1 p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-[#001A26]">Painel Administrativo</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie usuários, aprovações e configurações da plataforma.</p>
        </div>

        {/* Stats por role */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
            <button key={role} onClick={() => setFilterRole(prev => prev === role ? null : role)}
              className={`p-4 rounded-[18px] border-2 text-center transition-all ${
                filterRole === role ? 'border-[#4A72B2] bg-[#e2eef9]' : 'border-slate-100 bg-white hover:border-slate-200'
              }`}>
              <p className="text-xl font-black text-[#001A26]">{countByRole[role] || 0}</p>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${cfg.color}`}>{cfg.label}</span>
            </button>
          ))}
        </div>

        {/* ── APROVAÇÕES ── */}
        {activeTab === 'aprovacoes' && <ApprovalsPanel />}

        {/* ── USUÁRIOS ── */}
        {activeTab === 'usuarios' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 h-12">
                <Search size={16} className="text-slate-300 flex-shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="flex-1 text-sm bg-transparent outline-none text-slate-600 placeholder-slate-300" />
                {search && <button onClick={() => setSearch('')}><X size={14} className="text-slate-300" /></button>}
              </div>
              {filterRole && (
                <button onClick={() => setFilterRole(null)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#4A72B2] bg-[#e2eef9] rounded-xl">
                  {ROLE_CONFIG[filterRole]?.label} <X size={12} />
                </button>
              )}
              <button onClick={() => setShowCreate(p => !p)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-xl text-xs font-black transition-all">
                <UserPlus size={14} /> Novo usuário
              </button>
            </div>

            {showCreate && <CreateUserForm onAdd={addUser} onClose={() => setShowCreate(false)} />}

            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Usuário', 'Perfil', 'Loja', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#e2eef9] flex items-center justify-center font-black text-[#4A72B2] text-xs flex-shrink-0">
                            {user.name?.split(' ').map(n => n[0]).slice(0, 2).join('') || '??'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#001A26]">{user.name}</p>
                            <p className="text-[10px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {editingId === user.id ? (
                          <div className="flex items-center gap-2">
                            <select value={editRole} onChange={e => setEditRole(e.target.value)} autoFocus
                              className="px-3 py-1.5 rounded-xl border border-[#4A72B2] text-xs font-black text-[#001A26] outline-none bg-white">
                              {Object.entries(ROLE_CONFIG).map(([r, cfg]) => (
                                <option key={r} value={r}>{cfg.label}</option>
                              ))}
                            </select>
                            <button onClick={() => { updateUser(user.id, { systemRole: editRole }); setEditingId(null); }}
                              className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                              <Check size={13} />
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <RoleBadge role={user.systemRole} />
                            <button onClick={() => { setEditingId(user.id); setEditRole(user.systemRole); }}
                              className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#e2eef9] hover:text-[#4A72B2] flex items-center justify-center">
                              <Pencil size={11} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-400">{user.unit || user.store_name || '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          user.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => updateUser(user.id, { active: !user.active })}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-500 hover:bg-red-50 hover:text-red-500'
                              : 'bg-red-50 text-red-400 hover:bg-emerald-50 hover:text-emerald-500'
                          }`}>
                          {user.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LOJAS ── */}
        {activeTab === 'lojas' && (
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-10 text-center space-y-4">
            <Store size={28} className="text-slate-400 mx-auto" />
            <p className="font-black text-[#001A26]">Gestão de Lojas em breve</p>
            <p className="text-sm text-slate-400">Esta seção exibirá as lojas e seus colaboradores.</p>
          </div>
        )}

        {/* ── RELATÓRIO ── */}
        {activeTab === 'relatorio' && (
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-10 text-center space-y-4">
            <BarChart2 size={28} className="text-slate-400 mx-auto" />
            <p className="font-black text-[#001A26]">Relatórios em breve</p>
            <p className="text-sm text-slate-400">Análises de conclusão de cursos e engajamento por loja e perfil.</p>
          </div>
        )}

        {/* ── CONFIG ── */}
        {activeTab === 'config' && (
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 space-y-6 max-w-md">
            <p className="font-black text-[#001A26]">Configurações da plataforma</p>
            <button onClick={() => navigate('/configuracoes')}
              className="flex items-center gap-2 px-5 py-3 bg-[#001A26] text-white rounded-xl text-sm font-bold hover:bg-[#4A72B2] transition-colors">
              <Settings size={15} /> Abrir configurações completas
            </button>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-2">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">Apenas admins têm acesso a configurações avançadas.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
