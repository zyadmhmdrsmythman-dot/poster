import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Clock, MessageCircle } from "lucide-react";

const AvailableGroups = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = user?.id;

  const fetchGroups = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/available?userId=${userId}`
      );
      setGroups(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [userId]);

  const requestJoin = async (groupId) => {
    if (!userId) return;
    try {
      const res = await axios.post(
        `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/${groupId}/join`,
        { userId }
      );
      toast.success(res.data?.message || "تم إرسال طلب الانضمام بنجاح");
      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId
            ? {
                ...g,
                members: [...(g.members || []), { userId, status: "pending" }],
              }
            : g
        )
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "حدث خطأ أثناء إرسال الطلب";
      toast.error(errorMsg);
      fetchGroups();
    }
  };

  return (
    <div
      className="flex min-h-screen justify-center bg-gray-900 p-3 sm:p-6 pb-28 sm:pb-32 text-white"
      dir="rtl"
    >
      <div className="w-full max-w-3xl space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 sm:mt-4">
          المجموعات المتاحة
        </h2>
        {loading ? (
          <p className="text-gray-400 text-sm py-4">جاري تحميل المجموعات...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">لا توجد مجموعات متاحة حالياً</p>
        ) : (
          groups.map((g) => {
            const userMember = g.members?.find(
              (m) => String(m.userId) === String(userId)
            );
            const isOwner = String(g.owner) === String(userId);
            const isAccepted = userMember?.status === "accepted";
            const isPending = userMember?.status === "pending";

            return (
              <div
                key={g._id}
                className="flex flex-col items-stretch justify-between gap-3 rounded-2xl bg-gray-800/90 border border-white/10 p-3.5 sm:p-4 sm:flex-row sm:items-center shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-violet-500/25 to-indigo-500/20 text-base font-bold text-violet-100 ring-1 ring-white/10">
                    {(g.name || "م").trim().charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-white truncate text-base block">
                      {g.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {g.members?.filter((m) => m.status === "accepted").length || 0} عضو
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOwner ? (
                    <button
                      onClick={() =>
                        navigate(
                          `/groups/requests?groupId=${encodeURIComponent(g._id)}`
                        )
                      }
                      className="w-full sm:w-auto rounded-xl bg-linear-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs sm:text-sm text-white font-medium transition hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
                    >
                      إدارة طلبات المجموعة
                    </button>
                  ) : isAccepted ? (
                    <button
                      onClick={() => navigate(`/groups/chat/${g._id}`)}
                      className="w-full sm:w-auto rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs sm:text-sm text-white font-medium transition hover:brightness-110 active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle size={15} />
                      <span>أنت عضو (دخول المحادثة)</span>
                    </button>
                  ) : isPending ? (
                    <button
                      disabled
                      className="w-full sm:w-auto rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs sm:text-sm text-amber-300 font-medium cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Clock size={15} />
                      <span>الطلب معلق قيد المراجعة</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => requestJoin(g._id)}
                      className="w-full sm:w-auto rounded-xl bg-linear-to-r from-indigo-600 to-purple-700 px-4 py-2 text-xs sm:text-sm text-white font-medium transition hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
                    >
                      طلب الانضمام
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AvailableGroups;
