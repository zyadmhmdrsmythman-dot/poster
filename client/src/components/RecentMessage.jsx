import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import moment from "moment";
import { useAuth, useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../api/axios.js";

const RecentMessages = ({ viewStory, setViewStory }) => {
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchRecentMessages = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get("/api/user/recent-message", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        toast.error(data.message || "Failed to load recent messages");
        return;
      }

      const messageList = Array.isArray(data.messages) ? data.messages : [];
      const groupedMessages = messageList.reduce((acc, message) => {
        const sender = message?.from_user_id;
        const senderId = sender?._id ? String(sender._id) : "";

        if (!senderId) return acc;

        const existing = acc[senderId];
        if (!existing || new Date(message.createdAt) > new Date(existing.createdAt)) {
          acc[senderId] = message;
        }

        return acc;
      }, {});

      const sortedMessages = Object.values(groupedMessages).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setMessages(sortedMessages);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to load recent messages");
    }
  };

  useEffect(() => {
    if (!user) return;

    const handleMessageReceived = () => fetchRecentMessages();
    window.addEventListener("message-received", handleMessageReceived);
    fetchRecentMessages();
    const id = setInterval(fetchRecentMessages, 30000);
    return () => {
      clearInterval(id);
      window.removeEventListener("message-received", handleMessageReceived);
    };
  }, [user, getToken]);

  return (
    <motion.div
      className={`relative flex w-full flex-col text-sm
      ${viewStory ? "hidden" : "flex"} 
      bg-linear-to-b from-[#1a1f4d]/80 via-[#0f172a]/60 to-[#0b0f3b]/90
      backdrop-blur-xl rounded-3xl shadow-[0_0_25px_rgba(131,58,180,0.5)] 
      border border-purple-500/30 overflow-hidden`}
      initial={{ x: 200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      {/* Header */}
      <h1 className="font-bold text-white px-4 py-3 border-b
      border-purple-500/30 bg-purple-900/10 backdrop-blur-md">
        Messages
      </h1>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
        {messages.map((message, index) => {
          const sender = message?.from_user_id || {};
          const senderId = sender._id ? String(sender._id) : "";
          const senderName = sender.full_name || sender.username || "User";
          const senderAvatar = sender.profile_picture || "";

          return (
            <Link
              to={senderId ? `/messages/${senderId}` : "#"}
              key={`${senderId || index}-${index}`}
              className="flex items-center gap-3 px-4 py-5 hover:bg-purple-700/20 hover:shadow-[0_0_25px_rgba(131,58,180,0.5)] hover:rounded-3xl transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={senderAvatar}
                  alt={senderName}
                  className="w-10 h-10 rounded-full ring-2 ring-purple-500 shadow-[0_0_25px_rgba(131,58,180,0.5)]"
                />
                {!message.seen && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse ring-1 ring-green-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{senderName}</p>
                <p className="text-purple-300 text-xs truncate">
                  {message.text ? message.text : "Media"}
                </p>
              </div>

              <div className="flex flex-col items-end text-xs text-purple-400">
                <span>{moment(message.createdAt).fromNow(true)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RecentMessages;