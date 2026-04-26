import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-yellow-500","bg-red-500","bg-indigo-500"];
function avatarColor(uid) {
  const h = [...(uid||"x")].reduce((a,c)=>a+c.charCodeAt(0),0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  return (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
}
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
}
function to12hr(time24) {
  if (!time24 || time24==="--:--") return "--:--";
  const [h,m] = time24.split(":").map(Number);
  const ampm  = h>=12 ? "PM" : "AM";
  return `${h%12||12}:${String(m).padStart(2,"0")} ${ampm}`;
}

export default function AdminAttendance() {
  const [users, setUsers]         = useState({});
  const [allAttend, setAllAttend] = useState({});
  const [selectedUid, setSelectedUid] = useState(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });
  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const u1 = onValue(ref(db,"users"),      (s) => {
      const data = s.val() || {};
      setUsers(data);
      setSelectedUid((prev) => prev || Object.keys(data)[0] || null);
    });
    const u2 = onValue(ref(db,"attendance"), (s) => setAllAttend(s.val()||{}));
    return () => { u1(); u2(); };
  }, []);

  const selectedUser   = users[selectedUid] || null;
  const userAttend     = allAttend[selectedUid] || {};
  const todayRecord    = userAttend[todayKey] || null;

  const logs = Object.entries(userAttend)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  const presentDays = Object.values(userAttend).filter(r => r.status==="Present"||r.status==="Late").length;
  const totalDays   = Object.keys(userAttend).length;

  const statusBadge = (s) => {
    if (s==="Present") return "bg-green-100 text-green-700";
    if (s==="Late")    return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Attendance Management</h1>
      <p className="text-slate-400 text-sm mb-5">{today}</p>

      {/* Employee selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {Object.keys(users).length === 0 ? (
          <p className="text-sm text-slate-400">No team members found.</p>
        ) : (
          Object.entries(users).map(([uid, u]) => {
            const isSelected = uid === selectedUid;
            return (
              <button
                key={uid}
                onClick={() => setSelectedUid(uid)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition border
                  ${isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
              >
                <div className={`w-6 h-6 ${avatarColor(uid)} rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {initials(u.name)}
                </div>
                {u.name?.split(" ")[0]} {u.name?.split(" ")[1]?.[0]}.
              </button>
            );
          })
        )}
      </div>

      {selectedUser && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

            {/* Today's card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-1">
                Today — {selectedUser.name}
              </h3>
              <p className="text-xs text-slate-400 mb-4">{selectedUser.designation || selectedUser.role || "Team Member"}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Punch In</p>
                  <p className="text-2xl font-bold text-slate-700 font-mono">
                    {todayRecord?.punchIn12 || to12hr(todayRecord?.punchIn) || "--:--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Punch Out</p>
                  <p className="text-2xl font-bold text-slate-700 font-mono">
                    {todayRecord?.punchOut12 || to12hr(todayRecord?.punchOut) || "--:--"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Status</p>
                  {todayRecord ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(todayRecord.status)}`}>
                      {todayRecord.status}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Hours</p>
                  <p className="text-sm font-semibold text-slate-700">{todayRecord?.hours || "—"}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">Shift</p>
                  <p className="text-xs font-medium text-blue-600 truncate">{todayRecord?.shiftName || "—"}</p>
                </div>
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-4">Attendance Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 rounded-xl p-3.5 text-center">
                  <p className="text-2xl font-bold text-green-600">{presentDays}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Days Present</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 text-center">
                  <p className="text-2xl font-bold text-slate-600">{totalDays}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Records</p>
                </div>
              </div>
              {totalDays > 0 && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Attendance rate</span>
                    <span className="text-xs font-semibold text-slate-700">
                      {Math.round((presentDays / totalDays) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.round((presentDays/totalDays)*100)}%` }}
                    />
                  </div>
                </>
              )}
              {totalDays === 0 && (
                <p className="text-sm text-slate-400 text-center mt-4">No records yet for this employee.</p>
              )}
            </div>
          </div>

          {/* Attendance Log */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-semibold text-slate-800">Attendance Log — {selectedUser.name}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {["Date","Shift","Status","In","Out","Hours"].map(h=>(
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                        No attendance records yet
                      </td>
                    </tr>
                  ) : (
                    logs.map((rec) => (
                      <tr key={rec.date} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDateLabel(rec.date)}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{rec.shiftName||"—"}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-green-600 font-medium font-mono whitespace-nowrap">
                          {rec.punchIn12 || to12hr(rec.punchIn)}
                        </td>
                        <td className="px-5 py-3.5 text-red-500 font-medium font-mono whitespace-nowrap">
                          {rec.punchOut12 || to12hr(rec.punchOut) || "--:--"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{rec.hours||"—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}