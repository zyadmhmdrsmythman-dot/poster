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

  // التحقق هل يتابعه حالياً أم لا
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

  // التحقق من وجود طلب معلق
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
      const endpoint = isFollowing ? "/api/user/unfollow" : "/api/user/follow";

      const { data } = await api.post(
        endpoint,
        { id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
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
    <div className="flex w-full max-w-72 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 pt-5 shadow-lg text-white">
      <div className="text-center">
        <img
          src={user.profile_picture || "/default-profile.png"}
          alt={user.full_name || "User"}
          className="rounded-full w-16 h-16 object-cover shadow-md mx-auto border-2 border-purple-400/40"
        />

        <p className="mt-3 font-semibold text-white text-base">{user.full_name}</p>
        {user.username && (
          <p className="text-purple-300 font-light text-xs sm:text-sm">@{user.username}</p>
        )}
        {user.bio && (
          <p className="text-gray-300 mt-2 text-center px-2 text-xs line-clamp-2">
            {user.bio}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-300">
        <div className="flex items-center gap-1 border border-white/15 bg-white/5 rounded-full px-2.5 py-1 text-xs">
          <MapPin className="w-3.5 h-3.5 text-purple-300" />
          <span className="truncate max-w-24">{user.location || "Earth"}</span>
        </div>
        <div className="flex items-center gap-1 border border-white/15 bg-white/5 rounded-full px-2.5 py-1 text-xs">
          <span>{user.followers?.length || 0}</span> Followers
        </div>
      </div>

      <div className="flex mt-4 gap-2">
        {/* زر المتابعة / إلغاء المتابعة */}
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`w-full py-2 rounded-xl flex justify-center items-center gap-2 transition active:scale-95 cursor-pointer text-xs sm:text-sm font-medium ${
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

        {/* زر طلب التواصل / الدردشة */}
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
          className={`flex items-center justify-center w-14 sm:w-16 rounded-xl border transition active:scale-95 ${
            isConnected
              ? "border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
              : isPending
              ? "border-amber-500/40 text-amber-500 bg-amber-500/10 cursor-not-allowed"
              : "border-white/20 text-gray-200 hover:bg-white/10 cursor-pointer"
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
