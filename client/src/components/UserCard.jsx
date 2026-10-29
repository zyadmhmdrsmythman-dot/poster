import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { Clock, MapPin, MessageCircle, Plus, UserPlus } from "lucide-react";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchUser } from "../features/user/userSlice.js";
import { fetchConnections } from "../features/connections/connectionsSlice.js";

const UserCard = ({ user }) => {
  const currentUser = useSelector((state) => state.user?.value);
  const sentConnections = useSelector(
    (state) => state.connections?.sentConnections || []
  );
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // التحقق هل يتابعه حالياً أم لا (سواء كانت المصفوفة تحتوي نصوصاً أو كائنات)
  const isFollowing = Boolean(
    currentUser?.following?.some(
      (item) => String(item?._id || item) === String(user?._id)
    )
  );

  // التحقق من حالة الاتصال
  const isConnected = Boolean(
    currentUser?.connections?.some(
      (item) => String(item?._id || item) === String(user?._id)
    )
  );

  // التحقق من وجود طلب معلق (إذا كانت متاحة في المستخدم أو الـ state)
  const isPending = Boolean(
    sentConnections.some(
      (item) => String(item?._id || item) === String(user?._id)
    )
  );

  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // التبديل بين المتابعة وإلغاء المتابعة حسب الحالة الحالية
      const endpoint = isFollowing ? "/api/user/unfollow" : "/api/user/follow";

      const { data } = await api.post(
        endpoint,
        { id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        // تحديث الـ Redux فوراً لتغيير لون وحالة الزر مباشرة
        await dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionRequest = async () => {
    if (isConnected) {
      return navigate("/messages/" + user._id);
    }
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/user/connect",
        { id: user._id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
        await dispatch(fetchUser(token));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex w-full max-w-72 flex-col justify-between rounded-md border border-gray-200 p-4 pt-6 shadow">
      <div className="text-center">
        <img
          src={user.profile_picture}
          alt={user.full_name}
          className="rounded-full w-16 h-16 object-cover shadow-md mx-auto"
        />

        <p className="mt-4 font-semibold">{user.full_name}</p>
        {user.username && (
          <p className="text-gray-500 font-light">@{user.username}</p>
        )}
        {user.bio && (
          <p className="text-gray-600 mt-2 text-center px-4 text-xs">
            {user.bio}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1 text-xs">
          <MapPin className="w-3.5 h-3.5" />
          {user.location || "Earth"}
        </div>
        <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1 text-xs">
          <span>{user.followers?.length || 0}</span> Followers
        </div>
      </div>

      <div className="flex mt-4 gap-2">
        {/* زر المتابعة / إلغاء المتابعة */}
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`w-full py-2 rounded-md flex justify-center items-center gap-2 transition active:scale-95 cursor-pointer text-sm font-medium ${
            isFollowing
              ? "bg-slate-700 hover:bg-red-600/80 text-gray-200 hover:text-white border border-slate-600 group"
              : "bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {isFollowing ? (
            <>
              <span className="block group-hover:hidden">Following</span>
              <span className="hidden group-hover:block">Unfollow</span>
            </>
          ) : (
            "Follow"
          )}
        </button>

        {/* زر طلب التواصل / الدردشة / معلق */}
        <button
          onClick={handleConnectionRequest}
          disabled={isPending}
          title={
            isConnected
              ? "Send Message"
              : isPending
              ? "Request Pending"
              : "Connect"
          }
          className={`flex items-center justify-center w-16 border rounded-md transition active:scale-95 ${
            isConnected
              ? "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
              : isPending
              ? "border-amber-500/30 text-amber-500 bg-amber-500/5 cursor-not-allowed"
              : "border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 cursor-pointer"
          }`}
        >
          {isConnected ? (
            <MessageCircle className="h-5 w-5 hover:scale-105 transition" />
          ) : isPending ? (
            <Clock className="h-5 w-5 animate-pulse" />
          ) : (
            <Plus className="h-5 w-5 hover:scale-105 transition" />
          )}
        </button>
      </div>
    </div>
  );
};

export default UserCard;