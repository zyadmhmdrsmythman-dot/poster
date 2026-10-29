import Loading from "../components/Loading";
import logo from "../assets/logo.png";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import StoriesBar from "../components/StoriesBar";
import RecentMessages from "../components/RecentMessage";
import PostCard from "../components/PostCard";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

function Feed() {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {getToken, isLoaded, isSignedIn} = useAuth();

  const fetchFeeds =useCallback( async ()=>{
    try{
      setLoading(true)
      const token = await getToken();
      if (!token) return;

      const {data} = await api.get("/api/post/feed" , {
        headers:{
          Authorization : `Bearer ${await getToken()}` ,"Cache-Control": "no-cache",
        },
        
      })
      if(data.success){
        setFeeds(data.posts || data.feeds || [])
      }else{
        toast.error(data.message || "Failed to fetch feeds")
      }
    }catch(error){
        toast.error(error.message)
    }
    finally {
    setLoading(false); }
  }, [getToken]);

  useEffect(() => {
  if (isLoaded && isSignedIn) {
    fetchFeeds();
  }
}, [isLoaded, isSignedIn, fetchFeeds]);

  useEffect(() => {
    const handlePostCreated = (event) => {
      const post = event.detail;
      if (!post?._id) return;

      setFeeds((currentFeeds) => [
        post,
        ...currentFeeds.filter((feed) => feed._id !== post._id),
      ]);
    };

    window.addEventListener("post-created", handlePostCreated);
    return () => window.removeEventListener("post-created", handlePostCreated);
  }, []);

  return !loading ? (
    <div className="relative flex min-h-[calc(100dvh-3.5rem)] w-full flex-col items-center overflow-x-hidden bg-linear-to-b from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] py-4 text-white sm:min-h-screen sm:py-10">
      <div className="z-10 flex w-full max-w-5xl items-center justify-between gap-2 rounded-3xl px-3 py-2 sm:gap-4 sm:px-4">
        <img src={logo} alt="Poster" className="mr-1 hidden h-10 shrink-0 animate-pulse sm:block sm:mr-3" />
        <div className="mx-1 max-w-md flex-1 sm:mx-4 sm:ml-6">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-3 border rounded-3xl border-purple-500/30 bg-white/5 text-white placeholder-purple-500/40 transition-all focus:outline-none focus:border-purple-400"
          />
        </div>
        <div
          onClick={() => navigate("/notifications")}
          className="relative cursor-pointer p-3 rounded-full bg-linear-to-br from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(255,0,255,0.5)] hover:scale-110 transition-transform"
        >
          <Bell className="w-6 h-6 text-white animate-pulse" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </div>

      <div className="mt-4 flex w-full items-start justify-center gap-4 px-2 sm:px-4 xl:gap-8">
        <div className="w-full min-w-0 max-w-2xl">
          <StoriesBar />
          <div className="space-y-6 p-4 pb-32">
            {/* PostCards */}
            {feeds.map((post)=>(
              <PostCard key={post._id} post={post} className="bg-white/5 backdrop-blur-lg
              rounded-2xl shadow-[0_0_20px_rgba(255,0,255,0.2)] hover:scale-105 
              hover:shadow-[0_0_25px_rgba(255,0,255,0.4)] transition-transform duration-300" />
            ))}
          </div>
        </div>
        {/* الرسائل الجانبية */}
        <div className="sticky top-2 hidden w-72 shrink-0 xl:block">
        <RecentMessages />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-purple-600/20 via-pink-500/10 to-indigo-400/10 mix-blend-overlay animate-pulse-slow" />
    </div>
  ) : (
    <Loading />
  );
}

export default Feed;