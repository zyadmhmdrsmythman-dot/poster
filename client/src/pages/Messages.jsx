import { motion } from "framer-motion";
import { MessageSquare, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const navigate = useNavigate();
  const connections = useSelector((state) => state.connections?.connections || []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#0f172a] via-purple-900 to-black text-white pb-28 sm:pb-32">
      <div className="absolute inset-0">
        <div className="absolute w-150 h-150 bg-purple-500/20 rounded-full blur-3xl -top-40 -left-40 animate-pulse" />
        <div className="absolute w-100 h-100 bg-pink-500/20 rounded-full blur-3xl bottom-0 right-0 animate-pulse" />
      </div>

      <div className="relative mx-auto max-w-4xl p-3 sm:p-6">
        <div className="mb-6 text-center sm:mb-10 pt-2 sm:pt-0">
          <h1 className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-2xl font-extrabold text-transparent drop-shadow-lg sm:text-5xl">
            Messages
          </h1>
          <p className="mt-1 text-xs text-gray-300 sm:text-lg">
            Connect with your friends in a cosmic style 🚀
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-3 sm:gap-4"
        >
          {connections.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm sm:text-base">
              No conversations yet. Connect with users to start chatting!
            </p>
          ) : (
            connections.map((user, index) => (
              <motion.div
                key={user._id || index}
                whileHover={{ scale: 1.01 }}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4 shadow-lg backdrop-blur-xl transition hover:border-purple-400"
                onClick={() => navigate(`/messages/${user._id}`)}
              >
                <div className="flex min-w-0 items-center gap-3 sm:gap-4 flex-1">
                  <img
                    src={user.profile_picture || "/default-profile.png"}
                    alt={user.full_name || "User"}
                    className="rounded-full size-12 sm:size-14 border-2 border-purple-400 shadow-md object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm sm:text-base truncate">
                      {user.full_name}
                    </p>
                    <p className="text-purple-300 text-xs sm:text-sm truncate">@{user.username}</p>
                    <p className="text-gray-400 text-xs truncate max-w-xs">
                      {user.bio || "No bio available"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/messages/${user._id}`);
                    }}
                    className="rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30 p-2 sm:p-2.5 text-white shadow-md transition hover:bg-white/20 active:scale-95 cursor-pointer"
                    title="Open Chat"
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${user._id}`);
                    }}
                    className="rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30 p-2 sm:p-2.5 text-white shadow-md transition hover:bg-white/20 active:scale-95 cursor-pointer"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;
