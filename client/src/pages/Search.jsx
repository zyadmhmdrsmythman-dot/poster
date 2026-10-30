import { useEffect, useState, useCallback } from "react";
import { Search as SearchIcon } from "lucide-react";
import Loading from "../components/Loading";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { fetchUser } from "../features/user/userSlice.js";
import UserCard from "../components/UserCard";

const Search = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [input, setInput] = useState(initialQuery);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const performSearch = useCallback(
    async (searchTerm) => {
      const term = (searchTerm ?? input).trim();
      if (!term) return;

      try {
        setUsers([]);
        setLoading(true);
        const { data } = await api.post(
          "/api/user/discover",
          { input: term },
          {
            headers: { Authorization: `Bearer ${await getToken()}` },
          }
        );
        if (data.success) {
          setUsers(data.users || []);
        } else {
          toast.error(data.message || "Failed to find users");
        }
      } catch (error) {
        toast.error(error.message || "Search error");
      } finally {
        setLoading(false);
      }
    },
    [input, getToken]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  useEffect(() => {
    getToken().then((token) => {
      if (token) dispatch(fetchUser(token));
    });
  }, [dispatch, getToken]);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b0f3d] via-[#1a1f4d] to-[#3c1f7f] text-white">
      <div className="mx-auto max-w-6xl p-3 sm:p-6 pb-28 sm:pb-32">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 sm:mb-8 text-center pt-2 sm:pt-0"
        >
          <h1 className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-2xl sm:text-4xl font-extrabold text-transparent">
            🔮 Discover People
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2">
            Connect with amazing people and grow your network
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 sm:mb-8 shadow-lg rounded-2xl border border-white/20 bg-white/10 backdrop-blur-lg"
        >
          <div className="p-3 sm:p-5">
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="البحث بالاسم أو اسم المستخدم..."
                className="pl-11 pr-20 py-2.5 sm:py-3 w-full border border-purple-600/50 rounded-xl bg-slate-900/80 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-all"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                onClick={() => performSearch()}
                className="absolute right-2 px-3.5 py-1.5 sm:py-2 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg text-xs font-semibold text-white shadow-md active:scale-95 cursor-pointer hover:brightness-110 transition-all"
              >
                بحث
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {users.length === 0 && !loading && (
            <p className="text-gray-400 col-span-full text-center py-12 text-sm sm:text-base">
              {input ? "لم يتم العثور على مستخدمين." : "ابدأ البحث بالاسم أو اسم المستخدم..."}
            </p>
          )}
          {users.map((user) => (
            <motion.div
              key={user._id}
              whileHover={{ scale: 1.02 }}
              className="relative p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-lg border border-purple-500/30 shadow-md transition-all flex justify-center"
            >
              <UserCard user={user} />
            </motion.div>
          ))}
        </motion.div>
        {loading && <Loading height="40vh" />}
      </div>
    </div>
  );
};

export default Search;
