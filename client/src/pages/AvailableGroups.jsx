import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
          `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/available?userId=${userId}`,
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
      const res = await axios.post(
        `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/${groupId}/join`,
        { userId },
      );
      alert("تم ارسال طلب الانضمام بنجاح");
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex min-h-screen justify-center bg-gray-900 p-3 sm:p-4">
      <div className="w-full max-w-3xl space-y-4">
        <h2 className="text-2xl font-bold text-white mt-4">
          المجموعات المتاحة
        </h2>
        {groups.length === 0 && (
          <p className="text-gray-300">لا توجد مجموعات متاحة للانضمام</p>
        )}
        {groups.map((g) => (
          <div
            key={g._id}
            className="flex flex-col items-stretch justify-between gap-3 rounded-xl bg-gray-800 p-3 sm:flex-row sm:items-center"
          >
            <span className="min-w-0 wrap-break-word text-white">{g.name}</span>
            {g.owner === userId ? (
              <button
                onClick={() =>
                  navigate(`/groups/requests?groupId=${encodeURIComponent(g._id)}`)
                }
                className="rounded-xl bg-linear-to-r from-indigo-600 to-purple-700 px-4 py-2 text-white transition hover:opacity-80"
              >
                طلبات الانضمام المرسلة لهذا الجروب
              </button>
            ) : (
              <button
                onClick={() => requestJoin(g._id)}
                className="rounded-xl bg-linear-to-r from-indigo-600 to-purple-700 px-4 py-2 text-white transition hover:opacity-80"
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
