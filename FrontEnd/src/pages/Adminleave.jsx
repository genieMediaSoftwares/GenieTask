import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue, update, remove } from "firebase/database";

const AVATAR_COLORS = [
  "bg-blue-500","bg-purple-500","bg-green-500",
  "bg-yellow-500","bg-red-500","bg-indigo-500","bg-pink-500",
];
function avatarColor(uid) {
  const h = [...(uid||"x")].reduce((a,c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  return (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
}

const TYPE_EMOJI = { Sick:"🤒", Casual:"🌴", Privilege:"⭐", Emergency:"🚨" };

export default function AdminLeave() {
  const [users,        setUsers]        = useState({});
  const [allLeaves,    setAllLeaves]    = useState({});
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const u1 = onValue(ref(db, "users"),  s => setUsers(s.val()    || {}));
    const u2 = onValue(ref(db, "leaves"), s => setAllLeaves(s.val()|| {}));
    return () => { u1(); u2(); };
  }, []);

  const leaveList = Object.entries(allLeaves).flatMap(([uid, leaves]) =>
    Object.entries(leaves||{}).map(([id, l]) => ({ id, uid, ...l }))
  ).sort((a, b) => new Date(b.appliedOn||0) - new Date(a.appliedOn||0));

  const total    = leaveList.length;
  const approved = leaveList.filter(l => l.status === "Approved").length;
  const pending  = leaveList.filter(l => l.status === "Pending").length;
  const rejected = leaveList.filter(l => l.status === "Rejected").length;

  const filtered = filterStatus === "All"
    ? leaveList
    : leaveList.filter(l => l.status === filterStatus);

  const handleAction = (uid, id, status) =>
    update(ref(db, `leaves/${uid}/${id}`), { status });

  const handleDelete = (uid, id) => {
    if (window.confirm("Are you sure you want to delete this leave request? This cannot be undone.")) {
      remove(ref(db, `leaves/${uid}/${id}`));
    }
  };

  const statusBadge = (s) => {
    if (s === "Approved") return "bg-green-100 text-green-700 border border-green-200";
    if (s === "Rejected") return "bg-red-100 text-red-600 border border-red-200";
    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  };

  const typeColor = (t) => {
    if (t === "Sick")      return "bg-red-50 text-red-600 border-red-200";
    if (t === "Privilege") return "bg-purple-50 text-purple-600 border-purple-200";
    if (t === "Emergency") return "bg-rose-50 text-rose-600 border-rose-200";
    return "bg-blue-50 text-blue-600 border-blue-200";
  };

  return (

    <div className="pt-[68px] px-3 pb-6 sm:px-5 sm:pt-[68px] lg:pt-6 lg:px-6 max-w-[1000px] mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Leave Management</h1>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            {pending > 0
              ? `${pending} request${pending > 1 ? "s" : ""} awaiting approval`
              : "All requests reviewed"}
          </p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide shrink-0">
          {[
            { key:"All",      count: total    },
            { key:"Pending",  count: pending  },
            { key:"Approved", count: approved },
            { key:"Rejected", count: rejected },
          ].map(({ key, count }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm
                font-medium transition whitespace-nowrap shrink-0
                ${filterStatus === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              {key}
              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                ${filterStatus === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
        {[
          { label:"Total",    value:total,    color:"border-t-blue-400",   vcolor:"text-blue-500"   },
          { label:"Approved", value:approved, color:"border-t-green-400",  vcolor:"text-green-500"  },
          { label:"Pending",  value:pending,  color:"border-t-yellow-400", vcolor:"text-yellow-500" },
          { label:"Rejected", value:rejected, color:"border-t-red-400",    vcolor:"text-red-500"    },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-3 sm:p-5 shadow-sm border-t-4 ${s.color}`}>
            <p className={`text-2xl sm:text-3xl font-bold ${s.vcolor}`}>{s.value}</p>
            <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 sm:py-16 text-slate-400 bg-white rounded-xl border border-slate-100">
          <p className="text-3xl sm:text-4xl mb-3">🏖️</p>
          <p className="text-sm">
            No leave requests{filterStatus !== "All" ? ` with status "${filterStatus}"` : " yet"}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {filtered.map(leave => {
            const u         = users[leave.uid];
            const isPending = leave.status === "Pending";
            return (
              <div key={leave.id} className="px-4 sm:px-5 py-4 hover:bg-slate-50/60 transition">

                <div className="hidden sm:flex items-center gap-4">
                  <div className={`w-10 h-10 ${avatarColor(leave.uid)} rounded-full flex items-center
                    justify-center text-white text-sm font-bold shrink-0`}>
                    {initials(u?.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{u?.name || "Unknown"}</p>
                      <span className="text-xs text-slate-400">{u?.designation || u?.role || "Member"}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      <span className="font-medium">{leave.type} Leave</span>
                      <span className="text-slate-400 mx-1.5">·</span>
                      <span>{leave.from} → {leave.to}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">Reason: {leave.reason}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Applied</p>
                    <p className="text-xs font-medium text-slate-600">{leave.appliedOn || "—"}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(leave.status)}`}>
                          Pending
                        </span>
                        <button
                          onClick={() => handleAction(leave.uid, leave.id, "Approved")}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition active:scale-95"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(leave.uid, leave.id, "Rejected")}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition active:scale-95"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs px-2.5 py-1.5 rounded-full font-semibold ${statusBadge(leave.status)}`}>
                        {leave.status}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(leave.uid, leave.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition active:scale-95"
                      title="Delete leave request"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="sm:hidden">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 ${avatarColor(leave.uid)} rounded-full flex items-center
                        justify-center text-white text-xs font-bold shrink-0`}>
                        {initials(u?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{u?.name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{u?.designation || u?.role || "Member"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${statusBadge(leave.status)}`}>
                        {leave.status}
                      </span>
                      <button
                        onClick={() => handleDelete(leave.uid, leave.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition active:scale-95"
                        title="Delete leave request"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${typeColor(leave.type)}`}>
                      {TYPE_EMOJI[leave.type] || ""} {leave.type}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {leave.from} → {leave.to}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">
                    {leave.reason}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-400">
                      Applied: <span className="font-medium text-slate-500">{leave.appliedOn || "—"}</span>
                    </p>
                    {isPending && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAction(leave.uid, leave.id, "Approved")}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white
                            text-[10px] font-bold rounded-lg transition active:scale-95"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleAction(leave.uid, leave.id, "Rejected")}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white
                            text-[10px] font-bold rounded-lg transition active:scale-95"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}