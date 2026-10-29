import {Outlet} from 'react-router-dom';
import {Menu , X} from 'lucide-react';
import {useState} from 'react';
import Sidebar from '../components/Sidebar';
import Loading from '../components/Loading';

const Layout = () => {
  const user =true; // Replace with actual user authentication logic
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return user ? (
    <div className="flex min-h-screen w-full">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="min-w-0 flex-1 bg-slate-50 sm:ml-20">
        <Outlet />
      </main>
      <button
        type="button"
        aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={sidebarOpen}
        className="fixed right-3 top-2 z-50 grid h-10 w-10 place-items-center rounded-xl border border-purple-300/20 bg-[#111638]/95 text-white shadow-lg sm:hidden"
        onClick={() => setSidebarOpen((open) => !open)}
      >
        {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </div>

  ):(
    <Loading />
  )
};

export default Layout;
