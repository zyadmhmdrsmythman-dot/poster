import { useEffect, useRef, useState } from "react";
import { ImageIcon, SendHorizonal } from "lucide-react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  addMessages,
  resetMessages,
  fetchMessages,
} from "../features/messages/messsagesSlice.js";

const Chat = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);
  const connections = useSelector((state) => state.connections?.connections || []);
  const currentUser = useSelector((state) => state.user?.value);
  const currentUserId = currentUser?._id ? String(currentUser._id) : null;
  const dispatch = useDispatch();
  const { messages } = useSelector((state) => state.messages || { messages: [] });
  const { userId } = useParams();
  const { getToken } = useAuth();
  const messagesEndRef = useRef(null);

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/profiles",
        { profileId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setUser({
          ...(data.profile || {}),
          blockedUsers: data.profile?.blockedUsers || [],
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load user data"
      );
    }
  };

  const fetchUserMessages = async () => {
    if (!userId) return;

    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load messages"
      );
    }
  };

  const sendMessage = async () => {
    try {
      if (!user || !currentUserId || !userId) return;

      if (user.blockedUsers?.some((id) => String(id) === currentUserId)) {
        toast.error("هذا المستخدم قام بحظرك");
        return;
      }

      if (!text.trim() && !image) return;

      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text.trim());
      if (image) formData.append("image", image);

      const { data } = await api.post("/api/message/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setText("");
        setImage(null);
        dispatch(addMessages(data.message));
      } else {
        throw new Error(data.message || "Failed to send message");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to send message"
      );
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchUserMessages();
    return () => dispatch(resetMessages());
  }, [userId, getToken, dispatch]);

  useEffect(() => {
    if (connections.length > 0 && userId) {
      const matchedUser = connections.find(
        (connection) => String(connection._id) === String(userId)
      );

      if (matchedUser) {
        setUser((prev) => ({
          ...(prev || {}),
          ...matchedUser,
          blockedUsers: prev?.blockedUsers || matchedUser.blockedUsers || [],
        }));
      }
    }
  }, [connections, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user || !currentUserId) return null;

  const isBlockedByUser = user.blockedUsers?.some(
    (id) => String(id) === currentUserId
  );

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] min-h-[420px] flex-col overflow-hidden bg-linear-to-br from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white sm:h-screen">
      <div className="z-10 flex items-center gap-3 border-b border-purple-500/30 bg-white/5 p-3 shadow-[0_0_15px_rgba(131,58,180,0.3)] backdrop-blur-lg sm:px-6 md:px-10">
        <img
          src={user.profile_picture || ""}
          alt={user.full_name || "User"}
          className="w-12 h-12 rounded-full border border-purple-300 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
        />
        <div>
          <p className="font-bold text-purple-200">{user.full_name}</p>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>
      </div>

      <div className="flex-1 p-4 md:px-10 overflow-y-scroll relative">
        {isBlockedByUser ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="bg-linear-to-br from-purple-600/50 via-pink-600/40 to-indigo-500/40 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-purple-400/50"
            >
              <p className="text-2xl font-bold text-white mb-4">
                😣 لقد قام المستخدم بحظرك
              </p>
              <p className="text-purple-200 text-lg">
                للأسف لا يمكنك مراسلته , ربما في المستقبل سيكون هناك فرصة
                للتواصل 💔😶‍🌫️
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4 max-w-full mx-auto">
            {messages
              .toSorted((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((message, index) => {
                const isCurrentUser =
                  String(message.from_user_id) === currentUserId;
                const sender = isCurrentUser
                  ? null
                  : connections.find(
                      (connection) =>
                        String(connection._id) === String(message.from_user_id)
                    );

                return (
                  <motion.div
                    key={`${message.id || message._id || index}-${index}`}
                    initial={{ opacity: 0, x: isCurrentUser ? 100 : -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                    }}
                    className={`flex items-start gap-2 ${
                      isCurrentUser
                        ? "justify-end"
                        : "justify-start ml-2 sm:ml-8 md:ml-16"
                    }`}
                  >
                    {!isCurrentUser && sender && (
                      <div className="flex flex-col items-center">
                        <img
                          src={sender.profile_picture || ""}
                          alt={sender.full_name || "User"}
                          className="w-8 h-8 rounded-full border border-purple-500 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                        />
                      </div>
                    )}

                    <div
                      className={`p-3 text-sm max-w-sm rounded-xl shadow-lg transition-all duration-300 ${
                        isCurrentUser
                          ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-br-none"
                          : "bg-white/10 backdrop-blur-lg rounded-bl-none border border-purple-500/30"
                      }`}
                    >
                      {message.message_type === "image" && message.media_url && (
                        <img
                          src={message.media_url}
                          alt="Message attachment"
                          className="w-full max-w-sm rounded-xl mb-1 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                        />
                      )}
                      {message.text && <p>{message.text}</p>}
                    </div>

                    {isCurrentUser && (
                      <div className="flex flex-col items-center">
                        <img
                          src={currentUser?.profile_picture || ""}
                          alt={currentUser?.full_name || "User"}
                          className="w-8 h-8 rounded-full border border-indigo-400 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {!isBlockedByUser && (
        <div className="px-2 pb-3 sm:px-4 sm:pb-4">
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-purple-500/30 bg-white/10 px-3 py-2 shadow-[0_0_15px_rgba(131,58,180,0.4)] backdrop-blur-lg sm:gap-3 sm:rounded-full sm:px-5">
            <input
              type="text"
              className="flex-1 outline-none text-white bg-transparent placeholder-gray-400"
              placeholder="Type a message..."
              onKeyDown={(event) => event.key === "Enter" && sendMessage()}
              onChange={(event) => setText(event.target.value)}
              value={text}
            />
            <label htmlFor="image" className="cursor-pointer">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Upload preview"
                  className="h-8 w-8 object-cover rounded-xl border border-purple-400 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                />
              ) : (
                <ImageIcon className="w-7 h-7 text-purple-300 hover:text-purple-200 transition-colors" />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                hidden
                onChange={(event) => {
                  if (event.target.files?.[0]) setImage(event.target.files[0]);
                }}
              />
            </label>
            <button
              onClick={sendMessage}
              className="bg-linear-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full shadow-[0_0_15px_rgba(255,0,255,0.6)] hover:shadow-[0_0_25px_rgba(255,0,255,0.8)] transition-all"
            >
              <SendHorizonal size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;