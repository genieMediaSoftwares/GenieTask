import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue, update } from "firebase/database";

const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-yellow-500","bg-red-500","bg-indigo-500","bg-pink-500"];
function avatarColor(uid) {
  const h = [...(uid||"x")].reduce((a,c)=>a+c.charCodeAt(0),0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  return (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
}

export default function AdminLeave() {
  const [users, setUsers]       = useState({});
  const [allLeaves, setAllLeaves] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const u1 = onValue(ref(db,"users"),  (s) => setUsers(s.val()||{}));
    const u2 = onValue(ref(db,"leaves"), (s) => setAllLeaves(s.val()||{}));
    return () => { u1(); u2(); };
  }, []);

  // Flatten all leaves with uid
  const leaveList = Object.entries(allLeaves).flatMap(([uid, leaves]) =>
    Object.entries(leaves||{}).map(([id,l]) => ({ id, uid, ...l }))
  ).sort((a,b) => new Date(b.appliedOn||0) - new Date(a.appliedOn||0));

  const total    = leaveList.length;
  const approved = leaveList.filter(l=>l.status==="Approved").length;
  const pending  = leaveList.filter(l=>l.status==="Pending").length;

  const filtered = filterStatus==="All" ? leaveList : leaveList.filter(l=>l.status===filterStatus);

  const handleAction = (uid, id, status) => {
    update(ref(db, `leaves/${uid}/${id}`), { status });
  };

  const statusBadge = (s) => {
    if (s==="Approved") return "bg-green-100 text-green-700 border border-green-200";
    if (s==="Rejected") return "bg-red-100 text-red-600 border border-red-200";
    return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
        {/* Filter tabs */}
        <div className="flex gap-2">
          {["All","Pending","Approved","Rejected"].map(f=>(
            <button key={f} onClick={()=>setFilterStatus(f)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition
                ${filterStatus===f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-t-blue-400">
          <p className="text-3xl font-bold text-blue-500">{total}</p>
          <p className="text-sm text-slate-500 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-t-green-400">
          <p className="text-3xl font-bold text-green-500">{approved}</p>
          <p className="text-sm text-slate-500 mt-1">Approved</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-t-yellow-400">
          <p className="text-3xl font-bold text-yellow-500">{pending}</p>
          <p className="text-sm text-slate-500 mt-1">Pending</p>
        </div>
      </div>

      {/* Leave list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏖️</p>
          <p className="text-sm">No leave requests {filterStatus!=="All" ? `with status "${filterStatus}"` : "yet"}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {filtered.map((leave) => {
            const u = users[leave.uid];
            const isPending = leave.status === "Pending";
            return (
              <div key={leave.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition">
                {/* Avatar */}
                <div className={`w-10 h-10 ${avatarColor(leave.uid)} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {initials(u?.name)}
                </div>

                {/* Info */}
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
                  <p className="text-xs text-slate-400 mt-0.5">Reason: {leave.reason}</p>
                </div>

                {/* Applied date */}
                <div className="text-right shrink-0 hidden md:block">
                  <p className="text-xs text-slate-400">Applied</p>
                  <p className="text-xs font-medium text-slate-600">{leave.appliedOn || "—"}</p>
                </div>

                {/* Action */}
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}