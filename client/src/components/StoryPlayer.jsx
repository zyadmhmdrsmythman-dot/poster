import { useState, useEffect, useCallback } from "react";
import { ChevronRight, Trash2, X } from "lucide-react";

const StoryPlayer = ({
  viewStory,
  setViewStory,
  onNext,
  onDelete,
  canDelete,
  isDeleting,
}) => {
  const [progress, setProgress] = useState(0);

  const handleClose = useCallback(() => {
    setViewStory(null);
  }, [setViewStory]);

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      handleClose();
    }
  };

  useEffect(() => {
    let timer, progressInterval;

    if (viewStory && viewStory.media_type !== "video") {
      setProgress(0);
      const duration = 10000; // 10 ثوانٍ لعرض الستوري
      const step = 50;
      let elapsed = 0;

      // تحديث شريط التقدم بانتظام
      progressInterval = setInterval(() => {
        elapsed += step;
        const currentProgress = (elapsed / duration) * 100;
        if (currentProgress >= 100) {
          setProgress(100);
          clearInterval(progressInterval);
        } else {
          setProgress(currentProgress);
        }
      }, step);

      // بعد انتهاء الشريط يقفل الاستوري بشكل مباشر
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [viewStory, handleClose]);

  if (!viewStory) return null;

  const getMediaUrl = (mediaUrl) => {
    if (Array.isArray(mediaUrl)) {
      return mediaUrl[0] || "";
    }
    return mediaUrl || "";
  };

  const renderContent = () => {
    const url = getMediaUrl(viewStory.media_url);

    switch (viewStory.media_type) {
      case "image":
        return (
          <img
            src={url}
            alt="Story"
            className="max-w-[95vw] sm:max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
          />
        );
      case "video":
        return (
          <video
            src={url}
            autoPlay
            onEnded={handleClose}
            controls
            className="max-w-[95vw] sm:max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        );
      case "text":
        return (
          <div className="w-full max-w-xl p-5 sm:p-8 text-white text-xl sm:text-3xl font-semibold text-center leading-relaxed select-none">
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
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/20 z-30">
          <div
            className="h-full bg-white transition-all duration-75 ease-linear rounded-r-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* بيانات صاحب الستوري */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-8 flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 px-3 sm:px-4 rounded-full bg-black/50 backdrop-blur-md z-30 border border-white/10 shadow-lg">
        <img
          src={viewStory.user?.profile_picture || "/default-profile.png"}
          alt="Profile"
          className="size-7 sm:size-8 rounded-full object-cover border border-white/20"
        />
        <div className="text-white font-medium flex items-center gap-1.5 text-xs sm:text-sm">
          <span>{viewStory.user?.full_name || viewStory.user?.username || "User"}</span>
        </div>
      </div>

      {/* زر الإغلاق */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white p-1.5 sm:p-2 rounded-full hover:bg-white/15 transition z-30 cursor-pointer"
        title="إغلاق (Close)"
      >
        <X className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* زر الانتقال للستوري التالي الجانبي */}
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition-all duration-200 cursor-pointer shadow-xl active:scale-90"
        title="الستوري التالي"
        aria-label="Next story"
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {/* عرض محتوى الستوري */}
      <div className="max-w-[95vw] sm:max-w-[90vw] max-h-[80vh] sm:max-h-[85vh] flex items-center justify-center z-10">
        {renderContent()}
      </div>

      {/* شريط التحكم السفلي */}
      <div className="absolute bottom-4 left-3 right-3 sm:bottom-6 sm:left-8 sm:right-8 flex items-center justify-between z-30">
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-red-600/80 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-lg"
            aria-label="Delete story"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "جاري الحذف..." : "حذف"}
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition duration-200 cursor-pointer shadow-lg active:scale-95 border border-white/20"
          aria-label="Go to next story"
        >
          <span>التالي</span>
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
};

export default StoryPlayer;
