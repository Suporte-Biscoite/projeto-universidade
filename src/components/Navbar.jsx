import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, Bell, Pencil, X, Heart, Briefcase, Settings, LogOut, Home, BookOpen, Award, Menu, Radio, Shield, Store, BarChart2, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { authFetch } from '../utils/authFetch';

const ROLE_LABEL = {
  admin:     'Administrador',
  professor: 'Professor',
  gestor:    'Gestor',
  aluno:     'Colaborador',
};

const ROLE_PANEL = {
  admin:     { label: 'Painel Admin',     path: '/admin',     icon: Shield,   color: 'text-purple-500 bg-purple-50' },
  professor: { label: 'Painel Professor', path: '/professor', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
  gestor:    { label: 'Painel Gestor',    path: '/gestor',    icon: BarChart2,color: 'text-teal-500 bg-teal-50' },
};

const TYPE_COLOR = {
  course:      'bg-blue-500',
  certificate: 'bg-green-500',
  live:        'bg-red-500',
  approval:    'bg-emerald-500',
  system:      'bg-orange-500',
  info:        'bg-slate-400',
};

const allCourses = [];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifCloseTimer = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const searchRef = useRef(null);

  const { profileImage, updateProfileImage, userData, menuItems = [], systemRole, setSystemRole } = useProfile();


  // Busca notificações reais da API
  useEffect(() => {
    const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');
    if (!isAuth) return;
    const fetchNotifs = async () => {
      try {
        const res = await authFetch('/api/data?resource=notifications');
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread || 0);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000); // atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    ['biscoite_auth','biscoite_access_token','biscoite_refresh_token','biscoite_logged_user']
      .forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    navigate('/login');
  };

  const filteredCourses = searchQuery.trim().length > 1
    ? allCourses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Mapeamento de id do menu para ícone
  const MENU_ID_TO_ICON = {
    home: Home, courses: BookOpen, certificados: Award,
    favoritos: Heart, carreira: Briefcase, live: Radio, configuracoes: Settings,
  };

  // Menu dinâmico vindo do ProfileContext
  const sortedItems = [...menuItems].sort((a, b) => a.order - b.order);
  const navLinks = sortedItems
    .filter(i => i.group === 'nav' && i.visible)
    .map(i => ({ name: i.label, path: i.path, icon: MENU_ID_TO_ICON[i.id] || Home }));

  const dropdownLinks = sortedItems
    .filter(i => i.group === 'dropdown' && i.visible)
    .map(i => ({ ...i, icon: MENU_ID_TO_ICON[i.id] || Settings }));

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => updateProfileImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const markAllRead = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await authFetch('/api/data?resource=notifications&action=read-all', { method: 'POST' }); } catch {}
  };

  const deleteNotif = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await authFetch(`/api/data?resource=notifications&action=delete&id=${id}`, { method: 'POST' }); } catch {}
  };

  const deleteAllNotifs = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await authFetch('/api/data?resource=notifications&action=delete-all', { method: 'POST' }); } catch {}
  };

  useEffect(() => {
    if (isSearchOpen && searchRef.current) searchRef.current.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    setIsOpen(false);
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsNotifOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center relative z-[100]">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-4 group shrink-0">
            <img src="/logo-biscoite.svg" alt="Logo" className="h-14 w-auto" />
          </Link>
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold transition-all relative py-1 ${
                  location.pathname === link.path ? 'text-[#00263B]' : 'text-slate-400 hover:text-[#6385B7]'
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <div className="absolute -bottom-[23px] left-0 w-full h-0.5 bg-[#6385B7]"></div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="relative">
            <button
              onClick={() => { setIsSearchOpen(!isSearchOpen); setIsNotifOpen(false); setIsOpen(false); }}
              className={`p-2 rounded-xl transition-all ${isSearchOpen ? 'bg-[#e2eef9] text-[#4A72B2]' : 'text-slate-400 hover:text-[#00263B] hover:bg-slate-50'}`}
            >
              <Search size={20} />
            </button>
            {isSearchOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar cursos, categorias..."
                      className="flex-1 outline-none text-sm text-[#001A26] placeholder-slate-400"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          navigate(`/courses?q=${encodeURIComponent(searchQuery)}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    )}
                  </div>
                  {filteredCourses.length > 0 ? (
                    <div className="py-2">
                      {filteredCourses.map(course => (
                        <button
                          key={course.id}
                          onClick={() => { navigate('/player'); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#e2eef9] flex items-center justify-center shrink-0">
                            <BookOpen size={14} className="text-[#4A72B2]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#001A26]">{course.title}</p>
                            <p className="text-[10px] text-slate-400">{course.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.trim().length > 1 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400">Nenhum resultado para "<strong>{searchQuery}</strong>"</p>
                    </div>
                  ) : (
                    <div className="py-4 px-4 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sugestões</p>
                      {['Operação cafeteria', 'Atendimento', 'Marketing'].map(s => (
                        <button key={s} onClick={() => setSearchQuery(s)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#4A72B2] transition-colors w-full py-1">
                          <Search size={12} className="text-slate-300" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => {
                const opening = !isNotifOpen;
                setIsNotifOpen(opening);
                setIsSearchOpen(false);
                setIsOpen(false);
                // Auto-fecha após 8s
                if (opening) {
                  if (notifCloseTimer.current) clearTimeout(notifCloseTimer.current);
                  notifCloseTimer.current = setTimeout(() => setIsNotifOpen(false), 8000);
                }
              }}
              className={`relative p-2 rounded-xl transition-all ${isNotifOpen ? 'bg-[#e2eef9] text-[#4A72B2]' : 'text-slate-400 hover:text-[#00263B] hover:bg-slate-50'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => {
                  setIsNotifOpen(false);
                  if (notifCloseTimer.current) clearTimeout(notifCloseTimer.current);
                }} />
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                  <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-[#001A26] text-sm">Alertas</h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-bold text-[#4A72B2] hover:underline">Marcar todas como lidas</button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="flex flex-col items-center gap-2 py-10 text-slate-300">
                        <Bell size={28} />
                        <p className="text-xs font-bold text-slate-400">Nenhuma notificação</p>
                      </div>
                    )}
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className="flex gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group bg-blue-50/40"
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${TYPE_COLOR[notif.type] || TYPE_COLOR.info}`}></div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={async () => {
                          setNotifications(prev => prev.filter(n => n.id !== notif.id));
                          setUnreadCount(prev => Math.max(0, prev - 1));
                          try { await authFetch(`/api/data?resource=notifications&action=read&id=${notif.id}`, { method: 'POST' }); } catch {}
                          setIsNotifOpen(false);
                          if (notif.link) navigate(notif.link);
                        }}>
                          <p className="text-sm leading-tight font-bold text-[#001A26]">{notif.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{notif.description}</p>
                        </div>
                        <button
                          onClick={async () => {
                            setNotifications(prev => prev.filter(n => n.id !== notif.id));
                            setUnreadCount(prev => Math.max(0, prev - 1));
                            try { await authFetch(`/api/data?resource=notifications&action=read&id=${notif.id}`, { method: 'POST' }); } catch {}
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all flex-shrink-0 mt-1"
                          title="Fechar notificação"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-[1px] bg-slate-100 hidden md:block mx-1"></div>

          {/* PROFILE (desktop) */}
          <div className="relative hidden md:flex items-center gap-3 cursor-pointer">
            <div className="text-right" onClick={() => setIsOpen(!isOpen)}>
              <p className="text-sm font-black text-[#00263B] leading-none uppercase">{userData.name.split(' ')[0]}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-80">{ROLE_LABEL[systemRole] || systemRole || '—'}</p>
            </div>
            <div className="relative group" onClick={() => fileInputRef.current.click()}>
              <img src={profileImage} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover transition-all group-hover:brightness-90" alt="Perfil" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                <Pencil size={12} className="text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <div onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </div>
            {isOpen && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />
                <div className="absolute right-0 top-14 w-72 bg-[#F2F2F2] rounded-2xl shadow-2xl border border-white/20 overflow-hidden py-2">
                  <Link to="/profile" className="flex items-center gap-3 px-5 py-3.5 text-[#00263B] font-bold text-sm hover:bg-white/60 transition-colors" onClick={() => setIsOpen(false)}>
                    <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center"><Pencil size={13} /></div> Minha conta
                  </Link>

                  {/* Acesso ao painel — admin vê todos, outros veem só o seu */}
                  {systemRole === 'admin' ? (
                    <>
                      <div className="mx-5 h-[1px] bg-slate-200/50" />
                      <div className="px-5 py-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Painéis de acesso</p>
                        <div className="flex flex-col gap-1">
                          {Object.values(ROLE_PANEL).map((panel) => {
                            const PanelIcon = panel.icon;
                            return (
                              <Link
                                key={panel.path}
                                to={panel.path}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#00263B] font-bold text-xs hover:bg-white/60 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${panel.color}`}>
                                  <PanelIcon size={12} />
                                </div>
                                {panel.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : ROLE_PANEL[systemRole] ? (() => {
                    const panel = ROLE_PANEL[systemRole];
                    const PanelIcon = panel.icon;
                    return (
                      <>
                        <div className="mx-5 h-[1px] bg-slate-200/50" />
                        <Link
                          to={panel.path}
                          className="flex items-center gap-3 px-5 py-3.5 text-[#00263B] font-bold text-sm hover:bg-white/60 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${panel.color}`}>
                            <PanelIcon size={13} />
                          </div>
                          {panel.label}
                        </Link>
                      </>
                    );
                  })() : null}

                  {dropdownLinks.map(item => {
                    const DropIcon = item.icon;
                    return (
                      <div key={item.id}>
                        <div className="mx-5 h-[1px] bg-slate-200/50"></div>
                        <Link to={item.path} className="flex items-center gap-3 px-5 py-3.5 text-[#00263B] font-bold text-sm hover:bg-white/60 transition-colors" onClick={() => setIsOpen(false)}>
                          <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                            <DropIcon size={13} />
                          </div>
                          {item.label}
                        </Link>
                      </div>
                    );
                  })}

                  <div className="mx-5 h-[1px] bg-slate-200/50 mb-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3.5 text-[#F27474] font-bold text-sm hover:bg-red-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><LogOut size={13} className="text-[#F27474]" /></div> Sair
                  </button>
                </div>
              </>
            )}
          </div>

          {/* HAMBURGER (mobile) */}
          <button
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[90]" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-72 bg-white z-[95] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src={profileImage} className="w-10 h-10 rounded-full object-cover border-2 border-[#e2eef9]" alt="Perfil" />
                <div>
                  <p className="font-black text-sm text-[#001A26]">{userData.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{ROLE_LABEL[systemRole] || systemRole || '—'}</p>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-400"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Navegação</p>
                {navLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-colors mb-1 ${
                        location.pathname === link.path ? 'bg-[#e2eef9] text-[#4A72B2]' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={16} /> {link.name}
                    </Link>
                  );
                })}
              </div>
              <div className="mx-4 h-[1px] bg-slate-100 my-3"></div>
              <div className="px-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Minha conta</p>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors mb-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Pencil size={13} /></div>
                  Minha conta
                </Link>
                {dropdownLinks.map(item => {
                  const MobIcon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors mb-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><MobIcon size={13} /></div>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="px-4 pb-6 border-t border-slate-100 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"><LogOut size={13} className="text-red-400" /></div>
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}