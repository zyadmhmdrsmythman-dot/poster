import axios from "axios"
import { useUser } from "@clerk/clerk-react"
import { useEffect, useState } from "react"

const GroupChat = () => {
    const {user} = useUser()
    const [groups , setGroups] = useState([])
    const [groupName , setGroupName] = useState("")

    useEffect(()=>{
        const fetchGroups = async ()=>{
            if(!user?.id) return;
            try{
                const res = await axios.get(
                    `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/owned/${user.id}`
                )
                const payload = Array.isArray(res.data)
                    ? res.data
                    : res.data?.groups
                if (!Array.isArray(payload)) {
                    throw new Error("Invalid groups response from server")
                }
                setGroups(payload)
            }catch(err){
                console.error(err);
                setGroups([])
            }
        }
        fetchGroups()
    },[user?.id])

    const createdGroup = async ()=>{
        if(!groupName) return;
        try{
            const res = await axios.post(
                    `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group`,{
                        name:groupName,
                        owner:user.id
                    }
                )
                setGroups((prev)=> [...prev , res.data])
                setGroupName("")
        }catch(err){
                console.error(err);
            }
    }
  return (
    <div className="flex min-h-dvh justify-center bg-gray-900 p-3 sm:min-h-screen sm:p-4">
      <div className="w-full max-w-3xl space-y-4">
        <header className="text-2xl font-bold text-white text-center bg-linear-to-r
        from-purple-800 to-indigo-800 p-4 rounded-xl shadow-md">
            إنشاء مجموعاتك
        </header>
        <div className="space-y-3">
            {
                groups.length === 0 &&(
                    <p className="text-gray-300 text-center">لا توجد مجموعات لديك</p>
                )
            }
            {
                groups.map((g)=>(
                    <div key={g._id} className="p-3 bg-gray-800 rounded-xl text-white text-center font-medium">
                        {g.name}
                    </div>
                ))
            }
        </div>
        <div className="flex min-w-0 gap-2">
            <input value={groupName} onChange={(e)=> setGroupName(e.target.value)} placeholder="اسم المجموعة"
            className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 p-2 text-white" />
            <button onClick={createdGroup} className="px-4 rounded-xl bg-linear-to-r from-green-600
            to-emerald-700 hover:opacity-80 text-white">
                إنشاء 
            </button>
        </div>
      </div>
    </div>
  )
}

export default GroupChat
