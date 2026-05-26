import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

// Simple placeholder pages for new routes
function PlaceholderPage({ title, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="text-6xl">{emoji}</div>
      <h1 className="text-3xl font-black text-[#001A26]">{title}</h1>
      <p className="text-slate-400 text-sm">Página em desenvolvimento</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <InactivityGuard timeoutMinutes={15}>
      <Routes>
        <Route path="/registrar" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/professor" element={<ProfessorDashboard />} />
        <Route path="/gestor" element={<GestorDashboard />} />
        <Route path="/franqueado" element={<GestorDashboard />} />
        <Route path="/loja" element={<LojaDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="live" element={<LiveChat />} />
          <Route path="courses" element={<Courses />} />
          <Route path="player" element={<CoursePlayer />} />
          <Route path="profile" element={<Profile />} />
          <Route path="certificados" element={<Certificates />} />
          <Route path="favoritos" element={<PlaceholderPage title="Meus Favoritos" emoji="❤️" />} />
          <Route path="carreira" element={<PlaceholderPage title="Minha Carreira" emoji="🚀" />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="instructor/:instructorId" element={<InstructorProfile />} />
        </Route>
      </Routes>
      </InactivityGuard>
    </BrowserRouter>
  );
}

export default App;