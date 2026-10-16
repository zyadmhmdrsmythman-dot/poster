import React, { useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Share2 } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

const PostCard = ({ post }) => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [likes, setLikes] = useState(
    Array.isArray(post.likes_count) ? post.likes_count : []
  );

  const postWithHashtags = post.content?.replace(
    /(#\w+)/g,
    '<span class="text-indigo-400 font-medium">$1</span>'
  );

  const handleLike = () => {
    if (!userId) {
      toast.error("Please sign in to like this post");
      return;
    }

    setLikes((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="bg-[#182034] text-white rounded-xl shadow-sm p-4 space-y-3 w-full max-w-2xl">
      {/* Header */}
      <div
        onClick={() => post.user?._id && navigate(`/profile/${post.user._id}`)}
        className="flex items-center gap-3 cursor-pointer"
      >
        <img
          src={post.user?.profile_picture || "/default-profile.png"}
          alt={post.user?.username || "User"}
          className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-purple-500/30"
        />
        <div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">
              {post.user?.full_name || "Unknown User"}
            </span>
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-gray-400 text-xs flex items-center gap-1.5">
            <span>@{post.user?.username || "anonymous"}</span>
            <span>•</span>
            <span>{moment(post.createdAt).fromNow()}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      {post.content && (
        <div
          className="text-gray-200 text-sm whitespace-pre-line leading-relaxed"
          dangerouslySetInnerHTML={{ __html: postWithHashtags }}
        />
      )}

      {/* Post Images */}
      {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
        <div
          className={`grid gap-2 ${
            post.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
          } max-h-75 overflow-hidden `}
        >
          {post.image_urls.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Post attachment ${index + 1}`}
              className={`w-full object-cover rounded-lg ${
                post.image_urls.length === 1
                  ? "h-48 md:h-64"
                  : "h-36 md:h-48"
              }`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 text-gray-400 text-sm border-t border-purple-500/10 pt-3">
        <button
          type="button"
          className="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer"
          onClick={handleLike}
        >
          <Heart
            className={`w-5 h-5 ${
              userId && likes.includes(userId)
                ? "text-red-500 fill-red-500"
                : ""
            }`}
          />
          <span>{likes.length}</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 hover:text-blue-400 transition-colors cursor-pointer"
          onClick={() => navigate(`/post/${post._id}`)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments?.length || 0}</span>
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 hover:text-gray-200 transition-colors cursor-pointer"
          onClick={() => {
            navigator.clipboard?.writeText(`${window.location.origin}/post/${post._id}`);
            toast.success("Link copied to clipboard!");
          }}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PostCard;