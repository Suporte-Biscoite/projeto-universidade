// src/components/professor/CertificadosTab.jsx
import { useState } from 'react';
import { X, Check, Award, AlertTriangle, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { CURRENT_INSTRUCTOR_ID } from '../../context/ProfileContext';

// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICADOS — sub-tab do Meus Cursos
// ═══════════════════════════════════════════════════════════════════════════
const CERT_AREAS = ['Operações','Vendas','Gestão','Marketing','IA','Franquias','Business'];
const CERT_DURATIONS = ['Curta duração','Média duração','Longa duração'];
const CERT_BG_COLORS = ['#001A26','#7C3AED','#0F766E','#C2410C','#1D4ED8','#15803D'];
const CERT_ACCENT_COLORS = ['#4A72B2','#F59E0B','#34D399','#FB923C','#60A5FA','#86EFAC'];
const AREA_BADGE = {
  'Operações':'bg-emerald-100 text-emerald-700','Vendas':'bg-blue-100 text-blue-700',
  'Gestão':'bg-purple-100 text-purple-700','Marketing':'bg-orange-100 text-orange-700',
  'IA':'bg-pink-100 text-pink-700','Franquias':'bg-teal-100 text-teal-700','Business':'bg-cyan-100 text-cyan-700',
};

function CertPreview({ cert }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ background: cert.bgColor || '#001A26' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${cert.accentColor || '#4A72B2'}` }}>
        <div className="flex items-center gap-2">
          <Award size={16} style={{ color: cert.accentColor || '#4A72B2' }} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Universidade Biscoitê</span>
        </div>
        <span className="text-[8px] text-white/50 font-semibold">{cert.createdAt || ''}</span>
      </div>
      <div className="px-5 py-5 space-y-2">
        <p className="text-[9px] text-white/60 font-semibold uppercase tracking-widest">Certificado de Conclusão</p>
        <p className="text-sm font-black text-white leading-tight">{cert.title || 'Título do certificado'}</p>
        <p className="text-[9px] text-white/50 leading-relaxed line-clamp-2">{cert.description || 'Descrição do certificado...'}</p>
      </div>
      <div className="px-5 py-3 flex items-center justify-between border-t border-white/10">
        <div className="flex gap-1 flex-wrap">
          {(cert.tags || []).slice(0, 2).map(t => (
            <span key={t} className="text-[7px] font-black px-2 py-0.5 rounded-full text-white/70 border border-white/20">{t}</span>
          ))}
        </div>
        <span className="text-[8px] font-black" style={{ color: cert.accentColor || '#4A72B2' }}>{cert.instructorName || 'Professor'}</span>
      </div>
    </div>
  );
}

function CertTemplateModal({ initial, courses, onSave, onClose }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    area: initial?.area || 'Operações',
    tags: initial?.tags?.join(', ') || '',
    duration: initial?.duration || 'Curta duração',
    courseId: initial?.courseId || '',
    instructorName: initial?.instructorName || 'Karla Madeira',
    bgColor: initial?.bgColor || '#001A26',
    accentColor: initial?.accentColor || '#4A72B2',
    published: initial?.published ?? true,
  });
  const isEdit = Boolean(initial?.id);
  const previewCert = {
    ...form,
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    createdAt: initial?.createdAt || 'Abr 2026',
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-[#001A26] text-lg">{isEdit ? 'Editar Certificado' : 'Novo Certificado'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value.slice(0, 120) }))}
                placeholder="Certificado de Conclusão — Curso X"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value.slice(0, 500) }))}
                placeholder="Certifica que o aluno concluiu..." rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium resize-none placeholder-slate-300" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Área</label>
                <select value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                  {CERT_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração</label>
                <select value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                  {CERT_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Curso vinculado</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: Number(e.target.value) || '' }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                <option value="">Nenhum (manual)</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags (vírgula)</label>
              <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="operações, básico, biscoitê"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do instrutor</label>
              <input value={form.instructorName} onChange={e => setForm(p => ({ ...p, instructorName: e.target.value.slice(0, 60) }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor fundo</label>
                <div className="flex gap-2 flex-wrap">
                  {CERT_BG_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, bgColor: c }))}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${form.bgColor === c ? 'border-[#4A72B2] scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor destaque</label>
                <div className="flex gap-2 flex-wrap">
                  {CERT_ACCENT_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, accentColor: c }))}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${form.accentColor === c ? 'border-[#001A26] scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${form.published ? 'bg-[#4A72B2]' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm font-black text-[#001A26]">Publicar (visível para alunos)</span>
            </label>
          </div>
          {/* Preview */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pré-visualização</p>
            <CertPreview cert={previewCert} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
          <button onClick={() => {
            if (!form.title.trim()) return;
            onSave({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
            onClose();
          }} disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-xl bg-[#001A26] hover:bg-[#4A72B2] text-white font-black text-xs transition-all disabled:opacity-40">
            {isEdit ? 'Salvar alterações' : 'Criar certificado'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueModal({ template, users, issuedCerts, onIssue, onClose }) {
  const [selUserId, setSelUserId] = useState('');
  const [stars, setStars] = useState(5);
  const [issued, setIssued] = useState(false);
  const eligible = users.filter(u => u.systemRole === 'aluno' || u.systemRole === 'franqueado');
  const alreadyIssued = issuedCerts.filter(ic => ic.templateId === template.id);
  const alreadyIds = new Set(alreadyIssued.map(ic => ic.userId));
  const handleIssue = () => {
    if (!selUserId) return;
    const u = users.find(u => u.id === Number(selUserId));
    onIssue(template.id, Number(selUserId), u?.name || '', u?.systemRole || 'aluno', stars);
    setIssued(true);
    setTimeout(() => { setIssued(false); setSelUserId(''); }, 1500);
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] p-7 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-[#001A26] text-sm">{template.title}</p>
            <p className="text-[10px] text-slate-400 font-medium">Emitir certificado para aluno/franqueado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><X size={16} /></button>
        </div>
        {issued ? (
          <div className="flex flex-col items-center gap-2 py-6 text-emerald-500">
            <Check size={32} /><p className="font-black text-sm">Certificado emitido!</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecionar aluno/franqueado</label>
              <select value={selUserId} onChange={e => setSelUserId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                <option value="">Escolha um usuário...</option>
                {eligible.map(u => (
                  <option key={u.id} value={u.id} disabled={alreadyIds.has(u.id)}>
                    {u.name} ({u.systemRole}){alreadyIds.has(u.id) ? ' ✓ já emitido' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avaliação</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setStars(s)}>
                    <Star size={20} className={s <= stars ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>
            {alreadyIssued.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Já emitido para</p>
                {alreadyIssued.map(ic => (
                  <div key={ic.id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-xs font-black text-emerald-700">{ic.userName}</span>
                    <span className="text-[9px] text-emerald-500 font-medium">{ic.issuedAt}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-xs hover:bg-slate-50">Cancelar</button>
              <button onClick={handleIssue} disabled={!selUserId}
                className="flex-1 py-3 rounded-xl bg-[#4A72B2] hover:bg-[#001A26] text-white font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                <Award size={13} /> Emitir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CertificadosSubTab({ certTemplates, addCertTemplate, updateCertTemplate, deleteCertTemplate, issuedCerts, issueCertificate, revokeIssuedCert, courses, users, systemRole }) {
  const [modal, setModal] = useState(null); // null | 'add' | template obj
  const [issueModal, setIssueModal] = useState(null); // null | template obj
  const [confirmDel, setConfirmDel] = useState(null);

  const myCerts = systemRole === 'professor'
    ? certTemplates.filter(t => t.instructorId === CURRENT_INSTRUCTOR_ID)
    : certTemplates;

  return (
    <div className="space-y-6">
      {modal && (
        <CertTemplateModal
          initial={modal === 'add' ? null : modal}
          courses={courses}
          onSave={(data) => modal === 'add' ? addCertTemplate(data) : updateCertTemplate(modal.id, data)}
          onClose={() => setModal(null)}
        />
      )}
      {issueModal && (
        <IssueModal
          template={issueModal}
          users={users}
          issuedCerts={issuedCerts}
          onIssue={issueCertificate}
          onClose={() => setIssueModal(null)}
        />
      )}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-black text-[#001A26] text-sm">Excluir certificado?</p>
                <p className="text-slate-400 text-xs mt-1">Todos os certificados emitidos deste modelo também serão removidos.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
              <button onClick={() => { deleteCertTemplate(confirmDel); setConfirmDel(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-[#00263B]">Modelos de Certificado</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Crie e gerencie os certificados que serão emitidos para alunos e franqueados</p>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00263B] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all">
          <Plus size={14} /> Novo certificado
        </button>
      </div>

      {myCerts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-medium text-sm">
          Nenhum certificado criado ainda. Clique em "Novo certificado" para começar.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {myCerts.map(tmpl => {
            const issued = issuedCerts.filter(ic => ic.templateId === tmpl.id);
            return (
              <div key={tmpl.id} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-5">
                  <CertPreview cert={tmpl} />
                </div>
                <div className="px-5 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${AREA_BADGE[tmpl.area] || 'bg-slate-100 text-slate-600'}`}>{tmpl.area}</span>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${tmpl.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tmpl.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                    <Award size={10} className="text-[#4A72B2]" />
                    <span>{issued.length} emitido{issued.length !== 1 ? 's' : ''}</span>
                    {tmpl.courseId && courses.find(c => c.id === tmpl.courseId) && (
                      <span className="ml-1">· {courses.find(c => c.id === tmpl.courseId)?.title}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIssueModal(tmpl)}
                      className="flex-1 py-2 rounded-xl bg-[#4A72B2] hover:bg-[#001A26] text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all">
                      <Award size={11} /> Emitir
                    </button>
                    <button onClick={() => setModal(tmpl)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDel(tmpl.id)}
                      className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de emissões */}
      {issuedCerts.length > 0 && (
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-black text-[#00263B]">Histórico de Emissões</h4>
          <div className="space-y-2">
            {issuedCerts.map(ic => {
              const tmpl = certTemplates.find(t => t.id === ic.templateId);
              return (
                <div key={ic.id} className="flex items-center gap-4 px-4 py-3 bg-slate-50 rounded-2xl">
                  <div className="w-8 h-8 rounded-xl bg-[#E2F0FF] flex items-center justify-center shrink-0">
                    <Award size={14} className="text-[#4A72B2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#001A26] truncate">{ic.userName}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate">{tmpl?.title || '—'}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= ic.stars ? 'text-yellow-400' : 'text-slate-200'} fill="currentColor" />)}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium shrink-0">{ic.issuedAt}</span>
                  <button onClick={() => revokeIssuedCert(ic.id)} title="Revogar"
                    className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-colors">
                    <X size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


export default CertificadosSubTab;
