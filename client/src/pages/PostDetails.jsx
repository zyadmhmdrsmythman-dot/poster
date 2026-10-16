import { ArrowLeft, Loader2, SendHorizonal } from "lucide-react";
import { useEffect,useState } from "react";
import { useParams ,useNavigate } from "react-router-dom";
import moment from "moment";
import toast from "react-hot-toast";

const PostDetails = () => {
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading,setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading){
    return (
    <div className="flex items-center justify-center h-screen text-white">
      <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading post...
    </div> 
  );
  }

  if (!post)
  {
    return (
      <p className="text-center text-gray-400">Post Not Found</p>
    )
  }
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div
        className="sticky top-0 z-10 bg-[#182034] px-4 py-3 flex items-center gap-3 shadow-md
    "
      >
        <ArrowLeft
          onClick={() => navigate(-1)}
          className="w-6 h-6 cursor-pointer
      hover:text-blue-400 transition"
        />
        <h1 className="text-lg font-semibold ml-20">Post Details</h1>
      </div>
      {/* Post Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-[#182034] p-4 rounded-xl shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={post.user?.profile_picture || ""}
              className="w-10 h-10 rounded-full border
            bg-gray-600"
            />

            <div>
              <p className="font-semibold">{post.user?.full_name}</p>
              <span className="text-sm text-gray-400">@{post.user?.username || ""} * {moment(post.createdAt).fromNow()}</span>
            </div>
          </div>
        </div>
        <p className="text-gray-200 whitespace-pre-line">{post.content}</p>
        {
          post.image_urls?.length > 0 && (
            <div className={`grid gap-2 ${post.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {
                post.image_urls.map((img,i)=>(
                  <img key={i} src={img} className="w-full object-cover rounded-xl"/>
                ))
              }
            </div>
          )
        }
      </div>
      {/* Comments Section */}
      <div className="bg-[#182034] rounded-xl shadow-lg p-4">
        <h2 className="text-lg font-semibold mb-3">💬 التعليقات </h2>
        {
          (!post.comments || post.comments.length === 0) && (
            <p className="text-gray-400">لا يوجد تعليقات بعد, كن اول من يعلق!</p>
          )
        }
        <div className="space-y-4">
          {post.comments?.map((c,i)=>(
            <div key={i} className="flex items-start gap-3 bg-[#0f172a] p-2 rounded-lg">
              <img src={c.user?.profile_picture} className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-sm font-medium">{c.user?.full_name || ""}
                  <span className="text-gray-400 text-xs">@{c.user?.username || ""}</span>
                </p>
                <p className="text-gray-200 text-sm">{XMLDocument.text}
                  <span className="text-xs text-gray-500">{moment(c.createdAt).fromNow()}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* Add Comment */}
        <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-2">
          <input type="text" value={commentText} onChange={(e)=> setCommentText(e.target.validationMessage)} 
          placeholder="Add your comment..." className="flex-1 px-3 py-2 rounded-xl bg-[#0f172a] text-white
          focus:outline-none border border-gray-600"/>
          <button type="submit" disabled={submitting} className="bg-linear-to-r from-blue-600
          to-purple-700 px-3 py-2 rounded-xl flex items-center gap-1 hover:opacity-90
          transition disabled:opacity-50">
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SendHorizonal className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostDetails;
