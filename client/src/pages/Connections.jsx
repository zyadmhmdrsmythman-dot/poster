import { Users, MessageSquare, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { fetchConnections } from "../features/connections/connectionsSlice.js";
import { useDispatch, useSelector } from "react-redux";

const Connections = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("Followers");
  const {
    connections = [],
    pendingConnections = [],
    followers = [],
    following = [],
  } = useSelector((state) => state.connections || {});

  const { getToken, isLoaded, isSignedIn } = useAuth();
  const dispatch = useDispatch();

  const tabs = [
    {
      label: "Followers",
      value: followers,
      icon: Users,
      color: "from-purple-400 to-pink-500",
    },
    {
      label: "Following",
      value: following,
      icon: Users,
      color: "from-green-400 to-teal-500",
    },
    {
      label: "Pending",
      value: pendingConnections,
      icon: Users,
      color: "from-yellow-400 to-orange-500",
    },
    {
      label: "Connections",
      value: connections,
      icon: Users,
      color: "from-indigo-400 to-blue-500",
    },
  ];

  // جلب البيانات عند اكتمال تحميل Clerk
  useEffect(() => {
    const loadData = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            dispatch(fetchConnections(token));
          }
        } catch (error) {
          console.error("Failed to load connections:", error);
        }
      }
    };
    loadData();
  }, [dispatch, getToken, isLoaded, isSignedIn]);

  // إلغاء المتابعة
  const handleUnfollow = async (targetId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/unfollow",
        { id: targetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // قبول طلب التواصل
  const acceptConnection = async (targetId) => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/accept",
        { id: targetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const activeTabUsers = tabs.find((t) => t.label === currentTab)?.value || [];

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0f3b] via-[#3c1f7f] to-[#3c1f7f] py-6 text-white sm:py-10">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1           className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            🌟 Your Network
          </h1>
          <p className="text-gray-300 mt-2">
            Discover, connect, and grow your magical network
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex flex-wrap justify-center gap-2 sm:mb-10 sm:gap-4"
        >
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setCurrentTab(tab.label)}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all cursor-pointer sm:px-4 sm:text-sm ${
                currentTab === tab.label
                  ? `bg-linear-to-r ${tab.color} shadow-lg text-white`
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              <span className="ml-1 bg-white/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                {tab.value.length}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Users Grid */}
        {activeTabUsers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No users found in {currentTab}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTabUsers.map((user) => {
              if (!user) return null;
              const userId = user._id || user.id;

              return (
                <motion.div
                  key={userId}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 0 20px rgba(255,255,255,0.2)",
                  }}
                  className="flex flex-col justify-between rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-lg transition-all sm:p-6"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <img
                      src={user.profile_picture || "https://via.placeholder.com/150"}
                      className="w-20 h-20 rounded-full shadow-md object-cover border border-white/20"
                      alt={user.full_name || "User"}
                    />
                    <h2 className="font-semibold text-lg">{user.full_name}</h2>
                    {user.username && (
                      <p className="text-gray-300 text-sm">@{user.username}</p>
                    )}
                    {user.bio && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      onClick={() => navigate(`/profile/${userId}`)}
                      className="w-full py-2 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition text-white font-medium cursor-pointer"
                    >
                      View Profile
                    </button>

                    {currentTab === "Following" && (
                      <button
                        onClick={() => handleUnfollow(userId)}
                        className="w-full py-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 transition font-medium cursor-pointer"
                      >
                        Unfollow
                      </button>
                    )}

                    {currentTab === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptConnection(userId)}
                          className="flex-1 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition font-medium cursor-pointer shadow-md flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                      </div>
                    )}

                    {currentTab === "Connections" && (
                      <button
                        onClick={() => navigate(`/messages/${userId}`)}
                        className="w-full py-2 rounded-full bg-linear-to-r from-gray-400 to-teal-500 hover:from-gray-400 hover:to-teal-600 text-white transition font-medium flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;