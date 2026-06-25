// src/components/professor/OverviewView.jsx
import { useState, useEffect } from 'react';
import { Star, Users, BookOpen, CheckCircle2, Loader } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import LiveControl from '../LiveControl';
import { getLoggedId } from './ProfessorHelpers';

function OverviewView({ onNewComm }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const loggedId = getLoggedId();

  useEffect(() => {
    Promise.all([
      authFetch('/api/courses').then(r => r.ok ? r.json() : []),
      authFetch('/api/data?resource=certificates').then(r => r.ok ? r.json() : []),
      authFetch('/api/users').then(r => r.ok ? r.json() : []),
    ]).then(async ([allCourses, certs, users]) => {
      // Filtra cursos do professor logado
      const myCourses = Array.isArray(allCourses)
        ? allCourses.filter(c => c.instructor_id === loggedId || c.instructorId === loggedId)
        : [];

      // Total de aulas nos meus cursos
      const totalLessons = myCourses.flatMap(c => (c.modules || []).flatMap(m => m.lessons || [])).length;

      // Certificados emitidos nos meus cursos
      const myCourseIds = new Set(myCourses.map(c => c.id));
      const myCerts = Array.isArray(certs) ? certs.filter(c => myCourseIds.has(c.course_id)) : [];

      // Alunos únicos com progresso nos meus cursos
      const studentIds = new Set(myCerts.map(c => c.user_id));
      const activeStudents = Array.isArray(users) ? users.filter(u => u.role === 'aluno' && u.active).length : 0;

      // Busca ratings dos meus cursos
      let avgRating = 0;
      let totalRatings = 0;
      let ratingDist = [0,0,0,0,0]; // 1-5
      for (const course of myCourses) {
        try {
          const res = await authFetch(`/api/data?resource=ratings&courseId=${course.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.avg_rating) {
              avgRating += Number(data.avg_rating) * Number(data.total);
              totalRatings += Number(data.total);
            }
          }
        } catch {}
      }
      const finalAvg = totalRatings > 0 ? (avgRating / totalRatings).toFixed(1) : null;

      // Taxa de conclusão: cursos concluídos / total cursos publicados * 100
      const publishedCourses = myCourses.filter(c => c.published);
      const completionRate = publishedCourses.length > 0
        ? Math.round((myCerts.length / (publishedCourses.length * Math.max(1, studentIds.size))) * 100)
        : 0;

      setStats({
        courses:        myCourses.length,
        published:      publishedCourses.length,
        activeStudents,
        certs:          myCerts.length,
        avgRating:      finalAvg,
        totalRatings,
        completionRate: Math.min(completionRate, 100),
        totalLessons,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [loggedId]);

  const StarDisplay = ({ value }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={14}
          fill={value >= s ? '#F59E0B' : value >= s - 0.5 ? '#F59E0B' : 'none'}
          className={value >= s ? 'text-amber-400' : 'text-slate-200'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Controle de Live */}
      <LiveControl />

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-[24px] h-32 animate-pulse border border-slate-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Taxa de conclusão */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Conclusão</p>
              <div className="w-8 h-8 bg-[#e2eef9] rounded-xl flex items-center justify-center">
                <CheckCircle2 size={16} className="text-[#4A72B2]" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#001A26]">{stats?.completionRate ?? 0}%</p>
            <p className="text-xs text-slate-400">{stats?.certs ?? 0} certificados emitidos</p>
          </div>

          {/* Nota média */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota Média</p>
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star size={16} className="text-amber-400" fill="#F59E0B" />
              </div>
            </div>
            {stats?.avgRating ? (
              <>
                <p className="text-3xl font-black text-[#001A26]">{stats.avgRating}</p>
                <StarDisplay value={Number(stats.avgRating)} />
                <p className="text-xs text-slate-400">{stats.totalRatings} avaliações</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-slate-300">—</p>
                <p className="text-xs text-slate-400">Sem avaliações ainda</p>
              </>
            )}
          </div>

          {/* Alunos ativos */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alunos Ativos</p>
              <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Users size={16} className="text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#001A26]">{stats?.activeStudents ?? 0}</p>
            <p className="text-xs text-slate-400">colaboradores na plataforma</p>
          </div>

          {/* Cursos publicados */}
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cursos Publicados</p>
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                <BookOpen size={16} className="text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#001A26]">{stats?.published ?? 0}</p>
            <p className="text-xs text-slate-400">{stats?.totalLessons ?? 0} aulas no total</p>
          </div>
        </div>
      )}

      {/* Cursos com ratings */}
      {!loading && stats && stats.published > 0 && (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-black text-[#001A26] text-sm">Avaliações por curso</h3>
          <CourseRatingsList loggedId={loggedId} />
        </div>
      )}
    </div>
  );
}

function CourseRatingsList({ loggedId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    authFetch('/api/courses').then(r => r.ok ? r.json() : []).then(async courses => {
      const mine = Array.isArray(courses) ? courses.filter(c => c.instructor_id === loggedId || c.instructorId === loggedId) : [];
      const withRatings = await Promise.all(mine.filter(c => c.published).map(async c => {
        try {
          const res  = await authFetch(`/api/data?resource=ratings&courseId=${c.id}`);
          const data = res.ok ? await res.json() : {};
          return { ...c, avg_rating: data.avg_rating || null, total_ratings: data.total || 0 };
        } catch { return { ...c, avg_rating: null, total_ratings: 0 }; }
      }));
      setItems(withRatings);
    }).catch(() => {});
  }, [loggedId]);

  if (items.length === 0) return <p className="text-sm text-slate-400">Nenhum curso publicado ainda.</p>;

  return (
    <div className="space-y-3">
      {items.map(c => (
        <div key={c.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#001A26] text-sm truncate">{c.title}</p>
            <p className="text-xs text-slate-400">{c.category} · {c.level}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {c.avg_rating ? (
              <>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} fill={Number(c.avg_rating) >= s ? '#F59E0B' : 'none'} className={Number(c.avg_rating) >= s ? 'text-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
                <span className="text-sm font-black text-[#001A26]">{Number(c.avg_rating).toFixed(1)}</span>
                <span className="text-xs text-slate-400">({c.total_ratings})</span>
              </>
            ) : (
              <span className="text-xs text-slate-400">Sem avaliações</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}



export default OverviewView;
