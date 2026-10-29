import { ArrowLeft, Loader2, SendHorizonal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import api from "../api/axios";

const PostDetails = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { getToken } = useAuth();
  const currentUser = useSelector((state) => state.user?.value);
  const currentUserId = currentUser?._id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await api.get(`/api/post/${postId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (data.success) {
          setPost(data.post);
        } else {
          toast.error(data.message || "Failed to load the post");
        }
      } catch (error) {
        toast.error("Failed to load the post");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, getToken]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return toast.error("Write a comment first");

    try {
      setSubmitting(true);
      const token = await getToken();
      const { data } = await api.post(
        `/api/post/${postId}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Comment added successfully");
        setPost(data.post);
        setCommentText("");
      } else {
        toast.error(data.message || "Failed to add comment");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const token = await getToken();
      const { data } = await api.delete(`/api/post/${postId}/comment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success("Comment deleted successfully");
        setPost(data.post);
      } else {
        toast.error(data.message || "Failed to delete comment");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white">
        <Loader2 className="animate-spin w-7 h-7 mr-2 text-indigo-400" />
        <span>Loading post...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Post Not Found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-400 hover:underline text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#182034]/90 backdrop-blur-md px-4 py-3 flex items-center sm:justify-center gap-4 shadow-md border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Post Details</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Post Card */}
        <div className="bg-[#182034] p-5 rounded-2xl shadow-lg border border-purple-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={post.user?.profile_picture || "/default-profile.png"}
              alt={post.user?.username || "avatar"}
              className="w-11 h-11 rounded-full object-cover border border-purple-500/30"
            />

            <div>
              <p className="font-semibold text-white leading-tight">
                {post.user?.full_name || "Unknown User"}
              </p>
              <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <span>@{post.user?.username || "anonymous"}</span>
                <span>•</span>
                <span>{moment(post.createdAt).fromNow()}</span>
              </div>
            </div>
          </div>

          {post.content && (
            <p className="text-gray-200 text-sm whitespace-pre-line leading-relaxed">
              {post.content}
            </p>
          )}

          {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
            <div
              className={`grid gap-2 ${
                post.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
              } overflow-hidden rounded-xl`}
            >
              {post.image_urls.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Attachment ${i + 1}`}
                  className="h-auto w-full rounded-xl object-contain"
                />
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="bg-[#182034] rounded-2xl shadow-lg border border-purple-500/10 p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <span>💬 Comments</span>
            <span className="text-xs font-normal text-gray-400">
              ({post.comments?.length || 0})
            </span>
          </h2>

          {!post.comments || post.comments.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {post.comments.map((c, i) => {
                const commentAuthorId = c.user?._id || c.user;
                const postAuthorId = post.user?._id || post.user;
                const canDelete =
                  currentUserId &&
                  (String(currentUserId) === String(commentAuthorId) ||
                    String(currentUserId) === String(postAuthorId));

                return (
                  <div
                    key={c._id || i}
                    className="flex items-start justify-between gap-3 bg-[#0f172a] p-3 rounded-xl border border-white/5 group"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <img
                        src={c.user?.profile_picture || "/default-profile.png"}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {c.user?.full_name || "User"}{" "}
                          </span>
                          <span className="text-xs text-gray-400">
                            @{c.user?.username || "anonymous"}
                          </span>
                          <span className="text-[10px] text-gray-500 ml-auto">
                            {moment(c.createdAt).fromNow()}
                          </span>
                        </div>
                        <p className="text-gray-200 text-sm leading-relaxed">
                          {c.text || c.content}{" "}
                        </p>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c._id)}
                        className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition opacity-80 group-hover:opacity-100 cursor-pointer shrink-0"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comment..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-white/10"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2.5 rounded-xl flex items-center justify-center hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizonal className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;