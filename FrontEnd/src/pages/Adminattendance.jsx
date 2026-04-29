import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

const AVATAR_COLORS = [
  "bg-blue-500","bg-purple-500","bg-green-500",
  "bg-yellow-500","bg-red-500","bg-indigo-500",
];
function avatarColor(uid) {
  const h = [...(uid||"x")].reduce((a,c) => a + c.charCodeAt(0), 0);
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
function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}
function to12hr(time24) {
  if (!time24 || time24 === "--:--") return "--:--";
  const [h, m] = time24.split(":").map(Number);
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}

export default function AdminAttendance() {
  const [users,       setUsers]       = useState({});
  const [allAttend,   setAllAttend]   = useState({});
  const [selectedUid, setSelectedUid] = useState(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday:"long", day:"numeric", month:"long", year:"numeric",
  });
  const todayKey = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const u1 = onValue(ref(db, "users"), (s) => {
      const data = s.val() || {};
      setUsers(data);
      setSelectedUid(prev => prev || Object.keys(data)[0] || null);
    });
    const u2 = onValue(ref(db, "attendance"), (s) => setAllAttend(s.val() || {}));
    return () => { u1(); u2(); };
  }, []);

  const selectedUser = users[selectedUid] || null;
  const userAttend   = allAttend[selectedUid] || {};
  const todayRecord  = userAttend[todayKey] || null;

  const logs = Object.entries(userAttend)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 15);

  const presentDays = Object.values(userAttend).filter(r => r.status==="Present"||r.status==="Late").length;
  const totalDays   = Object.keys(userAttend).length;
  const attendPct   = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const statusBadge = (s) => {
    if (s === "Present") return "bg-green-100 text-green-700";
    if (s === "Late")    return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (

    <div className="pt-[68px] px-3 pb-6 sm:px-5 sm:pt-[68px] lg:pt-6 lg:px-6 max-w-[1100px] mx-auto">

      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-0.5">Attendance Management</h1>
      <p className="text-slate-400 text-xs sm:text-sm mb-5">{today}</p>


      {Object.keys(users).length === 0 ? (
        <p className="text-sm text-slate-400 mb-5">No team members found.</p>
      ) : (
        <div className="mb-5 sm:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible
            scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            {Object.entries(users).map(([uid, u]) => {
              const isSelected = uid === selectedUid;
              const { present, total } = (() => {
                const att   = allAttend[uid] || {};
                const pres  = Object.values(att).filter(r => r.status==="Present"||r.status==="Late").length;
                const tot   = Object.keys(att).length;
                return { present: pres, total: tot };
              })();
              return (
                <button
                  key={uid}
                  onClick={() => setSelectedUid(uid)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs sm:text-sm
                    font-medium transition border shrink-0
                    ${isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                >
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 ${avatarColor(uid)} rounded-full flex items-center
                    justify-center text-white text-[9px] sm:text-[10px] font-bold shrink-0`}>
                    {initials(u.name)}
                  </div>
                  <span className="whitespace-nowrap">
                    {u.name?.split(" ")[0]}
                    {u.name?.split(" ")[1] ? ` ${u.name.split(" ")[1][0]}.` : ""}
                  </span>
                  {total > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                      ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {Math.round((present/total)*100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedUser && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 mb-4 sm:mb-5">

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-0.5 text-sm sm:text-base">
                Today — {selectedUser.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400 mb-4">
                {selectedUser.designation || selectedUser.role || "Team Member"}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="bg-slate-50 rounded-xl p-3 sm:p-0 sm:bg-transparent sm:rounded-none">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Punch In</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-700 font-mono leading-none">
                    {todayRecord?.punchIn12 || to12hr(todayRecord?.punchIn) || "--:--"}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 sm:p-0 sm:bg-transparent sm:rounded-none">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Punch Out</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-700 font-mono leading-none">
                    {todayRecord?.punchOut12 || to12hr(todayRecord?.punchOut) || "--:--"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Status</p>
                  {todayRecord ? (
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${statusBadge(todayRecord.status)}`}>
                      {todayRecord.status}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5">Hours</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">{todayRecord?.hours || "—"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5">Shift</p>
                  <p className="text-[10px] sm:text-xs font-medium text-blue-600 truncate">{todayRecord?.shiftName || "—"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Attendance Summary</h3>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="bg-green-50 rounded-xl p-3 sm:p-3.5 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{presentDays}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Days Present</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 sm:p-3.5 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-slate-600">{totalDays}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Total Records</p>
                </div>
              </div>

              {totalDays > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-xs text-slate-500">Attendance rate</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-700">{attendPct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width:`${attendPct}%` }}/>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[
                      { label:"Present", val: Object.values(userAttend).filter(r=>r.status==="Present").length,  color:"bg-green-100 text-green-700"  },
                      { label:"Late",    val: Object.values(userAttend).filter(r=>r.status==="Late").length,     color:"bg-yellow-100 text-yellow-700" },
                      { label:"Absent",  val: Object.values(userAttend).filter(r=>r.status==="Absent").length,   color:"bg-red-100 text-red-600"       },
                    ].map(s => (
                      <span key={s.label}
                        className={`text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full ${s.color}`}>
                        {s.val} {s.label}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs sm:text-sm text-slate-400 text-center mt-4">
                  No records yet for this employee.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-50">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                Attendance Log — {selectedUser.name}
              </h3>
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {["Date","Shift","Status","In","Out","Hours"].map(h => (
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
                    logs.map(rec => (
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

            <div className="sm:hidden divide-y divide-slate-50">
              {logs.length === 0 ? (
                <p className="px-4 py-8 text-center text-slate-400 text-sm">No attendance records yet</p>
              ) : (
                logs.map(rec => (
                  <div key={rec.date} className="px-4 py-3.5">
                    {/* Row 1: date + status badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatDateLabel(rec.date)}
                      </span>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusBadge(rec.status)}`}>
                        {rec.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">{rec.shiftName || "—"}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">In</span>
                        <span className="font-mono font-semibold text-green-600">
                          {rec.punchIn12 || to12hr(rec.punchIn) || "--:--"}
                        </span>
                      </div>
                      <span className="text-slate-200">·</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Out</span>
                        <span className="font-mono font-semibold text-red-500">
                          {rec.punchOut12 || to12hr(rec.punchOut) || "--:--"}
                        </span>
                      </div>
                      {rec.hours && (
                        <>
                          <span className="text-slate-200">·</span>
                          <span className="text-slate-500 font-medium">{rec.hours}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}