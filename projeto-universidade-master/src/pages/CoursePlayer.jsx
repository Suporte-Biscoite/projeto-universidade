import { useState, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Play, Lock, Star, Clock, FileText,
  CheckCircle2, PlayCircle, Maximize2, Minimize2, User, Trophy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useProfile } from '../context/ProfileContext';

const MODULES = [
  {
    id: 1,
    title: 'Módulo 1: O que é a Biscoitê?',
    expanded: true,
    lessons: [
      { id: 1, title: 'Aula 1: Nossa História', duration: '05:00', completed: false, active: true },
      { id: 2, title: 'Aula 2: Manifesto + Valores', duration: '03:30', completed: false, locked: false },
    ]
  },
  {
    id: 2,
    title: 'Módulo 2: Operacional',
    expanded: true,
    lessons: [
      { id: 3, title: 'Aula 3: Conceito de Boutique', duration: '12:00', completed: false, locked: true },
      { id: 4, title: 'Aula 4: Conceito de Marca', duration: '08:15', completed: false, locked: true },
    ]
  },
  {
    id: 3,
    title: 'Módulo 3: Atendimento',
    expanded: false,
    lessons: [
      { id: 5, title: 'Aula 5: Conceito de Foco', duration: '10:00', completed: false, locked: true },
      { id: 6, title: 'Aula 6: Próximos passos', duration: '06:00', completed: false, locked: true },
    ]
  },
];

const TESTIMONIALS = [
  { name: 'José Almeida', stars: 5, text: 'Esse curso mudou minha forma de atender os clientes. Recomendo muito para todos da equipe de vendas!' },
  { name: 'Carolina Garcia', stars: 3, text: 'Bom conteúdo, mas poderia ter mais exemplos práticos do dia a dia da loja. No geral valeu!' },
  { name: 'Marcos Souza', stars: 5, text: 'Aprendi muito sobre a história da Biscoitê. Agora consigo transmitir os valores da marca com muito mais confiança.' },
  { name: 'Ana Lima', stars: 4, text: 'Didática excelente, os módulos são bem divididos e fáceis de acompanhar. Adorei o formato.' },
  { name: 'Fernanda Costa', stars: 5, text: 'Melhor treinamento que já fiz na empresa. Me sinto muito mais preparada para o atendimento boutique.' },
  { name: 'Ricardo Nunes', stars: 4, text: 'Conteúdo muito relevante e direto ao ponto. Já apliquei vários ensinamentos na prática.' },
];

