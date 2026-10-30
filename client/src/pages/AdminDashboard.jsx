import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  MessageSquareText,
  Search,
  Shield,
  Trash2,
  Users,
  UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const tabs = [
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "messages", label: "الرسائل الخاصة", icon: MessageSquareText },
  { id: "groups", label: "المجموعات", icon: UsersRound },
];

const displayName = (profile) =>
  profile?.full_name || profile?.username || "مستخدم غير معروف";

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupOwnerId, setNewGroupOwnerId] = useState("");
  const pageSize = 30;

  const request = useCallback(
    async (method, path, data) => {
      const token = await getToken();
      if (!token) throw new Error("انتهت جلسة تسجيل الدخول");
      return api.request({
        method,
        url: path,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    [getToken]
  );

  const loadOverview = useCallback(async () => {
    const { data } = await request("get", "/api/admin/overview");
    setStats(data.stats);
  }, [request]);

  const loadRows = useCallback(async () => {
    const { data } = await request(
      "get",
      `/api/admin/${activeTab}?page=${page}&limit=${pageSize}&q=${encodeURIComponent(appliedQuery)}`
    );
    const key = activeTab;
    setRows(data[key] || []);
    setTotal(data.total || 0);
  }, [activeTab, appliedQuery, page, request]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAccessError("");
    Promise.all([loadOverview(), loadRows()])
      .catch((error) => {
        const status = error.response?.status;
        if (active) {
          if (status === 403 || status === 503) {
            navigate("/", { replace: true });
            return;
          }
          setAccessError(
            error.response?.data?.message || "تعذر تحميل بيانات لوحة الإدارة."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadOverview, loadRows, navigate]);

  const refresh = async () => {
    await Promise.all([loadOverview(), loadRows()]);
  };

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  };

  const changeUserSuspension = async (target, suspended) => {
    try {
      await request("patch", `/api/admin/users/${encodeURIComponent(target._id)}/suspension`, {
        suspended,
      });
      toast.success(suspended ? "تم تعليق الحساب" : "تمت إعادة تفعيل الحساب");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر تحديث حالة الحساب");
    }
  };

  const deleteUser = async (target) => {
    if (
      !window.confirm(
        `حذف حساب ${displayName(target)} نهائيًا؟ سيتم حذف ملفه ورسائله ومجموعاته التي أنشأها.`
      )
    ) {
      return;
    }
    try {
      await request("delete", `/api/admin/users/${encodeURIComponent(target._id)}`);
      toast.success("تم حذف الحساب وبياناته المرتبطة");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر حذف الحساب");
    }
  };

  const changeAdminRole = async (target, isAdmin) => {
    const action = isAdmin ? "منح" : "إلغاء";
    if (!window.confirm(`${action} صلاحية أدمن المنصة لـ ${displayName(target)}؟`)) {
      return;
    }

    try {
      await request(
        "patch",
        `/api/admin/users/${encodeURIComponent(target._id)}/admin`,
        { isAdmin }
      );
      setRows((current) =>
        current.map((user) =>
          user._id === target._id ? { ...user, isPlatformAdmin: isAdmin } : user
        )
      );
      toast.success(isAdmin ? "تم تعيين المستخدم أدمن للمنصة" : "تم إلغاء صلاحية الأدمن");
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر تحديث صلاحية الأدمن");
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm("حذف هذه الرسالة نهائيًا؟")) return;
    try {
      await request("delete", `/api/admin/messages/${message._id}`);
      setRows((current) => current.filter((row) => row._id !== message._id));
      setTotal((current) => Math.max(0, current - 1));
      toast.success("تم حذف الرسالة");
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر حذف الرسالة");
    }
  };

  const setGroupLock = async (group, locked) => {
    try {
      await request("patch", `/api/admin/groups/${group._id}/lock`, { locked });
      setRows((current) =>
        current.map((row) =>
          row._id === group._id ? { ...row, chatLocked: locked } : row
        )
      );
      toast.success(locked ? "تم قفل دردشة المجموعة" : "تم فتح دردشة المجموعة");
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر تحديث المجموعة");
    }
  };

  const createGroup = async (event) => {
    event.preventDefault();
    try {
      await request("post", "/api/admin/groups", {
        name: newGroupName.trim(),
        ownerId: newGroupOwnerId.trim(),
      });
      setNewGroupName("");
      setNewGroupOwnerId("");
      toast.success("تم إنشاء المجموعة");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر إنشاء المجموعة");
    }
  };

  const renameGroup = async (group) => {
    const name = window.prompt("اكتب الاسم الجديد للمجموعة", group.name)?.trim();
    if (!name || name === group.name) return;
    try {
      await request("patch", `/api/admin/groups/${group._id}`, { name });
      setRows((current) =>
        current.map((row) =>
          row._id === group._id ? { ...row, name } : row
        )
      );
      toast.success("تم تعديل اسم المجموعة");
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر تعديل المجموعة");
    }
  };

  const updateMember = async (group, member, action) => {
    try {
      await request(
        "patch",
        `/api/admin/groups/${group._id}/members/${encodeURIComponent(member.userId)}`,
        { action }
      );
      if (action === "remove") {
        setRows((current) =>
          current.map((row) =>
            row._id === group._id
              ? {
                  ...row,
                  members: row.members.filter(
                    (item) => item.userId !== member.userId
                  ),
                }
              : row
          )
        );
      } else {
        setRows((current) =>
          current.map((row) =>
            row._id === group._id
              ? {
                  ...row,
                  members: row.members.map((item) =>
                    item.userId === member.userId
                      ? action === "accept"
                        ? { ...item, status: "accepted" }
                        : { ...item, role: action }
                      : item
                  ),
                }
              : row
          )
        );
      }
      toast.success(
        action === "remove"
          ? "تمت إزالة العضو"
          : action === "accept"
            ? "تم قبول طلب الانضمام"
            : "تم تحديث دور العضو"
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر تحديث العضو");
    }
  };

  const deleteGroup = async (group) => {
    if (!window.confirm(`حذف مجموعة "${group.name}" وجميع رسائلها؟`)) return;
    try {
      await request("delete", `/api/admin/groups/${group._id}`);
      toast.success("تم حذف المجموعة ورسائلها");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "تعذر حذف المجموعة");
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main dir="rtl" className="min-h-dvh bg-[#080b24] p-4 text-white sm:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-linear-to-l from-[#20174d] to-[#111638] p-5 shadow-xl sm:p-7">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-400/15 text-rose-200">
              <Shield size={25} />
            </div>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">لوحة إدارة المنصة</h1>
              <p className="mt-1 text-sm text-slate-400">
                إدارة الحسابات والمحادثات والمجموعات
              </p>
            </div>
          </div>
          <BarChart3 className="hidden text-violet-200 sm:block" size={30} />
        </header>

        {accessError ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-6 text-center text-rose-100">
            <AlertTriangle className="mx-auto mb-3" />
            {accessError}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                ["المستخدمون", stats?.users, Users],
                ["حسابات معلقة", stats?.suspendedUsers, AlertTriangle],
                ["المجموعات", stats?.groups, UsersRound],
                ["الرسائل الخاصة", stats?.messages, MessageSquareText],
                ["رسائل المجموعات", stats?.groupMessages, MessageSquareText],
                ["المنشورات", stats?.posts, BarChart3],
              ].map(([label, value, Icon]) => (
                <article
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <Icon className="mb-3 text-violet-200" size={20} />
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value ?? "—"}</p>
                </article>
              ))}
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101437]/80">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3 sm:p-4">
                <nav className="flex flex-wrap gap-2">
                  {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveTab(id);
                        setPage(1);
                        setQuery("");
                        setAppliedQuery("");
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                        activeTab === id
                          ? "bg-violet-500 text-white"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </nav>
                <form onSubmit={applySearch} className="flex min-w-55 flex-1 gap-2 sm:max-w-sm">
                  <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3">
                    <Search size={16} className="shrink-0 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={
                        activeTab === "messages"
                          ? "ابحث في الرسائل أو المشاركين"
                          : activeTab === "groups"
                            ? "ابحث باسم المجموعة"
                            : "ابحث بالاسم أو البريد أو المعرّف"
                      }
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-500"
                    />
                  </label>
                  <button className="rounded-xl bg-violet-600 px-3 text-sm font-semibold hover:bg-violet-500">
                    بحث
                  </button>
                </form>
              </div>

              {activeTab === "groups" && (
                <form
                  onSubmit={createGroup}
                  className="grid gap-2 border-b border-white/10 bg-white/3 p-3 sm:grid-cols-[1fr_1.2fr_auto] sm:p-4"
                >
                  <input
                    value={newGroupName}
                    onChange={(event) => setNewGroupName(event.target.value)}
                    required
                    placeholder="اسم المجموعة الجديدة"
                    className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm outline-none focus:border-violet-400/50"
                  />
                  <input
                    value={newGroupOwnerId}
                    onChange={(event) => setNewGroupOwnerId(event.target.value)}
                    required
                    placeholder="معرّف Clerk لمنشئ المجموعة"
                    className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-sm outline-none focus:border-violet-400/50"
                  />
                  <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-500">
                    إنشاء مجموعة
                  </button>
                </form>
              )}

              {loading ? (
                <div className="p-12 text-center text-slate-400">جارٍ تحميل البيانات...</div>
              ) : rows.length === 0 ? (
                <div className="p-12 text-center text-slate-400">لا توجد نتائج.</div>
              ) : (
                <div className="divide-y divide-white/8">
                  {activeTab === "users" &&
                    rows.map((target) => (
                      <article
                        key={target._id}
                        className="flex flex-wrap items-center justify-between gap-3 p-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {target.profile_picture ? (
                            <img
                              src={target.profile_picture}
                              alt=""
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <span className="grid h-11 w-11 place-items-center rounded-full bg-violet-400/15 font-bold text-violet-100">
                              {displayName(target).charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-bold">{displayName(target)}</p>
                            <p className="truncate text-xs text-slate-400">
                              @{target.username || "—"} · {target.email}
                            </p>
                            <p className="mt-1 break-all text-[10px] text-slate-500">
                              {target._id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${
                              target.isSuspended
                                ? "bg-amber-400/10 text-amber-200"
                                : "bg-emerald-400/10 text-emerald-200"
                            }`}
                          >
                            {target.isSuspended ? "معلق" : "نشط"}
                          </span>
                          {target.isPlatformAdmin && (
                            <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs text-violet-200">
                              أدمن المنصة
                            </span>
                          )}
                          {!target.isBootstrapAdmin && (
                            <button
                              type="button"
                              disabled={target.isSuspended && !target.isPlatformAdmin}
                              onClick={() =>
                                changeAdminRole(target, !target.isPlatformAdmin)
                              }
                              className="rounded-lg border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs text-violet-100 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {target.isPlatformAdmin ? "إلغاء الأدمن" : "تعيين أدمن"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              changeUserSuspension(target, !target.isSuspended)
                            }
                            disabled={target.isPlatformAdmin}
                            className="rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/20"
                          >
                            {target.isSuspended ? "إعادة تفعيل" : "تعليق"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(target)}
                            disabled={target.isPlatformAdmin}
                            className="rounded-lg border border-rose-300/20 bg-rose-400/10 p-2 text-rose-100 hover:bg-rose-400/20"
                            aria-label="حذف الحساب"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </article>
                    ))}

                  {activeTab === "messages" &&
                    rows.map((message) => (
                      <article key={message._id} className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 truncate text-xs text-slate-400">
                            <span className="text-violet-200">
                              {displayName(message.fromUser)}
                            </span>
                            {" ← "}
                            <span className="text-cyan-200">
                              {displayName(message.toUser)}
                            </span>
                            {" · "}
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => deleteMessage(message)}
                            className="shrink-0 rounded-lg p-2 text-rose-200 hover:bg-rose-400/10"
                            aria-label="حذف الرسالة"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {message.text && (
                          <p className="whitespace-pre-wrap wrap-break-word rounded-xl bg-black/15 p-3 text-sm">
                            {message.text}
                          </p>
                        )}
                        {message.media_url && (
                          <a
                            href={message.media_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-cyan-200 underline"
                          >
                            عرض المرفق
                          </a>
                        )}
                      </article>
                    ))}

                  {activeTab === "groups" &&
                    rows.map((group) => {
                      const membersList = Array.isArray(group.members) ? group.members : [];
                      const acceptedCount = membersList.filter(
                        (member) => member && member.status === "accepted"
                      ).length;

                      return (
                        <article key={group._id} className="space-y-3 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h2 className="font-bold">{group.name}</h2>
                              <p className="text-xs text-slate-400">
                                المنشئ: {displayName(group.ownerProfile)} ·{" "}
                                {acceptedCount} أعضاء
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => renameGroup(group)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
                              >
                                تعديل الاسم
                              </button>
                              <button
                                type="button"
                                onClick={() => setGroupLock(group, !group.chatLocked)}
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/20"
                              >
                                {group.chatLocked ? <LockOpen size={14} /> : <Lock size={14} />}
                                {group.chatLocked ? "فتح الشات" : "قفل الشات"}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteGroup(group)}
                                className="rounded-lg border border-rose-300/20 bg-rose-400/10 p-2 text-rose-100 hover:bg-rose-400/20"
                                aria-label="حذف المجموعة"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-2">
                            {membersList.map((member, idx) => (
                              <div
                                key={member?.userId || member?._id || idx}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 p-3"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {displayName(member?.profile)}
                                    {String(member?.userId) === String(group.owner) && (
                                      <span className="mr-2 text-xs text-amber-200">المنشئ</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {member?.status === "pending"
                                      ? "طلب معلّق"
                                      : member?.role === "admin"
                                        ? "مسؤول"
                                        : "عضو"}
                                  </p>
                                </div>
                                {String(member?.userId) !== String(group.owner) && (
                                  <div className="flex gap-1.5">
                                    {member?.status === "accepted" && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateMember(
                                            group,
                                            member,
                                            member?.role === "admin" ? "member" : "admin"
                                          )
                                        }
                                        className="rounded-lg bg-violet-400/10 px-2 py-1.5 text-[11px] text-violet-100 hover:bg-violet-400/20"
                                      >
                                        {member?.role === "admin" ? "إزالة المسؤول" : "تعيين مسؤول"}
                                      </button>
                                    )}
                                    {member?.status === "pending" && (
                                      <button
                                        type="button"
                                        onClick={() => updateMember(group, member, "accept")}
                                        className="rounded-lg bg-emerald-400/10 px-2 py-1.5 text-[11px] text-emerald-100 hover:bg-emerald-400/20"
                                      >
                                        قبول الطلب
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => updateMember(group, member, "remove")}
                                      className="rounded-lg bg-rose-400/10 px-2 py-1.5 text-[11px] text-rose-100 hover:bg-rose-400/20"
                                    >
                                      إزالة
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                </div>
              )}

              <footer className="flex items-center justify-between border-t border-white/10 p-4 text-sm text-slate-400">
                <span>
                  {total === 0 ? "0" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`} من {total}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-white/10 p-2 disabled:opacity-40"
                    aria-label="الصفحة السابقة"
                  >
                    <ChevronRight size={17} />
                  </button>
                  <button
                    type="button"
                    disabled={page >= pageCount || loading}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-white/10 p-2 disabled:opacity-40"
                    aria-label="الصفحة التالية"
                  >
                    <ChevronLeft size={17} />
                  </button>
                </div>
              </footer>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;
