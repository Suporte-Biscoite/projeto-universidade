import { Link } from 'react-router-dom';
import { Heart, Play, Clock } from 'lucide-react';

export default function CourseCard({ title, instructor, progress, image, category, duration, isFavorite, onToggleFavorite, id }) {
  
  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) onToggleFavorite(id);
  };

  // Cores por categoria
  const categoryColors = {
    'Operações':  'bg-emerald-100 text-emerald-700',
    'Vendas':     'bg-purple-100 text-purple-700',
    'Gestão':     'bg-blue-100 text-blue-700',
    'Marketing':  'bg-orange-100 text-orange-700',
    'IA':         'bg-pink-100 text-pink-700',
    'Franquias':  'bg-teal-100 text-teal-700',
    'Business':   'bg-cyan-100 text-cyan-700',
  };
  const catColor = categoryColors[category] || 'bg-slate-100 text-slate-600';

  return (
    <Link to="/player" className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer">
        
        {/* THUMBNAIL */}
        <div className="aspect-video w-full bg-slate-200 relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <Play size={18} className="text-[#4A72B2] ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Categoria badge */}
          {category && (
            <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full ${catColor} backdrop-blur-sm`}>
              {category}
            </span>
          )}

          {/* Favorito */}
          <button
            onClick={handleFavorite}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
              isFavorite ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-slate-400 hover:text-red-400'
            }`}
          >
            <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-5">
          <h3 className="font-bold text-[#001A26] leading-tight mb-1 line-clamp-2">{title}</h3>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">{instructor}</p>
            {duration && (
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <Clock size={11} />
                {duration}
              </div>
            )}
          </div>

          {/* PROGRESSO */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Progresso</span>
              <span className={progress === 100 ? 'text-emerald-500' : 'text-[#4A72B2]'}>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 rounded-full ${progress === 100 ? 'bg-emerald-400' : 'bg-[#4A72B2]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}