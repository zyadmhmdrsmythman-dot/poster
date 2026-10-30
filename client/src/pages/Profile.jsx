import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import sample_cover from "../assets/sample_cover.jpg";
import sample_profile from "../assets/sample_profile.jpg";
import ProfileModel from "../components/ProfileModel";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchConnections } from "../features/connections/connectionsSlice.js";
import Loading from "../components/Loading";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const Profile = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.value);
  const following = useSelector((state) => state.connections?.following || []);
  const { profileId } = useParams();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // تحديد هوية الحساب بدقة
  const currentUserId = currentUser?._id ? String(currentUser._id) : null;

  const targetProfileId = profileId || currentUserId;
  const isMyProfile = !profileId || profileId === currentUserId;

  const fetchUser = useCallback(
    async (idToFetch) => {
      if (!idToFetch) return;
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return;

        const { data } = await api.post(
          "/api/user/profiles",
          { profileId: idToFetch },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success && data.profile) {
          const profileDoc = data.profile;
          const followed = following.some(
            (u) => String(u?._id) === String(profileDoc._id)
          );

          setUser({
            ...profileDoc,
            isFollowed: followed,
          });

          setIsBlocked(Boolean(data.isBlocked));
          setPosts(!data.isBlocked && Array.isArray(data.posts) ? data.posts : []);
        } else {
          toast.error(data.message || "Failed to load profile");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    },
    [getToken, following]
  );

  useEffect(() => {
    if (isLoaded && isSignedIn && targetProfileId) {
      fetchUser(targetProfileId);
    }
  }, [isLoaded, isSignedIn, targetProfileId, fetchUser]);

  const toggleBlock = async () => {
    if (!user?._id) return;
    try {
      const token = await getToken();
      if (isBlocked) {
        const { data } = await api.post(
          "/api/user/unblock",
          { userIdToUnblock: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.success) {
          setIsBlocked(false);
          toast.success("User unblocked successfully");
          fetchUser(user._id);
          dispatch(fetchConnections(token));
        }
      } else {
        const { data } = await api.post(
          "/api/user/block",
          { userIdToBlock: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.success) {
          setIsBlocked(true);
          toast.success("User blocked successfully");
          fetchUser(user._id);
          dispatch(fetchConnections(token));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?._id) return;
    try {
      const token = await getToken();
      const endpoint = user.isFollowed
        ? "/api/user/unfollow"
        : "/api/user/follow";

      const { data } = await api.post(
        endpoint,
        { id: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setUser((prev) => ({
          ...prev,
          isFollowed: !prev.isFollowed,
        }));
        dispatch(fetchConnections(token));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (!isLoaded || loading) return <Loading />;
  if (!user) return <Loading />;

  return (
    <div className="relative min-h-screen overflow-y-auto bg-linear-to-br from-gray-900 via-purple-900 to-black p-3 sm:p-6 pb-28 sm:pb-32">
      <div className="max-w-5xl mx-auto">
        {/* Cover */}
        <div className="relative">
          <div className="h-36 sm:h-56 rounded-2xl sm:rounded-3xl bg-linear-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <img
              src={user.cover_photo || sample_cover}
              alt="Cover"
              className="w-full h-full object-cover mix-blend-overlay opacity-80"
            />
          </div>
          <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2">
            <img
              src={user.profile_picture || sample_profile}
              alt={user.username || "User"}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.8)] object-cover bg-[#182034]"
            />
          </div>
        </div>

        {/* User Info */}
        <div className="mt-14 sm:mt-20 text-center text-white px-2">
          <h1 className="text-xl sm:text-2xl font-bold">{user.full_name || user.username}</h1>
          {user.username && (
            <p className="text-purple-300 text-xs sm:text-sm">@{user.username}</p>
          )}
          <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
            {user.bio || "No bio yet..."}
          </p>

          {isMyProfile ? (
            <button
              onClick={() => setShowEdit(true)}
              className="mt-3 px-5 py-2 bg-purple-600/30 rounded-xl border border-purple-500/50 hover:bg-purple-600/50 text-xs sm:text-sm transition-all cursor-pointer shadow-md"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex justify-center gap-2 sm:gap-3 mt-3">
              <button
                onClick={handleFollowToggle}
                className={`px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer shadow-md ${
                  user.isFollowed
                    ? "bg-slate-700/80 hover:bg-red-600/80 text-gray-200 hover:text-white border border-slate-600 group"
                    : "bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                }`}
              >
                {user.isFollowed ? (
                  <>
                    <span className="block group-hover:hidden">Following</span>
                    <span className="hidden group-hover:block">Unfollow</span>
                  </>
                ) : (
                  "Follow"
                )}
              </button>

              <button
                onClick={toggleBlock}
                className={`px-5 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-lg transition-all cursor-pointer ${
                  isBlocked
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-purple-600/30 hover:bg-purple-600/50 text-white border border-purple-500/30"
                }`}
              >
                {isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          )}
        </div>

        {/* Tabs & Content */}
        {!isBlocked ? (
          <>
            <div className="mt-8 sm:mt-10 flex justify-center gap-4 sm:gap-6">
              {["posts", "media"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? "bg-purple-600 text-white scale-105 sm:scale-110 shadow-lg shadow-purple-600/30"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-4 sm:gap-6">
              {activeTab === "posts" && (
                posts.length === 0 ? (
                  <p className="text-gray-400 text-sm py-10">No posts yet</p>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={{
                        ...post,
                        user: {
                          _id: user._id,
                          username: user.username,
                          profile_picture: user.profile_picture,
                          full_name: user.full_name,
                        },
                      }}
                      onDeleteSuccess={(deletedId) =>
                        setPosts((prev) => prev.filter((p) => p._id !== deletedId))
                      }
                    />
                  ))
                )
              )}

              {activeTab === "media" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl w-full mx-auto">
                  {posts.flatMap((p) =>
                    (p.image_urls || []).map((img, i) => (
                      <img
                        key={`${p._id}-${i}`}
                        src={img}
                        alt="Media attachment"
                        className="rounded-xl object-cover shadow-lg sm:hover:scale-105 transition-all w-full h-36 sm:h-48"
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-12 text-center text-gray-400">
            <p className="text-base">You have blocked this user.</p>
          </div>
        )}

        {showEdit && (
          <ProfileModel
            setShowEdit={setShowEdit}
            onSuccess={() => fetchUser(targetProfileId)}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
