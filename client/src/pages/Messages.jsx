import { motion } from "framer-motion";
import { MessageSquare, Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const navigate = useNavigate();
  const connections = useSelector((state) => state.connections?.connections || []);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-linear-to-br from-[#0f172a] via-purple-900 to-black text-white"
    >
      <div className="absolute inset-0">
        <div
          className="absolute w-150 h-150 bg-purple-500/20 rounded-full blur-3xl -top-40 -left-40
        animate-pulse"
        ></div>
        <div
          className="absolute w-100 h-100 bg-pink-500/20 rounded-full blur-3xl bottom-0 right-0
        animate-pulse"
        ></div>
      </div>

      <div className="relative mx-auto max-w-4xl p-3 sm:p-6">
        <div className="mb-8 text-center sm:mb-10">
          <h1
            className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-3xl font-extrabold text-transparent drop-shadow-lg sm:text-5xl"
          >
            Messages
          </h1>
          <p className="mt-2 text-sm text-gray-300 sm:text-lg">
            Connect with your frinds in a cosmic style 🚀
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4"
        >
          {connections.map((user, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-xl transition hover:border-purple-400 hover:shadow-purple-500/40 sm:gap-4 sm:p-5"
              onClick={() => navigate(`/messages/${user._id}`)}
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="rounded-full size-14 border-2 border-purple-400 shadow-md shadow-purple-500/40 "
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white text-lg">
                    {user.full_name}
                  </p>
                  <p className=" text-purple-300 text-sm">@{user.username}</p>
                  <p className=" text-gray-400 text-sm truncate max-w-55">
                    {user.bio || "No bio availabel"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-1.5 sm:gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/messages/${user._id}`);
                  }}
                  className="rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30 p-2 text-white shadow-md shadow-purple-500/30 transition hover:from-purple-500/30 hover:to-pink-500/30 sm:p-3"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${user._id}`);
                  }}
                  className="rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30 p-2 text-white shadow-md shadow-purple-500/30 transition hover:from-purple-500/30 hover:to-pink-500/30 sm:p-3"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;
