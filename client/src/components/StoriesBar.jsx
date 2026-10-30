import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import StoryWindow from "./StoryWindow";
import StoryPlayer from "./StoryPlayer";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import socket from "../lib/groupSocket.js";

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchStories = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { data } = await api.get("/api/story/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && Array.isArray(data.stories)) {
        setStories(data.stories);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStories();

    // تهيئة اتصال السوكيت للاستماع للأحداث اللحظية
    const initSocket = async () => {
      try {
        const token = await getToken();
        if (token && !socket.connected) {
          socket.auth = { token };
          socket.connect();
        }
      } catch (e) {
        console.error("Socket error in StoriesBar:", e);
      }
    };
    initSocket();

    // الاستماع لأحداث التطبيق المحلية (CustomEvent)
    const handleStoryCreated = (event) => {
      const newStory = event.detail;
      if (newStory && newStory._id) {
        setStories((prev) => [
          newStory,
          ...prev.filter((s) => s._id !== newStory._id),
        ]);
      }
      fetchStories();
    };

    const handleStoryDeleted = (event) => {
      const deletedId =
        typeof event.detail === "object"
          ? event.detail?.storyId
          : event.detail;
      if (deletedId) {
        setStories((prev) => prev.filter((s) => s._id !== deletedId));
        setViewStory((current) =>
          current?._id === deletedId ? null : current
        );
      }
      fetchStories();
    };

    // الاستماع لأحداث السوكيت في الوقت الفعلي من أي مستخدم آخر
    const onSocketStoryCreated = (story) => {
      if (story && story._id) {
        setStories((prev) => [
          story,
          ...prev.filter((s) => s._id !== story._id),
        ]);
      }
      fetchStories();
    };

    const onSocketStoryDeleted = ({ storyId }) => {
      if (storyId) {
        setStories((prev) => prev.filter((s) => s._id !== storyId));
        setViewStory((current) =>
          current?._id === storyId ? null : current
        );
      }
    };

    window.addEventListener("story_created", handleStoryCreated);
    window.addEventListener("story_deleted", handleStoryDeleted);
    window.addEventListener("story-updated", fetchStories);
    window.addEventListener("focus", fetchStories);

    socket.on("story_created", onSocketStoryCreated);
    socket.on("story_deleted", onSocketStoryDeleted);

    // تحديث دوري هادئ كل 15 ثانية لجلب الستوريز الجديدة بدون إعادة تحميل الصفحة
    const interval = setInterval(fetchStories, 15000);

    return () => {
      window.removeEventListener("story_created", handleStoryCreated);
      window.removeEventListener("story_deleted", handleStoryDeleted);
      window.removeEventListener("story-updated", fetchStories);
      window.removeEventListener("focus", fetchStories);
      socket.off("story_created", onSocketStoryCreated);
      socket.off("story_deleted", onSocketStoryDeleted);
      clearInterval(interval);
    };
  }, [fetchStories, getToken]);

  const handleNextStory = () => {
    if (!viewStory || !stories || stories.length === 0) {
      setViewStory(null);
      return;
    }
    const currentIndex = stories.findIndex((s) => s._id === viewStory._id);
    if (currentIndex !== -1 && currentIndex < stories.length - 1) {
      setViewStory(stories[currentIndex + 1]);
    } else {
      // عند الوصول لآخر ستوري يتم الإغلاق
      setViewStory(null);
    }
  };

  const handleDeleteStory = async () => {
    if (!viewStory) return;
    const storyIdToDelete = viewStory._id;

    try {
      setIsDeleting(true);
      const token = await getToken();
      const { data } = await api.delete(`/api/story/${storyIdToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("تم حذف الستوري بنجاح");

        const currentIndex = stories.findIndex((s) => s._id === storyIdToDelete);
        const remainingStories = stories.filter((s) => s._id !== storyIdToDelete);

        // تحديث الحالة فورياً
        setStories(remainingStories);

        // الانتقال للستوري التالي أو الإغلاق إذا لم يتبق شيء
        if (currentIndex !== -1 && currentIndex < remainingStories.length) {
          setViewStory(remainingStories[currentIndex]);
        } else {
          setViewStory(null);
        }

        // إرسال إشعار لحظي للمتصفح
        window.dispatchEvent(
          new CustomEvent("story_deleted", { detail: { storyId: storyIdToDelete } })
        );
      } else {
        toast.error(data.message || "فشل في حذف الستوري");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "حدث خطأ أثناء الحذف"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = Boolean(
    user &&
      viewStory &&
      (viewStory.user?._id === user.id ||
        viewStory.user === user.id ||
        viewStory.user?._id === user._id)
  );

  return (
    <>
      {/* Stories Bar */}
      <div
        className="fixed bottom-0 left-0 sm:left-20 right-0 bg-linear-to-t from-[#0f172a] via-[#1a1f4d]/80 to-[#3c1f7f]/0
        backdrop-blur-lg border-t border-purple-500/20 z-10 pb-2 h-24 px-2 sm:px-4"
      >
        <div className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide py-1">
          {/* Create Story */}
          <motion.div
            onClick={() => setShowModal(true)}
            className="shrink-0 ml-1 sm:ml-3 mt-3 flex flex-col items-center cursor-pointer"
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 150 }}
          >
            <div
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600
                 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.5)]
                  hover:shadow-[0_0_35px_rgba(255,0,255,0.8)] transition-all"
            >
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-[11px] text-white/70 mt-1 font-semibold animate-pulse">
              Story
            </p>
          </motion.div>
          {/* Stories */}
          {stories.map((story, index) => (
            <motion.div
              key={story._id || index}
              className="shrink-0 flex flex-col mt-3 items-center cursor-pointer w-16 sm:w-20 px-1"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <img
                src={story.user?.profile_picture || "/default-profile.png"}
                alt={story.user?.username || "User"}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full ring-2 ring-purple-400 object-cover
                      shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                onClick={() => setViewStory(story)}
              />
              <p className="text-[11px] text-white mt-1 truncate max-w-14 text-center">
                {story.user?.username || "User"}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Story Modal */}
      {showModal && (
        <StoryWindow
          setShowModal={setShowModal}
          fetchStories={fetchStories}
        />
      )}

      {/* full-screen story Viewer */}
      {viewStory && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Story Player */}
          <StoryPlayer
            viewStory={viewStory}
            setViewStory={setViewStory}
            onNext={handleNextStory}
            onDelete={handleDeleteStory}
            canDelete={canDelete}
            isDeleting={isDeleting}
          />
        </motion.div>
      )}
    </>
  );
};

export default StoriesBar;
