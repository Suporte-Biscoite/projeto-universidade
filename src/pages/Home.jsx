import { useState, useEffect } from 'react';
import { ChevronRight, Play, Clock, LayoutDashboard, Store, ShoppingBag, BarChart3, Megaphone, Brain, Tent, Building2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useProfile } from '../context/ProfileContext';
import { authFetch } from '../utils/authFetch';

const categories = [
  { name: 'Operações',       icon: LayoutDashboard, color: 'bg-emerald-50 text-emerald-500', hoverColor: 'hover:bg-emerald-500', desc: 'Gestão diária da loja e processos operacionais' },
  { name: 'Vendas',          icon: ShoppingBag,     color: 'bg-purple-50 text-purple-500',  hoverColor: 'hover:bg-purple-500',  desc: 'Técnicas de atendimento e conversão' },
  { name: 'Gestão',          icon: BarChart3,        color: 'bg-blue-50 text-blue-500',      hoverColor: 'hover:bg-blue-500',    desc: 'Liderança, equipes e indicadores' },
  { name: 'Business',        icon: Building2,        color: 'bg-cyan-50 text-cyan-500',      hoverColor: 'hover:bg-cyan-500',    desc: 'Estratégias e crescimento do negócio' },
  { name: 'Marketing',       icon: Megaphone,        color: 'bg-orange-50 text-orange-500',  hoverColor: 'hover:bg-orange-500',  desc: 'Campanhas, redes sociais e marca' },
  { name: 'IA',              icon: Brain,            color: 'bg-pink-50 text-pink-500',      hoverColor: 'hover:bg-pink-500',    desc: 'Inteligência artificial aplicada ao varejo' },
  { name: 'V. Merchandising',icon: Tent,             color: 'bg-slate-50 text-slate-500',    hoverColor: 'hover:bg-slate-500',   desc: 'Vitrine, exposição e visual da loja' },
  { name: 'Franquias',       icon: Store,            color: 'bg-teal-50 text-teal-500',      hoverColor: 'hover:bg-teal-500',    desc: 'Padrões e expansão da rede Biscoitê' },
];

export default function Home() {
  const navigate = useNavigate();
  const { reels: reelsData } = useProfile();
  const [myCourses, setMyCourses]     = useState([]);
  const [courseIndex, setCourseIndex] = useState(0);
  const [hoveredReel, setHoveredReel] = useState(null);
  const coursesPerPage = 3;

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await authFetch('/api/courses');
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data.filter(c => c.published) : [];

        const progressResults = await Promise.all(
          list.map(c =>
            authFetch(`/api/progress?courseId=${c.id}`)
              .then(r => r.ok ? r.json() : { completed: [], count: 0 })
              .catch(() => ({ completed: [], count: 0 }))
          )
        );

        setMyCourses(list.map((c, i) => {
          const prog  = progressResults[i];
          const total = (c.modules || []).flatMap(m => m.lessons || []).length;
          const done  = prog.count || 0;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          return {
            ...c,
            image:      c.thumbnail_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400',
            instructor: c.instructor_name || '—',
            progress:   pct,
          };
        }));
      } catch {}
    };
    loadCourses();
  }, []);

  const maxCourseIndex = Math.max(0, myCourses.length - coursesPerPage);
  const visibleCourses = myCourses.slice(courseIndex, courseIndex + coursesPerPage);

  const goToCoursesByCategory = (categoryName) => {
    navigate(`/courses?categoria=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-16 sm:space-y-20 pb-20">

      {/* 1. MEUS CURSOS */}
      <section className="bg-[#e2eef9] -mx-4 sm:-mx-8 px-4 sm:px-8 py-10 sm:py-16 rounded-[32px] sm:rounded-[48px] space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Meus Cursos</h2>
          <button
            onClick={() => navigate('/courses')}
            className="text-[#4A72B2] text-sm font-bold hover:underline flex items-center gap-1"
          >
            Ver todos <ChevronRight size={16} />
          </button>
        </div>

        {myCourses.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="font-bold">Nenhum curso disponível ainda.</p>
            <p className="text-sm mt-1">Novos conteúdos em breve!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  instructor={course.instructor_name || course.instructor}
                  progress={course.progress}
                  image={course.thumbnail_url || course.image}
                  category={course.category}
                  duration={course.duration}
                />
              ))}
            </div>
            {myCourses.length > coursesPerPage && (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCourseIndex(Math.max(0, courseIndex - 1))}
                  disabled={courseIndex === 0}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    courseIndex === 0
                      ? 'bg-[#b9d2eb] text-[#001A26] opacity-40 cursor-not-allowed'
                      : 'bg-[#b9d2eb] text-[#001A26] hover:bg-[#4A72B2] hover:text-white'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCourseIndex(Math.min(maxCourseIndex, courseIndex + 1))}
                  disabled={courseIndex >= maxCourseIndex}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    courseIndex >= maxCourseIndex
                      ? 'bg-[#b9d2eb] text-[#001A26] opacity-40 cursor-not-allowed'
                      : 'bg-[#4A72B2] text-white shadow-md hover:bg-[#001A26]'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 2. CATEGORIAS */}
      <section className="space-y-6 sm:space-y-8">
        <h2 className="text-xl sm:text-2xl font-black text-[#001A26] text-center sm:text-left">
          Procure seu curso por categorias
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => goToCoursesByCategory(cat.name)}
                className={`bg-white p-4 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[32px] shadow-sm border border-slate-50 flex flex-col items-center text-center space-y-3 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group w-full`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${cat.color} group-hover:text-white ${cat.hoverColor} transition-colors`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-[#001A26] text-sm sm:text-base">{cat.name}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed hidden sm:block">{cat.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. REELS */}
      {reelsData && reelsData.length > 0 && (
        <section className="space-y-6 sm:space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Reels dos Professores</h2>
            <button className="text-[#4A72B2] text-sm font-bold hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {reelsData.map((reel) => {
              const thumb = reel.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400';
              return (
                <div
                  key={reel.id}
                  className="relative flex-shrink-0 w-36 sm:w-44 md:w-52 rounded-[20px] overflow-hidden cursor-pointer snap-start"
                  style={{ aspectRatio: '9/16' }}
                  onMouseEnter={() => setHoveredReel(reel.id)}
                  onMouseLeave={() => setHoveredReel(null)}
                >
                  <img src={thumb} className="absolute inset-0 w-full h-full object-cover" alt={reel.caption} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                    <p className="text-white text-[10px] sm:text-xs font-bold leading-snug line-clamp-2">{reel.caption}</p>
                  </div>
                  {hoveredReel === reel.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <Play size={16} fill="#001A26" className="text-[#001A26] translate-x-[1px]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
