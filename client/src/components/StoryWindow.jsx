import { useAuth } from "@clerk/clerk-react";
import { ArrowLeft, Sparkle, TextIcon, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const StoryWindow = ({ setShowModal }) => {
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

  // useEffect(() => {
  //   return () => {
  //     if (previewUrl) {
  //       URL.revokeObjectURL(previewUrl);
  //     }
  //   };
  // }, [previewUrl]);

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setMedia(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode("media");
  };

  const handleCreateStory = async () => {
    if (mode === "text" && !text.trim()) {
      throw new Error("Please write text story");
    }
    if (mode === "media" && !media) {
      throw new Error("Please select Photo/Video");
    }


    setShowModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-99999 min-h-screen bg-black/80 backdrop-blur text-white
      flex items-end justify-center p-4"
    >
       <div className="w-full max-w-md bg-[#131226] border border-purple-500/20
        rounded-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)]
       flex flex-col -translate-y-220 transition-transform">
        {/* Header */}
        <div className="text-center mb-4 flex items-center justify-between">
          <button
            type="button"
            className="text-white p-2 cursor-pointer hover:bg-white/10 rounded-full transition"
            onClick={() => setShowModal(false)}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold">Create Story</h2>
          <span className="w-10"></span>
        </div>

        {/* Story Canvas / Preview */}
        <div
          className="rounded-lg h-96 flex items-center justify-center relative overflow-hidden p-4"
          style={{ backgroundColor: background }}
        >
          {mode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="write here..."
              className="w-full h-full bg-transparent text-white text-center text-xl font-bold placeholder-white/60 resize-none outline-none flex items-center justify-center flex-col my-auto"
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
        <div className="flex justify-center mt-4 gap-2">
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
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={() => {
              setMode("text");
              setMedia(null);
              setPreviewUrl(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition ${
              mode === "text" ? "bg-white text-black font-medium" : "bg-zinc-800 text-white"
            }`}
          >
            <TextIcon size={18} /> Text
          </button>

          <label
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded cursor-pointer transition ${
              mode === "media" ? "bg-white text-black font-medium" : "bg-zinc-800 text-white"
            }`}
          >
            <input
              onChange={handleMediaUpload}
              type="file"
              accept="image/*,video/*"
              className="hidden"
            />
            <Upload size={18} /> Photo/Video
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() =>
            toast.promise(handleCreateStory(), {
              loading: "Saving...",
              success: "Story created successfully!",
              error: (err) => err?.message || "Failed to create story.",
            })
          }
          className="flex items-center justify-center gap-2 text-white
          py-2 mt-4 w-full rounded bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600
          hover:to-purple-700 active:scale-95 transition cursor-pointer font-medium"
        >
          <Sparkle size={18} /> Create Story
        </button>
      </div>
    </div>
  );
};

export default StoryWindow;