import { useState, useEffect, useRef } from 'react';
import { Award, Download, Share2, ExternalLink, Loader, CheckCircle2, Calendar, Clock, Tag } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { useProfile } from '../context/ProfileContext';

// ─── Template visual do certificado ──────────────────────────────────────────
function CertificateCard({ cert, onView }) {
  const date = new Date(cert.issued_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
      {/* Header colorido */}
      <div className="bg-[#001A26] px-6 py-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#4A72B2] opacity-10 translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 left-1/2 w-20 h-20 rounded-full bg-[#b9d2eb] opacity-5 translate-y-6" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A72B2]/30 flex items-center justify-center flex-shrink-0">
            <Award size={20} className="text-[#b9d2eb]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#b9d2eb]/60 font-bold uppercase tracking-widest mb-1">Certificado de Conclusão</p>
            <h3 className="text-white font-black text-sm leading-tight line-clamp-2">{cert.course_title}</h3>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="px-6 py-5 space-y-4">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Concedido a</p>
          <p className="text-[#001A26] font-black text-base">{cert.user_name}</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {cert.category && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Tag size={12} />
              <span>{cert.category}</span>
            </div>
          )}
          {cert.level && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle2 size={12} />
              <span>{cert.level}</span>
            </div>
          )}
          {cert.duration && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} />
              <span>{cert.duration}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 border-t border-slate-50 pt-4">
          <Calendar size={12} />
          <span>Emitido em {date}</span>
        </div>

        {/* ID do certificado */}
        <div className="bg-slate-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <p className="text-[9px] text-slate-400 font-mono">{cert.id.toUpperCase().slice(0,8)}...{cert.id.slice(-8).toUpperCase()}</p>
          <button
            onClick={() => navigator.clipboard?.writeText(cert.id)}
            className="text-[9px] text-[#4A72B2] font-bold hover:underline"
          >
            Copiar ID
          </button>
        </div>
      </div>

      {/* Ações */}
      <div className="px-6 pb-5 flex gap-2">
        <button
          onClick={() => onView(cert)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ExternalLink size={13} /> Ver certificado
        </button>
        <button
          onClick={() => {
            const url = `${window.location.origin}/certificado/${cert.id}`;
            navigator.clipboard?.writeText(url);
          }}
          className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
          title="Copiar link"
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Modal do certificado completo ────────────────────────────────────────────
function CertificateModal({ cert, onClose }) {
  const printRef = useRef(null);
  const date = new Date(cert.issued_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Certificado visual */}
        <div ref={printRef} className="relative bg-[#001A26] p-10 sm:p-14 text-center overflow-hidden">
          {/* Decorações */}
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-[#4A72B2] opacity-10 -translate-x-16 -translate-y-16" />
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#b9d2eb] opacity-5 translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-64 h-64 rounded-full bg-[#4A72B2] opacity-5" />

          {/* Borda interna decorativa */}
          <div className="relative border border-[#4A72B2]/30 rounded-[24px] p-8 sm:p-12 space-y-6">
            {/* Logo / ícone */}
            <div className="w-16 h-16 bg-[#4A72B2]/20 rounded-full flex items-center justify-center mx-auto border border-[#4A72B2]/40">
              <Award size={32} className="text-[#b9d2eb]" />
            </div>

            <div className="space-y-1">
              <p className="text-[#b9d2eb]/60 text-xs font-bold uppercase tracking-[0.2em]">Universidade Biscoitê</p>
              <p className="text-[#b9d2eb]/60 text-xs font-bold uppercase tracking-[0.2em]">Certificado de Conclusão</p>
            </div>

            <div className="space-y-2">
              <p className="text-white/50 text-sm">Certificamos que</p>
              <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight">{cert.user_name}</h2>
            </div>

            <div className="space-y-2">
              <p className="text-white/50 text-sm">concluiu com êxito o curso</p>
              <h3 className="text-[#b9d2eb] text-xl sm:text-2xl font-black">"{cert.course_title}"</h3>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
              <Calendar size={12} />
              <span>Emitido em {date}</span>
            </div>

            {/* Divisor */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#4A72B2]/30" />
              <div className="w-2 h-2 rounded-full bg-[#4A72B2]/50" />
              <div className="flex-1 h-px bg-[#4A72B2]/30" />
            </div>

            {/* ID de verificação */}
            <div className="space-y-1">
              <p className="text-white/30 text-[10px] uppercase tracking-widest">ID de verificação</p>
              <p className="text-[#b9d2eb]/60 text-[10px] font-mono">{cert.id}</p>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="p-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">
            Fechar
          </button>
          <button onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl bg-[#001A26] text-white font-bold text-sm hover:bg-[#4A72B2] transition-colors flex items-center justify-center gap-2">
            <Download size={15} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Certificates() {
  const { userData } = useProfile();
  const [certs, setCerts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    authFetch('/api/data?resource=certificates')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCerts(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10 pb-20">

      {selected && (
        <CertificateModal cert={selected} onClose={() => setSelected(null)} />
      )}

      {/* Header */}
      <div className="bg-[#001A26] rounded-[32px] px-8 sm:px-12 py-10 flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4A72B2]/30 rounded-xl flex items-center justify-center">
              <Award size={22} className="text-[#b9d2eb]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Meus Certificados</h1>
          </div>
          <p className="text-[#b9d2eb]/60 text-sm">
            {loading ? 'Carregando...' : `${certs.length} certificado${certs.length !== 1 ? 's' : ''} obtido${certs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!loading && certs.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 bg-[#4A72B2]/20 border border-[#4A72B2]/30 rounded-2xl px-5 py-3">
            <CheckCircle2 size={18} className="text-[#b9d2eb]" />
            <span className="text-[#b9d2eb] text-sm font-bold">{certs.length} curso{certs.length !== 1 ? 's' : ''} concluído{certs.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden animate-pulse">
              <div className="h-24 bg-slate-100" />
              <div className="p-6 space-y-3">
                <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                <div className="h-5 bg-slate-100 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : certs.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Award size={36} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-[#001A26]">Nenhum certificado ainda</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Conclua um curso para receber seu certificado automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certs.map(cert => (
            <CertificateCard key={cert.id} cert={cert} onView={setSelected} />
          ))}
        </div>
      )}

    </div>
  );
}
