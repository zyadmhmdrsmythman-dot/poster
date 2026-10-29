import {
  Home,
  Search,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Users,
  CirclePlus,
  Layers,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { UserButton, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import api from "../api/axios.js";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const verifyAdminAccess = async () => {
      if (!user?.id) {
        setIsPlatformAdmin(false);
        return;
      }
      try {
        const token = await getToken();
        const { data } = await api.get("/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setIsPlatformAdmin(Boolean(data.success));
      } catch (error) {
        if (active) setIsPlatformAdmin(false);
        if (error.response?.status !== 403 && error.response?.status !== 503) {
          console.error("Failed to verify admin navigation access:", error);
        }
      }
    };
    const handleAdminRoleChange = () => verifyAdminAccess();
    window.addEventListener("platform-admin-changed", handleAdminRoleChange);
    verifyAdminAccess();
    return () => {
      active = false;
      window.removeEventListener("platform-admin-changed", handleAdminRoleChange);
    };
  }, [user?.id, getToken]);

  return (
    <>
      <div
        className={`fixed left-0 top-0 z-40 flex h-dvh w-64 flex-col items-stretch overflow-y-auto px-3 py-5
        bg-linear-to-b from-[#0b0f3b] via-[#1a1f4b] to-[#3c1f7f]
        backdrop-blur-xl shadow-[0_0_30px_rgba(131,58,100,0.6)] border-r border-purple-500/20
        transition-transform duration-300 sm:w-20 sm:items-center sm:px-0 sm:py-6
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="flex flex-1 flex-col gap-2 sm:flex-none sm:gap-6">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          >
            <Home
              size={24}
              className="text-indigo-400 hover:text-indigo-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">الرئيسية</span>
          </Link>
          <Link
            to="/search"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          >
            <Search
              size={24}
              className="text-pink-400 hover:text-pink-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">البحث</span>
          </Link>
          <Link
            to="/messages"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          >
            <MessageCircle
              size={24}
              className="text-yellow-400 hover:text-yellow-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">الرسائل</span>
          </Link>
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          >
            <User
              size={24}
              className="text-cyan-400 hover:text-cyan-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">الملف الشخصي</span>
          </Link>

          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          >
            <Settings
              size={24}
              className="text-purple-400 hover:text-purple-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">الإعدادات</span>
          </Link>
          <Link
            to="/connections"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.9)]"
          >
            <Users
              size={24}
              className="text-green-400 hover:text-green-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">الاتصالات</span>
          </Link>
          {/* زر البحث في المجموعات */}
          <Link
            to="/groups/available"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.9)]"
          >
            <Layers
              size={24}
              className="text-orange-400 hover:text-orange-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">المجموعات المتاحة</span>
          </Link>

          <Link
            to="/groups"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.9)]"
          >
            <UsersRound
              size={24}
              className="text-fuchsia-400 hover:text-fuchsia-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">إنشاء مجموعاتك</span>
          </Link>

          {/* زر مجموعاتي */}
          <Link
            to="/groups/joined"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2
            hover:scale-110 hover:shadow-[0_0_20px_rgba(0,255,255,0.9)]"
          >
            <Users
              size={24}
              className="text-teal-400 hover:text-teal-300 transition-all"
            />
            <span className="text-sm text-white sm:hidden">مجموعاتي</span>
          </Link>
          {isPlatformAdmin && (
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-4 rounded-xl p-3 transition-all duration-300 hover:bg-white/5 sm:justify-center sm:rounded-full sm:p-2"
            >
              <ShieldCheck size={24} className="text-rose-300" />
              <span className="text-sm text-white sm:hidden">لوحة الإدارة</span>
            </Link>
          )}
        </div>

        <Link
          to="/create-post"
          onClick={() => setSidebarOpen(false)}
          className="mx-auto mt-4 flex h-12 w-12 shrink-0 items-center justify-center py-2.5 sm:mt-8
          bg-linear-to-r from-indigo-500 to-purple-600 rounded-full
          hover:from-indigo-600 hover:to-purple-700
          active:scale-95 transition shadow-[0_0_20px_rgba(0,255,255,0.9)]"
        >
          <CirclePlus size={24} className="w-6 h-6 text-white" />
        </Link>

        {/* User Actions */}
        <div className="mt-4 flex shrink-0 items-center justify-center gap-6 pb-2 sm:mt-auto sm:flex-col sm:gap-4 sm:pb-0">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "w-10 h-10 rounded-full shadow-[0_0_20px_rgba(0,255,255,0.7)] border border-purple-400",
              },
            }}
          />
          <LogOut
            onClick={signOut}
            className="w-6 h-6 text-gray-300 hover:text-white transition cursor-pointer
            shadow-[0_0_15px_rgba(255,0,255,0.7)] hover:shadow-[0_0_20px_rgba(0,255,255,1)] rounded-full p-1"
          />
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;