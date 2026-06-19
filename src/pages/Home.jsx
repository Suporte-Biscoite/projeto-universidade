import { useState, useEffect } from 'react';
import { ChevronRight, Play, Clock, LayoutDashboard, Store, ShoppingBag, BarChart3, Megaphone, Brain, Tent, Building2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useProfile } from '../context/ProfileContext';
import { authFetch } from '../utils/authFetch';

const categories = [
  { name: 'Operações',        icon: LayoutDashboard, color: 'bg-emerald-50 text-emerald-500', hoverColor: 'hover:bg-emerald-500', desc: 'Gestão diária da loja e processos operacionais' },
  { name: 'Vendas',           icon: ShoppingBag,     color: 'bg-purple-50 text-purple-500',   hoverColor: 'hover:bg-purple-500',  desc: 'Técnicas de atendimento e conversão' },
  { name: 'Gestão',           icon: BarChart3,        color: 'bg-blue-50 text-blue-500',       hoverColor: 'hover:bg-blue-500',    desc: 'Liderança, equipes e indicadores' },
  { name: 'Business',         icon: Building2,        color: 'bg-cyan-50 text-cyan-500',       hoverColor: 'hover:bg-cyan-500',    desc: 'Estratégias e crescimento do negócio' },
  { name: 'Marketing',        icon: Megaphone,        color: 'bg-orange-50 text-orange-500',   hoverColor: 'hover:bg-orange-500',  desc: 'Campanhas, redes sociais e marca' },
  { name: 'IA',               icon: Brain,            color: 'bg-pink-50 text-pink-500',       hoverColor: 'hover:bg-pink-500',    desc: 'Inteligência artificial aplicada ao varejo' },
  { name: 'V. Merchandising', icon: Tent,             color: 'bg-slate-50 text-slate-500',     hoverColor: 'hover:bg-slate-500',   desc: 'Vitrine, exposição e visual da loja' },
  { name: 'Franquias',        icon: Store,            color: 'bg-teal-50 text-teal-500',       hoverColor: 'hover:bg-teal-500',    desc: 'Padrões e expansão da rede Biscoitê' },
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
              .then(r => r.ok ? r.json() : { count: 0 })
              .catch(() => ({ count: 0 }))
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

  const maxCourseIndex  = Math.max(0, myCourses.length - coursesPerPage);
  const visibleCourses  = myCourses.slice(courseIndex, courseIndex + coursesPerPage);

  const goToCoursesByCategory = (categoryName) => {
    navigate(`/courses?categoria=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-16 sm:space-y-20 pb-20">

      {/* 1. MEUS CURSOS */}
      <section className="bg-[#e2eef9] -mx-4 sm:-mx-8 px-4 sm:px-8 py-10 sm:py-16 rounded-[32px] sm:rounded-[48px] space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Meus Cursos</h2>
          <button onClick={() => navigate('/courses')} className="text-[#4A72B2] text-sm font-bold hover:underline flex items-center gap-1">
            Ver tudo <ChevronRight size={14} />
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
                <button onClick={() => setCourseIndex(Math.max(0, courseIndex - 1))} disabled={courseIndex === 0}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${courseIndex === 0 ? 'bg-[#b9d2eb] text-[#001A26] opacity-40 cursor-not-allowed' : 'bg-[#b9d2eb] text-[#001A26] hover:bg-[#4A72B2] hover:text-white'}`}>
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <button onClick={() => setCourseIndex(Math.min(maxCourseIndex, courseIndex + 1))} disabled={courseIndex >= maxCourseIndex}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${courseIndex >= maxCourseIndex ? 'bg-[#b9d2eb] text-[#001A26] opacity-40 cursor-not-allowed' : 'bg-[#4A72B2] text-white shadow-md hover:bg-[#001A26]'}`}>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 2. CATEGORIAS */}
      <section className="space-y-6 sm:space-y-10">
        <h2 className="text-xl sm:text-2xl font-black text-[#001A26] text-center sm:text-left">Procure seu curso por categorias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => goToCoursesByCategory(cat.name)}
              className="bg-white p-4 sm:p-6 md:p-8 rounded-[20px] sm:rounded-[32px] shadow-sm border border-slate-50 flex flex-col items-center text-center space-y-3 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group w-full">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                <cat.icon size={22} />
              </div>
              <h3 className="font-bold text-[#001A26] text-sm">{cat.name}</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed hidden sm:block">{cat.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 3. REELS */}
      {reelsData && reelsData.length > 0 && (
        <section className="bg-[#f0f7ff] -mx-4 sm:-mx-8 px-4 sm:px-8 py-10 sm:py-16 rounded-[32px] sm:rounded-[48px] space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Reels dos instrutores</h2>
            <p className="text-slate-400 text-sm mt-1">Novidades, dicas e avisos em vídeos rápidos</p>
          </div>
          {/* Desktop: expandable reels */}
          <div className="hidden md:flex gap-3 overflow-hidden" style={{ height: '400px' }}>
            {reelsData.map((item) => {
              const isActive = hoveredReel === item.id;
              return (
                <button key={item.id} onClick={() => navigate('/player')}
                  onMouseEnter={() => setHoveredReel(item.id)}
                  onMouseLeave={() => setHoveredReel(null)}
                  className="relative flex-shrink-0 rounded-[24px] overflow-hidden border-2 border-white shadow-sm cursor-pointer text-left"
                  style={{ width: isActive ? '240px' : '120px', transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
                  <img src={item.thumbnail || item.image} className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.5s ease' }} alt={item.caption} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="bg-white/90 text-[#4A72B2] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">{item.tag}</span>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute left-0 right-0 h-[1px] bg-white/20" style={{ animation: 'scanline 2.5s linear infinite', top: 0 }} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5" style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                    <img src={item.avatar} className="w-6 h-6 rounded-full object-cover border border-white/50" alt={item.instructor} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    <div style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(6px)', transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
                      <p className="text-white text-[11px] font-bold leading-snug mb-1">{item.caption}</p>
                    </div>
                    <div className="flex items-center justify-between" style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.25s ease' }}>
                      <div className="flex items-center gap-1.5">
                        <img src={item.avatar} className="w-5 h-5 rounded-full object-cover border border-white/40" alt={item.instructor} />
                        <span className="text-white/80 text-[9px] font-bold truncate max-w-[90px]">{item.instructor}</span>
                      </div>
                      <span className="text-white/60 text-[9px]">{item.views} views</span>
                    </div>
                    {isActive && <div className="h-[2px] bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white/60 rounded-full" style={{ width: '30%' }} /></div>}
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[9px]" style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.3s ease' }}>{item.time}</span>
                      <div className="p-2 rounded-full shadow-lg bg-white flex items-center justify-center ml-auto"
                        style={{ transform: isActive ? 'scale(1.1)' : 'scale(0.95)', transition: 'transform 0.3s ease' }}>
                        {isActive ? (
                          <div className="flex gap-[3px] items-center">
                            <div className="w-[3px] h-[10px] bg-[#001A26] rounded-sm" />
                            <div className="w-[3px] h-[10px] bg-[#001A26] rounded-sm" />
                          </div>
                        ) : (
                          <Play size={10} fill="#001A26" className="text-[#001A26] translate-x-[1px]" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
            {reelsData.map((item) => (
              <div key={item.id} className="relative flex-shrink-0 w-36 rounded-[20px] overflow-hidden snap-start" style={{ aspectRatio: '9/16' }}>
                <img src={item.thumbnail || item.image} className="absolute inset-0 w-full h-full object-cover" alt={item.caption} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="bg-white/90 text-[#4A72B2] text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{item.tag}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-[10px] font-bold leading-snug line-clamp-2">{item.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <style>{`@keyframes scanline { 0% { top: -2px; } 100% { top: 100%; } }`}</style>

      {/* 4. COMBINAM COM VOCÊ */}
      <section className="space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Combinam com você</h2>
          <button onClick={() => navigate('/courses')} className="text-[#4A72B2] text-sm font-bold hover:underline flex items-center gap-1">
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-4 snap-x snap-mandatory">
          {myCourses.slice(0, 5).map((course) => (
            <div key={course.id} className="min-w-[240px] sm:min-w-[280px] snap-start">
              <CourseCard
                id={course.id}
                title={course.title}
                instructor={course.instructor_name || course.instructor}
                progress={course.progress}
                image={course.thumbnail_url || course.image}
                category={course.category}
                duration={course.duration}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 5. BANNER WEBINAR */}
      <section className="border border-slate-200 rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center gap-8 sm:gap-12 bg-white shadow-sm">
        <div className="flex-1 space-y-4 sm:space-y-6 text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-[#001A26]">Confirme sua presença no Webinar Biscoitê</h2>
          <p className="text-slate-500 max-w-lg leading-relaxed text-sm font-medium">
            Aprenda com especialistas e líderes da Biscoitê. Um evento exclusivo para franqueados e colaboradores sobre as tendências do mercado de cafeteria.
          </p>
          <button className="bg-[#4A72B2] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#001A26] transition-all shadow-lg shadow-blue-100">
            Agendar ingresso
          </button>
        </div>
        <div className="w-full md:w-1/3 flex justify-center">
          <img
            src="https://media.licdn.com/dms/image/v2/D4D0BAQGph6emrGRPtQ/company-logo_200_200/company-logo_200_200/0/1724087286406/biscoite_logo?e=2147483647&v=beta&t=j1zwyIPIShhSJymIX-44TEZxPPiklQngeo7DsM6U4ls"
            className="w-40 sm:w-52 md:w-64"
            alt="Webinar"
          />
        </div>
      </section>

    </div>
  );
}
