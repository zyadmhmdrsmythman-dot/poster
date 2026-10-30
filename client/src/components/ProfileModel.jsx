import { useAuth } from "@clerk/clerk-react";
import { Pencil, X } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { UpdateUser } from "../features/user/userSlice";

const ProfileModel = ({ setShowEdit, onSuccess }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const user = useSelector((state) => state.user?.value);

  const [editForm, setEditForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    profile_picture: null,
    cover_photo: null,
    full_name: user?.full_name || "",
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userData = new FormData();
      const {
        full_name,
        username,
        bio,
        location,
        profile_picture,
        cover_photo,
      } = editForm;

      userData.append("username", username);
      userData.append("location", location);
      userData.append("bio", bio);
      userData.append("full_name", full_name);
      profile_picture && userData.append("profile", profile_picture);
      cover_photo && userData.append("cover", cover_photo);

      const token = await getToken();
      await dispatch(UpdateUser({ userData, token })).unwrap();
      toast.success("Profile updated successfully!");
      if (onSuccess) onSuccess();
      setShowEdit(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="flex items-center justify-center min-h-screen py-4 sm:py-8 px-3 sm:px-4">
        <div
          className="w-full max-w-2xl mx-auto relative bg-linear-to-br from-gray-900/90
        via-purple-900/90 to-black/90 border border-purple-500/30 rounded-3xl p-5
         sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto my-auto"
        >
          {/* Close button */}
          <button
            onClick={() => setShowEdit(false)}
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <h1
            className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400
          to-pink-500 mb-6 text-center tracking-wide"
          >
            Edit Profile
          </h1>

          <form
            className="space-y-5 sm:space-y-6"
            onSubmit={(e) =>
              toast.promise(handleSaveProfile(e), { loading: "Saving..." })
            }
          >
            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="profile_picture"
                className="cursor-pointer group relative"
              >
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="profile_picture"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      profile_picture: e.target.files[0],
                    })
                  }
                />
                <img
                  src={
                    editForm.profile_picture
                      ? URL.createObjectURL(editForm.profile_picture)
                      : user?.profile_picture || "/default-profile.png"
                  }
                  alt="Profile"
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-purple-500
              shadow-[0_0_30px_rgba(168,85,247,0.75)]"
                />
                <div
                  className="absolute inset-0 flex sm:hidden sm:group-hover:flex items-center justify-center
            rounded-full bg-black/40"
                >
                  <Pencil className="w-5 h-5 text-white" />
                </div>
              </label>

              <span className="text-gray-300 text-xs sm:text-sm">
                Change Profile Picture
              </span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="cover_photo"
                className="cursor-pointer group relative w-full h-28 sm:h-36 rounded-2xl overflow-hidden border border-purple-500/40 bg-white/5 flex items-center justify-center"
              >
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="cover_photo"
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      cover_photo: e.target.files[0],
                    })
                  }
                />
                {editForm.cover_photo || user?.cover_photo ? (
                  <img
                    src={
                      editForm.cover_photo
                        ? URL.createObjectURL(editForm.cover_photo)
                        : user.cover_photo
                    }
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400">Click to upload cover photo</span>
                )}
                <div
                  className="absolute inset-0 flex sm:hidden sm:group-hover:flex items-center justify-center
            bg-black/40"
                >
                  <Pencil className="w-5 h-5 text-white" />
                </div>
              </label>
              <span className="text-gray-300 text-xs sm:text-sm">Change Cover Photo</span>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  value={editForm.full_name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  value={editForm.username || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  value={editForm.location || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 sm:p-3 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 resize-none"
                  value={editForm.bio || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Write something magical..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowEdit(false)}
                type="button"
                className="px-4 sm:px-5 py-2 rounded-xl border border-gray-500 text-gray-300 hover:bg-white/10 transition text-xs sm:text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 sm:px-6 py-2 rounded-xl bg-linear-to-r from-purple-500
              to-pink-600 text-white font-semibold shadow-lg hover:brightness-110 active:scale-95 transition text-xs sm:text-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModel;
