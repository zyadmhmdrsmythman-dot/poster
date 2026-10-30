import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Palette, Bell, ShieldAlert } from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: <User className="w-4 h-4" /> },
  { id: "privacy", label: "Privacy", icon: <Lock className="w-4 h-4" /> },
  {
    id: "appearance",
    label: "Appearance",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-4 h-4" />,
  },
  {
    id: "danger",
    label: "Danger Zone",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black text-white p-3 sm:p-8 pb-28 sm:pb-32">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-center bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent pt-2 sm:pt-0">
          ⚡ Settings
        </h1>
        <p className="text-gray-400 text-center text-xs sm:text-sm mt-1 sm:mt-2">
          Customize your experience, privacy, and preferences
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-2 sm:gap-4 mt-6 sm:mt-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition-all backdrop-blur-md border cursor-pointer ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white border-purple-400 shadow-lg scale-105"
                  : "bg-white/10 text-gray-300 hover:bg-white/20 border-white/20"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="mt-6 sm:mt-10">
          <AnimatePresence mode="wait">
            {activeTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-xl sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-bold mb-4">General Settings</h2>
                <div className="space-y-4 text-sm">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                  <textarea
                    rows={3}
                    placeholder="Short Bio"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              </motion.div>
            )}
            {activeTab === "privacy" && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
              >
                <h2 className="text-lg sm:text-xl font-bold mb-4">Privacy Settings</h2>
                <p className="text-gray-300 text-xs sm:text-sm">Manage who can see your profile and posts.</p>
              </motion.div>
            )}
            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
              >
                <h2 className="text-lg sm:text-xl font-bold mb-4">Theme</h2>
                <div className="flex flex-wrap justify-around gap-2 sm:gap-3 text-xs sm:text-sm">
                  <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10">
                    🌙 Dark
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10">
                    ☀️ Light
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10">
                    ✨ Fantasy
                  </button>
                </div>
              </motion.div>
            )}
            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
              >
                <h2 className="text-lg sm:text-xl font-bold mb-4">Notifications</h2>
                <div className="space-y-3 text-xs sm:text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-purple-600" />
                    Email Notifications
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-purple-600" />
                    Push Notifications
                  </label>
                </div>
              </motion.div>
            )}
            {activeTab === "danger" && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-red-500/30 shadow-xl"
              >
                <h2 className="text-lg sm:text-xl font-bold mb-3 text-red-400">
                  Danger Zone
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-xs sm:text-sm font-semibold rounded-xl shadow-lg transition cursor-pointer">
                  Delete Account
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
