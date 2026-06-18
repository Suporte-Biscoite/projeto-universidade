import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Play, Lock, Star, Clock, FileText,
  CheckCircle2, PlayCircle, Maximize2, Minimize2, User, Trophy,
  Loader, AlertCircle
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { authFetch } from '../utils/authFetch';

// ─── Player Vimeo ─────────────────────────────────────────────────────────────
function VimeoPlayer({ vimeoId, onEnded }) {
  if (!vimeoId) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/40">
      <Play size={48} />
      <p className="text-sm font-bold">Nenhum vídeo disponível para esta aula</p>
    </div>
  );
  return (
    <iframe
      src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&autoplay=1`}
      className="absolute inset-0 w-full h-full"
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
      title="Aula"
    />
  );
}

function parseDurationToMinutes(str) {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  return parts[0] || 0;
}

export default function CoursePlayer() {
  const { systemRole } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('id');

  // ── Estado do curso ────────────────────────────────────────────────────────
  const [course, setCourse]       = useState(null);
  const [modules, setModules]     = useState([]);
  const [progress, setProgress]   = useState({}); // { lessonId: true }
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── Estado do player ───────────────────────────────────────────────────────
  const [activeLesson, setActiveLesson]       = useState(null);
  const [isExpanded, setIsExpanded]           = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [toast, setToast]                     = useState(null);
  const [watchedSeconds, setWatchedSeconds]   = useState(0);  // tempo assistido na aula atual
  const [canComplete, setCanComplete]         = useState(false); // habilitado após 80% do tempo
  const watchTimerRef                         = useRef(null);
  const coursesScrollRef                      = useRef(null);

  const showToast = (msg, type = 'default') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Busca curso + módulos + progresso do banco ─────────────────────────────
  useEffect(() => {
    if (!courseId) { setError('Nenhum curso selecionado.'); setLoading(false); return; }

    const fetchCourse = async () => {
      try {
        const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');

        const [courseRes, progressRes] = await Promise.all([
          authFetch(`/api/courses?id=${courseId}`),
          isAuth ? authFetch(`/api/progress?courseId=${courseId}`) : Promise.resolve({ ok: false }),
        ]);

        if (!courseRes.ok) throw new Error('Curso não encontrado');
        const courseData = await courseRes.json();
        setCourse(courseData);
        setModules(courseData.modules || []);

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const progressMap = {};
          (progressData.completed || []).forEach(id => { progressMap[id] = true; });
          setProgress(progressMap);
        }

        // Seleciona primeira aula disponível
        const firstLesson = courseData.modules?.[0]?.lessons?.[0];
        if (firstLesson) setActiveLesson(firstLesson);

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // ── Lista plana de aulas ───────────────────────────────────────────────────
  const allLessons = modules.flatMap(m =>
    (m.lessons || []).map(l => ({ ...l, moduleId: m.id, moduleTitle: m.title }))
  );
  const currentIndex = allLessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson   = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson   = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const completedCount  = allLessons.filter(l => progress[l.id]).length;
  const progressPercent = allLessons.length > 0
    ? Math.round((completedCount / allLessons.length) * 100)
    : 0;

  // ── Timer de watch time — habilita conclusão após 80% do tempo ───────────
  useEffect(() => {
    if (!activeLesson) return;
    if (progress[activeLesson.id]) { setCanComplete(true); return; }

    // Reseta timer ao trocar de aula
    setWatchedSeconds(0);
    setCanComplete(false);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);

    // Calcula duração em segundos a partir da string (ex: "10 min", "05:30")
    let durationSeconds = 300; // padrão 5 min se não informado
    if (activeLesson.duration) {
      const d = activeLesson.duration;
      if (d.includes(':')) {
        const [m, s] = d.split(':').map(Number);
        durationSeconds = (m || 0) * 60 + (s || 0);
      } else {
        const mins = parseInt(d);
        if (!isNaN(mins)) durationSeconds = mins * 60;
      }
    }

    const required = Math.max(30, durationSeconds * 0.8); // 80% do tempo, mínimo 30s

    watchTimerRef.current = setInterval(() => {
      setWatchedSeconds(prev => {
        const next = prev + 1;
        if (next >= required) {
          setCanComplete(true);
          clearInterval(watchTimerRef.current);
        }
        return next;
      });
    }, 1000);

    return () => { if (watchTimerRef.current) clearInterval(watchTimerRef.current); };
  }, [activeLesson?.id]);

  // ── Selecionar aula ────────────────────────────────────────────────────────
  const selectLesson = (lesson) => {
    if (lesson.locked && !progress[lesson.id]) return;
    setActiveLesson(lesson);
  };

  // ── Marcar aula como concluída ─────────────────────────────────────────────
  const markLessonComplete = useCallback(async () => {
    if (!activeLesson || progress[activeLesson.id]) return;

    // Atualiza estado local imediatamente
    const newProgress = { ...progress, [activeLesson.id]: true };
    setProgress(newProgress);

    // Salva no banco
    try {
      await authFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ lessonId: activeLesson.id, courseId }),
      });
    } catch (e) {
      console.error('markLessonComplete:', e);
    }

    const allDone = allLessons.every(l => newProgress[l.id]);
    if (allDone && !courseCompleted) {
      setCourseCompleted(true);
      showToast('Parabéns! Curso concluído! 🎉', 'success');
    } else if (nextLesson) {
      showToast('Aula concluída! Próxima desbloqueada.', 'default');
      setActiveLesson(nextLesson);
    } else {
      showToast('Aula concluída!', 'default');
    }
  }, [activeLesson, progress, allLessons, courseCompleted, nextLesson, courseId]);

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader size={32} className="animate-spin text-[#4A72B2]" />
        <p className="text-sm font-bold">Carregando curso...</p>
      </div>
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400 max-w-sm text-center">
        <AlertCircle size={40} className="text-slate-300" />
        <p className="font-black text-[#001A26]">Curso não encontrado</p>
        <p className="text-sm">{error || 'O curso que você procura não está disponível.'}</p>
        <Link to="/courses" className="px-6 py-3 bg-[#4A72B2] text-white rounded-xl font-bold text-sm hover:bg-[#001A26] transition-colors">
          Ver todos os cursos
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto pb-20 px-4">

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl text-white font-bold text-sm flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-[#4A72B2]' : 'bg-[#001A26]'
        }`}>
          {toast.type === 'success' ? <Trophy size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      {!isExpanded && (
        <div className="space-y-4 mt-4">
          <div className="bg-[#b9d2eb] rounded-[32px] p-10 flex justify-between items-start shadow-sm">
            <div className="space-y-3">
              <Link to="/courses" className="flex items-center gap-2 text-slate-600 hover:text-[#001A26] text-sm font-semibold transition-colors">
                <ChevronLeft size={18} /> Voltar para os cursos
              </Link>
              <h1 className="text-4xl font-black text-[#001A26]">{course.title}</h1>
              <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                <Clock size={16} /> {course.duration || '—'}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-40 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4A72B2] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs font-black text-[#001A26]">{completedCount}/{allLessons.length} aulas</span>
              </div>
            </div>
            {course.level && (
              <div className="bg-[#FEF9C3] text-[#A16207] px-5 py-2.5 rounded-full text-xs font-black border border-[#FDE68A] flex items-center gap-2 mt-2">
                <Star size={14} fill="currentColor" /> {course.level}
              </div>
            )}
          </div>
          {course.description && (
            <p className="text-sm text-slate-600 leading-relaxed px-2">{course.description}</p>
          )}
        </div>
      )}

      {/* GRID PRINCIPAL */}
      <div className={`grid gap-8 ${isExpanded ? 'grid-cols-1 mt-4' : 'grid-cols-1 lg:grid-cols-12 mt-8'}`}>

        {/* PLAYER */}
        <div className={`${isExpanded ? 'w-full' : 'lg:col-span-8'} space-y-6`}>
          <div className="relative">
            <div className="aspect-video bg-[#001A26] rounded-[32px] overflow-hidden relative flex items-center justify-center border-4 border-white shadow-xl">
              <VimeoPlayer
                vimeoId={activeLesson?.vimeo_id || activeLesson?.vimeoId || activeLesson?.videoUrl}
                onEnded={markLessonComplete}
              />
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-5 right-5 z-20 bg-white/90 px-4 py-2 rounded-2xl text-[#001A26] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
              >
                {isExpanded ? <><Minimize2 size={16} /> Sair do Foco</> : <><Maximize2 size={16} /> Modo Foco</>}
              </button>
            </div>

            {/* NAVEGAÇÃO + CONCLUIR */}
            <div className="flex justify-between items-center mt-4 gap-3">
              <button onClick={() => prevLesson && selectLesson(prevLesson)}
                disabled={!prevLesson}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  prevLesson ? 'bg-white border border-slate-200 text-[#001A26] hover:bg-slate-50 shadow-sm' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}>
                <ChevronLeft size={16} /> Anterior
              </button>

              <button onClick={markLessonComplete}
                disabled={!activeLesson || !!progress[activeLesson?.id] || !canComplete}
                className={`flex-1 max-w-xs py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all ${
                  progress[activeLesson?.id]
                    ? 'bg-emerald-500 text-white cursor-default'
                    : canComplete
                      ? 'bg-[#4A72B2] hover:bg-[#001A26] text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={!canComplete && !progress[activeLesson?.id] ? 'Assista pelo menos 80% do vídeo para concluir' : ''}>
                {progress[activeLesson?.id]
                  ? <><CheckCircle2 size={16} /> Concluída</>
                  : canComplete
                    ? <><CheckCircle2 size={16} /> Marcar como concluída</>
                    : <><Clock size={16} /> Assista o vídeo para concluir</>}
              </button>

              <button onClick={() => nextLesson && selectLesson(nextLesson)}
                disabled={!nextLesson}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  nextLesson ? 'bg-white border border-slate-200 text-[#001A26] hover:bg-slate-50 shadow-sm' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}>
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* INFO DA AULA */}
          {!isExpanded && activeLesson && (
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeLesson.moduleTitle}</span>
              </div>
              <h2 className="text-xl font-black text-[#001A26]">{activeLesson.title}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                {activeLesson.duration && <span className="flex items-center gap-1"><Clock size={14} /> {activeLesson.duration}</span>}
                <span className="flex items-center gap-1 capitalize"><FileText size={14} /> {activeLesson.type || 'video'}</span>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: MÓDULOS */}
        {!isExpanded && (
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-black text-[#001A26] text-base px-1">Conteúdo do curso</h3>
            <div className="space-y-3">
              {modules.map(mod => (
                <div key={mod.id} className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-slate-50">
                    <p className="font-black text-[#001A26] text-sm">{mod.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {(mod.lessons || []).length} aulas ·{' '}
                      {(mod.lessons || []).filter(l => progress[l.id]).length} concluídas
                    </p>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {(mod.lessons || []).map(lesson => {
                      const isActive    = activeLesson?.id === lesson.id;
                      const isCompleted = !!progress[lesson.id];
                      const isLocked    = lesson.locked && !isCompleted;
                      return (
                        <button key={lesson.id}
                          onClick={() => selectLesson({ ...lesson, moduleId: mod.id, moduleTitle: mod.title })}
                          disabled={isLocked}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all ${
                            isActive ? 'bg-[#e2eef9]' : isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                          }`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-emerald-100' : isActive ? 'bg-[#4A72B2]' : 'bg-slate-100'
                          }`}>
                            {isCompleted ? <CheckCircle2 size={14} className="text-emerald-600" />
                              : isLocked ? <Lock size={12} className="text-slate-400" />
                              : isActive ? <Play size={12} fill="white" className="text-white ml-0.5" />
                              : <PlayCircle size={14} className="text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold truncate ${isActive ? 'text-[#4A72B2]' : 'text-[#001A26]'}`}>
                              {lesson.title}
                            </p>
                            {lesson.duration && (
                              <p className="text-[10px] text-slate-400 font-medium">{lesson.duration}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {modules.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum módulo disponível ainda.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
