import { useState } from 'react';
import { Download, Star, ChevronLeft, ChevronRight, Trophy, Flame, Clock, BarChart2, Users, X, Award, Check } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

// ID fixo do usuário logado (demo) — em produção viria do JWT
const MY_USER_ID = 3;

const FILTERS = ['Todos', 'Área', 'Avaliações', 'Duração'];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={13} className={i < count ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />
      ))}
    </div>
  );
}

function CertCard({ cert, onDownload }) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Mini preview colorido */}
      <div className="h-28 flex items-center justify-center px-6 relative" style={{ background: cert.bgColor || '#001A26' }}>
        <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: cert.accentColor || '#4A72B2' }} />
        <div className="text-center space-y-1">
          <Award size={22} style={{ color: cert.accentColor || '#4A72B2' }} className="mx-auto" />
          <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Universidade Biscoitê</p>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4 flex-1">
        <div className="space-y-1.5 flex-1">
          <span className={`self-start inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cert.areaColor || 'bg-slate-100 text-slate-600'}`}>
            {cert.area}
          </span>
          <h3 className="font-black text-[#001A26] text-sm leading-tight mt-2">{cert.title}</h3>
          {cert.description && (
            <p className="text-slate-400 text-xs leading-relaxed font-medium line-clamp-2">{cert.description}</p>
          )}
        </div>
        {cert.tags && cert.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cert.tags.map(tag => (
              <span key={tag} className="px-2.5 py-0.5 border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <StarRating count={cert.stars || 0} />
          <span className="text-[10px] text-slate-300 font-semibold">{cert.issuedAt || cert.date}</span>
        </div>
        <button onClick={() => onDownload(cert)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
          <Download size={14} /> Download
        </button>
      </div>
    </div>
  );
}

function DownloadModal({ cert, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => { setDownloading(false); setDone(true); }, 1500);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl space-y-6 relative">
        <button onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200">
          <X size={16} />
        </button>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-emerald-500">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Check size={28} />
            </div>
            <p className="font-black text-lg text-emerald-600">Certificado gerado!</p>
            <p className="text-slate-400 text-xs text-center font-medium">Em produção, o PDF seria baixado automaticamente.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-[#001A26] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all">Fechar</button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl" style={{ background: cert?.bgColor || '#001A26' }}>
                <Award size={24} style={{ color: cert?.accentColor || '#4A72B2' }} />
              </div>
              <h3 className="text-xl font-black text-[#001A26]">Baixar certificado</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                <strong className="text-[#001A26]">{cert?.title}</strong>
                <br />Emitido em {cert?.issuedAt || cert?.date || '—'} · {cert?.area}
              </p>
            </div>
            <button onClick={handleDownload} disabled={downloading}
              className="w-full py-3 bg-[#001A26] hover:bg-[#4A72B2] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {downloading ? <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4 inline-block" /> Gerando...</> : <><Download size={14} /> Baixar PDF</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Certificates() {
  const { userData, achievements, certTemplates, issuedCerts, systemRole } = useProfile();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [activeArea, setActiveArea] = useState(null);
  const [page, setPage] = useState(0);
  const [downloadModal, setDownloadModal] = useState(null);

  const PAGE_SIZE = 3;

  // Certificados do usuário logado:
  // 1. Certs emitidos pelo professor via issuedCerts
  // 2. Certs legados em userData.certificates
  const issuedToMe = issuedCerts
    .filter(ic => ic.userId === MY_USER_ID)
    .map(ic => {
      const tmpl = certTemplates.find(t => t.id === ic.templateId);
      return tmpl ? {
        id: `issued_${ic.id}`,
        title: tmpl.title,
        description: tmpl.description,
        area: tmpl.area,
        areaColor: tmpl.areaColor,
        tags: tmpl.tags,
        stars: ic.stars,
        issuedAt: ic.issuedAt,
        duration: tmpl.duration,
        bgColor: tmpl.bgColor,
        accentColor: tmpl.accentColor,
      } : null;
    })
    .filter(Boolean);

  // Para professor/admin: mostrar todos os templates publicados como referência
  const profCerts = (systemRole === 'admin' || systemRole === 'professor')
    ? certTemplates.filter(t => t.published).map(t => ({
        id: `tmpl_${t.id}`,
        title: t.title,
        description: t.description,
        area: t.area,
        areaColor: t.areaColor,
        tags: t.tags,
        stars: 5,
        issuedAt: t.createdAt,
        duration: t.duration,
        bgColor: t.bgColor,
        accentColor: t.accentColor,
      }))
    : [];

  const legacyCerts = userData.certificates || [];

  // Unifica: emitidos ao usuário + legados + (professor vê os templates)
  const allCerts = systemRole === 'aluno' || systemRole === 'franqueado'
    ? [...issuedToMe, ...legacyCerts]
    : [...profCerts, ...legacyCerts];

  const areas = [...new Set(allCerts.map(c => c.area))];

  let filtered = [...allCerts];
  if (activeFilter === 'Área' && activeArea) {
    filtered = filtered.filter(c => c.area === activeArea);
  } else if (activeFilter === 'Avaliações') {
    filtered = [...filtered].sort((a, b) => (b.stars || 0) - (a.stars || 0));
  } else if (activeFilter === 'Duração') {
    const order = { 'Curta duração': 1, 'Média duração': 2, 'Longa duração': 3 };
    filtered = [...filtered].sort((a, b) => (order[a.duration] || 0) - (order[b.duration] || 0));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleFilterClick = (f) => { setActiveFilter(f); setActiveArea(null); setPage(0); };

  const ACHIEVEMENT_ITEMS = [
    { icon: Trophy,   label: 'cursos completos',  value: `+${achievements.coursesCompleted}`, color: 'text-[#4A72B2]',   bg: 'bg-[#E2F0FF]' },
    { icon: Flame,    label: 'dias seguidos',      value: `${achievements.streak} dias`,       color: 'text-orange-500',  bg: 'bg-orange-50' },
    { icon: Clock,    label: 'Minutos vistos',     value: achievements.minutesWatched.toLocaleString('pt-BR'), color: 'text-[#4A72B2]', bg: 'bg-[#E2F0FF]' },
    { icon: BarChart2,label: 'no ranking',         value: `${achievements.ranking}°`,          color: 'text-purple-500',  bg: 'bg-purple-50' },
    { icon: Users,    label: 'alunos indicados',   value: `+${achievements.referrals}`,        color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-16 pb-20">
      {downloadModal && <DownloadModal cert={downloadModal} onClose={() => setDownloadModal(null)} />}

      {/* SEÇÃO 1: CERTIFICADOS */}
      <section className="bg-[#e2eef9] rounded-[40px] p-10 space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#001A26]">Certificados</h2>
            <p className="text-sm text-slate-500 font-medium">
              {systemRole === 'aluno' || systemRole === 'franqueado'
                ? 'Seus certificados conquistados — tudo em um só lugar'
                : 'Certificados publicados na plataforma'
              }
            </p>
          </div>
          {(systemRole === 'aluno' || systemRole === 'franqueado') && issuedToMe.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2">
              <Award size={14} className="text-emerald-600" />
              <span className="text-xs font-black text-emerald-700">{issuedToMe.length} emitido{issuedToMe.length > 1 ? 's' : ''} pelo professor</span>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => handleFilterClick(f)}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  activeFilter === f ? 'bg-[#4A72B2] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:border-[#4A72B2] hover:text-[#4A72B2]'
                }`}>
                {f}
              </button>
            ))}
          </div>
          {activeFilter === 'Área' && areas.length > 0 && (
            <div className="flex gap-2 flex-wrap pl-1">
              {areas.map(area => (
                <button key={area} onClick={() => { setActiveArea(activeArea === area ? null : area); setPage(0); }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeArea === area ? 'bg-[#001A26] text-white' : 'bg-white/80 text-slate-500 border border-slate-200 hover:border-[#001A26] hover:text-[#001A26]'
                  }`}>
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cards */}
        {paged.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto">
              <Award size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium text-sm">
              {systemRole === 'aluno' || systemRole === 'franqueado'
                ? 'Nenhum certificado ainda. Conclua cursos para receber certificados!'
                : 'Nenhum certificado encontrado.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paged.map(cert => (
              <CertCard key={cert.id} cert={cert} onDownload={setDownloadModal} />
            ))}
          </div>
        )}

        {/* Paginação */}
        <div className="flex justify-end items-center gap-3">
          {totalPages > 1 && (
            <span className="text-xs text-slate-400 font-semibold">{safePage + 1} / {totalPages}</span>
          )}
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${safePage === 0 ? 'bg-[#b9d2eb] text-[#001A26] opacity-30 cursor-not-allowed' : 'bg-[#b9d2eb] text-[#001A26] hover:opacity-80'}`}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${safePage >= totalPages - 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#4A72B2] text-white shadow-md hover:bg-[#001A26]'}`}>
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* SEÇÃO 2: CONQUISTAS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-4">
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-[#001A26] leading-tight tracking-[-0.03em]">Conquistas</h2>
          <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-xs">
            Um espaço dedicado às suas conquistas mais marcantes, resultados que refletem seu talento e dedicação.
          </p>
        </div>
        <div className="space-y-3">
          {ACHIEVEMENT_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <Icon size={18} className={item.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-[#001A26]">{item.value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
