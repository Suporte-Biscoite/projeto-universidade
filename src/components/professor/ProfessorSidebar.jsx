// src/components/professor/ProfessorSidebar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, MessageSquare, Clapperboard, Home, Settings } from 'lucide-react';

function Sidebar({ activeView, setActiveView, profileImage, userName, unreadComm }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
    { id: 'cursos',       label: 'Meus Cursos',  icon: BookOpen },
    { id: 'shorts',        label: 'Shorts',        icon: Clapperboard },
    { id: 'comunicacao',  label: 'Comunicação',  icon: MessageSquare, badge: unreadComm },
  ];

  return (
    <aside className="hidden md:flex w-[200px] min-h-screen bg-white border-r border-slate-100 flex-col py-8 px-6 gap-8 flex-shrink-0">
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
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">{badge}</span>
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

    </aside>
  );
}


export default Sidebar;
