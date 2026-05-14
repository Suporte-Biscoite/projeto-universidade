import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function InstructorCard({ name, role, image, specialty, id, courseCount }) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navega para o perfil do professor — ajuste a rota conforme sua estrutura
    navigate(`/professor?id=${id || name}`);
  };

  return (
    <div
      onClick={handleClick}
      className="relative h-[400px] w-full rounded-[32px] overflow-hidden group cursor-pointer"
    >
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-8 text-white">
        <h3 className="text-2xl font-bold">{name}</h3>
        <p className="text-sm text-slate-300 mb-3">{role}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full uppercase font-bold border border-white/30">
              {specialty}
            </span>
            {courseCount && (
              <span className="text-[10px] px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-bold border border-white/30 flex items-center gap-1">
                <BookOpen size={10} /> {courseCount} cursos
              </span>
            )}
          </div>
          {/* Ver perfil arrow */}
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
            <ChevronRight size={16} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}