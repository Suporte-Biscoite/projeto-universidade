import { useState, useEffect, useRef } from 'react';
import { Award, Download, Share2, ExternalLink, Loader, CheckCircle2, Calendar, Clock, Tag, Linkedin } from 'lucide-react';
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
            const text = `🎓 Concluí o curso "${cert.course_title}" pela Universidade Biscoitê! #Biscoitê #Aprendizado`;
            const url = `https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent('Certificado Biscoitê')}&summary=${encodeURIComponent(text)}&source=Universidade%20Biscoitê`;
            window.open(url, '_blank');
          }}
          className="px-3 py-2.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] rounded-xl transition-colors"
          title="Compartilhar no LinkedIn"
        >
          <Linkedin size={14} />
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

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth();  // 297
      const H = pdf.internal.pageSize.getHeight(); // 210

      // Fundo escuro
      pdf.setFillColor(0, 26, 38); // #001A26
      pdf.rect(0, 0, W, H, 'F');

      // Círculo decorativo canto superior direito
      pdf.setFillColor(74, 114, 178);
      pdf.setGState(pdf.GState({ opacity: 0.12 }));
      pdf.circle(W - 30, 30, 50, 'F');
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // Borda interna
      pdf.setDrawColor(74, 114, 178);
      pdf.setLineWidth(0.4);
      pdf.setGState(pdf.GState({ opacity: 0.4 }));
      pdf.roundedRect(16, 12, W - 32, H - 24, 6, 6, 'S');
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // Linha de acento topo
      pdf.setFillColor(74, 114, 178);
      pdf.rect(16, 12, (W - 32) * 0.5, 1, 'F');

      // Tag superior
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(185, 210, 235);
      pdf.setGState(pdf.GState({ opacity: 0.6 }));
      pdf.text('UNIVERSIDADE BISCOITÊ', W / 2, 28, { align: 'center', charSpace: 2 });
      pdf.text('CERTIFICADO DE CONCLUSÃO', W / 2, 34, { align: 'center', charSpace: 1.5 });
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // Linha divisória
      pdf.setDrawColor(74, 114, 178);
      pdf.setLineWidth(0.3);
      pdf.setGState(pdf.GState({ opacity: 0.3 }));
      pdf.line(W / 2 - 30, 38, W / 2 + 30, 38);
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // "Certificamos que"
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setGState(pdf.GState({ opacity: 0.5 }));
      pdf.text('Certificamos que', W / 2, 55, { align: 'center' });
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // Nome do aluno
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text(cert.user_name, W / 2, 72, { align: 'center' });

      // "concluiu com êxito"
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setGState(pdf.GState({ opacity: 0.5 }));
      pdf.text('concluiu com êxito o curso', W / 2, 85, { align: 'center' });
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // Título do curso
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(185, 210, 235);
      pdf.text(`"${cert.course_title}"`, W / 2, 98, { align: 'center', maxWidth: W - 60 });

      // Linha divisória central
      pdf.setDrawColor(74, 114, 178);
      pdf.setLineWidth(0.3);
      pdf.setGState(pdf.GState({ opacity: 0.3 }));
      pdf.line(W / 2 - 50, 110, W / 2 - 4, 110);
      pdf.setFillColor(74, 114, 178);
      pdf.setGState(pdf.GState({ opacity: 0.5 }));
      pdf.circle(W / 2, 110, 1.5, 'F');
      pdf.setGState(pdf.GState({ opacity: 0.3 }));
      pdf.line(W / 2 + 4, 110, W / 2 + 50, 110);
      pdf.setGState(pdf.GState({ opacity: 1 }));

      // Data
      const date = new Date(cert.issued_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(185, 210, 235);
      pdf.setGState(pdf.GState({ opacity: 0.5 }));
      pdf.text(`Emitido em ${date}`, W / 2, 122, { align: 'center' });

      // ID verificação
      pdf.setFontSize(7);
      pdf.setGState(pdf.GState({ opacity: 0.3 }));
      pdf.text(`ID: ${cert.id}`, W / 2, 132, { align: 'center' });
      pdf.setGState(pdf.GState({ opacity: 1 }));

      pdf.save(`Certificado - ${cert.course_title}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
    }
  };

  const handleLinkedIn = () => {
    const text = encodeURIComponent(
      `🎓 Acabei de concluir o curso "${cert.course_title}" pela Universidade Biscoitê!

Um passo importante na minha jornada de desenvolvimento profissional. Muito orgulhoso dessa conquista! 🚀

#UniversidadeBiscoitê #Biscoitê #Desenvolvimento #Aprendizado`
    );
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${text}`;
    window.open(url, '_blank', 'width=600,height=600');
  };

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
            {/* Logo Biscoitê */}
            <div className="flex flex-col items-center gap-3">
              <img
                src="/logo-biscoite.svg"
                alt="Universidade Biscoitê"
                className="h-12 w-auto"
                style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
                crossOrigin="anonymous"
              />
              <div className="w-10 h-10 bg-[#4A72B2]/20 rounded-full flex items-center justify-center border border-[#4A72B2]/40">
                <Award size={20} className="text-[#b9d2eb]" />
              </div>
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
        <div className="p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={onClose}
            className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors">
            Fechar
          </button>
          <button onClick={handleLinkedIn}
            className="flex-1 py-3 rounded-2xl bg-[#0A66C2] text-white font-bold text-sm hover:bg-[#0958a8] transition-colors flex items-center justify-center gap-2">
            <Linkedin size={15} /> Compartilhar no LinkedIn
          </button>
          <button onClick={handleDownloadPDF}
            className="flex-1 py-3 rounded-2xl bg-[#001A26] text-white font-bold text-sm hover:bg-[#4A72B2] transition-colors flex items-center justify-center gap-2">
            <Download size={15} /> Baixar PDF
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
