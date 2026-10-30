import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Image, Bell } from "lucide-react";
import moment from "moment";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";

const TABS = [
  { key: "all", icon: Bell },
  { key: "like", icon: Heart },
  { key: "comment", icon: MessageCircle },
  { key: "media", icon: Image },
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const { data } = await api.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const safeNotifications = (data.notifications || []).map((n) => ({
          ...n,
          type: n.type?.trim().toLowerCase() || "unknown",
          from_user: n.from_user || {
            profile_picture: "/default.png",
            full_name: "User",
          },
          _id: n._id || Math.random().toString(36).substring(2, 9),
        }));
        setNotifications(safeNotifications);
      } else {
        toast.error(data.message || "Failed to fetch notifications");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchNotifications();
    }
  }, [isLoaded, isSignedIn]);

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white p-3 sm:p-4 pb-28 sm:pb-32 relative">
      {/* Header */}
      <div className="max-w-2xl mx-auto sticky top-2 z-20 backdrop-blur-lg bg-[#182034]/90 rounded-2xl p-3 pl-14 sm:pl-4 flex items-center gap-3 shadow-lg border border-purple-500/30 mb-6">
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
        <h1 className="text-lg sm:text-xl font-bold">Notifications</h1>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <motion.div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer p-2.5 sm:p-3 rounded-xl backdrop-blur-lg bg-[#182034]/40 border flex items-center justify-center transition-colors ${
                isActive
                  ? "border-purple-500 bg-[#182034]/80 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "border-purple-500/20 hover:border-purple-500/40"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  isActive ? "text-purple-400" : "text-gray-400"
                }`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto pb-10">
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No notifications found.</p>
        ) : (
          <AnimatePresence>
            {filtered.map((n) => {
              const user = n.from_user;
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl backdrop-blur-lg bg-[#102034]/50 border border-purple-500/20 shadow-md hover:border-purple-500/40 transition-all"
                >
                  <img
                    src={user.profile_picture || "/default-profile.png"}
                    alt={user.full_name || "User"}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-purple-400/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold text-purple-200">
                        {user.full_name || "User"}
                      </span>{" "}
                      <span className="text-gray-300">
                        {n.message || "performed an action"}
                      </span>
                    </p>
                    <span className="text-xs text-purple-400/80 mt-1 block">
                      {moment(n.createdAt).fromNow()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
