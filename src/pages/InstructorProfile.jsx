import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Users, BookOpen, GraduationCap, ExternalLink, Play } from 'lucide-react';
import { useProfile, DEFAULT_COURSE_IMAGES, CURRENT_INSTRUCTOR_ID } from '../context/ProfileContext';

const AREA_ACCENT = {
  'Operações':      'bg-emerald-100 text-emerald-700',
  'Marketing':      'bg-orange-100 text-orange-700',
  'Vendas':         'bg-blue-100 text-blue-700',
  'Gestão':         'bg-purple-100 text-purple-700',
  'IA':             'bg-pink-100 text-pink-700',
  'Franquias':      'bg-teal-100 text-teal-700',
  'Business':       'bg-cyan-100 text-cyan-700',
  'Cafeteria & IA': 'bg-yellow-100 text-yellow-700',
  'RH':             'bg-rose-100 text-rose-700',
  'Café':           'bg-amber-100 text-amber-700',
  'Produção':       'bg-lime-100 text-lime-700',
};

const BANNER_GRADIENTS = [
  'from-[#001A26] to-[#4A72B2]',
  'from-[#1a0033] to-[#7C3AED]',
  'from-[#064e3b] to-[#10b981]',
  'from-[#7c2d12] to-[#f97316]',
  'from-[#1e1b4b] to-[#6366f1]',
  'from-[#0c4a6e] to-[#0ea5e9]',
];

function getBannerGradient(instructorId) {
  const hash = [...instructorId].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return BANNER_GRADIENTS[hash % BANNER_GRADIENTS.length];
}

export default function InstructorProfile() {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const { instructorProfiles, courses, systemRole } = useProfile();

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [instructorId]);

  const profile = instructorProfiles?.[instructorId];
  const isOwn = (systemRole === 'professor' || systemRole === 'admin') && CURRENT_INSTRUCTOR_ID === instructorId;
  const instructorCourses = courses.filter(c => c.instructorId === instructorId && c.published);
  const fallbackImg = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400';

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-5xl">🔍</div>
        <h1 className="text-2xl font-black text-[#001A26]">Instrutor não encontrado</h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4A72B2] font-bold hover:underline"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  const accentClass = AREA_ACCENT[profile.specialty] || 'bg-slate-100 text-slate-700';
  const bannerGradient = getBannerGradient(instructorId);

  return (
    <div className="max-w-[860px] mx-auto pb-24 space-y-0">

      {/* Back button */}
      <div className="pt-2 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-[#001A26] text-sm font-medium transition-colors"
        >
          <ArrowLeft size={15} /> Voltar para Cursos
        </button>
      </div>

      {/* ── Card principal (banner + avatar + info) ── */}
      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">

        {/* Banner */}
        <div
          className={`relative h-44 bg-gradient-to-r ${bannerGradient}`}
          style={profile.banner ? { backgroundImage: `url(${profile.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {isOwn && (
            <button
              onClick={() => navigate('/professor')}
              className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-colors"
            >
              Editar perfil
            </button>
          )}
        </div>

        {/* Avatar + Identity */}
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white" />
            </div>

            {/* Stats badges */}
            <div className="flex gap-3 mb-2">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl text-sm font-bold">
                <Star size={14} fill="currentColor" />
                {profile.stats?.rating ?? '—'}
              </div>
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold">
                <Users size={14} />
                {profile.stats?.students ?? 0} alunos
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-4 py-2 rounded-2xl text-sm font-bold">
                <BookOpen size={14} />
                {instructorCourses.length} curso{instructorCourses.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Name + title + location */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-[#001A26]">{profile.name}</h1>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${accentClass}`}>
                {profile.specialty}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">{profile.title}</p>
            {profile.location && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <MapPin size={12} />
                {profile.location}
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-5 text-slate-600 text-sm leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full hover:bg-[#e2eef9] hover:text-[#4A72B2] transition-colors cursor-default"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          {(profile.social?.linkedin || profile.social?.instagram) && (
            <div className="mt-5 flex gap-3">
              {profile.social.linkedin && (
                <a
                  href={profile.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-[#0077b5] hover:underline"
                >
                  <ExternalLink size={12} /> LinkedIn
                </a>
              )}
              {profile.social.instagram && (
                <a
                  href={profile.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-pink-500 hover:underline"
                >
                  <ExternalLink size={12} /> Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>


      {/* ── Formação ── */}
      {profile.education?.length > 0 && (
        <section className="mt-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-black text-[#001A26]">Formação</h2>
          </div>

          <div className="relative space-y-0 pl-5">
            <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-100" />
            {profile.education.map((ed, i) => (
              <div key={i} className="relative pb-6 last:pb-0">
                <div className="absolute -left-[17px] top-1.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
                <p className="font-bold text-sm text-[#001A26]">{ed.level}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ed.institution}</p>
                <p className="text-xs text-slate-400 mt-0.5">{ed.date}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Cursos comigo ── */}
      <section className="mt-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Play size={16} className="text-[#4A72B2]" />
            </div>
            <h2 className="text-lg font-black text-[#001A26]">Cursos comigo</h2>
          </div>
          {instructorCourses.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              {instructorCourses.length} curso{instructorCourses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {instructorCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
            <BookOpen size={32} className="opacity-30" />
            <p className="text-sm font-medium">Nenhum curso disponível ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {instructorCourses.map(course => {
              const thumb = course.thumbnail || DEFAULT_COURSE_IMAGES[course.category] || fallbackImg;
              return (
                <div
                  key={course.id}
                  onClick={() => navigate('/player')}
                  className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-[#4A72B2]/30 hover:bg-[#f8fbff] cursor-pointer transition-all group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={thumb}
                      alt={course.title}
                      className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 bg-[#4A72B2]/80 rounded-full flex items-center justify-center">
                        <Play size={12} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-sm text-[#001A26] line-clamp-2 leading-tight">{course.title}</p>
                    <p className="text-xs text-slate-400">{course.category} · {course.level}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <Star size={10} fill="currentColor" /> 4.5
                      </div>
                      {course.duration && (
                        <>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-xs text-slate-400">{course.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
