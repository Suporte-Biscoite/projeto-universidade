import { useState, useEffect } from 'react';
import {
  Menu, Users, Settings as SettingsIcon, User,
  Pencil, X, Check, Lock, Eye, EyeOff, Camera,
  ChevronUp, ChevronDown, AlertTriangle,
  Shield, GripVertical, ToggleLeft, ToggleRight, Save, Plus, UserPlus,
  Loader, Search,
} from 'lucide-react';
import { useProfile, STORES } from '../context/ProfileContext';
import { TODAS_LOJAS } from '../utils/stores';

// ─── Constantes ──────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  admin:      'Admin',
  professor:  'Professor',
  gestor:     'Gestor',
  loja:       'Líder Loja',
  franqueado: 'Franqueado',
  aluno:      'Aluno',
};
const ROLE_COLORS = {
  admin:      'bg-purple-100 text-purple-700',
  professor:  'bg-blue-100 text-blue-700',
  gestor:     'bg-teal-100 text-teal-700',
  loja:       'bg-orange-100 text-orange-700',
  franqueado: 'bg-cyan-100 text-cyan-700',
  aluno:      'bg-slate-100 text-slate-600',
};

// ─── Componentes compartilhados ──────────────────────────────────────────────
function RoleBadge({ role }) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-600'}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function LockMessage({ message = 'Apenas admins podem acessar esta seção.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Lock size={28} className="text-slate-400" />
      </div>
      <div>
        <p className="font-black text-[#001A26] text-base">Acesso restrito</p>
        <p className="text-slate-400 text-sm mt-1 font-medium max-w-xs">{message}</p>
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, maxLength = 200, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300"
      />
    </div>
  );
}

// ─── Tab: Menus ───────────────────────────────────────────────────────────────
function MenusTab({ menuItems, onToggle, onReorder }) {
  const sorted = [...menuItems].sort((a, b) => a.order - b.order);
  const navItems = sorted.filter(i => i.group === 'nav');
  const dropdownItems = sorted.filter(i => i.group === 'dropdown');

  const Section = ({ title, items }) => (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-2xl px-5 py-4 border border-slate-100 flex items-center gap-4">
            <GripVertical size={14} className="text-slate-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#001A26] text-sm">{item.label}</p>
              <p className="text-[10px] text-slate-400 font-medium">{item.path}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onReorder(item.id, 'up')}
                disabled={idx === 0}
                className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#e2eef9] hover:text-[#4A72B2] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp size={13} />
              </button>
              <button
                onClick={() => onReorder(item.id, 'down')}
                disabled={idx === items.length - 1}
                className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#e2eef9] hover:text-[#4A72B2] flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown size={13} />
              </button>
              <button
                onClick={() => onToggle(item.id)}
                title={item.visible ? 'Ocultar' : 'Mostrar'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  item.visible
                    ? 'bg-[#4A72B2] text-white hover:bg-[#001A26]'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-amber-700 leading-relaxed">
          Ocultar um menu remove o acesso visual, mas a URL ainda é acessível.
          Para bloquear o acesso real, implemente proteção de rota no backend.
        </p>
      </div>
      <Section title="Menu principal (navbar)" items={navItems} />
      <Section title="Menu do perfil (dropdown)" items={dropdownItems} />
    </div>
  );
}

// ─── Tab: Usuários ────────────────────────────────────────────────────────────
const EMPTY_NEW_USER = { name: '', email: '', systemRole: 'aluno', unit: '', storeId: '' };

