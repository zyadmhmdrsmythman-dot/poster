import { useRef, useState } from "react";
import { ImageIcon, SendHorizonal } from "lucide-react";
import { motion } from "framer-motion";

const currentUser = {
  _id: "1",
  username: "myuser",
  full_name: "My Name",
  profile_picture: "https://i.pravatar.cc/407?img=1",
};

const user = {
  _id: "2",
  username: "friend",
  full_name: "Friend Name",
  profile_picture: "https://i.pravatar.cc/407?img=2",
};

const connections = [user];

const initialMessages = [
  {
    id: "m1",
    from_user_id: "2",
    text: "مرحبا!",
    message_type: "text",
    createdAt: "2026-09-13T10:00:00Z",
  },
  {
    id: "m2",
    from_user_id: "1",
    text: "اهلا👋",
    message_type: "text",
    createdAt: "2026-09-13T10:01:00Z",
  },
  {
    id: "m3",
    from_user_id: "2",
    text: "كيف حالك ؟",
    message_type: "text",
    createdAt: "2026-09-13T10:02:00Z",
  },
];

const Chat = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [localMessages, setLocalMessages] = useState(initialMessages);
  const messageEndRef = useRef(null);
  const isBlockedByUser = true;

  const sendMessage = () => {
    if (!text.trim() && !image) return;

    const newMessage = {
      id: Date.now().toString(),
      from_user_id: currentUser._id,
      text: text.trim(),
      message_type: image ? "image" : "text",
      media_url: image ? URL.createObjectURL(image) : null,
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, newMessage]);
    setText("");
    setImage(null);

    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white overflow-hidden relative">
      {/* Header */}
      <div className="flex ml-16 items-center gap-3 p-3 md:px-10 bg-white/5 backdrop-blur-lg border-b border-purple-500/30 shadow-[0_0_15px_rgba(131,58,180,0.3)] z-10">
        <img
          src={user.profile_picture || ""}
          alt={user.full_name}
          className="w-12 h-12 rounded-full border border-purple-300 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
        />
        <div>
          <p className="font-bold text-purple-200">{user.full_name}</p>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>
      </div>

      {/* Messages */}
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
                للأسف لا يمكنك مراسلته , ربما في المستقبل سيكون هناك فرصة للتواصل
                💔😶‍🌫️
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4 max-w-full mx-auto">
            {localMessages
              .toSorted(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
              )
              .map((message, index) => {
                const isCurrentUser =
                  message.from_user_id === currentUser._id;
                const sender = isCurrentUser
                  ? null
                  : connections.find((c) => c._id === message.from_user_id);

                return (
                  <motion.div
                    key={`${message.id}-${index}`}
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
                        : "justify-start ml-16 md:ml-24"
                    }`}
                  >
                    {!isCurrentUser && sender && (
                      <div className="flex flex-col items-center">
                        <img
                          src={sender.profile_picture || ""}
                          alt={sender.full_name}
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
                          alt={currentUser.full_name}
                          className="w-8 h-8 rounded-full border border-indigo-400 shadow-[0_0_10px_rgba(255,0,255,0.5)]"
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            <div ref={messageEndRef} />
          </div>
        )}
      </div>

      {/* Input Box */}
      {!isBlockedByUser && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-lg border border-purple-500/30 shadow-[0_0_15px_rgba(131,58,180,0.4)] rounded-full max-w-xl mx-auto">
            <input
              type="text"
              className="flex-1 outline-none text-white bg-transparent placeholder-gray-400"
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onChange={(e) => setText(e.target.value)}
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
                onChange={(e) => {
                  if (e.target.files?.[0]) setImage(e.target.files[0]);
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