// src/pages/ProfessorDashboard.jsx
// Orquestrador principal — apenas monta o layout e roteamento de views.
// Cada view é um componente independente em src/components/professor/

import { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import Sidebar           from '../components/professor/ProfessorSidebar';
import OverviewView      from '../components/professor/OverviewView';
import MeusCursosView    from '../components/professor/MeusCursosView';
import ShortsView        from '../components/professor/ShortsView';
import ComunicacaoView   from '../components/professor/ComunicacaoView';

export default function ProfessorDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [unreadComm, setUnreadComm] = useState(0);
  const { profileImage, userData }  = useProfile();

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === 'comunicacao') setUnreadComm(0);
  };

  const viewTitle = {
    overview:    'Painel do Professor',
    cursos:      'Painel do Professor',
    shorts:      'Meus Shorts',
    comunicacao: 'Comunicação',
  }[activeView];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <div className="sticky top-0 h-screen flex-shrink-0 z-10">
        <Sidebar
          activeView={activeView}
          setActiveView={handleViewChange}
          profileImage={profileImage}
          userName={userData?.name || ''}
          unreadComm={unreadComm}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        <main className="flex-1 w-full px-4 sm:px-6 md:px-10 py-6 md:py-8 max-w-[1440px] pb-24 md:pb-8">
          <h1 className="text-2xl font-black text-[#00263B] mb-6">{viewTitle}</h1>
          {activeView === 'overview'    && <OverviewView    onNewComm={() => setUnreadComm(p => p + 1)} />}
          {activeView === 'cursos'      && <MeusCursosView  />}
          {activeView === 'shorts'      && <ShortsView      />}
          {activeView === 'comunicacao' && <ComunicacaoView onRead={() => setUnreadComm(0)} />}
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 flex justify-around items-center px-2 py-2 shadow-lg">
          {[
            { id: 'overview',    label: 'Overview', icon: '◻' },
            { id: 'cursos',      label: 'Cursos',   icon: '📚' },
            { id: 'shorts',      label: 'Shorts',   icon: '🎬' },
            { id: 'comunicacao', label: 'Chat',     icon: '💬' },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => handleViewChange(id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                activeView === id ? 'text-[#4A72B2]' : 'text-slate-400'
              }`}>
              <span className="text-lg">{icon}</span>
              <span className="text-[9px] font-bold">{label}</span>
            </button>
          ))}
        </div>

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
