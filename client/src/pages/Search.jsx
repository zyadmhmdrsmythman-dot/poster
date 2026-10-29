import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import Loading from "../components/Loading";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { fetchUser } from "../features/user/userSlice.js";
import UserCard from "../components/UserCard";

const Search = () => {

  const [input,setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const {getToken} = useAuth()
  const dispatch = useDispatch()

  const handleSearch = async(e)=>{
    if(e.key === "Enter"){
      try{
        setUsers([])
        setLoading(true)
        const{data} = await api.post(
          "/api/user/discover",
          {input},
          {
            headers:{Authorization : `Bearer ${await getToken()}`},
          }
        );
        data.success ? setUsers(data.users) : toast.error(data.message)
        setLoading(false)
        setInput("")
      }catch(error){
        toast.error(error.message)
        setLoading(false)
      }
    }
  }

  useEffect(()=>{
    getToken().then((token)=>{
      dispatch(fetchUser(token))
    })
  } , [dispatch , getToken])

  return (
    <div
      className="min-h-screen bg-linear-to-br from-[#0b0f3d] via-[#1a1f4d] to-[#3c1f7f]
   text-white"
    >
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-center"
        >
          <h1
            className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl"
          >
            🔮Discover People
          </h1>
          <p className="text-gray-300 mt-2">
            Connect with amazing people and grow your magical network
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 shadow-lg rounded-xl border border-white/20 bg-white/20 backdrop-blur-lg"
        >
          <div className="p-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
              <input type="text" placeholder="Search by name, username, bio or location..."
              className="pl-10 sm:pl-12 py-2 w-full border border-purple-600 rounded-xl bg-slate-900/70
              text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500
              transition-all duration-300" 
              onChange={(e)=> setInput(e.target.value)}
              value={input}
              onKeyUp={handleSearch}/>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {users.length === 0 && !loading && (
            <p className="text-gray-400 col-span-full text-center mt-12">
              No users found. Try searching something else...
            </p>
          )}
          {users.map((user)=>(
            <motion.div key={user._id} whileHover={{scale:1.05, boxShadow:"0 0 20px rgba(255,0,255,0.6)"}}
            className="relative p-6 rounded-xl bg-white/10 backdrop-blur-lg border border-pink-500 shadow-none
            transition-all">
              {/* User Card */}
              <UserCard user={user} />
            </motion.div>
          ))}
        </motion.div>
        {loading && <Loading height="50vh" />}
      </div>
    </div>
  );
};

export default Search;
