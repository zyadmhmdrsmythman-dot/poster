import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

const GroupRequestsManager = ({ ownerId }) => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedGroupId = searchParams.get("groupId");
  const currentOwnerId = ownerId || user?.id;

  useEffect(() => {
    const fetchOwnedGroups = async () => {
      if (!currentOwnerId) return;
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/owned/${currentOwnerId}`
        );
        const payload = Array.isArray(res.data)
          ? res.data
          : res.data.groups || [];
        setGroups(payload);
      } catch (err) {
        console.error("error ", err);
        setGroups([]);
      }
    };

    fetchOwnedGroups();
  }, [currentOwnerId]);

  const acceptRequest = async (groupId, userId) => {
    try {
      await axios.post(
        `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/${groupId}/accept`,
        { userId }
      );
      toast.success("تم قبول العضو بنجاح");
      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId
            ? {
                ...g,
                members: g.members.map((m) =>
                  m.userId === userId ? { ...m, status: "accepted" } : m
                ),
              }
            : g
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "فشل في قبول العضو");
    }
  };

  const visibleGroups = selectedGroupId
    ? groups.filter((group) => String(group._id) === selectedGroupId)
    : groups;

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-6 pb-28 sm:pb-32 text-white" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold">
            {selectedGroupId ? "طلبات الانضمام للمجموعة" : "طلبات الانضمام لمجموعاتك"}
          </h2>
        </div>
        {visibleGroups.length === 0 && (
          <p className="text-gray-400 text-sm py-8 text-center">
            {selectedGroupId ? "المجموعة غير موجودة ضمن مجموعاتك" : "لا توجد مجموعات لديك حالياً"}
          </p>
        )}
        {visibleGroups.map((g) => (
          <div key={g._id} className="mb-6 bg-gray-800/90 border border-white/10 p-4 rounded-2xl shadow-md">
            <h3 className="font-bold text-base sm:text-lg mb-3 text-purple-200">{g.name}</h3>
            <RequestsList group={g} acceptRequest={acceptRequest} />
          </div>
        ))}
      </div>
    </div>
  );
};

function RequestsList({ group, acceptRequest }) {
  const requests = group.members?.filter((m) => m.status === "pending") || [];
  if (requests.length === 0)
    return <p className="text-sm text-gray-400 py-2">لا توجد طلبات معلقة حالياً</p>;

  return (
    <ul className="space-y-2">
      {requests.map((r) => (
        <li
          key={r.userId}
          className="flex justify-between items-center p-3 bg-gray-700/80 rounded-xl"
        >
          <span className="text-sm font-medium">
            {r.profile?.full_name || r.profile?.username || "مستخدم"}
          </span>
          <button
            onClick={() => acceptRequest(group._id, r.userId)}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-xs sm:text-sm font-medium rounded-xl transition cursor-pointer shadow-md"
          >
            قبول
          </button>
        </li>
      ))}
    </ul>
  );
}

export default GroupRequestsManager;