// ─── Tab: Minha Conta ─────────────────────────────────────────────────────────
function MinhaContaTab({ userData, onUpdate, onUpdateImage, profileImage }) {
  const [form, setForm]       = useState({ name: userData.name || '', unit: userData.unit || '' });
  const [pwdForm, setPwdForm] = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  // Sincroniza o form quando userData.unit é atualizado externamente
  // (ex: usuário salvou a loja no modal de Editar Perfil)
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      name: userData.name || prev.name,
      unit: userData.unit || prev.unit,
    }));
  }, [userData.unit, userData.name]);

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await onUpdate({ name: form.name.trim(), unit: form.unit, store_name: form.unit });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError('Erro ao salvar. Tente novamente.'); }
    finally { setSaving(false); }
  };

  const handleSavePassword = async () => {
    if (pwdForm.password.length < 8) { setError('Senha deve ter no mínimo 8 caracteres'); return; }
    if (pwdForm.password !== pwdForm.confirm) { setError('As senhas não coincidem'); return; }
    setSaving(true); setError('');
    try {
      await onUpdate({ password: pwdForm.password });
      setPwdForm({ password: '', confirm: '' });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError('Erro ao salvar senha.'); }
    finally { setSaving(false); }
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onUpdateImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 max-w-md">
      {/* Foto de perfil */}
      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Foto de perfil</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={profileImage} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" alt="Perfil" />
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-[#4A72B2] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#001A26] transition-colors">
              <Camera size={13} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
          <div>
            <p className="text-sm font-bold text-[#001A26]">Alterar foto</p>
            <p className="text-xs text-slate-400">JPG, PNG ou GIF. Máx. 2MB.</p>
          </div>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dados pessoais</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Nome completo</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2]" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Unidade / Loja</label>
            <select
              value={form.unit}
              onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2] bg-white appearance-none"
            >
              <option value="">Selecione a loja...</option>
              {TODAS_LOJAS.map(loja => (
                <option key={loja} value={loja}>{loja}</option>
              ))}
            </select>
            {form.unit && !TODAS_LOJAS.includes(form.unit) && (
              <p className="text-[10px] text-amber-500 mt-1">
                Valor atual: "{form.unit}" — selecione a loja correta acima para atualizar.
              </p>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={handleSaveProfile} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${saved ? 'bg-emerald-500 text-white' : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'}`}>
          {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar dados</>}
        </button>
      </div>

      {/* Trocar senha */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trocar senha</p>
        <div className="space-y-3">
          <div className="relative">
            <input type={showPwd ? 'text' : 'password'} value={pwdForm.password}
              onChange={e => setPwdForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Nova senha (mín. 8 caracteres)"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2]" />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <input type={showPwd ? 'text' : 'password'} value={pwdForm.confirm}
            onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}
            placeholder="Confirmar nova senha"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2]" />
        </div>
        <button onClick={handleSavePassword} disabled={saving || !pwdForm.password}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black bg-[#001A26] hover:bg-[#4A72B2] text-white transition-all disabled:opacity-40">
          <Lock size={14} /> Alterar senha
        </button>
      </div>
    </div>
  );
}

function UsuariosTab() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('biscoite_access_token') || localStorage.getItem('biscoite_access_token');
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateRole = async (userId, newRole) => {
    setSaving(true);
    const token = sessionStorage.getItem('biscoite_access_token') || localStorage.getItem('biscoite_access_token');
    try {
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setEditingId(null);
      }
    } catch {}
    setSaving(false);
  };

  const ROLE_LABELS = { admin: 'Admin', professor: 'Professor', gestor: 'Gestor', aluno: 'Colaborador' };
  const ROLE_COLORS = {
    admin:     'bg-purple-100 text-purple-700',
    professor: 'bg-blue-100 text-blue-700',
    gestor:    'bg-teal-100 text-teal-700',
    aluno:     'bg-slate-100 text-slate-600',
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3">
        <Search size={15} className="text-slate-400 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="flex-1 text-sm outline-none text-slate-600 placeholder:text-slate-300" />
      </div>

      {/* Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex gap-3">
        <Shield size={16} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          Alterações de role são salvas no banco imediatamente. Novos usuários devem se registrar pela página de cadastro.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader size={24} className="animate-spin text-[#4A72B2]" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className="bg-white rounded-2xl px-4 sm:px-6 py-4 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e2eef9] flex items-center justify-center font-black text-[#4A72B2] text-sm shrink-0 overflow-hidden">
                {user.avatar_url
                  ? <img src={user.avatar_url} className="w-full h-full object-cover" alt={user.name} />
                  : (user.name || 'U').split(' ').map(n => n[0]).slice(0,2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-[#001A26] text-sm truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email} {user.unit ? `· ${user.unit}` : ''}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === user.id ? (
                  <select autoFocus defaultValue={user.role}
                    onChange={e => updateRole(user.id, e.target.value)}
                    disabled={saving}
                    className="px-3 py-2 rounded-xl border border-[#4A72B2] text-xs font-black text-[#001A26] outline-none bg-white">
                    <option value="aluno">Colaborador</option>
                    <option value="gestor">Gestor</option>
                    <option value="professor">Professor</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] || ROLE_COLORS.aluno}`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                )}
                <button onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-[#e2eef9] flex items-center justify-center text-slate-400 hover:text-[#4A72B2] transition-colors">
                  <Pencil size={13} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-center text-slate-400 text-sm py-8">Nenhum usuário encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Tab: Config Geral ────────────────────────────────────────────────────────
function ConfigTab() {
  const [form, setForm]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('biscoite_access_token') || localStorage.getItem('biscoite_access_token');
    fetch('/api/data?resource=platform_config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setForm(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true); setError('');
    const token = sessionStorage.getItem('biscoite_access_token') || localStorage.getItem('biscoite_access_token');
    try {
      const res = await fetch('/api/data?resource=platform_config', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
      else setError('Erro ao salvar. Tente novamente.');
    } catch { setError('Erro ao salvar. Tente novamente.'); }
    setSaving(false);
  };

  if (loading || !form) return (
    <div className="flex items-center justify-center py-10">
      <Loader size={24} className="animate-spin text-[#4A72B2]" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-md">
      <FieldInput
        label="Nome da plataforma"
        value={form.platformName || ''}
        onChange={v => setForm(p => ({ ...p, platformName: v }))}
        placeholder="Ex: Universidade Biscoitê"
        maxLength={60}
      />
      <FieldInput
        label="E-mail de suporte"
        value={form.supportEmail || ''}
        onChange={v => setForm(p => ({ ...p, supportEmail: v }))}
        placeholder="academy@biscoite.com"
        maxLength={80}
        type="email"
      />
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Máx. cursos por professor
        </label>
        <input
          type="number" min={1} max={100}
          value={form.maxCoursesPerProfessor || 30}
          onChange={e => setForm(p => ({ ...p, maxCoursesPerProfessor: Math.min(100, Math.max(1, Number(e.target.value))) }))}
          className="w-32 px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium"
        />
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permissões</p>
        {[
          { key: 'allowSelfRegistration', label: 'Permitir auto-cadastro', desc: 'Novos usuários podem se registrar sem aprovação prévia' },
          { key: 'requireApproval',       label: 'Exigir aprovação de conta', desc: 'Contas novas precisam ser aprovadas por um admin' },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-center gap-4 cursor-pointer bg-white rounded-2xl px-5 py-4 border border-slate-100 hover:border-[#4A72B2]/30 transition-colors">
            <div
              onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
              className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors shrink-0 ${form[key] ? 'bg-[#4A72B2]' : 'bg-slate-200'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form[key] ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <p className="font-black text-[#001A26] text-sm">{label}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button onClick={handleSave} disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${
          saved ? 'bg-emerald-500 text-white' : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'
        }`}>
        {saving ? <><Loader size={14} className="animate-spin" /> Salvando...</> :
         saved  ? <><Check size={14} /> Salvo!</> :
                  <><Save size={14} /> Salvar configurações</>}
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Settings() {
  const {
    systemRole, setSystemRole,
    menuItems, toggleMenuItemVisibility, reorderMenuItem,
    users, updateUser, addUser,
    platformConfig, updatePlatformConfig,
    updateUserDataApi, updateProfileImage,
    userData, profileImage,
  } = useProfile();

  const loggedUser = (() => {
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [activeTab, setActiveTab] = useState('minha-conta');

  // Bloqueia aluno completamente
  if (systemRole === 'aluno') {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
            <Lock size={36} className="text-slate-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#001A26]">Sem permissão</h2>
            <p className="text-slate-400 text-sm font-medium mt-2">Configurações disponíveis apenas para professores e admins.</p>
          </div>

        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'minha-conta', label: 'Minha Conta',   icon: User,         adminOnly: false },
    { id: 'usuarios',    label: 'Usuários',       icon: Users,        adminOnly: true },
    { id: 'config',      label: 'Config Geral',   icon: SettingsIcon, adminOnly: true },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#001A26]">Configurações</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Gerencie menus, usuários e configurações da plataforma.</p>
        </div>
        <RoleBadge role={systemRole} />
      </div>

      {/* Layout: sidebar + conteúdo */}
      <div className="flex gap-8 items-start">

        {/* Sidebar de tabs */}
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const locked = tab.adminOnly && systemRole !== 'admin';
            return (
              <button
                key={tab.id}
                onClick={() => !locked && setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#001A26] text-white'
                    : locked
                    ? 'text-slate-300 cursor-default'
                    : 'text-slate-500 hover:bg-[#e2eef9] hover:text-[#4A72B2]'
                }`}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{tab.label}</span>
                {locked && <Lock size={11} className="shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Área de conteúdo */}
        <div className="flex-1 min-w-0 bg-[#e2eef9] rounded-[32px] p-8">
          {activeTab === 'minha-conta' && (
            <MinhaContaTab
              userData={userData}
              profileImage={profileImage}
              onUpdate={updateUserDataApi}
              onUpdateImage={updateProfileImage}
            />
          )}

          {activeTab === 'usuarios' && (
            systemRole === 'admin'
              ? <UsuariosTab />
              : <LockMessage />
          )}
          {activeTab === 'config' && (
            systemRole === 'admin'
              ? <ConfigTab />
              : <LockMessage />
          )}
        </div>
      </div>
    </div>
  );
}
