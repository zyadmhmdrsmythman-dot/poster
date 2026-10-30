import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpLeft, MessageCircle, UsersRound } from "lucide-react";

const JoinedGroups = () => {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchJoinedGroups = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")}/api/group/joined/${user.id}`
        );

        const payload = Array.isArray(res.data)
          ? res.data
          : res.data?.groups || [];

        setGroups(payload);
      } catch (err) {
        console.error("Failed to load joined groups:", err);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedGroups();
  }, [user?.id]);

  const goToGroupChat = (groupId) => {
    navigate(`/groups/chat/${groupId}`);
  };

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#080b24] px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 sm:pb-32 text-white"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <section className="relative mx-auto w-full max-w-5xl">
        <header className="mb-6 sm:mb-9 flex flex-col gap-4 sm:gap-5 rounded-3xl border border-white/10 bg-white/4 p-5 sm:p-8 shadow-2xl shadow-purple-950/30 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1 text-xs sm:text-sm text-purple-200">
              <UsersRound size={16} />
              مساحتك مع مجتمعك
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              مجموعاتي
            </h1>
            <p className="mt-1 sm:mt-2 max-w-xl text-xs sm:text-base leading-6 text-slate-300">
              تابع مجموعاتك وادخل إلى المحادثات مع أصدقائك.
            </p>
          </div>
          <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1233]/80 px-4 py-2.5 sm:py-3">
            <span className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-950/40">
              <UsersRound size={20} />
            </span>
            <div>
              <p className="text-xl sm:text-2xl font-bold leading-none">{groups.length}</p>
              <p className="mt-1 text-xs text-slate-400">مجموعة منضم إليها</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/4"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-purple-300/25 bg-white/3 px-6 py-12 text-center backdrop-blur-sm sm:py-20">
            <span className="mx-auto grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-purple-500/10 text-purple-200 ring-1 ring-purple-300/20">
              <UsersRound size={28} />
            </span>
            <h2 className="mt-4 sm:mt-5 text-lg sm:text-xl font-bold">لا توجد مجموعات هنا بعد</h2>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-6 text-slate-400">
              لم يتم قبول طلب انضمامك إلى مجموعة بعد. يمكنك استكشاف المجموعات
              المتاحة وإرسال طلب للانضمام.
            </p>
            <button
              onClick={() => navigate("/groups/available")}
              className="mt-5 sm:mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-l from-violet-600 to-indigo-600 px-5 py-2.5 sm:py-3 text-sm font-semibold shadow-lg shadow-indigo-950/40 transition hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              استكشف المجموعات
              <ArrowLeft size={18} />
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {groups.map((group) => {
              const acceptedMembers =
                group.members?.filter((member) => member.status === "accepted")
                  .length || 0;

              return (
                <article
                  key={group._id}
                  className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-linear-to-br from-white/8 to-white/2.5 p-4 sm:p-6 shadow-xl shadow-black/10 backdrop-blur-lg transition duration-300 hover:border-purple-300/30 sm:hover:-translate-y-1"
                >
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div className="grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-violet-500/25 to-indigo-500/20 text-lg sm:text-xl font-black text-violet-100 ring-1 ring-white/10">
                        {(group.name || "م").trim().charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-base sm:text-lg font-bold text-white">
                          {group.name || "مجموعة بدون اسم"}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-slate-400">
                          <UsersRound size={15} />
                          {acceptedMembers} أعضاء
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium text-emerald-200">
                      عضو
                    </span>
                  </div>

                  <div className="relative mt-4 sm:mt-6 flex items-center justify-between border-t border-white/8 pt-3 sm:pt-4">
                    <span className="text-xs text-slate-400">
                      المحادثة الجماعية
                    </span>
                    <button
                      onClick={() => goToGroupChat(group._id)}
                      className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-linear-to-l from-violet-600 to-indigo-600 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-950/40 transition hover:brightness-110 active:scale-95 cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      دخول المحادثة
                      <ArrowUpLeft size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default JoinedGroups;
