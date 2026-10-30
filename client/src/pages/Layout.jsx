import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Loading from "../components/Loading";

const Layout = () => {
  const user = true;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return user ? (
    <div className="flex min-h-dvh w-full bg-[#0b0f3b] overflow-x-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="min-w-0 flex-1 sm:ml-20 w-full overflow-x-hidden">
        <Outlet />
      </main>
      <button
        type="button"
        aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={sidebarOpen}
        className="fixed left-3 top-2.5 z-50 grid h-10 w-10 place-items-center rounded-xl border border-purple-300/30 bg-[#111638]/95 text-white shadow-xl sm:hidden cursor-pointer active:scale-90 transition-transform"
        onClick={() => setSidebarOpen((open) => !open)}
      >
        {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </div>
  ) : (
    <Loading />
  );
};

export default Layout;
