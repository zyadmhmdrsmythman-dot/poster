import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import { ArrowLeft, Sparkle, TextIcon, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

const StoryWindow = ({ setShowModal, fetchStories }) => {
  const { getToken } = useAuth();

  const bgColors = [
    "#4f46e5",
    "#7c3aed",
    "#db2777",
    "#e11d48",
    "#ca8a04",
    "#0d9488",
  ];

  const [mode, setMode] = useState("text");
  const [background, setBackground] = useState(bgColors[0]);
  const [media, setMedia] = useState(null);
  const [text, setText] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_DURATION = 60;
  const MAX_SIZE = 50;

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video")) {
      if (file.size > MAX_SIZE * 1024 * 1024) {
        toast.error(`حجم الفيديو لا يمكن أن يتجاوز ${MAX_SIZE} ميجابايت.`);
        setMedia(null);
        setPreviewUrl(null);
        return;
      }
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_DURATION) {
          toast.error("مدة الفيديو لا يمكن أن تتجاوز دقيقة واحدة.");
          setMedia(null);
          setPreviewUrl(null);
        } else {
          setMedia(file);
          setPreviewUrl(URL.createObjectURL(file));
          setText("");
          setMode("media");
        }
      };
      video.src = URL.createObjectURL(file);
    } else if (file.type.startsWith("image")) {
      setMedia(file);
      setPreviewUrl(URL.createObjectURL(file));
      setText("");
      setMode("media");
    }
  };

  const handleCreateStory = async () => {
    if (isSubmitting) return;

    const media_type =
      mode === "media"
        ? media?.type?.startsWith("image")
          ? "image"
          : "video"
        : "text";

    if (mode === "text" && !text.trim()) {
      toast.error("يرجى كتابة نص للستوري");
      return;
    }

    if (mode === "media" && !media) {
      toast.error("يرجى اختيار صورة أو فيديو أولاً");
      return;
    }

    const formData = new FormData();
    formData.append("content", text);
    formData.append("media_type", media_type);
    if (media) {
      formData.append("media", media);
    }
    formData.append("background_color", background);

    setIsSubmitting(true);
    const toastId = toast.loading("جاري نشر الستوري...");

    try {
      const token = await getToken();
      const { data } = await api.post("/api/story/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.dismiss(toastId);
        toast.success("تم نشر الستوري بنجاح!");
        setShowModal(false);

        // تحديث قائمة الستوريز فوراً بدون إعادة تحميل الصفحة
        if (typeof fetchStories === "function") {
          await fetchStories();
        }

        window.dispatchEvent(
          new CustomEvent("story_created", { detail: data.story })
        );
        window.dispatchEvent(new CustomEvent("story-updated"));
      } else {
        toast.dismiss(toastId);
        toast.error(data.message || "فشل في نشر الستوري");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "حدث خطأ أثناء نشر الستوري"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 min-h-dvh bg-black/85 backdrop-blur-md text-white
      flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        className="w-full max-w-md bg-[#131226] border border-purple-500/20
        rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="text-center mb-3 sm:mb-4 flex items-center justify-between">
          <button
            type="button"
            className="text-white p-2 cursor-pointer hover:bg-white/10 rounded-full transition"
            onClick={() => setShowModal(false)}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h2 className="text-base sm:text-lg font-semibold">Create Story</h2>
          <span className="w-8 sm:w-10"></span>
        </div>

        {/* Story Canvas / Preview */}
        <div
          className="rounded-xl h-64 sm:h-80 md:h-96 flex items-center justify-center relative overflow-hidden p-4 shadow-inner"
          style={{ backgroundColor: background }}
        >
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب هنا..."
              className="w-full h-full bg-transparent text-white text-center text-lg sm:text-xl font-bold placeholder-white/60 resize-none outline-none flex items-center justify-center flex-col my-auto"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          ) : (
            previewUrl &&
            (media?.type.startsWith("image") ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="object-contain max-h-full max-w-full rounded"
              />
            ) : (
              <video
                src={previewUrl}
                controls
                className="object-contain max-h-full max-w-full rounded"
              />
            ))
          )}
        </div>

        {/* Color Palette */}
        <div className="flex justify-center mt-3 sm:mt-4 gap-2 flex-wrap">
          {bgColors.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                background === color ? "scale-125 ring-2 ring-white" : ""
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setBackground(color)}
            />
          ))}
        </div>

        {/* Mode Switchers */}
        <div className="flex gap-2 mt-3 sm:mt-4">
          <button
            type="button"
            onClick={() => {
              setMode("text");
              setMedia(null);
              setPreviewUrl(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-2 sm:p-2.5 rounded-lg text-sm cursor-pointer transition ${
              mode === "text"
                ? "bg-white text-black font-semibold shadow-md"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            <TextIcon size={16} /> Text
          </button>

          <label
            className={`flex-1 flex items-center justify-center gap-2 p-2 sm:p-2.5 rounded-lg text-sm cursor-pointer transition ${
              mode === "media"
                ? "bg-white text-black font-semibold shadow-md"
                : "bg-zinc-800 text-white hover:bg-zinc-700"
            }`}
          >
            <input
              onChange={handleMediaUpload}
              type="file"
              accept="image/*,video/*"
              className="hidden"
            />
            <Upload size={16} /> Photo/Video
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleCreateStory}
          className="flex items-center justify-center gap-2 text-white
          py-2.5 mt-3 sm:mt-4 w-full rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600
          hover:to-purple-700 active:scale-95 transition cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>جاري النشر...</span>
            </>
          ) : (
            <>
              <Sparkle size={18} />
              <span>نشر الستوري</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StoryWindow;
