import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../lib/groupSocket.js";
import {
  Lock,
  LockOpen,
  LogOut,
  Send,
  ShieldMinus,
  ShieldPlus,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const JoinedGroupsChat = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [membersOpen, setMembersOpen] = useState(false);
  const navigate = useNavigate();
  const currentUserId = user?.id;

  useEffect(() => {
    if (!groupId || !currentUserId) return undefined;

    let active = true;
    const onReceiveMessage = (incomingMessage) => {
      if (String(incomingMessage.groupId) !== String(groupId)) return;
      setMessages((currentMessages) => {
        if (
          currentMessages.some(
            (currentMessage) =>
              currentMessage._id &&
              currentMessage._id === incomingMessage._id
          )
        ) {
          return currentMessages;
        }
        return [...currentMessages, incomingMessage];
      });
    };

    const onGroupMemberRemoved = ({
      groupId: removedFromGroupId,
      userId,
      action,
    }) => {
      if (String(removedFromGroupId) !== String(groupId)) return;

      if (String(userId) === String(currentUserId)) {
        toast(action === "left" ? "غادرت المجموعة" : "تمت إزالتك من المجموعة");
        socket.emit("leave", { groupId });
        navigate("/groups/available", { replace: true });
        return;
      }

      setGroup((currentGroup) =>
        currentGroup
          ? {
              ...currentGroup,
              members: currentGroup.members.filter(
                (member) => String(member.userId) !== String(userId)
              ),
            }
          : currentGroup
      );
    };

    const onGroupChatLockChanged = ({ groupId: changedGroupId, locked }) => {
      if (String(changedGroupId) !== String(groupId)) return;
      setGroup((currentGroup) =>
        currentGroup ? { ...currentGroup, chatLocked: locked } : currentGroup
      );
    };

    const onGroupMemberRoleChanged = ({
      groupId: changedGroupId,
      userId,
      role,
    }) => {
      if (String(changedGroupId) !== String(groupId)) return;
      setGroup((currentGroup) =>
        currentGroup
          ? {
              ...currentGroup,
              members: currentGroup.members.map((member) =>
                String(member.userId) === String(userId)
                  ? { ...member, role }
                  : member
              ),
            }
          : currentGroup
      );
    };

    const onGroupMemberStatusChanged = ({
      groupId: changedGroupId,
      userId,
      status,
    }) => {
      if (String(changedGroupId) !== String(groupId)) return;
      setGroup((currentGroup) =>
        currentGroup
          ? {
              ...currentGroup,
              members: currentGroup.members.map((member) =>
                String(member.userId) === String(userId)
                  ? { ...member, status }
                  : member
              ),
            }
          : currentGroup
      );
    };

    const onSocketConnectError = (error) => {
      toast.error(error.message || "تعذر الاتصال بدردشة المجموعة");
    };

    const onGroupDeleted = ({ groupId: deletedGroupId }) => {
      if (String(deletedGroupId) !== String(groupId)) return;
      toast.error("تم حذف هذه المجموعة بواسطة إدارة المنصة");
      socket.emit("leave", { groupId });
      navigate("/groups/available", { replace: true });
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("group_member_removed", onGroupMemberRemoved);
    socket.on("group_chat_lock_changed", onGroupChatLockChanged);
    socket.on("group_member_role_changed", onGroupMemberRoleChanged);
    socket.on("group_member_status_changed", onGroupMemberStatusChanged);
    socket.on("connect_error", onSocketConnectError);
    socket.on("group_deleted", onGroupDeleted);

    const initializeChat = async () => {
      try {
        const [groupResponse, messagesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BASEURL}/api/group/${groupId}`),
          axios.get(
            `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/messages`
          ),
        ]);
        if (!active) return;

        const groupData = groupResponse.data?.group || groupResponse.data;
        const isMember = groupData?.members?.some(
          (member) =>
            String(member.userId) === String(currentUserId) &&
            member.status === "accepted"
        );

        if (!isMember) {
          alert("ليس لديك صلاحية الدخول لهذه المجموعة 🚫");
          navigate("/groups");
          return;
        }

        const messageData = Array.isArray(messagesResponse.data)
          ? messagesResponse.data
          : messagesResponse.data?.messages || [];

        setGroup(groupData);
        setMessages(messageData);
        const token = await getToken();
        if (!token) throw new Error("تعذر التحقق من تسجيل الدخول");
        socket.auth = { token };
        if (socket.connected) socket.disconnect();
        socket.connect();
        socket.emit("join", { groupId });
      } catch (error) {
        console.error("Failed to load group chat:", error);
        if (active) navigate("/groups");
      }
    };

    initializeChat();

    return () => {
      active = false;
      socket.off("receive_message", onReceiveMessage);
      socket.off("group_member_removed", onGroupMemberRemoved);
      socket.off("group_chat_lock_changed", onGroupChatLockChanged);
      socket.off("group_member_role_changed", onGroupMemberRoleChanged);
      socket.off("group_member_status_changed", onGroupMemberStatusChanged);
      socket.off("connect_error", onSocketConnectError);
      socket.off("group_deleted", onGroupDeleted);
      socket.emit("leave", { groupId });
    };
  }, [groupId, currentUserId, getToken, navigate]);

  const sendMessage = (event) => {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !currentUserId || !groupId) return;

    socket.emit(
      "send_message",
      { groupId, text: trimmedMessage },
      (result) => {
        if (!result?.success) {
          toast.error(result?.message || "تعذر إرسال الرسالة");
          return;
        }
        setMessage("");
      }
    );
  };

  const acceptedMembers =
    group?.members?.filter((member) => member.status === "accepted") || [];
  const isGroupOwner = String(group?.owner) === String(currentUserId);
  const currentMember = acceptedMembers.find(
    (member) => String(member.userId) === String(currentUserId)
  );
  const canManageChat = isGroupOwner || currentMember?.role === "admin";
  const canSendMessage = !group?.chatLocked || canManageChat;

  const toggleChatLock = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/chat-lock`,
        { locked: !group.chatLocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) {
        throw new Error(data.message || "تعذر تغيير حالة الدردشة");
      }
      setGroup((currentGroup) => ({
        ...currentGroup,
        chatLocked: data.chatLocked,
      }));
      toast.success(data.chatLocked ? "تم قفل الدردشة" : "تم فتح الدردشة");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm("هل تريد الخروج من هذه المجموعة؟")) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/leave`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) {
        throw new Error(data.message || "تعذر الخروج من المجموعة");
      }
      socket.emit("leave", { groupId });
      toast.success("غادرت المجموعة");
      navigate("/groups/available", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const appointGroupAdmin = async (memberId) => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/admin`,
        { targetUserId: memberId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        throw new Error(data.message || "تعذر تعيين المسؤول");
      }

      setGroup((currentGroup) => ({
        ...currentGroup,
        members: currentGroup.members.map((member) =>
          String(member.userId) === String(memberId)
            ? { ...member, role: "admin" }
            : member
        ),
      }));
      toast.success("تم تعيين مسؤول للمجموعة");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const removeGroupAdmin = async (memberId) => {
    if (!window.confirm("إزالة صلاحية المسؤول من هذا العضو؟")) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/admin/${encodeURIComponent(memberId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        throw new Error(data.message || "تعذر إلغاء تعيين المسؤول");
      }

      setGroup((currentGroup) => ({
        ...currentGroup,
        members: currentGroup.members.map((member) =>
          String(member.userId) === String(memberId)
            ? { ...member, role: "member" }
            : member
        ),
      }));
      toast.success("تم إلغاء صلاحية المسؤول");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const removeGroupMember = async (memberId, memberName) => {
    if (!window.confirm(`إزالة ${memberName} من المجموعة؟`)) return;

    try {
      const token = await getToken();
      const { data } = await axios.delete(
        `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/members/${encodeURIComponent(memberId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) {
        throw new Error(data.message || "تعذر إزالة العضو");
      }

      setGroup((currentGroup) => ({
        ...currentGroup,
        members: currentGroup.members.filter(
          (member) => String(member.userId) !== String(memberId)
        ),
      }));
      toast.success("تمت إزالة العضو من المجموعة");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <main
      dir="rtl"
      className="flex h-[calc(100dvh-3.5rem)] min-h-105 flex-col overflow-hidden bg-[#080b24] text-white sm:h-screen"
    >
      <header className="z-10 flex items-center justify-between border-b border-white/10 bg-[#101437]/90 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-950/40">
            <UsersRound size={21} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold sm:text-lg">
              {group?.name || "غرفة الدردشة"}
            </h1>
            <p className="text-xs text-slate-400">
              {acceptedMembers.length} أعضاء
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canManageChat && (
            <button
              type="button"
              onClick={toggleChatLock}
              title={group?.chatLocked ? "فتح الدردشة" : "قفل الدردشة"}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
            >
              {group?.chatLocked ? <LockOpen size={17} /> : <Lock size={17} />}
              <span className="hidden sm:inline">
                {group?.chatLocked ? "فتح الدردشة" : "قفل الدردشة"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={leaveGroup}
            title="الخروج من المجموعة"
            className="inline-flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-400/20"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">خروج</span>
          </button>
          <button
            type="button"
            onClick={() => setMembersOpen((isOpen) => !isOpen)}
            aria-expanded={membersOpen}
            className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-400/20 sm:px-4"
          >
            <UsersRound size={17} />
            <span className="hidden sm:inline">الأعضاء</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
              {acceptedMembers.length}
            </span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8">
            {messages.length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-200 ring-1 ring-violet-300/15">
                    <UsersRound size={25} />
                  </span>
                  <p className="mt-4 font-semibold text-slate-200">
                    ابدأ المحادثة برسالة جديدة
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    رسائلك ستظهر لأعضاء المجموعة مباشرة.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((chatMessage, index) => {
                const isCurrentUser =
                  String(chatMessage.sender) === String(currentUserId);
                const senderName =
                  chatMessage.senderProfile?.full_name ||
                  chatMessage.senderProfile?.username ||
                  (isCurrentUser ? user?.fullName : null) ||
                  "عضو";

                return (
                  <article
                    key={chatMessage._id || `${chatMessage.sender}-${index}`}
                    className={`flex ${isCurrentUser ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg sm:max-w-[70%] ${
                        isCurrentUser
                          ? "rounded-tl-sm bg-linear-to-br from-violet-600 to-indigo-700"
                          : "rounded-tr-sm border border-white/10 bg-white/[0.07]"
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold text-violet-200">
                        {isCurrentUser ? "أنت" : senderName}
                      </p>
                      <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-white">
                        {chatMessage.text}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-white/10 bg-[#101437]/80 p-3 backdrop-blur-xl sm:px-6 sm:py-4"
          >
            {group?.chatLocked && (
              <p className="mx-auto mb-2 max-w-4xl text-center text-xs text-amber-200">
                الدردشة مقفلة؛ الإرسال متاح للمنشئ والمسؤولين فقط.
              </p>
            )}
            <div className="mx-auto flex max-w-4xl gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 focus-within:border-violet-300/40">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  canSendMessage
                    ? "اكتب رسالة للمجموعة..."
                    : "الدردشة مقفلة من قبل المسؤول"
                }
                aria-label="اكتب رسالة للمجموعة"
                disabled={!canSendMessage}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!message.trim() || !canSendMessage}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-l from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold shadow-md shadow-indigo-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
                <span>إرسال</span>
              </button>
            </div>
          </form>
        </section>

        {membersOpen && (
          <button
            type="button"
            aria-label="إغلاق قائمة الأعضاء"
            onClick={() => setMembersOpen(false)}
            className="absolute inset-0 z-20 bg-black/50 md:hidden"
          />
        )}

        <aside
          className={`absolute inset-y-0 right-0 z-30 w-80 max-w-[85vw] border-l border-white/10 bg-[#101437] shadow-2xl shadow-black/40 transition-transform duration-300 md:static md:z-0 md:max-w-none md:translate-x-0 ${
            membersOpen ? "translate-x-0" : "translate-x-full md:hidden"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <h2 className="font-bold">أعضاء المجموعة</h2>
              <p className="mt-1 text-xs text-slate-400">
                {acceptedMembers.length} أعضاء
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMembersOpen(false)}
              aria-label="إغلاق قائمة الأعضاء"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white md:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <ul className="max-h-full space-y-1 overflow-y-auto p-3">
            {acceptedMembers.map((member) => {
              const profile = member.profile;
              const memberName =
                profile?.full_name ||
                profile?.username ||
                (String(member.userId) === String(currentUserId)
                  ? user?.fullName
                  : null) ||
                "عضو";

              return (
                <li
                  key={member.userId}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/6"
                >
                  {profile?.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-linear-to-br from-violet-500/30 to-indigo-500/30 font-bold text-violet-100">
                      {memberName.charAt(0)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-100">
                    {memberName}
                  </span>
                  {String(member.userId) === String(group?.owner) && (
                    <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] text-amber-200">
                      المنشئ
                    </span>
                  )}
                  {String(member.userId) !== String(group?.owner) &&
                    member.role === "admin" && (
                      <span className="rounded-full bg-violet-400/10 px-2 py-1 text-[10px] text-violet-200">
                        مسؤول
                      </span>
                    )}
                  {isGroupOwner &&
                    String(member.userId) !== String(group?.owner) &&
                    (
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        {member.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => removeGroupAdmin(member.userId)}
                            title="إزالة تعيين المسؤول"
                            aria-label={`إزالة صلاحية المسؤول من ${memberName}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300/20 bg-amber-400/10 px-2 py-1.5 text-xs text-amber-100 transition hover:bg-amber-400/20"
                          >
                            <ShieldMinus size={14} />
                            <span className="hidden sm:inline">إلغاء المسؤول</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => appointGroupAdmin(member.userId)}
                            title="تعيين مسؤول"
                            aria-label={`تعيين ${memberName} مسؤولًا`}
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-300/20 bg-violet-400/10 px-2 py-1.5 text-xs text-violet-100 transition hover:bg-violet-400/20"
                          >
                            <ShieldPlus size={14} />
                            <span className="hidden sm:inline">تعيين مسؤول</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            removeGroupMember(member.userId, memberName)
                          }
                          title="إزالة العضو من المجموعة"
                          aria-label={`إزالة ${memberName} من المجموعة`}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300/20 bg-red-400/10 px-2 py-1.5 text-xs text-red-100 transition hover:bg-red-400/20"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">إزالة</span>
                        </button>
                      </div>
                    )}
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </main>
  );
};

export default JoinedGroupsChat;
