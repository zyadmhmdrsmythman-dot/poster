import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const GroupChat = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/owned/${user.id}`
        );
        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.groups;
        if (!Array.isArray(payload)) {
          throw new Error("Invalid groups response from server");
        }
        setGroups(payload);
      } catch (err) {
        console.error(err);
        setGroups([]);
      }
    };
    fetchGroups();
  }, [user?.id]);

  const createdGroup = async () => {
    if (!groupName.trim()) {
      return toast.error("يرجى كتابة اسم المجموعة أولاً");
    }
    try {
      setCreating(true);
      const res = await axios.post(
        `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group`,
        {
          name: groupName.trim(),
          owner: user.id,
        }
      );
      toast.success("تم إنشاء المجموعة بنجاح");
      setGroups((prev) => [...prev, res.data]);
      setGroupName("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "فشل في إنشاء المجموعة");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-dvh justify-center bg-gray-900 p-3 sm:p-6 pb-28 sm:pb-32 text-white" dir="rtl">
      <div className="w-full max-w-3xl space-y-4">
        <header className="text-xl sm:text-2xl font-bold text-white text-center bg-linear-to-r from-purple-800 to-indigo-800 p-4 rounded-2xl shadow-md">
          إنشاء مجموعاتك
        </header>
        <div className="flex min-w-0 gap-2">
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createdGroup()}
            placeholder="اسم المجموعة الجديدة..."
            className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800/90 p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={createdGroup}
            disabled={creating}
            className="px-5 rounded-xl bg-linear-to-r from-green-600 to-emerald-700 hover:opacity-90 active:scale-95 text-white font-medium text-sm transition cursor-pointer shadow-md disabled:opacity-50"
          >
            {creating ? "جاري الإنشاء..." : "إنشاء"}
          </button>
        </div>
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-gray-400">مجموعاتك الحالية ({groups.length})</h3>
          {groups.length === 0 && (
            <p className="text-gray-400 text-center py-6 text-sm">لا توجد مجموعات لديك حالياً</p>
          )}
          {groups.map((g) => (
            <div
              key={g._id}
              className="p-3.5 bg-gray-800/80 border border-white/5 rounded-xl text-white font-medium flex items-center justify-between"
            >
              <span className="truncate">{g.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
