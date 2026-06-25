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
  const { shorts: shortsData } = useProfile();
  const [myCourses, setMyCourses]     = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Carrega favoritos do banco
  useEffect(() => {
    authFetch('/api/data?resource=favorites')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setFavorites(data.map(f => f.course_id)); })
      .catch(() => {});
  }, []);

  const toggleFav = async (id) => {
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);
    try {
      if (isFav) {
        await authFetch(`/api/data?resource=favorites&id=${id}`, { method: 'DELETE' });
      } else {
        await authFetch('/api/data?resource=favorites', {
          method: 'POST',
          body: JSON.stringify({ courseId: id }),
        });
      }
    } catch {}
  };
  const [courseIndex, setCourseIndex] = useState(0);
  const [hoveredShort, setHoveredShort] = useState(null);
  const [selectedShort, setSelectedShort] = useState(null);
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
            authFetch(`/api/courses?sub=progress&courseId=${c.id}`)
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
      finally { setLoadingCourses(false); }
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
      {/* Short player modal */}
      {selectedShort && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
          onClick={() => setSelectedShort(null)}>
          <div className="relative w-full max-w-xs" style={{ aspectRatio: '9/16' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedShort(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white font-bold text-sm flex items-center gap-2">
              ✕ Fechar
            </button>
            {selectedShort.vimeo_id ? (
              <iframe
                src={`https://player.vimeo.com/video/${selectedShort.vimeo_id}?autoplay=1&title=0&byline=0`}
                className="w-full h-full rounded-[24px]"
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="w-full h-full rounded-[24px] bg-slate-800 flex items-center justify-center text-white/40">
                <p className="text-sm">Sem vídeo</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-[24px]">
              <p className="text-white font-bold text-sm">{selectedShort.caption}</p>
              <p className="text-white/50 text-xs mt-1">{selectedShort.instructor}</p>
            </div>
          </div>
        </div>
      )}

      {/* 0. BANNER HERO */}
      <section style={{ position:'relative', overflow:'hidden', minHeight:'300px', display:'flex', alignItems:'stretch', borderRadius:'32px' }}>
        {/* Fundo */}
        <div style={{ position:'absolute', inset:0, background:'#001A26' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'42%', background:'#0a2d42', clipPath:'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)' }} />

        {/* Círculo decorativo */}
        <div style={{ position:'absolute', right:'8%', top:'50%', transform:'translateY(-50%)', width:'180px', height:'180px', borderRadius:'50%', border:'36px solid rgba(74,114,178,0.18)' }} />
        <div style={{ position:'absolute', right:'12%', top:'50%', transform:'translateY(-50%)', width:'100px', height:'100px', borderRadius:'50%', background:'#4A72B2', opacity:0.22 }} />

        {/* Grade de pontos */}
        <div style={{ position:'absolute', top:0, right:0, width:'45%', height:'100%', opacity:0.06 }}>
          <svg width="100%" height="100%">
            <defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#b9d2eb"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>

        {/* Barra de acento topo */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#4A72B2 0%,#b9d2eb 50%,transparent 100%)' }} />

        {/* Conteúdo */}
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'24px', padding:'40px 32px', width:'100%', flexWrap:'wrap' }} className="sm:!p-12">

          {/* Esquerda */}
          <div style={{ flex:1, maxWidth:'560px', minWidth:'260px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#4A72B2' }} />
              <div style={{ width:'32px', height:'2px', background:'#4A72B2', borderRadius:'2px' }} />
              <span style={{ color:'#4A72B2', fontSize:'11px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase' }}>Universidade Biscoitê</span>
            </div>

            <h1 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:700, color:'#ffffff', lineHeight:1.15, margin:'0 0 8px', letterSpacing:'-0.01em' }}>
              O seu próximo<br/>
              <span style={{ color:'#b9d2eb' }}>nível começa</span><br/>
              <span style={{ color:'#b9d2eb' }}>aqui.</span>
            </h1>

            <div style={{ width:'48px', height:'3px', background:'#4A72B2', borderRadius:'2px', margin:'18px 0' }} />

            <p style={{ fontSize:'14px', color:'rgba(185,210,235,0.7)', lineHeight:1.7, margin:'0 0 28px', maxWidth:'380px' }}>
              Treinamentos exclusivos para quem transforma o varejo todo dia. Da operação ao atendimento, do básico ao avançado.
            </p>

            <div style={{ display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap' }}>
              <button
                onClick={() => navigate('/courses')}
                style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'#4A72B2', color:'#ffffff', border:'none', borderRadius:'14px', padding:'13px 24px', fontSize:'14px', fontWeight:700, cursor:'pointer', letterSpacing:'0.01em' }}
              >
                Começar agora →
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ display:'flex' }}>
                  {[['BS','#185FA5'],['KL','#4A72B2'],['MR','#0C447C']].map(([init,bg]) => (
                    <div key={init} style={{ width:'28px', height:'28px', borderRadius:'50%', background:bg, border:'2px solid #001A26', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:700, color:'#b9d2eb', marginRight:'-8px' }}>{init}</div>
                  ))}
                </div>
                <div style={{ marginLeft:'10px' }}>
                  <p style={{ fontSize:'12px', fontWeight:700, color:'#ffffff', margin:0 }}>+300 colaboradores</p>
                  <p style={{ fontSize:'11px', color:'rgba(185,210,235,0.5)', margin:0 }}>já estão aprendendo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - escondido em mobile pequeno */}
          <div className="hidden sm:flex" style={{ flexDirection:'column', gap:'4px', flexShrink:0 }}>
            {[['98%','Satisfação','rgba(255,255,255,0.04)','rgba(185,210,235,0.1)','#ffffff'],
              ['100%','Gratuito','rgba(74,114,178,0.15)','rgba(74,114,178,0.35)','#b9d2eb'],
              ['70+','Lojas conectadas','rgba(255,255,255,0.04)','rgba(185,210,235,0.1)','#ffffff']
            ].map(([num,label,bg,border,color]) => (
              <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:'18px', padding:'18px 24px', textAlign:'center', minWidth:'120px' }}>
                <p style={{ fontSize:'28px', fontWeight:700, color, margin:0, lineHeight:1 }}>{num}</p>
                <p style={{ fontSize:'10px', color:'rgba(185,210,235,0.5)', margin:'5px 0 0', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 1. MEUS CURSOS */}
      <section className="bg-[#e2eef9] -mx-4 sm:-mx-8 px-4 sm:px-8 py-10 sm:py-16 rounded-[32px] sm:rounded-[48px] space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Meus Cursos</h2>
          <button onClick={() => navigate('/courses')} className="text-[#4A72B2] text-sm font-bold hover:underline flex items-center gap-1">
            Ver tudo <ChevronRight size={14} />
          </button>
        </div>

        {loadingCourses ? (
          /* Skeleton cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/60 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#b9d2eb]/50 w-full" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#b9d2eb]/50 rounded-full w-3/4" />
                  <div className="h-3 bg-[#b9d2eb]/40 rounded-full w-1/2" />
                  <div className="h-2 bg-[#b9d2eb]/30 rounded-full w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : myCourses.length === 0 ? (
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
                  isFavorite={favorites.includes(course.id)}
                  onToggleFavorite={toggleFav}
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
      {shortsData && shortsData.length > 0 && (
        <section className="bg-[#f0f7ff] -mx-4 sm:-mx-8 px-4 sm:px-8 py-10 sm:py-16 rounded-[32px] sm:rounded-[48px] space-y-6 sm:space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#001A26]">Shorts dos instrutores</h2>
            <p className="text-slate-400 text-sm mt-1">Novidades, dicas e avisos em vídeos rápidos</p>
          </div>
          {/* Desktop: expandable shorts */}
          <div className="hidden md:flex gap-3 overflow-hidden" style={{ height: '400px' }}>
            {shortsData.map((item) => {
              const isActive = hoveredShort === item.id;
              return (
                <button key={item.id} onClick={() => setSelectedShort(item)}
                  onMouseEnter={() => setHoveredShort(item.id)}
                  onMouseLeave={() => setHoveredShort(null)}
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
            {shortsData.map((item) => (
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
                isFavorite={favorites.includes(course.id)}
                onToggleFavorite={toggleFav}
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
