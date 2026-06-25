import { useState, useEffect } from 'react';
import { Heart, Loader, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { authFetch } from '../utils/authFetch';

export default function Favoritos() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await authFetch('/api/data?resource=favorites');
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        // Busca progresso de cada curso favorito
        const withProgress = await Promise.all(
          data.map(async (fav) => {
            try {
              const pr = await authFetch(`/api/courses?sub=progress&courseId=${fav.course_id}`);
              if (!pr.ok) return { ...fav, progress: 0 };
              const pd = await pr.json();
              // Busca total de aulas do curso
              const cr = await authFetch(`/api/courses?id=${fav.course_id}`);
              if (!cr.ok) return { ...fav, progress: 0 };
              const cd = await cr.json();
              const total = (cd.modules || []).flatMap(m => m.lessons || []).length;
              const done  = pd.count || 0;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
              return { ...fav, progress: pct };
            } catch {
              return { ...fav, progress: 0 };
            }
          })
        );
        setFavorites(withProgress);
      } catch {}
      finally { setLoading(false); }
    };
    loadFavorites();
  }, []);

  const toggleFav = async (courseId) => {
    setFavorites(prev => prev.filter(f => f.course_id !== courseId));
    try {
      await authFetch(`/api/data?resource=favorites&id=${courseId}`, { method: 'DELETE' });
    } catch {}
  };

  return (
    <div className="space-y-10 pb-20">

      {/* Header */}
      <div className="bg-[#001A26] rounded-[32px] px-8 sm:px-12 py-10 flex items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-red-400" fill="currentColor" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Meus Favoritos</h1>
          </div>
          <p className="text-[#b9d2eb]/60 text-sm">
            {loading ? 'Carregando...' : `${favorites.length} curso${favorites.length !== 1 ? 's' : ''} salvo${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Heart size={36} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-[#001A26]">Nenhum favorito ainda</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Explore os cursos e clique no coração para salvar seus favoritos.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#001A26] text-white rounded-xl font-bold text-sm hover:bg-[#4A72B2] transition-colors"
          >
            <BookOpen size={16} /> Ver cursos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {favorites.map(fav => (
            <CourseCard
              key={fav.course_id}
              id={fav.course_id}
              title={fav.title}
              instructor={fav.instructor_name || '—'}
              progress={fav.progress || 0}
              image={fav.thumbnail_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400'}
              category={fav.category}
              duration={fav.duration}
              isFavorite={true}
              onToggleFavorite={toggleFav}
            />
          ))}
        </div>
      )}
    </div>
  );
}
