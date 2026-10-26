import React, { useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Share2, Trash2, Edit3, Check, X } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../api/axios";

const PostCard = ({ post, onDeleteSuccess }) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user?.value);
  const userId = currentUser?._id;

  const [likes, setLikes] = useState(
    Array.isArray(post.likes_count) ? post.likes_count : []
  );

  // حالات التعديل والحذف
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content || "");
  const [editedContent, setEditedContent] = useState(post.content || "");

  // التحقق من أن المستخدم الحالي هو صاحب المنشور
  const postAuthorId = post.user?._id || post.user;
  const isAuthor = userId && String(userId) === String(postAuthorId);

  const postWithHashtags = content?.replace(
    /(#\w+)/g,
    '<span class="text-indigo-400 font-medium">$1</span>'
  );

  const handleLike = async () => {
    try {
      const token = await getToken();
      const { data } = await api.post(
        "/api/post/like",
        { postId: post._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setLikes((prev) =>
          prev.includes(currentUser?._id)
            ? prev.filter((id) => id !== currentUser._id)
            : [...prev, currentUser._id]
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // حذف المنشور نهائياً من الداتابيز
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post permanently?")) return;

    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/post/delete/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Post deleted permanently");
        if (onDeleteSuccess) onDeleteSuccess(post._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // حفظ التعديلات على محتوى المنشور
  const handleUpdate = async () => {
    try {
      const token = await getToken();
      const { data } = await api.put(
        `/api/post/update/${post._id}`,
        { content: editedContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Post updated successfully");
        setContent(editedContent);
        setIsEditing(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="bg-[#182034] text-white rounded-xl shadow-sm p-4 space-y-3 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              {/* <BadgeCheck className="w-4 h-4 text-blue-500" /> */}
            </div>
            <div className="text-gray-400 text-xs flex items-center gap-1.5">
              <span>@{post.user?.username || "anonymous"}</span>
              <span>•</span>
              <span>{moment(post.createdAt).fromNow()}</span>
            </div>
          </div>
        </div>

        {/* أزرار التعديل والحذف تظهر لصاحب البوست فقط */}
        {isAuthor && (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Edit post"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(content);
                  }}
                  className="p-1.5 text-gray-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      {isEditing ? (
        <textarea
          rows={3}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-2.5 bg-[#0f1523] border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      ) : (
        content && (
          <div
            className="text-gray-200 text-sm whitespace-pre-line leading-relaxed"
            dangerouslySetInnerHTML={{ __html: postWithHashtags }}
          />
        )
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