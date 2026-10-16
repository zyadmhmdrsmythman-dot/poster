import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StoryWindow from "./StoryWindow";
import StoryPlayer from "./StoryPlayer";
import RecentMessages from "./RecentMessage";

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);

  const fetchStories = async () =>{

  }
  return (
    <>
      {/* Stories Bar */}
      <div
  className="fixed bottom-0 left-0 sm:left-20 right-0 bg-linear-to-t from-[#0f172a] via-[#1a1f4d]/50 to-[#3c1f7f]/0
  backdrop-blur-lg border-t border-purple-500/20 z-10 pb-2 h-24"
>
        <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide">
          {/* Create Story */}
          <motion.div
            onClick={() => setShowModal(true)}
            className="shrink-0 sm:ml-3 mt-4 flex flex-col items-center cursor-pointer"
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 150 }}
          >
            <div
              className="w-14 h-14 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600
                 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,255,0.5)]
                  hover:shadow-[0_0_35px_rgba(255,0,255,0.8)] transition-all"
            >
              <Plus className="w-6 h-6 text-white" />
            </div>
            <p className="text-[11px] text-white/70 mt-1 font-semibold animate-pulse">
              Story
            </p>
          </motion.div>
          {/* Stories */}
          {stories.map((story, index) => (
            <motion.div
              key={index}
              className="shrink-0 flex flex-col mt-3 items-center cursor-pointer"
              style={{ width: "calc(100%/6)" }}
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              <img
                src={story.user.profile_picture}
                alt={story.user.username}
                className="w-14 h-14 rounded-full ring-2 ring-purple-400 object-cover
                      shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                onClick={() => setViewStory(story)}
              />
              <p className="text-[11px] text-white mt-1 truncate max-w-14 ">
                {story.user.username || "User"}
              </p>
            </motion.div>
          ))}
        </div>
        {/* Create Story Modal */}
        {showModal && <StoryWindow setShowModal={setShowModal} fetchStories = {setViewStory} />}
        {/* StoryWindow */}
      </div>

      {/* full-screen story Viewer */}
      {
        viewStory && (
          <motion.div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          >
            {/* Story Player */}
            <StoryPlayer viewStory={viewStory} setViewStory={setViewStory} />

            <RecentMessages viewStory={viewStory} setViewStory={setViewStory}/>
            {/* RecentMessages */}
          </motion.div>
        )
      }
    </>
  );
};

export default StoriesBar;
