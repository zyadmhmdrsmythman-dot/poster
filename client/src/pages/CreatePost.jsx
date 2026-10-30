import { useState } from "react";
import { Image, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.value);
  const { getToken } = useAuth();

  const handleSubmit = async () => {
    if (!images.length && !content.trim()) {
      return toast.error("Please add at least one image or some text");
    }
    setLoading(true);
    const postType =
      images.length && content
        ? "text_with_image"
        : images.length
        ? "image"
        : "text";

    try {
      const fromData = new FormData();
      fromData.append("content", content);
      fromData.append("post_type", postType);
      images.forEach((image) => fromData.append("images", image));

      const { data } = await api.post("/api/post/add", fromData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Post published successfully!");
        navigate("/");
      } else {
        throw new Error(data.message || "Failed to add post");
      }
    } catch (error) {
      console.error(error.message);
      toast.error(error.response?.data?.message || error.message || "Post not added");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0f3b] via-[#1a1f7f] to-[#3c1f7f] text-white pb-28 sm:pb-32">
      <div className="mx-auto max-w-6xl p-3 sm:p-6">
        <div className="mb-6 sm:mb-8 text-center pt-2 sm:pt-0">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-500">
            🔮 Create Post
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2">
            Share your magical thoughts with the world
          </p>
        </div>

        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-purple-500/40 bg-white/10 p-4 sm:p-6 shadow-[0_0_25px_rgba(131,58,180,0.5)] backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <img
              src={user?.profile_picture || "/default-profile.png"}
              alt="Profile"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-purple-500 shadow-[0_0_10px_rgba(255,0,255,0.3)] object-cover"
            />
            <div>
              <h2 className="font-semibold text-purple-200 text-sm sm:text-base">
                {user?.full_name || "User"}
              </h2>
              <p className="text-gray-400 text-xs">@{user?.username || ""}</p>
            </div>
          </div>

          <textarea
            className="w-full resize-none min-h-24 text-sm outline-none placeholder-gray-400 bg-white/5 text-gray-200 p-3 rounded-xl border border-purple-600/40 focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            placeholder="What's happening?"
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-4">
              {images.map((image, i) => (
                <div className="relative group" key={i}>
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    className="h-20 sm:h-24 w-20 sm:w-24 object-cover rounded-xl border border-pink-500/50 shadow-[0_0_10px_rgba(255,0,255,0.3)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 active:scale-90 transition cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-500/30 pt-3">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-xs sm:text-sm text-gray-100 hover:text-purple-300 transition cursor-pointer p-1"
            >
              <Image className="w-5 h-5 text-purple-300" />
              <span>Add Images</span>
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setImages([...images, ...Array.from(e.target.files)]);
                }
              }}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="text-xs sm:text-sm bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium px-5 py-2.5 rounded-xl shadow-lg hover:shadow-purple-500/50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Publishing..." : "Publish Post"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
