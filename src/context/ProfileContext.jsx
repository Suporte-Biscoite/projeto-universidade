import { createContext, useState, useContext, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

const ProfileContext = createContext();

export const AREA_COLORS = {
  'Operações': 'bg-emerald-100 text-emerald-700',
  'Marketing': 'bg-orange-100 text-orange-700',
  'Vendas': 'bg-blue-100 text-blue-700',
  'Gestão': 'bg-purple-100 text-purple-700',
  'IA': 'bg-pink-100 text-pink-700',
  'Franquias': 'bg-teal-100 text-teal-700',
  'Business': 'bg-cyan-100 text-cyan-700',
};

// ID do professor logado — em produção viria do JWT verificado no servidor
// DEFAULT_COURSE_IMAGES mantido para compatibilidade com outros imports

export const STORES = [
  { id: 'loja_eldorado',      name: 'Loja Eldorado',       city: 'São Paulo', state: 'SP' },
  { id: 'loja_pinheiros',     name: 'Loja Pinheiros',      city: 'São Paulo', state: 'SP' },
  { id: 'loja_moema',         name: 'Loja Moema',          city: 'São Paulo', state: 'SP' },
  { id: 'loja_tatuape',       name: 'Loja Tatuapé',        city: 'São Paulo', state: 'SP' },
  { id: 'loja_centro',        name: 'Loja Centro',         city: 'São Paulo', state: 'SP' },
  { id: 'loja_brooklin',      name: 'Loja Brooklin',       city: 'São Paulo', state: 'SP' },
  { id: 'loja_vila_madalena', name: 'Loja Vila Madalena',  city: 'São Paulo', state: 'SP' },
  { id: 'loja_jardins',       name: 'Loja Jardins',        city: 'São Paulo', state: 'SP' },
];

// ─── Dados iniciais ──────────────────────────────────────────────────────────

const INITIAL_CERTIFICATES = [];

export const DEFAULT_COURSE_IMAGES = {
  'Operações': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=400',
  'Marketing':  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=400',
  'Vendas':     'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400',
  'Gestão':     'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400',
  'IA':         'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=400',
  'Franquias':  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=400',
  'Business':   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=400',
};

const INITIAL_COURSES = [];

const INITIAL_MODULES = [];

// ─── Reels dos instrutores ───────────────────────────────────────────────────
const INITIAL_SHORTS = [];

// ─── Perfis públicos de instrutores ─────────────────────────────────────────
const INITIAL_INSTRUCTOR_PROFILES = {};

// ─── Conversas iniciais (professor ↔ alunos/franqueados) ────────────────────
const INITIAL_CONVERSATIONS = [];
// ─── Avisos iniciais (professor → alunos/franqueados) ────────────────────────
const INITIAL_ANNOUNCEMENTS = [];
const INITIAL_CERT_TEMPLATES = [];
const INITIAL_ISSUED_CERTS = [];
const INITIAL_MENU_ITEMS = [
  { id: 'home',          label: 'Home',           path: '/',               group: 'nav',      visible: true, order: 1 },
  { id: 'courses',       label: 'Cursos',          path: '/courses',        group: 'nav',      visible: true, order: 2 },
  { id: 'certificados',  label: 'Certificados',    path: '/certificados',   group: 'nav',      visible: true, order: 3 },
  { id: 'favoritos',     label: 'Favoritos',       path: '/favoritos',      group: 'dropdown', visible: true, order: 4 },
  { id: 'mensagens',     label: 'Mensagens',       path: '/mensagens',      group: 'dropdown', visible: true, order: 5 },
  { id: 'carreira',      label: 'Carreira (Beta)', path: '/carreira',       group: 'dropdown', visible: true, order: 6 },
  { id: 'live',          label: 'Live',            path: '/live',           group: 'dropdown', visible: true, order: 7 },
  { id: 'configuracoes', label: 'Configurações',   path: '/configuracoes',  group: 'dropdown', visible: true, order: 8 },
];

const INITIAL_USERS = [];

const INITIAL_CONFIG = {
  platformName: 'Universidade Biscoitê',
  supportEmail: 'academy@biscoite.com',
  maxCoursesPerProfessor: 10,
  allowSelfRegistration: true,
  requireApproval: false,
};

// ─── Helper para carregar do localStorage com fallback ───────────────────────
function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

// Garante que itens novos do INITIAL_MENU_ITEMS sejam adicionados
// mesmo que o usuário já tenha dados antigos no localStorage
function loadMenuItems() {
  const saved = loadFromStorage('biscoite_menu_items', INITIAL_MENU_ITEMS);
  const savedIds = new Set(saved.map(i => i.id));
  const missing = INITIAL_MENU_ITEMS.filter(i => !savedIds.has(i.id));
  return missing.length > 0 ? [...saved, ...missing] : saved;
}

// ─── Helper de sanitização ───────────────────────────────────────────────────
export function sanitizeText(str, maxLen = 200) {
  return String(str ?? '').trim().slice(0, maxLen);
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ProfileProvider({ children }) {
  const [profileImage, setProfileImage] = useState(() => {
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged?.avatar_url && !logged.avatar_url.startsWith('blob:'))
        return logged.avatar_url;
    } catch {}
    return null;
  });

  const [userData, setUserData] = useState(() => {
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged) {
        return {
          name:    logged.name         || 'Usuário',
          unit:    logged.unit         || logged.store_name || '',
          role:     '',  // sempre carregado do banco via fetchFreshData
          time:     logged.company_time || '',
          pronoun:  logged.pronoun      || '',
          bio:      logged.bio          || '',
          contacts: logged.contacts     || { phone: '', email: '', linkedin: '', website: '' },
          avatar_url:  logged.avatar_url  || null,
          banner_url:  logged.banner_url  || null,
          certificates: INITIAL_CERTIFICATES,
          education: [],
          experience: [],
        };
      }
    } catch {}
    return {
      name: 'Usuário', unit: '', role: '', time: '',
      pronoun: '', bio: '', avatar_url: null, banner_url: null,
      certificates: INITIAL_CERTIFICATES, education: [], experience: [],
    };
  });

  const [achievements, setAchievements] = useState({
    coursesCompleted: 0,
    streak: 0,
    minutesWatched: 0,
    ranking: 0,
    referrals: 0,
  });

  // ── Sistema de roles ──────────────────────────────────────────────────────
  // SECURITY NOTE: systemRole está em localStorage apenas para demo.
  // Em produção, DEVE vir de um JWT verificado no servidor.
  // Nunca confie em dados de role vindos do cliente para autorizar ações.
  const [systemRole, setSystemRoleState] = useState(() => {
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged?.role) return logged.role;
    } catch {}
    return 'aluno';
  });

  // ── Courses ───────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);

  // ── Modules ───────────────────────────────────────────────────────────────
  const [modules, setModules] = useState([]);

  // ── Menu items ────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems] = useState(() => loadMenuItems());

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState(INITIAL_USERS);

  // ── Platform config ───────────────────────────────────────────────────────
  const [platformConfig, setPlatformConfigState] = useState(
    () => loadFromStorage('biscoite_config', INITIAL_CONFIG)
  );

  // ── Conversas (professor ↔ alunos/franqueados) ────────────────────────────
  const [conversations, setConversations] = useState(
    () => loadFromStorage('biscoite_conversations', INITIAL_CONVERSATIONS)
  );

  // ── Avisos (professor → todos) ────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState(
    () => loadFromStorage('biscoite_announcements', INITIAL_ANNOUNCEMENTS)
  );

  // ── Certificate Templates (professor creates) ──────────────────────────────
  const [certTemplates, setCertTemplates] = useState(
    () => loadFromStorage('biscoite_cert_templates', INITIAL_CERT_TEMPLATES)
  );

  // ── Issued Certificates (professor issues to users) ────────────────────────
  const [issuedCerts, setIssuedCerts] = useState(
    () => loadFromStorage('biscoite_issued_certs', INITIAL_ISSUED_CERTS)
  );

  // ── Instructor Profiles ───────────────────────────────────────────────────
  const [instructorProfiles, setInstructorProfiles] = useState(
    () => loadFromStorage('biscoite_instructor_profiles', INITIAL_INSTRUCTOR_PROFILES)
  );

  // ── Reels ─────────────────────────────────────────────────────────────────
  const [shorts, setShorts]           = useState([]);
  const [shortsLoaded, setShortsLoaded] = useState(false);

  // ── Persistência no localStorage ──────────────────────────────────────────
  // ── Busca usuários do banco (para admin) ────────────────────────────────────
  useEffect(() => {
    const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');
    if (!isAuth) return;
    const token = sessionStorage.getItem('biscoite_access_token') || localStorage.getItem('biscoite_access_token');
    if (!token) return;
    // Só busca lista completa de usuários se for admin
    const raw = sessionStorage.getItem('biscoite_logged_user') || localStorage.getItem('biscoite_logged_user');
    const logged = raw ? JSON.parse(raw).catch?.(() => null) || JSON.parse(raw) : null;
    if (logged?.role !== 'admin') return;
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.users || []);
        if (list.length > 0) setUsers(list);
      })
      .catch(() => {});
  }, []);

  // ── Busca reels do banco ao inicializar ──────────────────────────────────────
  useEffect(() => {
    const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');
    if (!isAuth) return;
    // Remove reels antigos do localStorage
    localStorage.removeItem('biscoite_reels');
    sessionStorage.removeItem('biscoite_reels');
    authFetch('/api/data?resource=shorts')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setShorts(data); })
      .catch(() => {})
      .finally(() => setShortsLoaded(true));
  }, []);

  // ── Busca cursos do banco ao inicializar ─────────────────────────────────────
  useEffect(() => {
    // Remove chaves stale que não devem mais ser fonte de verdade
    ['biscoite_courses', 'biscoite_modules', 'biscoite_users', 'biscoite_system_role'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });

    const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');
    if (!isAuth) return;

    authFetch('/api/courses')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        setCourses(data);
        // Extrai módulos e aulas de todos os cursos e coloca no estado global
        const allModules = data.flatMap(course =>
          (course.modules || []).map(mod => ({
            ...mod,
            courseId:  mod.course_id || mod.courseId || course.id,
            lessons:   mod.lessons   || [],
          }))
        );
        if (allModules.length > 0) setModules(allModules);
      })
      .catch(() => {});
  }, []);

  // ── Sincroniza e busca dados frescos do banco ao inicializar ────────────────
  useEffect(() => {
    // 1. Sync imediato do storage local
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      if (raw) {
        const logged = JSON.parse(raw);
        if (logged?.name)  setUserData(prev => ({ ...prev, name: logged.name, unit: logged.unit || prev.unit }));
        if (logged?.avatar_url && !logged.avatar_url.startsWith('blob:')) setProfileImage(logged.avatar_url);
        if (logged?.role)  setSystemRoleState(logged.role);
      }
    } catch {}

    // 2. Busca dados frescos da API
    const fetchFreshData = async () => {
      try {
        const isAuth = sessionStorage.getItem('biscoite_auth') || localStorage.getItem('biscoite_auth');
        if (!isAuth) return;

        const raw = sessionStorage.getItem('biscoite_logged_user')
                 || localStorage.getItem('biscoite_logged_user');
        if (!raw) return;
        const logged = JSON.parse(raw);
        if (!logged?.id) return;

        const token = sessionStorage.getItem('biscoite_access_token')
                   || localStorage.getItem('biscoite_access_token');
        if (!token) return;

        // Busca direto sem authFetch para não triggerar refresh loop no mount
        const res = await fetch(`/api/users?id=${logged.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const user = await res.json();

        // Atualiza estado imediatamente com dados do banco
        setUserData(prev => ({
          ...prev,
          name:     user.name         || prev.name,
          unit:     user.unit         || user.store_name || prev.unit,
          pronoun:  user.pronoun      || prev.pronoun || '',
          role:     user.position     || '',
          time:     user.company_time || prev.time    || '',
          bio:      user.bio          || prev.bio     || '',
          contacts: user.contacts     || prev.contacts || { phone: '', email: '', linkedin: '', website: '' },
        }));
        if (user.avatar_url && !user.avatar_url.startsWith('blob:')) {
          setProfileImage(user.avatar_url);
        }
        if (user.role) setSystemRoleState(user.role);

        // Atualiza storage com dados frescos
        const storage = sessionStorage.getItem('biscoite_logged_user') ? sessionStorage : localStorage;
        storage.setItem('biscoite_logged_user', JSON.stringify({ ...logged, ...user }));
      } catch {}
    };
    fetchFreshData();

    // 3. Escuta mudanças de storage (ex: outra aba)
    const onStorage = () => {
      try {
        const raw = sessionStorage.getItem('biscoite_logged_user')
                 || localStorage.getItem('biscoite_logged_user');
        if (!raw) return;
        const logged = JSON.parse(raw);
        if (logged?.name)  setUserData(prev => ({ ...prev, name: logged.name }));
        if (logged?.avatar_url && !logged.avatar_url.startsWith('blob:')) setProfileImage(logged.avatar_url);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Persistência no localStorage ──────────────────────────────────────────
  // Apenas estados que ainda não têm endpoint de leitura consolidado no banco.
  // courses, modules, users e systemRole vêm do banco — não persistir localmente.
  useEffect(() => { try { localStorage.setItem('biscoite_menu_items', JSON.stringify(menuItems)); } catch {} }, [menuItems]);
  useEffect(() => { try { localStorage.setItem('biscoite_config', JSON.stringify(platformConfig)); } catch {} }, [platformConfig]);
  useEffect(() => { try { localStorage.setItem('biscoite_conversations', JSON.stringify(conversations)); } catch {} }, [conversations]);
  useEffect(() => { try { localStorage.setItem('biscoite_announcements', JSON.stringify(announcements)); } catch {} }, [announcements]);
  useEffect(() => { try { localStorage.setItem('biscoite_cert_templates', JSON.stringify(certTemplates)); } catch {} }, [certTemplates]);
  useEffect(() => { try { localStorage.setItem('biscoite_issued_certs', JSON.stringify(issuedCerts)); } catch {} }, [issuedCerts]);
  useEffect(() => { try { localStorage.setItem('biscoite_instructor_profiles', JSON.stringify(instructorProfiles)); } catch {} }, [instructorProfiles]);
  // reels saved to DB via API

  // ── Funções de profile ────────────────────────────────────────────────────
  const updateProfileImage = async (newImage) => {
    // Rejeita blob: URLs — não persistem entre sessões
    if (newImage && newImage.startsWith('blob:')) {
      console.warn('updateProfileImage: blob URL rejeitada, use base64');
      return;
    }
    // Atualiza estado imediatamente — sem esperar API
    setProfileImage(newImage);
    // Persiste no banco se o usuário estiver logado
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged?.id) {
        await authFetch(`/api/users?id=${logged.id}`, {
          method: 'PUT',
          body: JSON.stringify({ avatar_url: newImage }),
        });
        // Atualiza storage local
        const updated = { ...logged, avatar_url: newImage };
        if (sessionStorage.getItem('biscoite_logged_user')) sessionStorage.setItem('biscoite_logged_user', JSON.stringify(updated));
        if (localStorage.getItem('biscoite_logged_user'))   localStorage.setItem('biscoite_logged_user', JSON.stringify(updated));
      }
    } catch (e) { console.error('updateProfileImage', e); }
  };

  const updateUserDataApi = async (newData) => {
    // Atualiza estado local imediatamente (sem esperar API)
    setUserData(prev => ({ ...prev, ...newData }));
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged?.id) {
        const res = await authFetch(`/api/users?id=${logged.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name:         newData.name,
            unit:         newData.unit,
            pronoun:      newData.pronoun,
            position:     newData.role,
            company_time: newData.time,
            password:     newData.password || undefined,
          }),
        });
        if (res.ok) {
          const updated_user = await res.json();
          // Atualiza storage e estado com dados confirmados pelo banco
          const updatedLogged = { ...logged, ...updated_user };
          const storage = sessionStorage.getItem('biscoite_logged_user') ? sessionStorage : localStorage;
          storage.setItem('biscoite_logged_user', JSON.stringify(updatedLogged));
          // Re-sincroniza estado com dados do banco
          setUserData(prev => ({
            ...prev,
            name: updated_user.name || prev.name,
            unit: updated_user.unit || prev.unit,
          }));
        }
      }
    } catch (e) { console.error('updateUserDataApi', e); }
  };
  const updateUserData = (newData) => setUserData(prev => typeof newData === 'function' ? newData(prev) : { ...prev, ...newData });

  const completeLesson = (durationMinutes = 5) => {
    setAchievements(prev => ({ ...prev, minutesWatched: prev.minutesWatched + durationMinutes }));
  };

  const completeCourse = ({ title, area, stars = 5, tags = [], description = '' }) => {
    const today = new Date();
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const dateStr = `${months[today.getMonth()]} ${today.getFullYear()}`;
    const areaColor = AREA_COLORS[area] || 'bg-slate-100 text-slate-700';
    setAchievements(prev => ({ ...prev, coursesCompleted: prev.coursesCompleted + 1 }));
    setUserData(prev => ({
      ...prev,
      certificates: [...prev.certificates, { id: Date.now(), title, area, areaColor, description, tags, stars, date: dateStr, duration: 'Curta duração' }],
    }));
  };

  // ── Funções de systemRole ─────────────────────────────────────────────────
  const setSystemRole = (role) => {
    const valid = ['admin', 'professor', 'aluno', 'franqueado', 'gestor', 'loja'];
    if (valid.includes(role)) setSystemRoleState(role);
  };

  // ── Funções de courses ────────────────────────────────────────────────────
  // TODO (backend): cada função abaixo deve chamar a API com o token JWT do usuário.
  // O servidor deve re-validar o role antes de executar qualquer operação.

  const addCourse = async (data) => {
    try {
      const res = await authFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title:        data.title,
          description:  data.description,
          category:     data.category    || 'Operações',
          level:        data.level       || 'Iniciante',
          format:       data.format      || 'Vídeo',
          duration:     data.duration    || '',
          thumbnail_url: data.thumbnail  || null,
          vimeo_id:     data.vimeoId     || null,
          instructor:   data.instructor  || null,
          published:    Boolean(data.published),
          visibility:   data.visibility  || ['aluno','gestor','professor','admin'],
        }),
      });
      if (res.ok) {
        const newCourse = await res.json();
        setCourses(prev => [...prev, newCourse]);
        return newCourse.id;
      }
    } catch (e) { console.error('addCourse:', e); }
  };

  const updateCourse = async (id, data) => {
    // Atualiza estado local imediatamente
    setCourses(prev => prev.map(c => c.id !== id ? c : { ...c, ...data }));
    try {
      await authFetch(`/api/courses?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title:          data.title,
          description:    data.description,
          category:       data.category,
          level:          data.level,
          format:         data.format,
          duration:       data.duration,
          thumbnail_url:  data.thumbnail      || data.thumbnail_url || null,
          vimeo_id:       data.vimeoId        || data.vimeo_id      || null,
          instructor:     data.instructor     || data.instructor_name || null,
          published:      data.published !== undefined ? Boolean(data.published) : undefined,
          visibility:     data.visibility,
        }),
      });
    } catch (e) { console.error('updateCourse:', e); }
  };

  const deleteCourse = async (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    setModules(prev => prev.filter(m => m.courseId !== id));
    try {
      await authFetch(`/api/courses?id=${id}`, { method: 'DELETE' });
    } catch (e) { console.error('deleteCourse:', e); }
  };

  // ── Funções de modules ────────────────────────────────────────────────────
  const addModule = async (courseId, title) => {
    try {
      const res = await authFetch('/api/courses?sub=modules', {
        method: 'POST',
        body: JSON.stringify({ courseId, title }),
      });
      if (res.ok) {
        const newModule = await res.json();
        setModules(prev => [...prev, {
          ...newModule,
          courseId:  newModule.course_id || courseId,
          lessons:   [],
        }]);
        return newModule.id;
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('addModule error:', res.status, err);
      }
    } catch (e) { console.error('addModule:', e); }
  };

  const updateModule = async (id, title) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, title } : m));
    try {
      await authFetch(`/api/courses?sub=modules&id=${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title }),
      });
    } catch (e) { console.error('updateModule:', e); }
  };

  const deleteModule = async (id) => {
    setModules(prev => prev.filter(m => m.id !== id));
    try {
      await authFetch(`/api/courses?sub=modules&id=${id}`, { method: 'DELETE' });
    } catch (e) { console.error('deleteModule:', e); }
  };

  const addLesson = async (moduleId, lessonData) => {
    try {
      const res = await authFetch('/api/courses?sub=lessons', {
        method: 'POST',
        body: JSON.stringify({
          moduleId,
          title:      lessonData.title,
          duration:   lessonData.duration,
          type:       lessonData.type || 'video',
          vimeo_id:   lessonData.vimeoId || null,
          visibility: lessonData.visibility || ['aluno','gestor','professor','admin'],
        }),
      });
      if (res.ok) {
        const newLesson = await res.json();
        setModules(prev => prev.map(m =>
          m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), newLesson] } : m
        ));
        return newLesson.id;
      }
    } catch (e) { console.error('addLesson:', e); }
  };

  const deleteLesson = async (moduleId, lessonId) => {
    setModules(prev => prev.map(m =>
      m.id !== moduleId ? m : { ...m, lessons: (m.lessons || []).filter(l => l.id !== lessonId) }
    ));
    try {
      await authFetch(`/api/courses?sub=lessons&id=${lessonId}`, { method: 'DELETE' });
    } catch (e) { console.error('deleteLesson:', e); }
  };

  // ── Funções de menu ───────────────────────────────────────────────────────
  const toggleMenuItemVisibility = (id) => {
    setMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    ));
  };

  const reorderMenuItem = (id, direction) => {
    setMenuItems(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const updated = [...sorted];
      [updated[idx].order, updated[swapIdx].order] = [updated[swapIdx].order, updated[idx].order];
      return updated;
    });
  };

  // ── Funções de usuários ───────────────────────────────────────────────────
  const updateUser = (id, data) => {
    // TODO (backend): somente admin pode alterar roles — validar no servidor
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, ...data } : u
    ));
  };

  const addUser = (data) => {
    const newUser = {
      id: Date.now(),
      name: sanitizeText(data.name, 60),
      email: sanitizeText(data.email, 80),
      systemRole: ['admin','professor','aluno','franqueado','gestor','loja'].includes(data.systemRole) ? data.systemRole : 'aluno',
      unit: sanitizeText(data.unit, 60),
      active: true,
      instructorId: null,
    };
    setUsers(prev => [...prev, newUser]);
    return newUser.id;
  };

  // ── Funções de conversas ──────────────────────────────────────────────────
  // from: 'prof' | 'user'   convId: id da conversa
  const sendMessage = (convId, text, from) => {
    const msg = { id: Date.now(), from, text, time: 'agora' };
    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c;
      return {
        ...c,
        messages: [...c.messages, msg],
        lastMsg: text,
        lastTime: 'agora',
        unreadProf: from === 'user' ? c.unreadProf + 1 : c.unreadProf,
        unreadUser: from === 'prof' ? c.unreadUser + 1 : c.unreadUser,
      };
    }));
  };

  const markConvReadProf = (convId) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadProf: 0 } : c));
  };

  const markConvReadUser = (convId) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadUser: 0 } : c));
  };

  // ── Funções de avisos ─────────────────────────────────────────────────────
  const addAnnouncement = (data) => {
    setAnnouncements(prev => [{
      id: Date.now(),
      titulo: sanitizeText(data.titulo, 100),
      corpo: sanitizeText(data.corpo, 500),
      destino: data.destino || 'todos',
      time: 'agora',
      lidos: 0,
    }, ...prev]);
  };

  // ── Funções de certificados ───────────────────────────────────────────────
  const addCertTemplate = (data) => {
    const tmpl = {
      id: Date.now(),
      courseId: data.courseId || null,
      title: sanitizeText(data.title, 120),
      description: sanitizeText(data.description, 500),
      area: data.area || 'Operações',
      areaColor: AREA_COLORS[data.area] ? `${AREA_COLORS[data.area]}` : 'bg-slate-100 text-slate-700',
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : [],
      duration: data.duration || 'Curta duração',
      instructorId: userData?.instructor_id || userData?.id || null,
      instructorName: sanitizeText(data.instructorName, 60),
      bgColor: data.bgColor || '#001A26',
      accentColor: data.accentColor || '#4A72B2',
      published: Boolean(data.published),
      createdAt: (() => {
        const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const d = new Date();
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
      })(),
    };
    setCertTemplates(prev => [...prev, tmpl]);
    return tmpl.id;
  };

  const updateCertTemplate = (id, data) => {
    setCertTemplates(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        title: data.title !== undefined ? sanitizeText(data.title, 120) : t.title,
        description: data.description !== undefined ? sanitizeText(data.description, 500) : t.description,
        area: data.area || t.area,
        areaColor: data.area ? (AREA_COLORS[data.area] || 'bg-slate-100 text-slate-700') : t.areaColor,
        tags: data.tags !== undefined ? data.tags.slice(0, 5) : t.tags,
        duration: data.duration || t.duration,
        courseId: data.courseId !== undefined ? data.courseId : t.courseId,
        instructorName: data.instructorName !== undefined ? sanitizeText(data.instructorName, 60) : t.instructorName,
        bgColor: data.bgColor || t.bgColor,
        accentColor: data.accentColor || t.accentColor,
        published: data.published !== undefined ? Boolean(data.published) : t.published,
      };
    }));
  };

  const deleteCertTemplate = (id) => {
    setCertTemplates(prev => prev.filter(t => t.id !== id));
    setIssuedCerts(prev => prev.filter(ic => ic.templateId !== id));
  };

  const issueCertificate = (templateId, userId, userName, userRole, stars = 5) => {
    // Don't issue duplicate
    const already = issuedCerts.find(ic => ic.templateId === templateId && ic.userId === userId);
    if (already) return false;
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const d = new Date();
    setIssuedCerts(prev => [...prev, {
      id: Date.now(),
      templateId,
      userId,
      userName: sanitizeText(userName, 60),
      userRole,
      issuedAt: `${months[d.getMonth()]} ${d.getFullYear()}`,
      stars,
    }]);
    return true;
  };

  const revokeIssuedCert = (issuedCertId) => {
    setIssuedCerts(prev => prev.filter(ic => ic.id !== issuedCertId));
  };

  // ── Funções de reels (API) ────────────────────────────────────────────────
  const addShort = async (data) => {
    try {
      const res = await authFetch('/api/data?resource=shorts', {
        method: 'POST',
        body: JSON.stringify({
          caption:       data.caption,
          tag:           data.tag || 'Dica',
          thumbnail_url: data.thumbnail || null,
          vimeo_id:      data.vimeoId   || null,
        }),
      });
      if (res.ok) {
        const newReel = await res.json();
        setShorts(prev => [newReel, ...prev]);
        return newReel.id;
      }
    } catch (e) { console.error('addReel:', e); }
  };

  const deleteShort = async (id) => {
    setShorts(prev => prev.filter(r => r.id !== id));
    try {
      await authFetch(`/api/data?resource=shorts&id=${id}`, { method: 'DELETE' });
    } catch (e) { console.error('deleteReel:', e); }
  };

  // ── Funções de instructor profiles ───────────────────────────────────────
  const updateInstructorProfile = (instructorId, data) => {
    setInstructorProfiles(prev => {
      const existing = prev[instructorId] || {};
      return {
        ...prev,
        [instructorId]: {
          ...existing,
          ...data,
          name:       data.name       !== undefined ? sanitizeText(data.name, 80)       : existing.name,
          title:      data.title      !== undefined ? sanitizeText(data.title, 120)     : existing.title,
          bio:        data.bio        !== undefined ? sanitizeText(data.bio, 600)        : existing.bio,
          specialty:  data.specialty  !== undefined ? sanitizeText(data.specialty, 60)  : existing.specialty,
          location:   data.location   !== undefined ? sanitizeText(data.location, 80)   : existing.location,
          skills:     Array.isArray(data.skills)    ? data.skills.slice(0, 12)          : existing.skills,
          education:  Array.isArray(data.education) ? data.education                    : existing.education,
          experience: Array.isArray(data.experience)? data.experience                   : existing.experience,
          social:     data.social     !== undefined ? data.social                       : existing.social,
          avatar:     data.avatar     !== undefined ? data.avatar                       : existing.avatar,
          banner:     data.banner     !== undefined ? data.banner                       : existing.banner,
        },
      };
    });
  };

  // ── Funções de config ─────────────────────────────────────────────────────
  const updatePlatformConfig = (data) => {
    // TODO (backend): somente admin — validar no servidor
    setPlatformConfigState(prev => ({
      ...prev,
      platformName: data.platformName !== undefined ? sanitizeText(data.platformName, 60) : prev.platformName,
      supportEmail: data.supportEmail !== undefined ? sanitizeText(data.supportEmail, 80) : prev.supportEmail,
      maxCoursesPerProfessor: Number(data.maxCoursesPerProfessor) || prev.maxCoursesPerProfessor,
      allowSelfRegistration: data.allowSelfRegistration !== undefined ? Boolean(data.allowSelfRegistration) : prev.allowSelfRegistration,
      requireApproval: data.requireApproval !== undefined ? Boolean(data.requireApproval) : prev.requireApproval,
    }));
  };

  return (
    <ProfileContext.Provider value={{
      // Profile
      profileImage, updateProfileImage, updateUserDataApi,
      userData, updateUserData,
      achievements, completeLesson, completeCourse,
      // Sistema de acesso
      systemRole, setSystemRole,
      // Cursos
      courses, setCourses, addCourse, updateCourse, deleteCourse,
      // Módulos
      modules, setModules, addModule, updateModule, deleteModule, addLesson, deleteLesson,
      // Menus
      menuItems, toggleMenuItemVisibility, reorderMenuItem,
      // Usuários
      users, updateUser, addUser,
      // Lojas
      stores: STORES,
      // Config
      platformConfig, updatePlatformConfig,
      // Comunicação
      conversations, sendMessage, markConvReadProf, markConvReadUser,
      announcements, addAnnouncement,
      // Certificados
      certTemplates, addCertTemplate, updateCertTemplate, deleteCertTemplate,
      issuedCerts, issueCertificate, revokeIssuedCert,
      // Perfis de instrutores
      instructorProfiles, updateInstructorProfile,
      // Reels
      shorts, addReel: addShort, deleteReel: deleteShort, addShort, deleteShort, shortsLoaded,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() { return useContext(ProfileContext); }
