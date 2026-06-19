import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import InactivityGuard from './components/InactivityGuard';

// ─── Lazy loading de todas as páginas ────────────────────────────────────────
const Login            = lazy(() => import('./pages/Login'));
const Register         = lazy(() => import('./pages/Register'));
const ForgotPassword   = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword    = lazy(() => import('./pages/ResetPassword'));
const MainLayout       = lazy(() => import('./components/layouts/MainLayout'));
const Home             = lazy(() => import('./pages/Home'));
const Courses          = lazy(() => import('./pages/Courses'));
const CoursePlayer     = lazy(() => import('./pages/CoursePlayer'));
const LiveChat         = lazy(() => import('./pages/LiveChat'));
const Profile          = lazy(() => import('./pages/Profile'));
const Certificates     = lazy(() => import('./pages/Certificates'));
const Settings         = lazy(() => import('./pages/Settings'));
const InstructorProfile = lazy(() => import('./pages/InstructorProfile'));
const ProfessorDashboard = lazy(() => import('./pages/ProfessorDashboard'));
const GestorDashboard  = lazy(() => import('./pages/GestorDashboard'));
const LojaDashboard    = lazy(() => import('./pages/LojaDashboard'));
const AdminPanel       = lazy(() => import('./pages/AdminPanel'));

// ─── Loading screen ───────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-[#e2eef9]" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#4A72B2] animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-400">Carregando...</p>
      </div>
    </div>
  );
}

// ─── Route transition loading bar ─────────────────────────────────────────────
function RouteLoadingBar() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(20);
    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(90), 300);
    const t3 = setTimeout(() => { setProgress(100); }, 500);
    const t4 = setTimeout(() => { setLoading(false); setProgress(0); }, 700);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className="h-full bg-[#4A72B2] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function PlaceholderPage({ title, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-6xl">{emoji}</div>
      <h1 className="text-3xl font-black text-[#001A26]">{title}</h1>
      <p className="text-slate-400 text-sm">Página em desenvolvimento</p>
    </div>
  );
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getLoggedUser() {
  try {
    const raw = sessionStorage.getItem('biscoite_logged_user')
             || localStorage.getItem('biscoite_logged_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isAuthenticated() {
  return (
    sessionStorage.getItem('biscoite_auth') === '1' ||
    localStorage.getItem('biscoite_auth')   === '1'
  );
}

// ─── Rota protegida ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles) {
    const user = getLoggedUser();
    if (!user || !roles.includes(user.systemRole || user.role)) {
      return <Navigate to="/" replace />;
    }
  }
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <RouteLoadingBar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Públicas */}
          <Route path="/login"            element={<Login />} />
          <Route path="/registrar"        element={<Register />} />
          <Route path="/recuperar-senha"  element={<ForgotPassword />} />
          <Route path="/redefinir-senha"  element={<ResetPassword />} />

          {/* Protegidas com layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index                  element={<Home />} />
            <Route path="live"            element={<LiveChat />} />
            <Route path="courses"         element={<Courses />} />
            <Route path="player"          element={<CoursePlayer />} />
            <Route path="profile"         element={<Profile />} />
            <Route path="certificados"    element={<Certificates />} />
            <Route path="favoritos"       element={<PlaceholderPage title="Meus Favoritos" emoji="❤️" />} />
            <Route path="carreira"        element={<PlaceholderPage title="Minha Carreira" emoji="🚀" />} />
            <Route path="configuracoes"   element={<Settings />} />
            <Route path="instructor/:instructorId" element={<InstructorProfile />} />
          </Route>

          {/* Dashboards */}
          <Route path="/professor" element={
            <ProtectedRoute roles={['professor','admin']}>
              <ProfessorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/gestor" element={
            <ProtectedRoute roles={['gestor','admin']}>
              <GestorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <InactivityGuard timeoutMinutes={15}>
        <AppRoutes />
      </InactivityGuard>
    </BrowserRouter>
  );
}
