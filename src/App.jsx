import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import InactivityGuard from './components/InactivityGuard';

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
          <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center space-y-5 shadow-sm border border-slate-100">
            <div className="text-5xl">⚠️</div>
            <h1 className="text-xl font-black text-[#001A26]">Algo deu errado</h1>
            <p className="text-slate-400 text-sm">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#001A26] text-white rounded-xl font-bold text-sm hover:bg-[#4A72B2] transition-colors"
              >
                Recarregar
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Ir para Home
              </button>
            </div>
            {import.meta.env.DEV && (
              <details className="text-left mt-4">
                <summary className="text-xs text-slate-400 cursor-pointer font-bold">Detalhes do erro</summary>
                <pre className="text-[10px] text-red-500 mt-2 bg-red-50 p-3 rounded-xl overflow-auto max-h-40">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const Favoritos        = lazy(() => import('./pages/Favoritos'));
const Mensagens        = lazy(() => import('./pages/Mensagens'));
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
            <Route path="favoritos"       element={<Favoritos />} />
            <Route path="mensagens"       element={<Mensagens />} />
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
      <ErrorBoundary>
        <InactivityGuard timeoutMinutes={15}>
          <AppRoutes />
        </InactivityGuard>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
