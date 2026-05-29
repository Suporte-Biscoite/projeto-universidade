import { useState } from 'react';
import {
  Menu, Users, Settings as SettingsIcon, User,
  Pencil, X, Check, Lock, Eye, EyeOff, Camera,
  ChevronUp, ChevronDown, AlertTriangle,
  Shield, GripVertical, ToggleLeft, ToggleRight, Save, Plus, UserPlus,
} from 'lucide-react';
import { useProfile, STORES } from '../context/ProfileContext';

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

function UsuariosTab({ users, onUpdateUser, onAddUser }) {
  const [editingRole, setEditingRole] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [created, setCreated] = useState(false);

  const handleCreate = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    onAddUser(newUser);
    setNewUser(EMPTY_NEW_USER);
    setCreated(true);
    setTimeout(() => { setCreated(false); setShowCreate(false); }, 1800);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex gap-3 flex-1 mr-4">
          <Shield size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            Alterações de role aqui são apenas para demonstração.
            Em produção, roles devem ser gerenciadas pelo servidor com auditoria completa.
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(p => !p); setCreated(false); }}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-xl text-xs font-black transition-all"
        >
          <UserPlus size={14} /> Novo usuário
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-[#4A72B2]/30 p-6 space-y-4">
          <p className="text-sm font-black text-[#001A26]">Criar novo usuário</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome completo *</label>
              <input
                autoFocus
                value={newUser.name}
                onChange={e => setNewUser(p => ({ ...p, name: e.target.value.slice(0, 60) }))}
                placeholder="Ex: Ana Costa"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={e => setNewUser(p => ({ ...p, email: e.target.value.slice(0, 80) }))}
                placeholder="ana@biscoite.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfil</label>
              <select
                value={newUser.systemRole}
                onChange={e => setNewUser(p => ({ ...p, systemRole: e.target.value, storeId: '' }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white"
              >
                <option value="aluno">Aluno / Colaborador</option>
                <option value="loja">Líder de Loja</option>
                <option value="gestor">Gestor Regional</option>
                <option value="franqueado">Franqueado</option>
                <option value="professor">Professor / Instrutor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {(newUser.systemRole === 'aluno' || newUser.systemRole === 'loja') ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {newUser.systemRole === 'loja' ? 'Loja responsável' : 'Loja que trabalha'}
                </label>
                <select
                  value={newUser.storeId || ''}
                  onChange={e => setNewUser(p => ({ ...p, storeId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white"
                >
                  <option value="">Selecione a loja</option>
                  {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unidade / Região</label>
                <input
                  value={newUser.unit}
                  onChange={e => setNewUser(p => ({ ...p, unit: e.target.value.slice(0, 60) }))}
                  placeholder="Ex: Gestora Regional SP"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowCreate(false); setNewUser(EMPTY_NEW_USER); }}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={!newUser.name.trim() || !newUser.email.trim()}
              className={`flex-1 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                created ? 'bg-emerald-500 text-white' : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'
              }`}>
              {created ? <><Check size={13} /> Criado!</> : <><Plus size={13} /> Criar usuário</>}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-2xl px-6 py-5 border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e2eef9] flex items-center justify-center font-black text-[#4A72B2] text-sm shrink-0">
              {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#001A26] text-sm">{user.name}</p>
              <p className="text-xs text-slate-400 font-medium">{user.email} · {user.unit}</p>
            </div>

            {editingRole === user.id ? (
              <div className="flex items-center gap-2">
                <select
                  defaultValue={user.systemRole}
                  onChange={e => { onUpdateUser(user.id, { systemRole: e.target.value }); setEditingRole(null); }}
                  autoFocus
                  className="px-3 py-2 rounded-xl border border-[#4A72B2] text-xs font-black text-[#001A26] outline-none bg-white"
                >
                  <option value="aluno">Aluno</option>
                  <option value="loja">Líder Loja</option>
                  <option value="gestor">Gestor</option>
                  <option value="franqueado">Franqueado</option>
                  <option value="professor">Professor</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => setEditingRole(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RoleBadge role={user.systemRole} />
                <button onClick={() => setEditingRole(user.id)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#e2eef9] hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                  <Pencil size={13} />
                </button>
              </div>
            )}

            <button
              onClick={() => onUpdateUser(user.id, { active: !user.active })}
              title={user.active ? 'Desativar usuário' : 'Ativar usuário'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                user.active ? 'bg-emerald-50 text-emerald-500 hover:bg-red-50 hover:text-red-500' : 'bg-red-50 text-red-400 hover:bg-emerald-50 hover:text-emerald-500'
              }`}
            >
              {user.active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Tab: Minha Conta ─────────────────────────────────────────────────────────
function MinhaContaTab({ userData, onUpdate, onUpdateImage, profileImage }) {
  const [form, setForm]         = useState({ name: userData.name || '', unit: userData.unit || '' });
  const [pwdForm, setPwdForm]   = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      await onUpdate({ name: form.name.trim(), unit: form.unit.trim() });
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
            <label className="text-xs font-bold text-slate-500 mb-1 block">Unidade</label>
            <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#4A72B2]" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button onClick={handleSaveProfile} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'} disabled:opacity-50`}>
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

// ─── Tab: Config Geral ────────────────────────────────────────────────────────
function ConfigTab({ config, onUpdate }) {
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-md">
      <FieldInput
        label="Nome da plataforma"
        value={form.platformName}
        onChange={v => setForm(p => ({ ...p, platformName: v }))}
        placeholder="Ex: Universidade Biscoitê"
        maxLength={60}
      />
      <FieldInput
        label="E-mail de suporte"
        value={form.supportEmail}
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
          type="number"
          min={1}
          max={100}
          value={form.maxCoursesPerProfessor}
          onChange={e => setForm(p => ({ ...p, maxCoursesPerProfessor: Math.min(100, Math.max(1, Number(e.target.value))) }))}
          className="w-32 px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium"
        />
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permissões</p>
        {[
          { key: 'allowSelfRegistration', label: 'Permitir auto-cadastro', desc: 'Novos usuários podem se registrar sem aprovação prévia' },
          { key: 'requireApproval', label: 'Exigir aprovação de conta', desc: 'Contas novas precisam ser aprovadas por um admin' },
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

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${
          saved ? 'bg-emerald-500 text-white' : 'bg-[#001A26] hover:bg-[#4A72B2] text-white'
        }`}
      >
        {saved ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar configurações</>}
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
          <button
            onClick={() => setSystemRole('admin')}
            className="flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-[#001A26] text-white text-xs font-black hover:bg-[#4A72B2] transition-colors"
          >
            <Shield size={13} />
            Restaurar acesso (Demo)
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'minha-conta', label: 'Minha Conta',   icon: User,         adminOnly: false },
    { id: 'menus',      label: 'Menus',        icon: Menu,         adminOnly: true },
    { id: 'usuarios',   label: 'Usuários',     icon: Users,        adminOnly: true },
    { id: 'config',     label: 'Config Geral', icon: SettingsIcon, adminOnly: true },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#001A26]">Configurações</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Gerencie menus, usuários e configurações da plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={systemRole} />
          {/* Demo switcher — remover quando o backend estiver pronto */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider"></span>
            <select
              value={systemRole}
              onChange={e => {
                if (e.target.value === 'aluno' && !window.confirm('Trocar para Aluno bloqueará o acesso às configurações. Tem certeza?')) return;
                setSystemRole(e.target.value);
              }}
              className="text-[10px] font-black text-amber-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="professor">Professor</option>
              <option value="gestor">Gestor</option>
              <option value="loja">Líder Loja</option>
              <option value="franqueado">Franqueado</option>
              <option value="aluno">Aluno</option>
            </select>
          </div>
        </div>
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
          {activeTab === 'menus' && (
            systemRole === 'admin'
              ? <MenusTab menuItems={menuItems} onToggle={toggleMenuItemVisibility} onReorder={reorderMenuItem} />
              : <LockMessage />
          )}
          {activeTab === 'usuarios' && (
            systemRole === 'admin'
              ? <UsuariosTab users={users} onUpdateUser={updateUser} onAddUser={addUser} />
              : <LockMessage />
          )}
          {activeTab === 'config' && (
            systemRole === 'admin'
              ? <ConfigTab config={platformConfig} onUpdate={updatePlatformConfig} />
              : <LockMessage />
          )}
        </div>
      </div>
    </div>
  );
}
