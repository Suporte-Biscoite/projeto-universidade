// src/components/professor/MeusCursosView.jsx
import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, ChevronRight, ChevronDown, ChevronUp, Search,
  FileText, CheckSquare, GripVertical, X, Check, Pencil, Eye, EyeOff,
  Layers, Award, Megaphone, AlertTriangle, BarChart2, Loader, Star, Trash2,
} from 'lucide-react';
import { useProfile, CURRENT_INSTRUCTOR_ID } from '../../context/ProfileContext';
import { authFetch } from '../../utils/authFetch';
import VimeoUploader from '../VimeoUploader';
import { getLoggedId } from './ProfessorHelpers';
import { FieldInput, FieldSelect, InstructorDropdown, CourseFormModal, CourseDeleteModal } from './CourseModals';
import CertificadosSubTab from './CertificadosTab';

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

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: MEUS CURSOS
// ═══════════════════════════════════════════════════════════════════════════
function MeusCursosView() {
  const loggedId = getLoggedId();
  const {
    courses, modules, systemRole,
    addCourse, updateCourse, deleteCourse,
    addModule, updateModule, deleteModule, addLesson, updateLesson, deleteLesson,
    certTemplates, addCertTemplate, updateCertTemplate, deleteCertTemplate,
    issuedCerts, issueCertificate, revokeIssuedCert,
    users, setCourses, setModules,
  } = useProfile();

  // Recarrega cursos e módulos frescos do banco ao abrir aba
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    authFetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (cancelled || !Array.isArray(data)) return;
        if (setCourses) setCourses(data);
        const allMods = data.flatMap(c =>
          (c.modules || []).map(m => ({
            ...m,
            courseId: m.course_id || c.id,
            lessons:  m.lessons   || [],
          }))
        );
        if (setModules) setModules(allMods);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  const [mainTab, setMainTab] = useState('gerenciamento');
  const [subTab, setSubTab] = useState('cursos');

  // ── Course CRUD state ──
  const [courseModal, setCourseModal] = useState(null);
  const [confirmDelCourse, setConfirmDelCourse] = useState(null);
  const [courseFilter, setCourseFilter] = useState('todos');

  // ── Module/Aula CRUD state ──
  const [selCourseId, setSelCourseId] = useState(null);
  const [expandedMod, setExpandedMod] = useState(null);
  const [newModTitle, setNewModTitle] = useState('');
  const [editingMod, setEditingMod] = useState(null);
  const [editModTitle, setEditModTitle] = useState('');
  const [newLesson, setNewLesson] = useState({ title: '', duration: '', type: 'video', vimeoId: null, visibility: ['aluno','gestor','professor','admin'] });
  const [uploadingLesson, setUploadingLesson] = useState(false);
  const [addingLessonTo, setAddingLessonTo] = useState(null);
  const [confirmDelMod, setConfirmDelMod] = useState(null);

  // ── Kanban expand state ──
  const [expandedKanbanMod, setExpandedKanbanMod] = useState({});

  // ── Quiz state ──
  const [quizQuestions, setQuizQuestions] = useState([
    { id: 1, text: 'Questão 1 — Aula 1' },
    { id: 2, text: 'Questão 2 — Aula 2' },
    { id: 3, text: 'Questão 3 — Aula 1' },
  ]);
  const [quizSearch, setQuizSearch] = useState('');
  const [quizQuestion, setQuizQuestion] = useState('Como funciona o processo de abertura de loja?');
  const [quizAlts, setQuizAlts] = useState(['Checklist e aprovação do gestor', 'Apenas a chave do caixa', 'Sinal de wi-fi ativo']);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [newAlt, setNewAlt] = useState('');

  const myCourses = systemRole === 'professor'
    ? courses.filter(c => c.instructorId === CURRENT_INSTRUCTOR_ID)
    : courses;

  const filteredCourses = courseFilter === 'todos' ? myCourses
    : courseFilter === 'publicado' ? myCourses.filter(c => c.published)
    : myCourses.filter(c => !c.published);

  const courseModules = selCourseId
    ? modules.filter(m => String(m.courseId) === String(selCourseId) || String(m.course_id) === String(selCourseId)).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const handleAddMod = () => {
    if (!newModTitle.trim() || !selCourseId) return;
    addModule(selCourseId, newModTitle);
    setNewModTitle('');
  };

  const handleAddLesson = (moduleId) => {
    if (!newLesson.title.trim()) return;
    addLesson(moduleId, newLesson);
    setNewLesson({ title: '', duration: '', type: 'video', vimeoId: null, visibility: ['aluno','gestor','professor','admin'] });
    setAddingLessonTo(null);
  };

  const quizFiltered = quizQuestions.filter(q =>
    q.text.toLowerCase().includes(quizSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Modals */}
      {courseModal && (
        <CourseFormModal
          initial={courseModal === 'add' ? null : courseModal}
          systemRole={systemRole}
          onSave={(data) => courseModal === 'add' ? addCourse(data) : updateCourse(courseModal.id, data)}
          onClose={() => setCourseModal(null)}
        />
      )}
      {confirmDelCourse && (
        <CourseDeleteModal
          message="Tem certeza que deseja excluir este curso e todos os seus módulos?"
          onConfirm={() => { deleteCourse(confirmDelCourse); setConfirmDelCourse(null); }}
          onCancel={() => setConfirmDelCourse(null)}
        />
      )}
      {confirmDelMod && (
        <CourseDeleteModal
          message="Tem certeza que deseja excluir este módulo e todas as suas aulas?"
          onConfirm={() => { deleteModule(confirmDelMod); setConfirmDelMod(null); }}
          onCancel={() => setConfirmDelMod(null)}
        />
      )}

      {/* ── Main tabs ── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-0">
        <div className="flex gap-6">
          {[['gerenciamento','Gerenciamento de Cursos'],['relatorios','Relatórios'],['avaliacoes','Avaliações']].map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)}
              className={`pb-3 text-sm font-black transition-all border-b-2 -mb-px ${
                mainTab === id ? 'text-[#00263B] border-[#4A72B2]' : 'text-slate-400 border-transparent hover:text-[#00263B]'
              }`}>{label}</button>
          ))}
        </div>
        {mainTab === 'gerenciamento' && subTab === 'cursos' && (
          <button onClick={() => setCourseModal('add')}
            className="flex-shrink-0 mb-1 flex items-center gap-2 px-5 py-2.5 bg-[#00263B] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all">
            <Plus size={14} /> Novo curso
          </button>
        )}
        {mainTab === 'gerenciamento' && subTab === 'modulos' && selCourseId && (
          <button onClick={() => { if (!newModTitle.trim()) return; handleAddMod(); }}
            className="flex-shrink-0 mb-1 flex items-center gap-2 px-5 py-2.5 bg-[#00263B] text-white rounded-xl text-xs font-black hover:bg-[#4A72B2] transition-all opacity-40 cursor-default">
            <Plus size={14} /> Módulo
          </button>
        )}
      </div>

      {/* ── Gerenciamento ── */}
      {mainTab === 'gerenciamento' && (
        <div className="space-y-8">

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
            {[
              ['kanban',       <Layers size={13} />,      'Estrutura Visual'],
              ['cursos',       <BookOpen size={13} />,    'Lista de Cursos'],
              ['modulos',      <FileText size={13} />,    'Módulos & Aulas'],

            ].map(([id, icon, label]) => (
              <button key={id} onClick={() => setSubTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  subTab === id ? 'bg-white text-[#00263B] shadow-sm' : 'text-slate-400 hover:text-[#00263B]'
                }`}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ── SUB-TAB: Estrutura Visual (Kanban) ── */}
          {subTab === 'kanban' && (
            <div>
              {myCourses.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium text-sm">
                  Nenhum curso criado ainda.
                  <button onClick={() => setSubTab('cursos')} className="ml-2 text-[#4A72B2] font-black underline">Criar agora</button>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {myCourses.map((course, ci) => {
                    const cMods = modules.filter(m => String(m.courseId || m.course_id) === String(course.id)).sort((a, b) => (a.order || 0) - (b.order || 0));
                    const color = KANBAN_COLORS[ci % KANBAN_COLORS.length];
                    return (
                      <div key={course.id} className="min-w-[220px] max-w-[220px] bg-white rounded-[20px] border border-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border truncate max-w-[130px] ${color}`}>{course.title}</span>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => setCourseModal(course)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-[#4A72B2]"><Pencil size={11} /></button>
                            <button onClick={() => { setSelCourseId(course.id); setSubTab('modulos'); }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-[#4A72B2]"><Plus size={11} /></button>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                          {cMods.length === 0 && (
                            <p className="text-center text-[9px] text-slate-300 font-medium py-4">Sem módulos</p>
                          )}
                          {cMods.map(mod => {
                            const key = `${course.id}-${mod.id}`;
                            const isOpen = !!expandedKanbanMod[key];
                            return (
                              <div key={mod.id}>
                                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 cursor-pointer hover:bg-[#f0f6ff]"
                                  onClick={() => setExpandedKanbanMod(p => ({ ...p, [key]: !p[key] }))}>
                                  <GripVertical size={9} className="text-slate-300 shrink-0" />
                                  {isOpen ? <ChevronDown size={9} className="text-slate-400 shrink-0" /> : <ChevronRight size={9} className="text-slate-400 shrink-0" />}
                                  <span className="text-[9px] font-black text-[#00263B] flex-1 truncate">{mod.title}</span>
                                  <span className="text-[8px] text-slate-300 shrink-0">{mod.lessons.length}</span>
                                </div>
                                {isOpen && mod.lessons.map(lesson => (
                                  <div key={lesson.id} className="flex items-center gap-1.5 px-4 py-2 hover:bg-slate-50">
                                    <FileText size={8} className="text-[#4A72B2] shrink-0" />
                                    <span className="text-[9px] font-medium text-slate-500 flex-1 truncate">{lesson.title}</span>
                                    <span className="text-[8px] text-slate-300 shrink-0">{lesson.duration}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-3 py-2 border-t border-slate-50 flex items-center gap-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${course.published ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {course.published ? 'Publicado' : 'Rascunho'}
                          </span>
                          <span className="text-[8px] text-slate-300 ml-auto">{cMods.length} mód.</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB: Lista de Cursos ── */}
          {subTab === 'cursos' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {['todos','publicado','rascunho'].map(f => (
                  <button key={f} onClick={() => setCourseFilter(f)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      courseFilter === f ? 'bg-[#4A72B2] text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-[#4A72B2] hover:text-[#4A72B2]'
                    }`}>{f}
                  </button>
                ))}
              </div>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium text-sm">Nenhum curso encontrado.</div>
              ) : (
                <div className="space-y-3">
                  {filteredCourses.map(course => (
                    <div key={course.id} className="bg-white rounded-2xl px-6 py-5 border border-slate-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-[#001A26] text-sm truncate">{course.title}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${CAT_COLORS[course.category] || 'bg-slate-100 text-slate-600'}`}>{course.category}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${course.published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {course.published ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          {course.instructor} · {course.level} · {course.duration} · {course.format}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateCourse(course.id, { published: !course.published })}
                          title={course.published ? 'Despublicar' : 'Publicar'}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                          {course.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setCourseModal(course)}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { setSelCourseId(course.id); setSubTab('modulos'); }}
                          title="Gerenciar módulos"
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#e2eef9] text-slate-400 hover:text-[#4A72B2] flex items-center justify-center transition-colors">
                          <Layers size={14} />
                        </button>
                        <button onClick={() => setConfirmDelCourse(course.id)}
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB: Módulos & Aulas ── */}
          {subTab === 'modulos' && (
            <div className="space-y-5">
              {/* Seletor de curso */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 max-w-xs space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione o curso</label>
                  <select value={selCourseId || ''} onChange={e => { setSelCourseId(e.target.value || null); setExpandedMod(null); }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                    <option value="">Escolha um curso...</option>
                    {myCourses.map(c => <option key={c.id} value={String(c.id)}>{c.title}</option>)}
                  </select>
                </div>
                {selCourseId && (
                  <div className="flex gap-2 flex-1">
                    <input value={newModTitle} onChange={e => setNewModTitle(e.target.value.slice(0, 100))}
                      placeholder="Nome do novo módulo..."
                      onKeyDown={e => e.key === 'Enter' && handleAddMod()}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                    <button
                      onClick={() => {
                        if (!newModTitle.trim()) {
                          alert('Digite o nome do módulo antes de criar.');
                          return;
                        }
                        handleAddMod();
                      }}
                      className="px-5 py-3 bg-[#00263B] hover:bg-[#4A72B2] text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all">
                      <Plus size={14} /> Módulo
                    </button>
                  </div>
                )}
              </div>

              {!selCourseId && (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  Selecione um curso para gerenciar os módulos.
                </div>
              )}

              {selCourseId && courseModules.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  Nenhum módulo ainda. Crie o primeiro acima.
                </div>
              )}

              {selCourseId && courseModules.length > 0 && (
                <div className="space-y-3">
                  {courseModules.map((mod, idx) => (
                    <div key={mod.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4">
                        <GripVertical size={14} className="text-slate-300 shrink-0" />
                        <span className="w-6 h-6 rounded-lg bg-[#e2eef9] text-[#4A72B2] text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        {editingMod === mod.id ? (
                          <input autoFocus value={editModTitle} onChange={e => setEditModTitle(e.target.value.slice(0, 100))}
                            onKeyDown={e => { if (e.key === 'Enter') { updateModule(mod.id, editModTitle); setEditingMod(null); } if (e.key === 'Escape') setEditingMod(null); }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#4A72B2] text-sm font-black text-[#001A26] outline-none" />
                        ) : (
                          <span className="flex-1 font-black text-[#001A26] text-sm">{mod.title}</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{mod.lessons.length} aulas</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {editingMod === mod.id ? (
                            <>
                              <button onClick={() => { updateModule(mod.id, editModTitle); setEditingMod(null); }} className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100"><Check size={13} /></button>
                              <button onClick={() => setEditingMod(null)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100"><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingMod(mod.id); setEditModTitle(mod.title); }} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#e2eef9] hover:text-[#4A72B2] flex items-center justify-center"><Pencil size={12} /></button>
                              <button onClick={() => setConfirmDelMod(mod.id)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"><Trash2 size={12} /></button>
                            </>
                          )}
                          <button onClick={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                            {expandedMod === mod.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      {expandedMod === mod.id && (
                        <div className="border-t border-slate-50 px-5 py-4 space-y-3">
                          {mod.lessons.length === 0 && <p className="text-xs text-slate-400 font-medium">Nenhuma aula ainda.</p>}
                          {mod.lessons.map((lesson, li) => (
                            <div key={lesson.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                              <span className="text-[10px] font-bold text-slate-400 w-4">{li + 1}</span>
                              <span className="flex-1 text-sm font-medium text-[#001A26]">{lesson.title}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{lesson.duration}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-500">{lesson.type}</span>
                              <button onClick={() => deleteLesson(mod.id, lesson.id)} className="w-6 h-6 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"><Trash2 size={11} /></button>
                            </div>
                          ))}
                          {addingLessonTo === mod.id ? (
                            <div className="space-y-3 pt-2">
                              <div className="grid grid-cols-2 gap-3">
                                <input autoFocus type="text" placeholder="Título da aula" value={newLesson.title}
                                  onChange={e => setNewLesson(p => ({ ...p, title: e.target.value.slice(0, 100) }))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                                <input type="text" placeholder="Duração (ex: 10 min)" value={newLesson.duration}
                                  onChange={e => setNewLesson(p => ({ ...p, duration: e.target.value.slice(0, 20) }))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-[#001A26] outline-none focus:border-[#4A72B2] font-medium placeholder-slate-300" />
                              </div>
                              <div className="flex items-center gap-3">
                                <select value={newLesson.type} onChange={e => setNewLesson(p => ({ ...p, type: e.target.value }))}
                                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-[#001A26] outline-none focus:border-[#4A72B2] font-medium bg-white">
                                  {L_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="flex gap-2 ml-auto shrink-0">
                                  <button onClick={() => { setAddingLessonTo(null); setNewLesson({ title: '', duration: '', type: 'video', vimeoId: null, visibility: ['aluno','gestor','professor','admin'] }); }}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-500 hover:bg-slate-50">Cancelar</button>
                                  <button onClick={() => handleAddLesson(mod.id)} disabled={!newLesson.title.trim()}
                                    className="px-4 py-2 rounded-xl bg-[#001A26] hover:bg-[#4A72B2] text-white text-xs font-black transition-all disabled:opacity-40">Adicionar</button>
                                </div>
                              </div>
                              {/* Upload de vídeo Vimeo para a aula */}
                              <div className="mt-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vídeo da aula (opcional)</p>
                                <VimeoUploader
                                  value={newLesson.vimeoId}
                                  onChange={(id) => setNewLesson(p => ({ ...p, vimeoId: id }))}
                                  courseTitle={newLesson.title}
                                />
                              </div>
                              {/* Visibilidade da aula */}
                              <div className="mt-3 space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visível para</p>
                                <div className="flex gap-1.5 flex-wrap">
                                  {[
                                    { value: 'aluno', label: 'Colaboradores' },
                                    { value: 'gestor', label: 'Gestores' },
                                    { value: 'professor', label: 'Professores' },
                                    { value: 'admin', label: 'Admins' },
                                  ].map(({ value, label }) => {
                                    const active = (newLesson.visibility || []).includes(value);
                                    return (
                                      <button key={value} type="button"
                                        onClick={() => setNewLesson(p => ({
                                          ...p,
                                          visibility: active
                                            ? (p.visibility || []).filter(v => v !== value)
                                            : [...(p.visibility || []), value],
                                        }))}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-black border transition-all ${
                                          active ? 'bg-[#4A72B2] text-white border-[#4A72B2]' : 'bg-white text-slate-300 border-slate-200'
                                        }`}>
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setAddingLessonTo(mod.id)} className="flex items-center gap-2 text-xs font-black text-[#4A72B2] hover:text-[#001A26] transition-colors pt-1">
                              <Plus size={13} /> Adicionar aula
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB: Certificados ── */}
          {subTab === 'certificados' && (
            <CertificadosSubTab
              certTemplates={certTemplates}
              addCertTemplate={addCertTemplate}
              updateCertTemplate={updateCertTemplate}
              deleteCertTemplate={deleteCertTemplate}
              issuedCerts={issuedCerts}
              issueCertificate={issueCertificate}
              revokeIssuedCert={revokeIssuedCert}
              courses={myCourses}
              users={users}
              systemRole={systemRole}
            />
          )}

          {/* ── Quiz + Acesso (oculto na aba Certificados) ── */}
          {subTab !== 'certificados' && <>

          {/* ── Gerador de Quiz + Configurações de Acesso ── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quiz */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
              <h4 className="text-sm font-black text-[#00263B]">Gerador de Quiz</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco de Questões</p>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <Search size={11} className="text-slate-300" />
                      <input value={quizSearch} onChange={e => setQuizSearch(e.target.value)} placeholder="Buscar"
                        className="flex-1 bg-transparent text-[10px] outline-none text-slate-500" />
                    </div>
                    <button onClick={() => {
                      const t = prompt('Título da questão:');
                      if (t?.trim()) setQuizQuestions(p => [...p, { id: Date.now(), text: t.trim() }]);
                    }} className="w-8 h-8 bg-[#4A72B2] text-white rounded-xl flex items-center justify-center hover:bg-[#00263B] transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quizFiltered.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl hover:bg-[#E2F0FF] transition-colors cursor-pointer group/q">
                        <CheckSquare size={11} className="text-[#4A72B2]" />
                        <span className="text-[9px] font-semibold text-slate-500 flex-1">{q.text}</span>
                        <button onClick={() => setQuizQuestions(p => p.filter(x => x.id !== q.id))}
                          className="opacity-0 group-hover/q:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pergunta</p>
                  <textarea value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)}
                    className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-2 text-[9px] text-slate-500 outline-none resize-none focus:border-[#4A72B2]" />
                  <div className="space-y-1.5">
                    {quizAlts.map((alt, i) => (
                      <div key={i} className="flex items-center gap-2 group/alt">
                        <input type="radio" name="quiz_alt" checked={quizCorrect === i} onChange={() => setQuizCorrect(i)} className="accent-[#4A72B2]" />
                        <span className="text-[9px] text-slate-400 font-medium flex-1">{alt}</span>
                        <button onClick={() => setQuizAlts(p => p.filter((_, j) => j !== i))}
                          className="opacity-0 group-hover/alt:opacity-100 text-slate-300 hover:text-red-400 transition-all">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                    {newAlt !== undefined && (
                      <div className="flex gap-1 pt-1">
                        <input value={newAlt} onChange={e => setNewAlt(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && newAlt.trim()) { setQuizAlts(p => [...p, newAlt.trim()]); setNewAlt(''); } }}
                          placeholder="+ Nova alternativa (Enter)"
                          className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-[9px] outline-none focus:border-[#4A72B2] placeholder-slate-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Configurações de Acesso */}
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-4">
              <h4 className="text-sm font-black text-[#00263B]">Configurações de Acesso</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trilhas de Pré-requisito</p>
                  <div className="flex gap-2 flex-wrap">
                    {myCourses.slice(0, 3).map((c, i) => (
                      <div key={c.id} className="relative">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-[8px] font-black border-2 border-white shadow-sm ${KANBAN_COLORS[i % KANBAN_COLORS.length]}`}>
                          {c.title.slice(0, 4)}
                        </div>
                        <span className="absolute -bottom-1 left-0 right-0 text-center text-[7px] font-black text-slate-500 bg-white rounded-full mx-1 py-0.5 truncate">{c.title.split(' ')[0]}</span>
                      </div>
                    ))}
                    {myCourses.length === 0 && <p className="text-[9px] text-slate-300 font-medium">Nenhum curso disponível.</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" className="accent-[#4A72B2]" defaultChecked />
                    <span className="text-[9px] text-slate-400 font-medium">Requer conclusão do pré-requisito</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segmentação</p>
                  {['Diretores','Vendedores','Apenas Franqueados','Apenas Funcionários'].map((seg) => (
                    <div key={seg} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl hover:bg-[#E2F0FF] transition-colors cursor-pointer">
                      <span className="text-[9px] font-semibold text-slate-500">{seg}</span>
                      <ChevronRight size={10} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </>}
        </div>
      )}

      {mainTab === 'relatorios'  && <RelatoriosView />}
      {mainTab === 'avaliacoes'  && <AvaliacoesView loggedId={loggedId} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW: RELATÓRIOS
// ═══════════════════════════════════════════════════════════════════════════
function RelatoriosView() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch('/api/courses').then(r => r.ok ? r.json() : []),
      authFetch('/api/data?resource=certificates').then(r => r.ok ? r.json() : []),
    ]).then(([courses, certs]) => {
      setData({ courses: Array.isArray(courses) ? courses : [], certs: Array.isArray(certs) ? certs : [] });
    }).catch(() => setData({ courses: [], certs: [] }))
    .finally(() => setLoading(false));
  }, []);

  const AREA_COLORS = {
    'Operações': { area: 'bg-teal-100 text-teal-700', tag: 'bg-teal-500', card: 'bg-teal-50' },
    'Vendas':    { area: 'bg-purple-100 text-purple-700', tag: 'bg-purple-500', card: 'bg-purple-50' },
    'Marketing': { area: 'bg-orange-100 text-orange-700', tag: 'bg-orange-500', card: 'bg-orange-50' },
    'Gestão':    { area: 'bg-blue-100 text-blue-700', tag: 'bg-blue-500', card: 'bg-blue-50' },
    'default':   { area: 'bg-slate-100 text-slate-600', tag: 'bg-slate-400', card: 'bg-slate-50' },
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader size={28} className="animate-spin text-[#4A72B2]" />
    </div>
  );

  const courses = data?.courses || [];
  const certs   = data?.certs   || [];

  if (courses.length === 0) return (
    <div className="text-center py-20 text-slate-400">
      <BarChart2 size={40} className="mx-auto mb-3 text-slate-200" />
      <p className="font-bold">Nenhum curso publicado ainda.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sumário geral */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Cursos publicados', value: courses.filter(c => c.published).length, color: 'bg-[#e2eef9] text-[#4A72B2]' },
          { label: 'Certificados emitidos', value: certs.length, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total de aulas', value: courses.flatMap(c => c.modules || []).flatMap(m => m.lessons || []).length, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-[20px] p-5 text-center`}>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{label}</p>
          </div>
        ))}
      </div>

      {/* Cards por curso */}
      <div className="space-y-4">
        {courses.filter(c => c.published).map((c) => {
          const colors = AREA_COLORS[c.category] || AREA_COLORS.default;
          const totalAulas = (c.modules || []).flatMap(m => m.lessons || []).length;
          const certCount  = certs.filter(cert => cert.course_id === c.id).length;
          const modCount   = (c.modules || []).length;

          return (
            <div key={c.id} className={`${colors.card} rounded-[24px] p-6 relative overflow-hidden`}>
              <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 ${colors.tag} text-white rounded-full text-[10px] font-black uppercase`}>
                <Megaphone size={10} /> {c.category || 'Geral'}
              </div>
              <div className="flex items-center gap-8 flex-wrap">
                <div className="min-w-[200px]">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full ${colors.area} mb-2 inline-block`}>
                    {c.instructor_name || 'Instrutor'}
                  </span>
                  <h4 className="text-base font-black text-[#00263B] leading-tight">{c.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{c.level} · {c.format}</p>
                </div>
                <div className="flex gap-8 flex-1 flex-wrap">
                  {[
                    { label: 'Módulos',     value: modCount },
                    { label: 'Aulas',       value: totalAulas },
                    { label: 'Certificados emitidos', value: certCount },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-3xl font-black text-[#00263B]">{m.value}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 max-w-[80px] leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


export default MeusCursosView;
