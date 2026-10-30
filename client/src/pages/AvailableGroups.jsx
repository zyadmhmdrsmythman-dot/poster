import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AvailableGroups = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  const userId = user?.id;

  useEffect(() => {
    const fetchGroups = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/available?userId=${userId}`
        );
        setGroups(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, [userId]);

  const requestJoin = async (groupId) => {
    if (!userId) return;
    try {
      await axios.post(
        `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/${groupId}/join`,
        { userId }
      );
      toast.success("تم إرسال طلب الانضمام بنجاح");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "فشل في إرسال طلب الانضمام");
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-gray-900 p-3 sm:p-6 pb-28 sm:pb-32 text-white" dir="rtl">
      <div className="w-full max-w-3xl space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 sm:mt-4">
          المجموعات المتاحة
        </h2>
        {groups.length === 0 && (
          <p className="text-gray-400 text-sm">لا توجد مجموعات متاحة للانضمام حالياً</p>
        )}
        {groups.map((g) => (
          <div
            key={g._id}
            className="flex flex-col items-stretch justify-between gap-3 rounded-2xl bg-gray-800/90 border border-white/10 p-3.5 sm:p-4 sm:flex-row sm:items-center shadow-md"
          >
            <span className="min-w-0 font-medium text-white truncate text-base">{g.name}</span>
            {g.owner === userId ? (
              <button
                onClick={() =>
                  navigate(`/groups/requests?groupId=${encodeURIComponent(g._id)}`)
                }
                className="rounded-xl bg-linear-to-r from-indigo-600 to-purple-700 px-4 py-2 text-xs sm:text-sm text-white font-medium transition hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
              >
                طلبات الانضمام لهذا الجروب
              </button>
            ) : (
              <button
                onClick={() => requestJoin(g._id)}
                className="rounded-xl bg-linear-to-r from-indigo-600 to-purple-700 px-4 py-2 text-xs sm:text-sm text-white font-medium transition hover:brightness-110 active:scale-95 cursor-pointer shadow-md"
              >
                طلب الانضمام
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableGroups;
