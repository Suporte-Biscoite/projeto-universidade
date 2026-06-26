import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';
import LiveFloatButton from '../LiveFloatButton';
import MessageFloatButton from '../MessageFloatButton';

export default function MainLayout() {
  const [chatOpen, setChatOpen] = useState(false);
  const [navOpen, setNavOpen]   = useState(false);

  const openChat = () => { setChatOpen(true);  setNavOpen(false); };
  const openNav  = () => { setNavOpen(true);   setChatOpen(false); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Navbar externalOpen={navOpen} onOpenChange={(v) => { setNavOpen(v); if (v) setChatOpen(false); }} />
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-8 pb-20">
        <Outlet />
      </main>
      <LiveFloatButton />
      <MessageFloatButton externalOpen={chatOpen} onOpenChange={(v) => { setChatOpen(v); if (v) setNavOpen(false); }} />
      <Footer />
    </div>
  );
}
