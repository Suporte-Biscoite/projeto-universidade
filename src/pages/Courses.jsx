import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Heart, BookOpen, Loader } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { authFetch } from '../utils/authFetch';

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = value !== null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm transition-all ${
          isActive ? 'bg-[#4A72B2] text-white shadow-[#4A72B2]/30 shadow-md' : 'bg-white text-[#001A26] hover:bg-slate-50'
        }`}>
        {isActive ? value : label}
        {isActive
          ? <span onClick={e => { e.stopPropagation(); onChange(null); }} className="hover:scale-110 transition-transform"><X size={14} /></span>
          : <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''} text-slate-400`} />}
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 min-w-[160px]">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                value === opt ? 'bg-[#e2eef9] text-[#4A72B2] font-bold' : 'hover:bg-slate-50 text-[#001A26] font-medium'
              }`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal Ver Tudo ───────────────────────────────────────────────────────────
function VerTudoModal({ title, courses, favorites, onToggleFavorite, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-10 py-8 border-b border-slate-100">
          <h2 className="text-2xl font-black text-[#001A26]">{title}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard key={course.id} {...course}
                isFavorite={favorites.includes(course.id)}
                onToggleFavorite={onToggleFavorite} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Courses() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters]   = useState({ area: null, nivel: null, formato: null, instructor: null });
  const [favorites, setFavorites] = useState([]);
  const [modal, setModal]       = useState(null);

  // Busca cursos + progresso da API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res  = await authFetch('/api/courses');
        const data = await res.json();
        if (res.ok) {
          const list = Array.isArray(data) ? data : [];

          // Busca progresso de todos os cursos em paralelo
          const progressResults = await Promise.all(
            list.map(c =>
              authFetch(`/api/progress?courseId=${c.id}`)
                .then(r => r.ok ? r.json() : { completed: [], count: 0 })
                .catch(() => ({ completed: [], count: 0 }))
            )
          );

          const normalized = list.map((c, i) => {
            const prog  = progressResults[i];
            const total = (c.modules || []).flatMap(m => m.lessons || []).length;
            const done  = prog.count || 0;
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
            return {
              ...c,
              image:      c.thumbnail_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400',
              instructor: c.instructor_name || '—',
              rating:     4.5,
              progress:   pct,
            };
          });
          setCourses(normalized);
        }
      } catch (e) {
        console.error('fetchCourses:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();

    // Lê parâmetros de URL
    const cat = searchParams.get('categoria');
    const q   = searchParams.get('q');
    if (cat) setFilters(prev => ({ ...prev, area: cat }));
    if (q)   { setSearch(q); setSearchQuery(q.toLowerCase()); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter    = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const handleSearch = () => setSearchQuery(search.trim().toLowerCase());
  const toggleFav    = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const hasActiveFilters = Object.values(filters).some(v => v !== null) || !!searchQuery;

  const filteredCourses = courses.filter(c => {
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery) && !(c.category || '').toLowerCase().includes(searchQuery)) return false;
    if (filters.area       && c.category !== filters.area)       return false;
    if (filters.nivel      && c.level    !== filters.nivel)      return false;
    if (filters.formato    && c.format   !== filters.formato)    return false;
    if (filters.instructor && (c.instructor_name || c.instructor) !== filters.instructor) return false;
    return true;
  });

  const favoriteCourses = courses.filter(c => favorites.includes(c.id));

  const filterOpts = {
    area:       [...new Set(courses.map(c => c.category).filter(Boolean))],
    nivel:      [...new Set(courses.map(c => c.level).filter(Boolean))],
    formato:    [...new Set(courses.map(c => c.format).filter(Boolean))],
    instructor: [...new Set(courses.map(c => c.instructor_name || c.instructor).filter(Boolean))],
  };

  return (
    <div className="space-y-16 pb-20">
      {modal && (
        <VerTudoModal title={modal.title} courses={modal.courses}
          favorites={favorites} onToggleFavorite={toggleFav} onClose={() => setModal(null)} />
      )}

      {/* ── HERO ── */}
      <section
        className="relative rounded-[40px] px-12 py-16 flex justify-between items-center gap-8 shadow-sm overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #001A26 0%, #0a3349 50%, #4A72B2 100%)',
        }}
      >
        {/* Decoração de fundo */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #b9d2eb 0%, transparent 60%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#4A72B2]/20 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-[#b9d2eb]/10 translate-y-1/2" />

        <div className="relative space-y-5 max-w-xl">
          <span className="inline-block bg-white/10 text-[#b9d2eb] text-xs font-black px-4 py-2 rounded-full border border-white/20 uppercase tracking-widest backdrop-blur-sm">
            ✦ Universidade Biscoitê
          </span>
          <h1 className="text-4xl font-black text-white leading-tight">
            Aprenda com quem vive<br />o dia a dia da Biscoitê
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Treinamentos práticos para colaboradores, gestores e franqueados.<br />
            Do atendimento boutique à gestão de alta performance.
          </p>
        </div>

        <div className="relative hidden lg:flex flex-col items-center gap-6">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl px-8 py-5 text-center">
            <p className="text-5xl font-black text-white">{courses.length}</p>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1">Cursos disponíveis</p>
          </div>
        </div>
      </section>

      {/* ── BUSCA + FILTROS ── */}
      <section className="space-y-5">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-5 h-14 shadow-sm">
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar cursos..."
              className="flex-1 text-sm bg-transparent outline-none text-[#001A26] placeholder-slate-300 font-medium" />
            {search && <button onClick={() => { setSearch(''); setSearchQuery(''); }}><X size={14} className="text-slate-300" /></button>}
          </div>
          <button onClick={handleSearch}
            className="px-8 h-14 bg-[#001A26] text-white rounded-2xl font-black text-sm hover:bg-[#4A72B2] transition-colors shadow-sm">
            Buscar
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          <FilterDropdown label="Área"       options={filterOpts.area}       value={filters.area}       onChange={v => setFilter('area', v)} />
          <FilterDropdown label="Nível"      options={filterOpts.nivel}      value={filters.nivel}      onChange={v => setFilter('nivel', v)} />
          <FilterDropdown label="Formato"    options={filterOpts.formato}    value={filters.formato}    onChange={v => setFilter('formato', v)} />
          <FilterDropdown label="Instrutor"  options={filterOpts.instructor} value={filters.instructor} onChange={v => setFilter('instructor', v)} />
          {hasActiveFilters && (
            <button onClick={() => { setFilters({ area: null, nivel: null, formato: null, instructor: null }); setSearch(''); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl text-xs font-black text-red-400 hover:bg-red-50 flex items-center gap-1 transition-colors">
              <X size={12} /> Limpar filtros
            </button>
          )}
        </div>
      </section>

      {/* ── TODOS OS CURSOS ── */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#001A26]">
            {hasActiveFilters ? `${filteredCourses.length} resultado${filteredCourses.length !== 1 ? 's' : ''}` : 'Todos os cursos'}
          </h2>
          {!hasActiveFilters && filteredCourses.length > 8 && (
            <button onClick={() => setModal({ title: 'Todos os cursos', courses: filteredCourses })}
              className="flex items-center gap-1.5 text-[#4A72B2] text-sm font-bold hover:underline">
              Ver tudo <ChevronRight size={16} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={32} className="animate-spin text-[#4A72B2]" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {(hasActiveFilters ? filteredCourses : filteredCourses.slice(0, 8)).map(course => (
              <CourseCard key={course.id} {...course}
                isFavorite={favorites.includes(course.id)}
                onToggleFavorite={toggleFav} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-slate-500">Nenhum curso encontrado</p>
            <p className="text-sm mt-1">Tente outros filtros ou aguarde novos cursos serem publicados.</p>
          </div>
        )}
      </section>

      {/* ── FAVORITOS ── */}
      {favoriteCourses.length > 0 && (
        <section className="bg-[#f0f7ff] -mx-8 px-8 py-16 rounded-[48px]">
          <div className="max-w-[1200px] mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#001A26]">Seus favoritos
                <span className="ml-2 bg-[#4A72B2] text-white text-xs font-black px-2.5 py-1 rounded-full">{favoriteCourses.length}</span>
              </h2>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {favoriteCourses.map(course => (
                <div key={course.id} className="min-w-[280px]">
                  <CourseCard {...course} isFavorite={true} onToggleFavorite={toggleFav} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NOSSO MÉTODO ── */}
      <section className="border border-slate-200 rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-12 bg-white shadow-sm">
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-black text-[#001A26]">Nosso método</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            Focado na prática e no encantamento do cliente. Nosso treinamento combina teoria leve com muita mão na massa.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Com certificação', '70% de empregabilidade', '99% dos alunos recomendam'].map(tag => (
              <span key={tag} className="px-4 py-2 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wide">{tag}</span>
            ))}
          </div>
        </div>
        <div className="w-full md:w-1/3 flex justify-center">
          <div className="w-48 h-48 bg-blue-50 rounded-full flex items-center justify-center">
            <span className="text-6xl">📝</span>
          </div>
        </div>
      </section>
    </div>
  );
}
