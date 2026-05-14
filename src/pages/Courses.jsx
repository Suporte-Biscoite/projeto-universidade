import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, Heart, Search as SearchIcon, BookOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useProfile, DEFAULT_COURSE_IMAGES } from '../context/ProfileContext';

const INSTRUCTORS = [
  { id: 'jessica', name: 'Jéssica',   role: 'Gerente de Relacionamento', specialty: 'RH',        courseCount: 3, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400' },
  { id: 'marcos',  name: 'Marcos',    role: 'Especialista em Café',       specialty: 'Barista',   courseCount: 3, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400' },
  { id: 'ana',     name: 'Ana Silva', role: 'Líder de Operações',         specialty: 'Gestão',    courseCount: 3, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400' },
  { id: 'roberto', name: 'Roberto',   role: 'Mestre Biscoiteiro',         specialty: 'Produção',  courseCount: 3, image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400' },
];

// ─────────────────────────────────────────────────────────────
// FILTER DROPDOWN COMPONENT
// ─────────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = value !== null;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm transition-all duration-200 ${
          isActive
            ? 'bg-[#4A72B2] text-white shadow-[#4A72B2]/30 shadow-md'
            : 'bg-white text-[#001A26] hover:bg-slate-50'
        }`}
      >
        {isActive ? value : label}
        {isActive ? (
          <span onClick={(e) => { e.stopPropagation(); onChange(null); }} className="hover:scale-110 transition-transform">
            <X size={14} />
          </span>
        ) : (
          <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''} text-slate-400`} />
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 min-w-[160px] overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                value === opt ? 'bg-[#e2eef9] text-[#4A72B2] font-bold' : 'hover:bg-slate-50 text-[#001A26] font-medium'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL "VER TUDO"
// ─────────────────────────────────────────────────────────────
function VerTudoModal({ title, courses, favorites, onToggleFavorite, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-10 py-8 border-b border-slate-100">
          <h2 className="text-2xl font-black text-[#001A26]">{title}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                {...course}
                isFavorite={favorites.includes(course.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Courses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { courses: ctxCourses } = useProfile();

  // Normaliza cursos do contexto para o formato usado nos cards
  const ALL_COURSES = ctxCourses
    .filter(c => c.published)
    .map(c => ({
      ...c,
      image:    c.thumbnail || DEFAULT_COURSE_IMAGES[c.category] || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400',
      rating:   4.5,
      progress: 0,
    }));

  const [hoveredInstructor, setHoveredInstructor] = useState(null);

  // Estado de busca e filtros
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ area: null, nivel: null, duracao: null, formato: null, instrutor: null, avaliacao: null });

  // Lê parâmetros de URL ao montar: ?categoria= (Home) e ?q= (Navbar)
  useEffect(() => {
    const cat = searchParams.get('categoria');
    const q   = searchParams.get('q');
    if (cat) setFilters(prev => ({ ...prev, area: cat }));
    if (q)   { setSearch(q); setSearchQuery(q.toLowerCase()); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Favoritos
  const [favorites, setFavorites] = useState([1, 5, 8]);

  // Modal "Ver tudo"
  const [modal, setModal] = useState(null); // { title, courses }

  // Ativar filtros com "Pesquisar"
  const handleSearch = () => setSearchQuery(search.trim().toLowerCase());

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  // Lógica de filtragem
  const filteredCourses = ALL_COURSES.filter(course => {
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery) && !course.category.toLowerCase().includes(searchQuery)) return false;
    if (filters.area      && course.category  !== filters.area)      return false;
    if (filters.nivel     && course.level     !== filters.nivel)     return false;
    if (filters.formato   && course.format    !== filters.formato)   return false;
    if (filters.instrutor && course.instructor !== filters.instrutor) return false;
    if (filters.avaliacao && course.rating    < parseInt(filters.avaliacao)) return false;
    if (filters.duracao) {
      const [h] = course.duration.split('h').map(Number);
      if (filters.duracao === 'Até 2h' && h > 2)  return false;
      if (filters.duracao === '2h – 4h' && (h < 2 || h > 4)) return false;
      if (filters.duracao === '+ de 4h' && h <= 4) return false;
    }
    return true;
  });

  const favoriteCourses = ALL_COURSES.filter(c => favorites.includes(c.id));

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== null) || searchQuery;

  // Opções de filtro
  const filterOpts = {
    area:      [...new Set(ALL_COURSES.map(c => c.category))],
    nivel:     [...new Set(ALL_COURSES.map(c => c.level))],
    duracao:   ['Até 2h', '2h – 4h', '+ de 4h'],
    formato:   [...new Set(ALL_COURSES.map(c => c.format))],
    instrutor: [...new Set(ALL_COURSES.map(c => c.instructor))],
    avaliacao: ['4', '5'],
  };

  const filterLabels = [
    { key: 'area',      label: 'Área' },
    { key: 'nivel',     label: 'Nível' },
    { key: 'duracao',   label: 'Duração' },
    { key: 'formato',   label: 'Formato' },
    { key: 'instrutor', label: 'Instrutor' },
    { key: 'avaliacao', label: 'Avaliação' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-20 pb-20">

      {/* MODAL */}
      {modal && (
        <VerTudoModal
          title={modal.title}
          courses={modal.courses}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onClose={() => setModal(null)}
        />
      )}

      {/* ─── 1. BUSCA E FILTROS ─── */}
      <div className="bg-[#e2eef9] rounded-[40px] p-10 space-y-8">
        {/* Search bar */}
        <div className="max-w-3xl mx-auto flex gap-2">
          <div className="flex-1 flex items-center bg-white rounded-2xl shadow-sm px-5 gap-3">
            <SearchIcon size={18} className="text-slate-300 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Pesquise o curso de interesse"
              className="flex-1 h-14 bg-transparent border-none outline-none text-slate-600 placeholder-slate-400 text-sm font-medium"
            />
            {search && (
              <button onClick={() => { setSearch(''); setSearchQuery(''); }} className="text-slate-300 hover:text-slate-500 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#4A72B2] text-white px-8 rounded-2xl font-bold hover:bg-[#001A26] transition-colors shadow-lg shadow-blue-200"
          >
            Pesquisar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap justify-center gap-3">
          {filterLabels.map(({ key, label }) => (
            <FilterDropdown
              key={key}
              label={label}
              options={filterOpts[key]}
              value={filters[key]}
              onChange={(val) => setFilter(key, val)}
            />
          ))}
          {hasActiveFilters && (
            <button
              onClick={() => { setFilters({ area: null, nivel: null, duracao: null, formato: null, instrutor: null, avaliacao: null }); setSearch(''); setSearchQuery(''); }}
              className="px-5 py-3 rounded-2xl text-sm font-bold text-red-400 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <X size={14} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. GRID DE CURSOS ─── */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#001A26]">
              {hasActiveFilters ? `Resultados (${filteredCourses.length})` : 'Todos os Cursos'}
            </h2>
            {hasActiveFilters && (
              <p className="text-sm text-slate-400">
                {filteredCourses.length === 0 ? 'Nenhum curso encontrado com esses filtros.' : `${filteredCourses.length} curso${filteredCourses.length > 1 ? 's' : ''} encontrado${filteredCourses.length > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          {!hasActiveFilters && (
            <button
              onClick={() => setModal({ title: 'Todos os Cursos', courses: ALL_COURSES })}
              className="flex items-center gap-1.5 text-[#4A72B2] text-sm font-bold hover:underline"
            >
              Ver tudo <ChevronRight size={16} />
            </button>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {(hasActiveFilters ? filteredCourses : filteredCourses.slice(0, 8)).map(course => (
              <CourseCard
                key={course.id}
                {...course}
                isFavorite={favorites.includes(course.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-bold text-slate-500">Nenhum curso encontrado</p>
            <p className="text-sm mt-1">Tente outros filtros ou termos de busca</p>
          </div>
        )}
      </section>

      {/* ─── 3. FAVORITOS ─── */}
      <section className="bg-[#f0f7ff] -mx-8 px-8 py-16 rounded-[48px]">
        <div className="max-w-[1200px] mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-[#001A26]">Seus favoritos</h2>
              <span className="bg-[#4A72B2] text-white text-xs font-black px-2.5 py-1 rounded-full">
                {favoriteCourses.length}
              </span>
            </div>
            <button
              onClick={() => setModal({ title: 'Seus Favoritos', courses: favoriteCourses })}
              className="flex items-center gap-1.5 text-[#4A72B2] text-sm font-bold hover:underline"
            >
              Ver tudo <ChevronRight size={16} />
            </button>
          </div>

          {favoriteCourses.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {favoriteCourses.map(course => (
                <div key={course.id} className="min-w-[280px]">
                  <CourseCard
                    {...course}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Heart size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="font-bold text-slate-400 text-sm">Você ainda não tem favoritos</p>
              <p className="text-xs mt-1 text-slate-300">Clique no ❤ em qualquer curso para salvar aqui</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 4. INSTRUTORES — reel-style expand on hover ─── */}
      <section className="space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#001A26]">Seus instrutores</h2>
            <p className="text-slate-500 max-w-2xl text-sm">Aprenda com quem vive o dia a dia da Biscoitê. Passe o mouse para conhecer cada instrutor.</p>
          </div>
          <span className="flex-shrink-0" />
        </div>

        {/* Reel-style instructor cards */}
        <div className="flex gap-3 overflow-hidden" style={{ height: '420px' }}>
          {INSTRUCTORS.map((ins) => {
            const isActive = hoveredInstructor === ins.id;
            return (
              <div
                key={ins.id}
                className="relative flex-shrink-0 rounded-[28px] overflow-hidden cursor-pointer"
                style={{
                  width: isActive ? '320px' : '130px',
                  transition: 'width 0.45s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={() => setHoveredInstructor(ins.id)}
                onMouseLeave={() => setHoveredInstructor(null)}
                onClick={() => navigate(`/instructor/${ins.id}`)}
              >
                {/* Photo */}
                <img
                  src={ins.image}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: isActive ? 'grayscale(0%)' : 'grayscale(60%)',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: 'filter 0.4s ease, transform 0.45s ease',
                  }}
                  alt={ins.name}
                />

                {/* Gradient — stronger on hover */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                  style={{ opacity: isActive ? 1 : 0.7, transition: 'opacity 0.3s ease' }}
                />

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                  {/* Name — always visible */}
                  <p
                    className="text-white font-black leading-tight"
                    style={{
                      fontSize: isActive ? '18px' : '12px',
                      transition: 'font-size 0.3s ease',
                      whiteSpace: isActive ? 'normal' : 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {ins.name}
                  </p>

                  {/* Role + badges — visible on hover */}
                  <div
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    <p className="text-slate-300 text-xs mb-3">{ins.role}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full uppercase font-bold border border-white/30 text-white">
                        {ins.specialty}
                      </span>
                      {ins.courseCount && (
                        <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-bold border border-white/30 flex items-center gap-1 text-white">
                          <BookOpen size={9} /> {ins.courseCount} cursos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 5. NOSSO MÉTODO ─── */}
      <section className="border border-slate-200 rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-12 bg-white shadow-sm">
        <div className="flex-1 space-y-6">
          <h2 className="text-2xl font-black text-[#001A26]">Nosso método</h2>
          <p className="text-slate-500 leading-relaxed text-sm">
            Focado na prática e no encantamento do cliente. Nosso treinamento combina teoria leve com muita mão na massa.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Com certificação', '70% de empregabilidade', '99% dos alunos recomendam'].map(tag => (
              <span key={tag} className="px-4 py-2 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {tag}
              </span>
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