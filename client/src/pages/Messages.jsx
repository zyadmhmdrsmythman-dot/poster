import { motion } from "framer-motion";
import { MessageSquare, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import {connection} from "mongoose"

const Messages = () => {
  const navigate = useNavigate();
  const Connections = [];
  return (
    <div
      className="min-h-screen relative bg-linear-to-br from-[#0f172a] via-purple-900
     to-black text-white overflow-hidden"
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

      <div className="relative max-w-4xl mx-auto p-6">
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-extrabold bg-linear-to-r from-purple-400 to-pink-400
          bg-clip-text text-transparent drop-shadow-lg"
          >
            Messages
          </h1>
          <p className="text-gray-300 mt-2 text-lg">
            Connect with your frinds in a cosmic style 🚀
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-4"
        >
          {Connections.map((user, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex items-center justify-between gap-4 p-5 rounded-xl bg-white/10 backdrop-blur-xl
            border border-white/20 shadow-lg hover:shadow-purple-500/40 hover:border-purple-400
            transition cursor-pointer"
              onClick={() => navigate(`/messages/${user._id}`)}
            >
              <div className="flex items-center gap-4">
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="rounded-full size-14 border-2 border-purple-400 shadow-md shadow-purple-500/40 "
                />
                <div>
                  <p className="font-semibold text-white text-lg">
                    {user.full_name}
                  </p>
                  <p className=" text-purple-300 text-sm">@{user.username}</p>
                  <p className=" text-gray-400 text-sm truncate max-w-55">
                    {user.bio || "No bio availabel"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/messages/${user._id}`);
                  }}
                  className="p-3 rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30
                hover:from-purple-500/30 hover:to-pink-500/30 text-white shadow-md shadow-purple-500/30
                transition"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${user._id}`);
                  }}
                  className="p-3 rounded-full bg-linear-to-r from-purple-500/30 to-pink-500/30
                hover:from-purple-500/30 hover:to-pink-500/30 text-white shadow-md shadow-purple-500/30
                transition"
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
