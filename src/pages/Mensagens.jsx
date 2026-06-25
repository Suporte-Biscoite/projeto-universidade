import { useState, useEffect } from 'react';
import { MessageCircle, Plus, X, Loader, ChevronDown } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import ChatPanel from '../components/ChatPanel';

export default function Mensagens() {
  const [professors, setProfessors]     = useState([]);
  const [showNew, setShowNew]           = useState(false);
  const [selectedProf, setSelectedProf] = useState('');
  const [creating, setCreating]         = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);

  const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
  const currentUserId = (() => { try { return raw ? JSON.parse(raw)?.id : null; } catch { return null; } })();

  useEffect(() => {
    authFetch('/api/data?resource=professors')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setProfessors(data); })
      .catch(() => {});
  }, []);

  const handleNewConversation = async () => {
    if (!selectedProf) return;
    setCreating(true);
    try {
      await authFetch('/api/data?resource=conversations', {
        method: 'POST',
        body: JSON.stringify({ professorId: selectedProf }),
      });
      setShowNew(false);
      setSelectedProf('');
      setRefreshKey(k => k + 1);
    } catch {}
    setCreating(false);
  };

  return (
    <div className="space-y-6 pb-20">

      {/* Header */}
      <div className="bg-[#001A26] rounded-[32px] px-8 sm:px-12 py-10 flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4A72B2]/30 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} className="text-[#b9d2eb]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Mensagens</h1>
          </div>
          <p className="text-[#b9d2eb]/60 text-sm">Converse diretamente com seus professores.</p>
        </div>
        <button onClick={() => setShowNew(p => !p)}
          className="flex items-center gap-2 px-5 py-3 bg-[#4A72B2] hover:bg-[#b9d2eb] hover:text-[#001A26] text-white rounded-xl font-bold text-sm transition-colors">
          {showNew ? <X size={16} /> : <Plus size={16} />}
          {showNew ? 'Cancelar' : 'Nova conversa'}
        </button>
      </div>

      {/* Nova conversa */}
      {showNew && (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
          <p className="font-black text-[#001A26] text-sm">Iniciar nova conversa</p>
          <div className="relative">
            <select value={selectedProf} onChange={e => setSelectedProf(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] bg-white appearance-none">
              <option value="">Selecione um professor</option>
              {professors.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role === 'admin' ? 'Admin' : 'Professor'})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={handleNewConversation} disabled={!selectedProf || creating}
            className="w-full py-3 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {creating ? <Loader size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            {creating ? 'Criando...' : 'Iniciar conversa'}
          </button>
        </div>
      )}

      {/* Chat */}
      <div className="h-[calc(100vh-280px)] sm:h-[600px]">
        <ChatPanel key={refreshKey} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
