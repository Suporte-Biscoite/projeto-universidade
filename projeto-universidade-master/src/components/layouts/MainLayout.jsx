import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar'; // Sobe um nível para sair de layouts e achar a Navbar
import Footer from '../Footer'; // Sobe um nível para sair de layouts e achar o Footer
import LiveFloatButton from '../LiveFloatButton';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-8 pb-20">
            <Outlet />
      </main>

      <LiveFloatButton />

      <Footer />
    </div>
  );
}