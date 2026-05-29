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
export const CURRENT_INSTRUCTOR_ID = 'prof_karla';
export const CURRENT_USER_ID = 3;

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
const INITIAL_REELS = [];

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
  { id: 'carreira',      label: 'Carreira (Beta)',        path: '/carreira',       group: 'dropdown', visible: true, order: 5 },
  { id: 'live',          label: 'Live',            path: '/live',           group: 'dropdown', visible: true, order: 6 },
  { id: 'configuracoes', label: 'Configurações',   path: '/configuracoes',  group: 'dropdown', visible: true, order: 7 },
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
      if (logged?.avatar_url) return logged.avatar_url;
    } catch {}
    return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200';
  });

  const [userData, setUserData] = useState(() => {
    // Lê dados do usuário logado salvos no login
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged) {
        return {
          name: logged.name || 'Usuário',
          unit: logged.unit || '',
          role: logged.role || 'aluno',
          time: '',
          avatar_url: logged.avatar_url || null,
          certificates: INITIAL_CERTIFICATES,
          education: [],
          experience: [],
        };
      }
    } catch {}
    return {
      name: 'Usuário',
      unit: '',
      role: 'aluno',
      time: '',
      avatar_url: null,
      certificates: INITIAL_CERTIFICATES,
      education: [],
      experience: [],
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
  const [systemRole, setSystemRoleState] = useState(
    () => loadFromStorage('biscoite_system_role', 'admin')
  );

  // ── Courses ───────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState(
    () => loadFromStorage('biscoite_courses', INITIAL_COURSES)
  );

  // ── Modules ───────────────────────────────────────────────────────────────
  const [modules, setModules] = useState(
    () => loadFromStorage('biscoite_modules', INITIAL_MODULES)
  );

  // ── Menu items ────────────────────────────────────────────────────────────
  const [menuItems, setMenuItems] = useState(() => loadMenuItems());

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState(
    () => loadFromStorage('biscoite_users', INITIAL_USERS)
  );

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
  const [reels, setReels] = useState(
    () => loadFromStorage('biscoite_reels', INITIAL_REELS)
  );

  // ── Persistência no localStorage ──────────────────────────────────────────
  useEffect(() => { try { localStorage.setItem('biscoite_system_role', JSON.stringify(systemRole)); } catch {} }, [systemRole]);
  useEffect(() => { try { localStorage.setItem('biscoite_courses', JSON.stringify(courses)); } catch {} }, [courses]);
  useEffect(() => { try { localStorage.setItem('biscoite_modules', JSON.stringify(modules)); } catch {} }, [modules]);
  useEffect(() => { try { localStorage.setItem('biscoite_menu_items', JSON.stringify(menuItems)); } catch {} }, [menuItems]);
  useEffect(() => { try { localStorage.setItem('biscoite_users', JSON.stringify(users)); } catch {} }, [users]);
  useEffect(() => { try { localStorage.setItem('biscoite_config', JSON.stringify(platformConfig)); } catch {} }, [platformConfig]);
  useEffect(() => { try { localStorage.setItem('biscoite_conversations', JSON.stringify(conversations)); } catch {} }, [conversations]);
  useEffect(() => { try { localStorage.setItem('biscoite_announcements', JSON.stringify(announcements)); } catch {} }, [announcements]);
  useEffect(() => { try { localStorage.setItem('biscoite_cert_templates', JSON.stringify(certTemplates)); } catch {} }, [certTemplates]);
  useEffect(() => { try { localStorage.setItem('biscoite_issued_certs', JSON.stringify(issuedCerts)); } catch {} }, [issuedCerts]);
  useEffect(() => { try { localStorage.setItem('biscoite_instructor_profiles', JSON.stringify(instructorProfiles)); } catch {} }, [instructorProfiles]);
  useEffect(() => { try { localStorage.setItem('biscoite_reels', JSON.stringify(reels)); } catch {} }, [reels]);

  // ── Funções de profile ────────────────────────────────────────────────────
  const updateProfileImage = async (newImage) => {
    // Rejeita blob: URLs — não persistem entre sessões
    if (newImage && newImage.startsWith('blob:')) {
      console.warn('updateProfileImage: blob URL rejeitada, use base64');
      return;
    }
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
    setUserData(prev => ({ ...prev, ...newData }));
    try {
      const raw = sessionStorage.getItem('biscoite_logged_user')
               || localStorage.getItem('biscoite_logged_user');
      const logged = raw ? JSON.parse(raw) : null;
      if (logged?.id) {
        const token = sessionStorage.getItem('biscoite_access_token')
                   || localStorage.getItem('biscoite_access_token');
        const res = await authFetch(`/api/users?id=${logged.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name:     newData.name,
            unit:     newData.unit,
            password: newData.password || undefined,
          }),
        });
        const updated_user = await res.json();
        if (res.ok) {
          const updatedLogged = { ...logged, ...updated_user };
          if (sessionStorage.getItem('biscoite_logged_user')) sessionStorage.setItem('biscoite_logged_user', JSON.stringify(updatedLogged));
          if (localStorage.getItem('biscoite_logged_user'))   localStorage.setItem('biscoite_logged_user', JSON.stringify(updatedLogged));
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

  const addCourse = (data) => {
    const newCourse = {
      id: Date.now(),
      title: sanitizeText(data.title, 100),
      description: sanitizeText(data.description, 500),
      category: data.category || 'Operações',
      level: data.level || 'Iniciante',
      format: data.format || 'Vídeo',
      duration: sanitizeText(data.duration, 20),
      instructor: sanitizeText(data.instructor, 60),
      instructorId: systemRole === 'admin' ? (data.instructorId || CURRENT_INSTRUCTOR_ID) : CURRENT_INSTRUCTOR_ID,
      published: Boolean(data.published),
      thumbnail: data.thumbnail || null,
      videoUrl: data.videoUrl || '',
      videoType: data.videoType || null,
    };
    setCourses(prev => [...prev, newCourse]);
    return newCourse.id;
  };

  const updateCourse = (id, data) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (systemRole === 'professor' && c.instructorId !== CURRENT_INSTRUCTOR_ID) return c;
      return {
        ...c,
        title:       data.title !== undefined       ? sanitizeText(data.title, 100) : c.title,
        description: data.description !== undefined ? sanitizeText(data.description, 500) : c.description,
        category:    data.category  || c.category,
        level:       data.level     || c.level,
        format:      data.format    || c.format,
        duration:    data.duration !== undefined    ? sanitizeText(data.duration, 20) : c.duration,
        instructor:  data.instructor !== undefined  ? sanitizeText(data.instructor, 60) : c.instructor,
        published:   data.published !== undefined   ? Boolean(data.published) : c.published,
        thumbnail:   data.thumbnail !== undefined   ? data.thumbnail : c.thumbnail,
        videoUrl:    data.videoUrl !== undefined    ? data.videoUrl  : c.videoUrl,
        videoType:   data.videoType !== undefined   ? data.videoType : c.videoType,
      };
    }));
  };

  const deleteCourse = (id) => {
    // TODO (backend): verificar propriedade no servidor
    const course = courses.find(c => c.id === id);
    if (!course) return;
    if (systemRole === 'professor' && course.instructorId !== CURRENT_INSTRUCTOR_ID) return;
    setCourses(prev => prev.filter(c => c.id !== id));
    setModules(prev => prev.filter(m => m.courseId !== id));
  };

  // ── Funções de modules ────────────────────────────────────────────────────
  const addModule = (courseId, title) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    if (systemRole === 'professor' && course.instructorId !== CURRENT_INSTRUCTOR_ID) return;
    const courseModules = modules.filter(m => m.courseId === courseId);
    const newModule = {
      id: Date.now(),
      courseId,
      title: sanitizeText(title, 100),
      order: courseModules.length + 1,
      lessons: [],
    };
    setModules(prev => [...prev, newModule]);
    return newModule.id;
  };

  const updateModule = (id, title) => {
    setModules(prev => prev.map(m =>
      m.id === id ? { ...m, title: sanitizeText(title, 100) } : m
    ));
  };

  const deleteModule = (id) => {
    setModules(prev => prev.filter(m => m.id !== id));
  };

  const addLesson = (moduleId, lessonData) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        lessons: [...m.lessons, {
          id: Date.now(),
          title: sanitizeText(lessonData.title, 100),
          duration: sanitizeText(lessonData.duration, 20),
          type: lessonData.type || 'video',
        }],
      };
    }));
  };

  const deleteLesson = (moduleId, lessonId) => {
    setModules(prev => prev.map(m => {
      if (m.id !== moduleId) return m;
      return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
    }));
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
      instructorId: CURRENT_INSTRUCTOR_ID,
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

  // ── Funções de reels ──────────────────────────────────────────────────────
  const addReel = (data) => {
    const profile = instructorProfiles[CURRENT_INSTRUCTOR_ID] || {};
    const newReel = {
      id: Date.now(),
      instructorId: CURRENT_INSTRUCTOR_ID,
      caption:   sanitizeText(data.caption, 200),
      tag:       sanitizeText(data.tag, 30),
      instructor: profile.name || 'Instrutor',
      avatar:    profile.avatar || '',
      views:     '0',
      time:      'agora',
      thumbnail: data.thumbnail || null,
      videoUrl:  data.videoUrl  || '',
      videoType: data.videoType || null,
    };
    setReels(prev => [newReel, ...prev]);
    return newReel.id;
  };

  const deleteReel = (id) => {
    setReels(prev => prev.filter(r => r.id !== id));
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
      courses, addCourse, updateCourse, deleteCourse,
      // Módulos
      modules, addModule, updateModule, deleteModule, addLesson, deleteLesson,
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
      reels, addReel, deleteReel,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() { return useContext(ProfileContext); }
