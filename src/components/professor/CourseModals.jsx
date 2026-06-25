// src/components/professor/CourseModals.jsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import VimeoUploader from '../VimeoUploader';

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: MEUS CURSOS — componentes auxiliares
// ═══════════════════════════════════════════════════════════════════════════
const CATS  = ['Operações','Vendas','Gestão','Marketing','IA','Franquias','Business'];
const LVLS  = ['Iniciante','Intermediário','Avançado'];
const FMTS  = ['Vídeo','Híbrido','Presencial'];
const L_TYPES = ['video','documento','quiz','ao vivo'];
const CAT_COLORS = {
  'Operações':'bg-emerald-100 text-emerald-700','Vendas':'bg-blue-100 text-blue-700',
  'Gestão':'bg-purple-100 text-purple-700','Marketing':'bg-orange-100 text-orange-700',
  'IA':'bg-pink-100 text-pink-700','Franquias':'bg-teal-100 text-teal-700','Business':'bg-cyan-100 text-cyan-700',
};
const KANBAN_COLORS = [
  'bg-purple-100 text-purple-700 border-purple-200','bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200','bg-pink-100 text-pink-700 border-pink-200',
  'bg-blue-100 text-blue-700 border-blue-200','bg-emerald-100 text-emerald-700 border-emerald-200',
];

function FieldInput({ label, value, onChange, placeholder, maxLength = 200, type = 'text', required = false }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value.slice(0, maxLength))} placeholder={placeholder} rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] resize-none font-medium placeholder-slate-300" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value.slice(0, maxLength))} placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
      )}
    </div>
  );
}
function FieldSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function extractYouTubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function InstructorDropdown({ value, onChange }) {
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    authFetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data.users || []);
        setInstructors(list.filter(u => u.role === 'professor' || u.role === 'admin'));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] bg-white font-medium appearance-none"
      >
        <option value="">Selecione o instrutor</option>
        {instructors.map(u => (
          <option key={u.id} value={u.name}>{u.name} ({u.role === 'admin' ? 'Admin' : 'Professor'})</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

function CourseFormModal({ initial, onSave, onClose, systemRole }) {
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    description: initial?.description || '',
    category:    initial?.category    || 'Operações',
    level:       initial?.level       || 'Iniciante',
    format:      initial?.format      || 'Vídeo',
    duration:    initial?.duration    || '',
    published:   initial?.published   ?? false,
    thumbnail:   initial?.thumbnail   || initial?.thumbnail_url || null,
    vimeoId:     initial?.vimeoId     || initial?.vimeo_id     || null,
    instructor:  initial?.instructor  || initial?.instructor_name || '',
    visibility:  initial?.visibility  || ['aluno','gestor','professor','admin'], // quem pode ver
  });
  const thumbInputRef = useRef(null);
  const isEdit = Boolean(initial?.id);

  const handleThumbFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, thumbnail: ev.target.result }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#001A26] text-lg">{isEdit ? 'Editar curso' : 'Novo curso'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"><X size={16} /></button>
        </div>

        {/* ── THUMBNAIL ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thumbnail / Capa do curso</label>
          <div
            onClick={() => thumbInputRef.current.click()}
            className="relative w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4A72B2] transition-colors cursor-pointer overflow-hidden group bg-slate-50"
          >
            {form.thumbnail ? (
              <>
                <img
                  src={form.thumbnail}
                  className="w-full h-full object-cover"
                  alt="thumbnail"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 bg-white/95 px-4 py-2 rounded-full text-xs font-black text-[#001A26] shadow-lg">
                    <ImageIcon size={14} /> Trocar imagem
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <ImageIcon size={26} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-500">Clique para enviar a thumbnail</p>
                  <p className="text-[11px] text-slate-400 mt-1">JPG, PNG · Recomendado 16:9</p>
                </div>
              </div>
            )}
            <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
          </div>
          {form.thumbnail && (
            <button
              onClick={() => setForm(p => ({ ...p, thumbnail: null }))}
              className="text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-1"
            >
              <X size={11} /> Remover thumbnail customizada
            </button>
          )}

        </div>

        {/* ── VÍDEO (Vimeo) ── */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vídeo do curso</label>
          <VimeoUploader
            value={form.vimeoId}
            onChange={(id) => setForm(p => ({ ...p, vimeoId: id }))}
            courseTitle={form.title}
            courseDesc={form.description}
          />
        </div>

        <div className="border-t border-slate-100" />

        {/* ── METADADOS ── */}
        <FieldInput label="Título *" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Ex: Fase 2 - Intermediário" maxLength={100} required />
        <FieldInput label="Descrição" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Breve descrição do curso..." maxLength={500} type="textarea" />
        <div className="grid grid-cols-2 gap-4">
          <FieldSelect label="Categoria"  value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))}  options={CATS} />
          <FieldSelect label="Nível"      value={form.level}    onChange={v => setForm(p => ({ ...p, level: v }))}      options={LVLS} />
          <FieldSelect label="Formato"    value={form.format}   onChange={v => setForm(p => ({ ...p, format: v }))}     options={FMTS} />
          <FieldInput  label="Duração"    value={form.duration} onChange={v => setForm(p => ({ ...p, duration: v }))}   placeholder="Ex: 2h 30min" maxLength={20} />
        </div>
        {/* Dropdown de instrutores */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Instrutor</label>
          <InstructorDropdown
            value={form.instructor}
            onChange={v => setForm(p => ({ ...p, instructor: v }))}
          />
        </div>
        {/* ── VISIBILIDADE POR PERFIL ── */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visível para</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'aluno',     label: 'Colaboradores', color: 'bg-slate-100 text-slate-600 border-slate-200' },
              { value: 'gestor',    label: 'Gestores',      color: 'bg-teal-100 text-teal-700 border-teal-200' },
              { value: 'professor', label: 'Professores',   color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { value: 'admin',     label: 'Admins',        color: 'bg-purple-100 text-purple-700 border-purple-200' },
            ].map(({ value, label, color }) => {
              const active = form.visibility.includes(value);
              return (
                <button key={value} type="button"
                  onClick={() => setForm(p => ({
                    ...p,
                    visibility: active
                      ? p.visibility.filter(v => v !== value)
                      : [...p.visibility, value],
                  }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
                    active ? color : 'bg-white text-slate-300 border-slate-200 opacity-50'
                  }`}>
                  {active ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400">Selecione quais perfis podem visualizar este curso.</p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setForm(p => ({ ...p, published: !p.published }))}
            className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${form.published ? 'bg-[#4A72B2]' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm font-black text-[#001A26]">Publicar imediatamente</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
          <button
            onClick={() => { if (!form.title.trim()) return; onSave(form); onClose(); }}
            disabled={!form.title.trim()}
            className="flex-1 py-3 rounded-xl bg-[#001A26] hover:bg-[#4A72B2] text-white font-black text-xs transition-colors disabled:opacity-40"
          >
            {isEdit ? 'Salvar alterações' : 'Criar curso'}
          </button>
        </div>
      </div>
    </div>
  );
}
function CourseDeleteModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="font-black text-[#001A26] text-sm leading-snug">{message}</p>
            <p className="text-slate-400 text-xs mt-1">Esta ação não pode ser desfeita.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs">Excluir</button>
        </div>
      </div>
    </div>
  );
}


export { FieldInput, FieldSelect, InstructorDropdown, CourseFormModal, CourseDeleteModal };
