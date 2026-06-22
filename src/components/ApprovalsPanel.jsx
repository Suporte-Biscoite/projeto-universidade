// src/components/ApprovalsPanel.jsx
// Painel de aprovação de cadastros — usado dentro do AdminPanel

import { useState, useEffect } from 'react';
import { Check, X, Clock, User, Store, AlertTriangle, Loader } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

const STORE_TYPE_LABEL = {
  propria:    'Loja Própria',
  franquia:   'Franquia',
  escritorio: 'Escritório',
  galpao:     'Galpão / CD',
};

const ROLE_LABEL = {
  aluno:     'Colaborador',
  gestor:    'Gestor',
  professor: 'Professor',
  admin:     'Admin',
};

export default function ApprovalsPanel() {
  const [pending, setPending]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null); // id do usuário sendo processado
  const [rejectModal, setRejectModal] = useState(null); // usuário a rejeitar
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/users?action=approvals');
      const data = await res.json();
      if (res.ok) setPending(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (user) => {
    setActing(user.id);
    try {
      const res = await authFetch(`/api/users?action=approve&id=${user.id}`, {
        method: 'POST',
      });
      if (res.ok) {
        setPending(prev => prev.filter(u => u.id !== user.id));
        showToast(`${user.name} aprovado com sucesso!`);
      }
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal.id);
    try {
      const res = await authFetch(`/api/users?action=reject&id=${rejectModal.id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason || 'Cadastro não autorizado.' }),
      });
      if (res.ok) {
        setPending(prev => prev.filter(u => u.id !== rejectModal.id));
        showToast(`Cadastro de ${rejectModal.name} recusado.`, 'error');
      }
    } finally {
      setActing(null);
      setRejectModal(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#001A26]">Aprovações de Cadastro</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {pending.length} cadastro{pending.length !== 1 ? 's' : ''} aguardando aprovação
          </p>
        </div>
        <button onClick={fetchPending}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-500 hover:border-[#4A72B2] hover:text-[#4A72B2] transition-all">
          Atualizar
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader size={24} className="text-[#4A72B2] animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && pending.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-300">
          <Check size={40} />
          <p className="font-black text-sm text-slate-400">Nenhum cadastro pendente</p>
          <p className="text-xs text-slate-300">Todos os cadastros foram aprovados ou rejeitados.</p>
        </div>
      )}

      {/* List */}
      {!loading && pending.length > 0 && (
        <div className="space-y-3">
          {pending.map(user => (
            <div key={user.id}
              className="bg-white rounded-2xl border border-slate-100 px-6 py-5 flex items-center gap-4 hover:shadow-sm transition-shadow">

              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-[#e2eef9] flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-[#4A72B2]" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black text-[#001A26] text-sm">{user.name}</p>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    <Clock size={8} className="inline mr-1" />Pendente
                  </span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{user.email}</p>
                {(user.store_name || user.store_type) && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Store size={10} />
                    <span>{user.store_name || '—'}</span>
                    {user.store_type && (
                      <span className="text-slate-300">· {STORE_TYPE_LABEL[user.store_type] || user.store_type}</span>
                    )}
                  </div>
                )}
                <p className="text-[9px] text-slate-300">
                  Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(user)}
                  disabled={acting === user.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all disabled:opacity-50"
                >
                  {acting === user.id
                    ? <Loader size={12} className="animate-spin" />
                    : <Check size={12} />}
                  Aprovar
                </button>
                <button
                  onClick={() => setRejectModal(user)}
                  disabled={acting === user.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-black rounded-xl transition-all disabled:opacity-50"
                >
                  <X size={12} /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de rejeição */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-black text-[#001A26] text-sm">Rejeitar cadastro de {rejectModal.name}?</p>
                <p className="text-slate-400 text-xs mt-1">O usuário receberá um email informando.</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ex: Não encontramos seu registro em nossa base de colaboradores."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-300 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={handleReject}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-all">
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-black ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-[#001A26]'
        }`}>
          {toast.type === 'error' ? <X size={15} /> : <Check size={15} className="text-emerald-400" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
