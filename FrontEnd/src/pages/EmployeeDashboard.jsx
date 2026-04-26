import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function EmployeeDashboard() {
  const user = auth.currentUser;
  const parts = (user?.displayName || "User|employee").split("|");
  const firstName = (parts[0] || "User").split(" ")[0];
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({ casual: 0, sick: 0, privilege: 0 });
  const [leaves, setLeaves] = useState([]);
  const [profile, setProfile] = useState({ designation: "", department: "" });

  useEffect(() => {
    if (!user) return;
    const unsubs = [];
    unsubs.push(onValue(ref(db, `tasks/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setTasks(Object.entries(data).map(([id, v]) => ({ id, ...v })));
    }));
    unsubs.push(onValue(ref(db, `attendance/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      const sorted = Object.entries(data)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setAttendance(sorted);
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
    return () => unsubs.forEach((u) => u());
  }, [user?.uid]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const duePending = pendingTasks + inProgressTasks;
  const completedPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const presentDays = attendance.filter((a) => a.status === "Present" || a.status === "Late").length;
  const totalDays = attendance.length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const upcomingTasks = tasks.filter((t) => t.status !== "Done").slice(0, 3);
  const recentlyCompleted = tasks.filter((t) => t.status === "Done").slice(0, 3);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (completedPct / 100) * circ;

  const statusBadge = (s) => {
    if (s === "Done") return "bg-green-50 text-green-700 border border-green-200";
    if (s === "In Progress") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-orange-50 text-orange-600 border border-orange-200";
  };

  const attendanceBadge = (s) => {
    if (s === "Present") return "bg-green-100 text-green-700";
    if (s === "Late") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const priorityDot = (p) => {
    if (p === "High") return "bg-red-500";
    if (p === "Medium") return "bg-orange-400";
    return "bg-green-400";
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
            👤 EMPLOYEE VIEW
          </span>
          {profile.department && (
            <>
              <span className="text-slate-300 mx-1">/</span>
              <span>{profile.department}</span>
            </>
          )}
          {profile.designation && (
            <>
              <span className="text-slate-300 mx-1">·</span>
              <span>{profile.designation}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/employee/attendance")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-100 transition"
          >
            📍 Mark Attendance
          </button>
          <button
            onClick={() => navigate("/employee/leave")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-100 transition"
          >
            📋 Apply Leave
          </button>
        </div>
      </div>

      {/* Greeting */}
      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        Good morning, {firstName} 👋
      </h1>
      <p className="text-slate-400 text-sm mb-6">{today}</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border-l-4 border-l-blue-400 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">MY TASKS</p>
              <p className="text-2xl font-bold text-blue-500">{totalTasks}</p>
              <p className="text-xs text-slate-400 mt-0.5">{inProgressTasks} in progress</p>
            </div>
            <span className="text-2xl">📋</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border-l-4 border-l-green-400 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">COMPLETED</p>
              <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-xs text-slate-400 mt-0.5">{completedPct}% done</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">DUE/PENDING</p>
              <p className="text-2xl font-bold text-orange-500">{duePending}</p>
              <p className="text-xs text-slate-400 mt-0.5">Action needed</p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border-l-4 border-l-purple-400 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">DAYS PRESENT</p>
              <p className="text-2xl font-bold text-purple-500">
                {totalDays > 0 ? `${presentDays}/${totalDays}` : "—"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalDays > 0 ? `${attendancePct}% attendance` : "No records yet"}
              </p>
            </div>
            <span className="text-2xl">📍</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">My Upcoming Tasks</h3>
              <button
                onClick={() => navigate("/employee/tasks")}
                className="text-xs text-blue-500 hover:underline"
              >
                All tasks →
              </button>
            </div>
            <div className="space-y-0.5">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No pending tasks 🎉</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot(task.priority)}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{task.title}</p>
                        <p className="text-xs text-slate-400">
                          {task.project && <span className="mr-1">{task.project}</span>}
                          {task.dueDate && <span>· Due {task.dueDate}</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${statusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Recent Attendance</h3>
              <button
                onClick={() => navigate("/employee/attendance")}
                className="text-xs text-blue-500 hover:underline"
              >
                Details →
              </button>
            </div>
            <div className="space-y-2.5">
              {attendance.length === 0 ? (
                <p className="text-sm text-slate-400">No records yet. Mark your attendance!</p>
              ) : (
                attendance.map((rec) => (
                  <div key={rec.date} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-600 w-28 shrink-0">{formatDateLabel(rec.date)}</span>
                    <span className="text-slate-400 flex-1 text-xs">{rec.punchIn}–{rec.punchOut}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${attendanceBadge(rec.status)}`}>
                      {rec.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* My Progress donut */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">My Progress</h3>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke="#3b82f6" strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-700">{completedPct}%</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-600">Done: {completedTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-slate-600">In Progress: {inProgressTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-slate-600">Pending: {pendingTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4">Leave Balance</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{leaveBalance.casual ?? 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">Casual</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-2xl font-bold text-red-400">{leaveBalance.sick ?? 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">Sick</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{leaveBalance.privilege ?? 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">Privilege</p>
              </div>
            </div>
          </div>

          {/* Leave History */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">My Leave History</h3>
            {leaves.length === 0 ? (
              <p className="text-sm text-slate-400">No leave requests yet.</p>
            ) : (
              leaves.slice(0, 3).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0 text-sm">
                  <span className="text-slate-600">{leave.type}</span>
                  <span className="text-slate-400 text-xs">{leave.from} – {leave.to}</span>
                </div>
              ))
            )}
          </div>

          {/* Recently Completed */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
              Recently Completed <span>✅</span>
            </h3>
            {recentlyCompleted.length === 0 ? (
              <p className="text-sm text-slate-400">No completed tasks yet.</p>
            ) : (
              recentlyCompleted.map((task) => (
                <div key={task.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <FaCheckCircle className="text-green-500 shrink-0" />
                  <span className="text-slate-500 line-through truncate">{task.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}