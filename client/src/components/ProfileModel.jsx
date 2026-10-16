import { Pencil } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import sample_cover from "../assets/sample_cover.jpg";
import sample_profile from "../assets/sample_profile.jpg";

const ProfileModel = ({setShowEdit}) => {
  const [user, setUser] = useState({
      _id: "1",
      username: "Ziead mohamed",
      full_name: "Ziead mohamed",
      profile_picture: sample_profile,
      cover_photo: sample_cover,
      bio: "This is a bio",
      isFollowed: false,
      location:"egypt",
    });
  const [editForm, setEditForm] =
    useState (
      {
        username: user.username,
        bio: user.bio,
        location: user.location,
        profile_picture: null,
        cover_photo: null,
        full_name: user.full_name,
      }
    );

    const handleSaveProfile = ()=>{

    }
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md">
      <div className="flex items-start sm:items-center justify-center min-h-screen py-8 px-4">
        <div
          className="w-full max-w-2xl mx-auto relative bg-linear-to-br from-gray-900/58
        via-purple-900/85 to-black/85 border border-purple-500/20 rounded-3xl p-6
         sm:p-8 shadow-[0_0_40px_rgba(168,85,247,0.6)] max-h-[85vh] overflow-y-auto"
        >
          <h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400
          to-pink-500 mb-6 text-center tracking-wide"
          >
            Edit Profile
          </h1>

          <form
            className="space-y-6"
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
                      : user.profile_picture || "default.png"
                  }
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-purple-500
              shadow-[0_0_30px_rgba(168,85,247,0.75)]"
                />
                <div
                  className="absolute inset-0 hidden group-hover:flex items-center justify-center
            rounded-full bg-black/40"
                >
                   
                  <Pencil className="w-6 h-6 text-white" />
                </div>
              </label>

              <span className="text-gray-400 text-sm">
                Change Profile Picture
              </span>
            </div>

            {/* Cover_photo */}
            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="cover_photo"
                className="cursor-pointer group relative"
              >
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  id="cover_photo"
                  onChange={(e) =>
                    setEditForm({ ...editForm, cover_photo: e.target.files[0] })
                  }
                />
                <img
                  src={
                    editForm.cover_photo
                      ? URL.createObjectURL(editForm.cover_photo)
                      : user.cover_photo || "default.png"
                  }
                  className="w-full h-36 sm:h-40 rounded-xl object-center border border-purple-400/25 shadow-lg
              "
                />
                <div
                  className="absolute inset-0 hidden group-hover:flex items-center justify-center
            rounded-lg bg-black/40"
                >
                  
                  <Pencil className="w-6 h-6 text-white" />
                </div>
              </label>

              <span className="text-gray-400 text-sm">Change Cover Photo</span>
            </div>
            {/* Inputs */}
            {[
              { label: "Full Name", value: "full_name", type: "text" },
              { label: "Username", value: "username", type: "text" },
              { label: "Location", value: "location", type: "text" },
            ].map((field) => (
              <div key={field.value}>
                <label className="block text-sm font-medium text-purple-300 mb-1">
                  {field.value}
                </label>
                <input
                  type={field.type}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border
                border-white/10 text-white placeholder-gray-500 focus:outline-none
                focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition"
                  placeholder={`Enter your ${field.label.toLowerCase()}`}
                  onChange={(e) =>
                    setEditForm({ ...editForm, [field.value]: e.target.value })
                  }
                  value={editForm[field.value]}
                />
              </div>
            ))}
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-1">
                Bio
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border
                border-white/10 text-white placeholder-gray-500 focus:outline-none
                focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition"
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                value={editForm.bio}
                placeholder="Write something magical..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-6 pb-6">
              <button
                onClick={() => setShowEdit(false)}
                type="button"
                className="px-5 py-2 rounded-xl border border-gray-500 text-gray-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-linear-to-r from-purple-500
              to-pink-600 text-white font-semibold shadow-[0_0_25px_rgba(236,72,153,0.7)]
              hover:scale-105 transition"
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
