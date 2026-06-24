import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import LiveFloatButton from '../LiveFloatButton';
import MessageFloatButton from '../MessageFloatButton';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-8 pb-20">
        <Outlet />
      </main>
      <LiveFloatButton />
      <MessageFloatButton />
      <Footer />
    </div>
  );
}
