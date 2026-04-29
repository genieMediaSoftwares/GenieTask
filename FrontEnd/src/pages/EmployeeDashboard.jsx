import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { FaIdBadge, FaCheckCircle } from "react-icons/fa";

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function to12hr(t) {
  if (!t || t === "--:--") return "--:--";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function normalizeStatus(status) {
  if (status === "To Do")     return "Pending";
  if (status === "In Review") return "In Progress";
  return status;
}

export default function EmployeeDashboard() {
  const user       = auth.currentUser;
  const parts      = (user?.displayName || "User|employee|").split("|");
  const fullName   = parts[0] || "User";
  const firstName  = fullName.split(" ")[0];
  const employeeId = parts[2] || "";
  const navigate   = useNavigate();

  const [tasks,        setTasks]        = useState([]);
  const [attendance,   setAttendance]   = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ casual: 0, sick: 0, privilege: 0 });
  const [leaves,       setLeaves]       = useState([]);
  const [profile,      setProfile]      = useState({ designation: "", department: "", employeeId: "" });

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    unsubs.push(onValue(ref(db, "assignedTasks"), (snap) => {
      const data = snap.val() || {};
      setTasks(
        Object.entries(data)
          .filter(([, v]) => v.assignedTo === user.uid)
          .map(([id, v]) => ({ id, ...v, status: normalizeStatus(v.status) }))
      );
    }));
    unsubs.push(onValue(ref(db, `attendance/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setAttendance(
        Object.entries(data)
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
      );
    }));
    unsubs.push(onValue(ref(db, `leaveBalance/${user.uid}`), (snap) => {
      if (snap.val()) setLeaveBalance(snap.val());
    }));
    unsubs.push(onValue(ref(db, `leaves/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setLeaves(Object.entries(data).map(([id, v]) => ({ id, ...v })));
    }));
    unsubs.push(onValue(ref(db, `users/${user.uid}`), (snap) => {
      if (snap.val()) setProfile(snap.val());
    }));

    return () => unsubs.forEach(u => u());
  }, [user?.uid]);

  const totalTasks      = tasks.length;
  const completedTasks  = tasks.filter(t => t.status === "Done").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const pendingTasks    = tasks.filter(t => t.status === "Pending").length;
  const completedPct    = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const presentDays     = attendance.filter(a => a.status === "Present" || a.status === "Late").length;
  const totalDays       = attendance.length;
  const attendancePct   = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const upcomingTasks     = tasks.filter(t => t.status !== "Done").slice(0, 4);
  const recentlyCompleted = tasks.filter(t => t.status === "Done").slice(0, 3);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const radius = 38;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (completedPct / 100) * circ;

  const statusBadge = (s) => {
    if (s === "Done")        return "bg-green-50 text-green-700 border border-green-200";
    if (s === "In Progress") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-orange-50 text-orange-600 border border-orange-200";
  };
  const attendanceBadge = (s) => {
    if (s === "Present") return "bg-green-100 text-green-700";
    if (s === "Late")    return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };
  const priorityDot = (p) => {
    if (p === "High")   return "bg-red-500";
    if (p === "Medium") return "bg-orange-400";
    return "bg-green-400";
  };

  const empId = profile.employeeId || employeeId;

  return (

    <div className="pt-[68px] px-3 pb-6 sm:px-5 sm:pt-[68px] lg:pt-6 lg:px-6 max-w-[1200px] mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-5">

        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-50 text-blue-600 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-blue-200 whitespace-nowrap">
            👤 EMPLOYEE VIEW
          </span>
          {empId && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
              <FaIdBadge className="text-slate-400 text-[10px]" /> {empId}
            </span>
          )}
          {profile.department  && <span className="text-xs text-slate-400 hidden md:inline">{profile.department}</span>}
          {profile.designation && <span className="text-xs text-slate-500 font-medium hidden md:inline">{profile.designation}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/employee/attendance")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200
              text-rose-600 text-xs sm:text-sm font-medium hover:bg-rose-100 transition whitespace-nowrap"
          >
            📍 Attendance
          </button>
          <button
            onClick={() => navigate("/employee/leave")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200
              text-blue-600 text-xs sm:text-sm font-medium hover:bg-blue-100 transition whitespace-nowrap"
          >
            📋 Apply Leave
          </button>
        </div>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-0.5">
        Good morning, {firstName} 👋
      </h1>
      <p className="text-slate-400 text-xs sm:text-sm mb-5">{today}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        {[
          { label: "MY TASKS",     value: totalTasks,                                          sub: `${inProgressTasks} in progress`,                           color: "border-l-blue-400",   icon: "📋", val_color: "text-blue-500"   },
          { label: "COMPLETED",    value: completedTasks,                                      sub: `${completedPct}% done`,                                    color: "border-l-green-400",  icon: "✅", val_color: "text-green-500"  },
          { label: "PENDING",      value: pendingTasks + inProgressTasks,                      sub: "Action needed",                                            color: "border-l-orange-400", icon: "⏳", val_color: "text-orange-500" },
          { label: "DAYS PRESENT", value: totalDays > 0 ? `${presentDays}/${totalDays}` : "—", sub: totalDays > 0 ? `${attendancePct}% attendance` : "No records yet", color: "border-l-purple-400", icon: "📍", val_color: "text-purple-500" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-3 sm:p-4 border-l-4 ${s.color} shadow-sm`}>
            <div className="flex justify-between items-start">
              <div className="min-w-0 pr-1">
                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mb-1 tracking-wide leading-tight uppercase">
                  {s.label}
                </p>
                <p className={`text-lg sm:text-2xl font-bold ${s.val_color}`}>{s.value}</p>
                <p className="text-[9px] sm:text-xs text-slate-400 mt-0.5 leading-tight">{s.sub}</p>
              </div>
              <span className="text-lg sm:text-2xl shrink-0">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-5">

        <div className="lg:col-span-3 space-y-3 sm:space-y-5">

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">My Assigned Tasks</h3>
                <p className="text-xs text-slate-400 mt-0.5">Assigned by your admin</p>
              </div>
              <button onClick={() => navigate("/employee/tasks")}
                className="text-xs text-blue-500 hover:underline ml-2 whitespace-nowrap">
                View all →
              </button>
            </div>

            {totalTasks === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-2xl mb-1">📭</p>
                <p className="text-sm">No tasks assigned yet.</p>
                <p className="text-xs mt-0.5">Your admin will assign tasks soon.</p>
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm">All tasks completed!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {upcomingTasks.map(task => (
                  <div key={task.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot(task.priority)}`} />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-700 truncate">{task.title}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                          {task.project && <span className="mr-1">{task.project}</span>}
                          {task.dueDate && <span>· Due {task.dueDate}</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Recent Attendance</h3>
              <button onClick={() => navigate("/employee/attendance")}
                className="text-xs text-blue-500 hover:underline">Details →</button>
            </div>
            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">No records yet. Mark your attendance!</p>
            ) : (
              <div className="space-y-2.5">
                {attendance.map(rec => (
                  <div key={rec.date} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-slate-600 w-[66px] sm:w-28 shrink-0 text-[10px] sm:text-xs leading-tight">
                      {formatDateLabel(rec.date)}
                    </span>
                    <span className="text-slate-400 flex-1 font-mono text-[10px] sm:text-xs truncate">
                      {to12hr(rec.punchIn12 || rec.punchIn)} – {to12hr(rec.punchOut12 || rec.punchOut)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${attendanceBadge(rec.status)}`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">My Progress</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#3b82f6" strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-bold text-slate-700">{completedPct}%</span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                {[
                  { color: "bg-blue-500",   label: "Done",        val: completedTasks  },
                  { color: "bg-orange-400", label: "In Progress", val: inProgressTasks },
                  { color: "bg-slate-300",  label: "Pending",     val: pendingTasks    },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d.color} shrink-0`} />
                    <span className="text-slate-600">{d.label}: {d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 sm:mb-4 text-sm sm:text-base">Leave Balance</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-500">{leaveBalance.casual ?? 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Casual</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-xl sm:text-2xl font-bold text-red-400">{leaveBalance.sick ?? 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Sick</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-500">{leaveBalance.privilege ?? 0}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Privilege</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Leave History</h3>
              <button onClick={() => navigate("/employee/leave")}
                className="text-xs text-blue-500 hover:underline">View all →</button>
            </div>
            {leaves.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400">No leave requests yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {leaves.slice(0, 3).map(leave => {
                  const badge =
                    leave.status === "Approved" ? "bg-green-100 text-green-700"
                    : leave.status === "Rejected" ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700";
                  return (
                    <div key={leave.id}
                      className="flex items-center justify-between py-2 first:pt-0 last:pb-0 gap-2">
                      <div className="min-w-0">
                        <p className="text-slate-700 font-medium text-xs sm:text-sm">{leave.type}</p>
                        <p className="text-slate-400 text-[10px] truncate">{leave.from} – {leave.to}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
                        {leave.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-1.5 text-sm sm:text-base">
              Recently Completed <span>✅</span>
            </h3>
            {recentlyCompleted.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400">No completed tasks yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentlyCompleted.map(task => (
                  <div key={task.id} className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
                    <FaCheckCircle className="text-green-500 shrink-0 text-xs" />
                    <span className="text-xs sm:text-sm text-slate-400 line-through truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}