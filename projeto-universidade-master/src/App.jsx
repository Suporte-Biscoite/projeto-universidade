import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import MainLayout from './components/layouts/MainLayout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CoursePlayer from './pages/CoursePlayer';
import LiveChat from './pages/LiveChat';
import LiveFloatButton from './components/LiveFloatButton';
import Profile from './pages/Profile';
import Certificates from './pages/Certificates';
import ProfessorDashboard from './pages/ProfessorDashboard';
import GestorDashboard from './pages/GestorDashboard';
import LojaDashboard from './pages/LojaDashboard';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import InactivityGuard from './components/InactivityGuard';
import InstructorProfile from './pages/InstructorProfile';

function PlaceholderPage({ title, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-6xl">{emoji}</div>
      <h1 className="text-3xl font-black text-[#001A26]">{title}</h1>
      <p className="text-slate-400 text-sm">Página em desenvolvimento</p>
    </div>
  );
}

// ─── Helpers de autenticação e autorização ───────────────────────────────────
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

// ─── Protege rotas — redireciona para /login se não autenticado ───────────────
function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Se a rota exige roles específicos, verifica
  if (roles) {
    const user = getLoggedUser();
    if (!user || !roles.includes(user.systemRole)) {
      return <Navigate to="/" replace />;
    }
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <InactivityGuard timeoutMinutes={15}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login"     element={<Login />} />
          <Route path="/registrar" element={<Register />} />

          {/* Rota raiz: redireciona para login se não autenticado */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="live"        element={<LiveChat />} />
            <Route path="courses"     element={<Courses />} />
            <Route path="player"      element={<CoursePlayer />} />
            <Route path="profile"     element={<Profile />} />
            <Route path="certificados" element={<Certificates />} />
            <Route path="favoritos"   element={<PlaceholderPage title="Meus Favoritos" emoji="❤️" />} />
            <Route path="carreira"    element={<PlaceholderPage title="Minha Carreira" emoji="🚀" />} />
            <Route path="configuracoes" element={<Settings />} />
            <Route path="instructor/:instructorId" element={<InstructorProfile />} />
          </Route>

          {/* Dashboards protegidos */}
          <Route path="/professor"  element={<ProtectedRoute roles={["professor","admin"]}><ProfessorDashboard /></ProtectedRoute>} />
          <Route path="/gestor"     element={<ProtectedRoute roles={["gestor","admin"]}><GestorDashboard /></ProtectedRoute>} />
          <Route path="/franqueado" element={<ProtectedRoute roles={["franqueado","admin"]}><GestorDashboard /></ProtectedRoute>} />
          <Route path="/loja"       element={<ProtectedRoute roles={["loja","admin"]}><LojaDashboard /></ProtectedRoute>} />
          <Route path="/admin"      element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />

          {/* Qualquer rota desconhecida vai para login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </InactivityGuard>
    </BrowserRouter>
  );
}

export default App;