const RELATED_COURSES = [
  { title: 'Operação de máquina de café', instructor: 'Vendas', progress: 0, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
  { title: 'Operação de máquina de café', instructor: 'Vendas', progress: 0, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
  { title: 'Operação de máquina de café', instructor: 'Vendas', progress: 0, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
  { title: 'Operação de máquina de café', instructor: 'Vendas', progress: 0, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
  { title: 'Operação de máquina de café', instructor: 'Vendas', progress: 0, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400' },
];

function parseDurationToMinutes(str) {
  const parts = str.split(':').map(Number);
  return parts[0] || 0;
}

export default function CoursePlayer() {
  const { completeLesson, completeCourse } = useProfile();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [modules, setModules] = useState(MODULES);
  const [activeLesson, setActiveLesson] = useState({ moduleId: 1, lessonId: 1 });
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [toast, setToast] = useState(null);
  const [testimonialPage, setTestimonialPage] = useState(0);
  const coursesScrollRef = useRef(null);

  const TESTIMONIALS_PER_PAGE = 3;
  const totalTestimonialPages = Math.ceil(TESTIMONIALS.length / TESTIMONIALS_PER_PAGE);
  const visibleTestimonials = TESTIMONIALS.slice(
    testimonialPage * TESTIMONIALS_PER_PAGE,
    (testimonialPage + 1) * TESTIMONIALS_PER_PAGE
  );

  const scrollCourses = (direction) => {
    if (coursesScrollRef.current) {
      coursesScrollRef.current.scrollBy({ left: direction * 280, behavior: 'smooth' });
    }
  };

  const showToast = (msg, type = 'default') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const toggleModule = (moduleId) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, expanded: !m.expanded } : m));
  };

  const selectLesson = (moduleId, lesson) => {
    if (lesson.locked) return;
    setActiveLesson({ moduleId, lessonId: lesson.id });
  };

  const allLessons = modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id })));
  const currentIndex = allLessons.findIndex(l => l.id === activeLesson.lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const currentLesson = allLessons[currentIndex];

  const goToLesson = (lesson) => {
    if (!lesson || lesson.locked) return;
    setActiveLesson({ moduleId: lesson.moduleId, lessonId: lesson.id });
  };

  const markLessonComplete = () => {
    if (!currentLesson || currentLesson.completed) return;

    const minutes = parseDurationToMinutes(currentLesson.duration);
    completeLesson(minutes);

    // Marca aula concluída e desbloqueia a próxima
    const nextInFlat = allLessons[currentIndex + 1];
    setModules(prev => prev.map(m => ({
      ...m,
      lessons: m.lessons.map(l => {
        if (l.id === currentLesson.id) return { ...l, completed: true };
        if (nextInFlat && l.id === nextInFlat.id) return { ...l, locked: false };
        return l;
      })
    })));

    // Verifica se todas as aulas foram concluídas
    const updatedLessons = allLessons.map(l =>
      l.id === currentLesson.id ? { ...l, completed: true } : l
    );
    const allDone = updatedLessons.every(l => l.completed);

    if (allDone && !courseCompleted) {
      setCourseCompleted(true);
      completeCourse({
        title: 'Fase 1 - Básico',
        area: 'Operações',
        stars: 5,
        tags: ['operações', 'básico', 'fundamentos', 'biscoitê'],
        description: 'Curso básico de fundamentos da Biscoitê — história, valores, operacional e atendimento.',
      });
      showToast('Parabéns! Curso concluído — certificado adicionado!', 'success');
    } else if (nextInFlat) {
      showToast('Aula concluída! Próxima aula desbloqueada.', 'default');
      goToLesson({ ...nextInFlat, locked: false });
    } else {
      showToast('Aula concluída!', 'default');
    }
  };

  const completedCount = allLessons.filter(l => l.completed).length;
  const progressPercent = Math.round((completedCount / allLessons.length) * 100);

  return (
    <div className="max-w-[1440px] mx-auto pb-20 px-4">

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-bold text-sm flex items-center gap-3 transition-all ${
          toast.type === 'success' ? 'bg-[#4A72B2]' : 'bg-[#001A26]'
        }`}>
          {toast.type === 'success' ? <Trophy size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      {!isExpanded && (
        <div className="bg-[#b9d2eb] rounded-[32px] p-10 flex justify-between items-start shadow-sm mt-4">
          <div className="space-y-3">
            <Link to="/courses" className="flex items-center gap-2 text-slate-600 hover:text-[#001A26] text-sm font-semibold transition-colors">
              <ChevronLeft size={18} /> Voltar para o curso
            </Link>
            <h1 className="text-4xl font-black text-[#001A26]">Fase 1 - Básico</h1>
            <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
              <Clock size={16} /> 30 min
            </div>
            {/* Barra de progresso */}
            <div className="flex items-center gap-3 mt-1">
              <div className="w-40 h-2 bg-white/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A72B2] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-black text-[#001A26]">{completedCount}/{allLessons.length} aulas</span>
            </div>
          </div>
          <div className="bg-[#FEF9C3] text-[#A16207] px-5 py-2.5 rounded-full text-xs font-black border border-[#FDE68A] flex items-center gap-2 mt-2">
            <Star size={14} fill="currentColor" /> 4.9 (128 avaliações)
          </div>
        </div>
      )}

      {/* GRID PRINCIPAL */}
      <div className={`grid gap-8 ${isExpanded ? 'grid-cols-1 mt-4' : 'grid-cols-1 lg:grid-cols-12 mt-8'}`}>

        {/* LADO ESQUERDO: PLAYER */}
        <div className={`${isExpanded ? 'w-full' : 'lg:col-span-8'} space-y-6`}>

          {/* PLAYER */}
          <div className="relative">
            <div className="aspect-video bg-[#001A26] rounded-[32px] overflow-hidden relative flex items-center justify-center border-4 border-white shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
                alt="Aula"
              />
              <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 hover:scale-110 transition-transform cursor-pointer">
                <Play fill="white" className="text-white ml-1" size={32} />
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-5 right-5 z-20 bg-white/90 px-4 py-2 rounded-2xl text-[#001A26] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
              >
                {isExpanded ? <><Minimize2 size={16} /> Sair do Foco</> : <><Maximize2 size={16} /> Modo Foco</>}
              </button>
            </div>

            {/* NAVEGAÇÃO + CONCLUIR */}
            <div className="flex justify-between items-center mt-4 gap-3">
              <button
                onClick={() => goToLesson(prevLesson)}
                disabled={!prevLesson || prevLesson.locked}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  prevLesson && !prevLesson.locked
                    ? 'bg-white border border-slate-200 text-[#001A26] hover:bg-slate-50 shadow-sm'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              {/* Botão concluir aula */}
              {currentLesson?.completed ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 size={16} /> Aula concluída
                </div>
              ) : (
                <button
                  onClick={markLessonComplete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-sm"
                >
                  <CheckCircle2 size={16} /> Marcar como concluída
                </button>
              )}

              <button
                onClick={() => goToLesson(nextLesson)}
                disabled={!nextLesson || nextLesson.locked}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  nextLesson && !nextLesson.locked
                    ? 'bg-[#4A72B2] text-white hover:bg-[#001A26] shadow-sm'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* SOBRE A AULA */}
          <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-black text-[#001A26] mb-3">Nesta aula, você aprenderá sobre</h2>
              <p className="text-slate-500 leading-relaxed text-base font-medium">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-xl font-black text-[#001A26] mb-3">Para quem é esse curso?</h2>
              <p className="text-slate-500 leading-relaxed text-base font-medium">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet.
              </p>
            </div>
          </div>

          {/* DEPOIMENTOS */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-[#001A26]">Depoimento de outros alunos</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {testimonialPage + 1} de {totalTestimonialPages}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTestimonialPage((p) => Math.max(0, p - 1))}
                  disabled={testimonialPage === 0}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    testimonialPage === 0
                      ? 'bg-[#b9d2eb] text-[#001A26] opacity-30 cursor-not-allowed'
                      : 'bg-[#b9d2eb] text-[#001A26] hover:opacity-80'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setTestimonialPage((p) => Math.min(totalTestimonialPages - 1, p + 1))}
                  disabled={testimonialPage >= totalTestimonialPages - 1}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    testimonialPage >= totalTestimonialPages - 1
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#4A72B2] text-white shadow-md hover:bg-[#001A26]'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleTestimonials.map((t, i) => (
                <div key={`${testimonialPage}-${i}`} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#b9d2eb] flex items-center justify-center">
                      <User size={18} className="text-[#4A72B2]" />
                    </div>
                    <div>
                      <p className="font-black text-[#001A26] text-sm">{t.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s < t.stars ? 'text-yellow-400' : 'text-slate-200'}
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{t.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OUTROS CURSOS */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#001A26]">Outros alunos também se interessaram</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/courses')}
                  className="text-[#4A72B2] text-sm font-bold hover:underline flex items-center gap-1"
                >
                  Ver tudo <ChevronRight size={14} />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollCourses(-1)}
                    className="w-8 h-8 rounded-lg bg-[#b9d2eb] text-[#001A26] hover:opacity-80 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollCourses(1)}
                    className="w-8 h-8 rounded-lg bg-[#4A72B2] text-white hover:bg-[#001A26] flex items-center justify-center transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div ref={coursesScrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {RELATED_COURSES.map((course, i) => (
                <div key={i} className="min-w-[220px]">
                  <CourseCard {...course} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LADO DIREITO: SIDEBAR */}
        {!isExpanded && (
          <div className="lg:col-span-4 space-y-4">

            {/* CONTEÚDO DO CURSO */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50">
                <h3 className="text-sm font-black text-[#001A26] uppercase tracking-widest">Conteúdo do Curso</h3>
              </div>

              <div className="divide-y divide-slate-50">
                {modules.map((module) => (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`w-full px-6 py-4 flex items-center justify-between font-black text-sm transition-colors ${
                        module.id === activeLesson.moduleId
                          ? 'bg-[#001A26] text-white'
                          : 'bg-white text-[#001A26] hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-left leading-tight">{module.title}</span>
                      <ChevronRight
                        size={16}
                        className={`flex-shrink-0 transition-transform ${module.expanded ? 'rotate-90' : ''} ${
                          module.id === activeLesson.moduleId ? 'text-white/60' : 'text-slate-300'
                        }`}
                      />
                    </button>

                    {module.expanded && (
                      <div className="bg-slate-50/50">
                        {module.lessons.map((lesson) => {
                          const isActive = lesson.id === activeLesson.lessonId;
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => selectLesson(module.id, lesson)}
                              className={`w-full px-6 py-3.5 flex items-center justify-between transition-all text-left ${
                                isActive
                                  ? 'bg-[#E2F0FF] border-l-4 border-[#4A72B2]'
                                  : lesson.locked
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {lesson.completed ? (
                                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                ) : lesson.locked ? (
                                  <Lock size={16} className="text-slate-300 flex-shrink-0" />
                                ) : (
                                  <PlayCircle size={16} className={isActive ? 'text-[#4A72B2] flex-shrink-0' : 'text-slate-300 flex-shrink-0'} />
                                )}
                                <span className={`text-xs font-bold truncate ${isActive ? 'text-[#4A72B2]' : 'text-slate-500'}`}>
                                  {lesson.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0 ml-2">{lesson.duration}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* MATERIAL EXTRA */}
            <div className="bg-[#001A26] p-6 rounded-[28px] text-white space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <FileText size={18} className="text-[#4A72B2]" /> Material Extra
              </h4>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
