import { useState, useEffect } from "react";
import { BadgeCheck, X } from "lucide-react";

const StoryPlayer = ({ viewStory, setViewStory }) => {
  const [progress, setProgress] = useState(0);

  const handleClose = () => {
    setViewStory(null);
  };

  useEffect(() => {
    let timer, progressInterval;

    if (viewStory && viewStory.media_type !== "video") {
      setProgress(0);
      const duration = 10000; // 10 ثوانٍ
      const step = 100; // تحديث كل 100 ميلي ثانية
      let elapsed = 0;

      // تحديث شريط التقدم كل 100 ميلي ثانية
      progressInterval = setInterval(() => {
        elapsed += step;
        setProgress((elapsed / duration) * 100);
      }, step);

      // إغلاق الستوري تلقائياً عند انتهاء الـ 10 ثوانٍ
      timer = setTimeout(() => {
        setViewStory(null);
      }, duration);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [viewStory, setViewStory]);

  if (!viewStory) return null;

  const renderContent = () => {
    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            src={viewStory.media_url}
            alt="Story"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        );
      case "video":
        return (
          <video
            src={viewStory.media_url}
            autoPlay
            onEnded={() => setViewStory(null)}
            controls
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        );
      case "text":
        return (
          <div className="w-full max-w-xl p-8 text-white text-2xl sm:text-3xl font-semibold text-center leading-relaxed select-none">
            {viewStory.content}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 h-screen w-screen flex items-center justify-center z-50 overflow-hidden"
      style={{
        backgroundColor:
          viewStory.media_type === "text"
            ? viewStory.background_color || "#3b82f6"
            : "#000000",
      }}
    >
      {/* شريط التقدم العلوي */}
      {viewStory.media_type !== "video" && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-30">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* بيانات صاحب الستوري */}
      <div className="absolute top-4 left-4 sm:left-8 flex items-center gap-3 p-2 px-4 rounded-full bg-black/40 backdrop-blur-md z-30 border border-white/10">
        <img
          src={viewStory.user?.profile_picture || "/default-profile.png"}
          alt="Profile"
          className="size-8 rounded-full object-cover border border-white/20"
        />
        <div className="text-white font-medium flex items-center gap-1.5 text-sm">
          <span>{viewStory.user?.full_name || "User"}</span>
          {/* <BadgeCheck className="w-4 h-4 text-blue-400" /> */}
        </div>
      </div>

      {/* زر الإغلاق */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-30 cursor-pointer"
        title="Close"
      >
        <X className="w-7 h-7" />
      </button>

      {/* عرض محتوى الستوري */}
      <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center z-10">
        {renderContent()}
      </div>
    </div>
  );
};

export default StoryPlayer;