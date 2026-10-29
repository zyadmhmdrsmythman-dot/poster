import { useState } from "react";
import { Image, UnlockKeyhole, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import sample_cover from "../assets/sample_cover.jpg";
import sample_profile from "../assets/sample_profile.jpg";
import { useSelector } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.value)
  const {getToken} = useAuth()

  const handleSubmit = async()=>{
    if(!images.length && !content){
      toast.error("Please Add At least one image or text")
    }
    setLoading(true)
    const postType = images.length && content
    ? "text_with_image"
    :images.length
    ?"image"
    :"text"

    try{
      const fromData = new FormData()
      fromData.append("content" , content)
      fromData.append("post_type" , postType)
      images.forEach((image)=>fromData.append("images" , image))
      const {data} = await api.post("/api/post/add" , fromData,{
        headers:{Authorization: `Bearer ${await getToken()}`,}
      });
      if(data.success){
        navigate("/")
      }else{
        throw new Error(data.message)
      }
    }catch(error){
      console.log(error.message);
      toast.error("Post Not Added")
    }
    setLoading(false)
  }
  return (
    <div
      className="min-h-screen bg-linear-to-br from-[#0b0f3b] via-[#1a1f7f] to-[#3c1f7f]
      text-white"
    >
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-8 text-center">
          <h1
            className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r
          from-purple-400 to-pink-500"
          >
            🔮 Create Post
          </h1>
          <p className="text-gray-300 mt-2">
            Share your magical thoughts with the world
          </p>
        </div>
        <div
          className="mx-auto max-w-xl space-y-4 rounded-2xl border border-purple-500/40 bg-white/10 p-4 shadow-[0_0_25px_rgba(131,58,180,0.5)] backdrop-blur-lg sm:p-6"
        >
          <div className="flex items-center gap-3">
            <img
              src={user?.profile_picture}
              className="w-12 h-12 rounded-full border-purple-500
            shadow-[0_0_10px_rgba(255,0,255,0.3)]"
            />
            <div>
              <h2 className="font-semibold text-purple-200">
                {user?.full_name || ""}
              </h2>
              <p className="text-gray-400 text-sm">@{user?.username || ""}</p>
            </div>
          </div>
          <textarea
            className="w-full resize-none max-h-24 mt-4 text-sm outline-none placeholder-gray-400
          bg-white/5 text-gray-200 p-3 rounded-xl border border-purple-600/40
          focus:ring-2 focus:ring-purple-500 transition-all duration-300"
            placeholder="What's happening?"
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {images.map((image, i) => (
                <div className="relative group" key={i}>
                  <img
                    src={URL.createObjectURL(image)}
                    className="h-24 rounded-xl border border-pink-500/50 
                  shadow-[0_0_10px_rgba(255,0,255,0.3)]"
                  />
                  <div
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className="absolute hidden group-hover:flex justify-center items-center
                    top-0 right-0 bottom-0 left-0
                    bg-black/40 rounded-xl cursor-pointer transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-500/30 p-2 sm:p-3">
            <label
              htmlFor="images"
              className="flex items-center gap-2 text-sm text-gray-50
          hover:text-purple-300 transition cursor-pointer"
            >
              <Image className="w-5 h-5" /> Add Images
            </label>
            <input
              type="file"
              id="images"
              name="images"
              accept="image/*"
              hidden
              multiple
              onChange={(e) => setImages([...images, ...e.target.files])}
            />
            <button
              onClick={() =>
                toast.promise(handleSubmit(), {
                  loading: "Uploading...",
                  success: "Post Added",
                  error: "Post Not Added",
                })
              }
              disabled={loading}
              className="text-sm bg-linear-to-r from-indigo-500 to-purple-600
            hover:from-indigo-600 hover:to-purple-700 active: scale-95 transition text-white
            font-medium px-5 py-2 rounded-xl shadow-[0_0_15px_rgba(131,58,180,0.5)] sm:px-8
            hover:shadow-[0_0_25px_rgba(255,0,255, 0.8) ] "
            >
              Publish Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
