// import { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { ref, onValue, update } from "firebase/database";
// import Header from "../components/Header";
// import Footer from "../components/Footer";

// export default function AdminDashboard() {
//   const [tasks, setTasks] = useState([]);

//   useEffect(() => {
//     const tasksRef = ref(db, "tasks");

//     onValue(tasksRef, (snapshot) => {
//       const data = snapshot.val();
//       if (data) {
//         const taskList = Object.entries(data).map(([id, value]) => ({
//           id,
//           ...value,
//         }));
//         setTasks(taskList);
//       }
//     });
//   }, []);

//   const handleAccept = (id) => {
//     update(ref(db, `tasks/${id}`), {
//       status: "accepted",
//     });
//   };

//   return (
//     <>

//       <div className="p-5">
//         <h2>Admin Dashboard</h2>

//         {tasks.map((task) => (
//           <div key={task.id} className="border p-3 my-2">
//             <p><b>Task:</b> {task.text}</p>
//             <p><b>User:</b> {task.user}</p>
//             <p><b>Status:</b> {task.status}</p>

//             {task.status !== "accepted" && (
//               <button onClick={() => handleAccept(task.id)}>
//                 Accept
//               </button>
//             )}
//           </div>
//         ))}
//       </div>

//     </>
//   );
// }



import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-yellow-500", "bg-red-500", "bg-indigo-500", "bg-pink-500",
];
function avatarColor(uid) {
  const hash = [...(uid || "x")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers]           = useState({});
  const [allTasks, setAllTasks]     = useState({});   // { uid: { taskId: task } }
  const [allAttend, setAllAttend]   = useState({});   // { uid: { date: record } }
  const [allLeaves, setAllLeaves]   = useState({});   // { uid: { leaveId: leave } }

  useEffect(() => {
    const unsubs = [];
    unsubs.push(onValue(ref(db, "users"),      (s) => setUsers(s.val()      || {})));
    unsubs.push(onValue(ref(db, "tasks"),      (s) => setAllTasks(s.val()   || {})));
    unsubs.push(onValue(ref(db, "attendance"), (s) => setAllAttend(s.val()  || {})));
    unsubs.push(onValue(ref(db, "leaves"),     (s) => setAllLeaves(s.val()  || {})));
    return () => unsubs.forEach((u) => u());
  }, []);

  // Flatten all tasks into array with uid attached
  const taskList = Object.entries(allTasks).flatMap(([uid, tasks]) =>
    Object.entries(tasks || {}).map(([id, t]) => ({ id, uid, ...t }))
  );
  const totalTasks     = taskList.length;
  const completedTasks = taskList.filter((t) => t.status === "Done").length;
  const pendingTasks   = taskList.filter((t) => t.status === "Pending").length;
  const inProgressTasks = taskList.filter((t) => t.status === "In Progress").length;
  const highPriority   = taskList.filter((t) => t.priority === "High" && t.status !== "Done").length;
  const completePct    = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const teamMembers = Object.entries(users);
  const memberCount = teamMembers.length;

  // Pending leaves
  const leaveList = Object.entries(allLeaves).flatMap(([uid, leaves]) =>
    Object.entries(leaves || {}).map(([id, l]) => ({ id, uid, ...l }))
  );
  const pendingLeaves = leaveList.filter((l) => l.status === "Pending").length;

  // Per-member stats
  const memberStats = teamMembers.map(([uid, u]) => {
    const tasks    = Object.values(allTasks[uid] || {});
    const done     = tasks.filter((t) => t.status === "Done").length;
    const pend     = tasks.filter((t) => t.status !== "Done").length;
    const attRecs  = Object.values(allAttend[uid] || {});
    const present  = attRecs.filter((a) => a.status === "Present" || a.status === "Late").length;
    const total    = attRecs.length;
    const pct      = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    return { uid, name: u.name || "—", designation: u.designation || u.role || "—",
             tasks: tasks.length, done, pend, present, totalDays: total, pct };
  });

  // Project health: group tasks by project
  const projectMap = {};
  taskList.forEach((t) => {
    if (!t.project) return;
    if (!projectMap[t.project]) projectMap[t.project] = { total: 0, done: 0 };
    projectMap[t.project].total++;
    if (t.status === "Done") projectMap[t.project].done++;
  });

  // Recent activity: last 6 tasks sorted by createdAt desc
  const recentActivity = [...taskList]
    .filter((t) => t.createdAt || t.status === "Done")
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  // Tasks closed per last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const closedPerDay = last7.map((day) =>
    taskList.filter((t) => t.status === "Done" && (t.createdAt || "").startsWith(day)).length
  );
  const maxBar = Math.max(...closedPerDay, 1);

  // Donut
  const radius = 42;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (completePct / 100) * circ;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            🛡 ADMIN VIEW
          </span>
        </div>
        {pendingLeaves > 0 && (
          <button
            onClick={() => navigate("/admin/leave")}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-100 transition"
          >
            ⚠ {pendingLeaves} Leave{pendingLeaves > 1 ? "s" : ""} Pending · Review →
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold text-slate-800 mb-0.5">Team Command Center</h1>
      <p className="text-slate-400 text-sm mb-6">{today}</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "TOTAL TASKS",    value: totalTasks,   sub: `${inProgressTasks} in progress`, color: "border-l-blue-400",   icon: "📋" },
          { label: "COMPLETED",      value: completedTasks, sub: `${completePct}% rate`,         color: "border-l-green-400",  icon: "✅" },
          { label: "PENDING",        value: pendingTasks + inProgressTasks, sub: `${highPriority} high priority`, color: "border-l-yellow-400", icon: "⏳" },
          { label: "TEAM MEMBERS",   value: memberCount,  sub: "All active",                     color: "border-l-purple-400", icon: "👥" },
          { label: "LEAVE REQUESTS", value: pendingLeaves, sub: "Awaiting approval",              color: "border-l-red-400",    icon: "📅" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-slate-700">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Team Performance table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Team Performance</h3>
            <button onClick={() => navigate("/admin/attendance")} className="text-xs text-blue-500 hover:underline">
              View Attendance →
            </button>
          </div>
          {memberStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No team members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {["Member", "Tasks", "Done", "Pend.", "Attend.", "Progress"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {memberStats.map((m) => (
                    <tr key={m.uid} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 ${avatarColor(m.uid)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {initials(m.name)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 text-sm">{m.name}</p>
                            <p className="text-[11px] text-slate-400">{m.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{m.tasks}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{m.done}</td>
                      <td className="px-4 py-3 font-semibold text-orange-500">{m.pend}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {m.totalDays > 0 ? `${m.present}/${m.totalDays}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${m.pct}%`,
                                backgroundColor: m.pct === 100 ? "#22c55e" : m.pct > 50 ? "#f59e0b" : "#3b82f6",
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{m.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Completion Overview donut */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Completion Overview</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="50" cy="50" r={radius} fill="none"
                    stroke="#3b82f6" strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-700">{completePct}%</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-600">Done: {completedTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
                  <span className="text-slate-600">Active: {inProgressTasks}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-slate-600">Pending: {pendingTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Closed / Week bar chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Tasks Closed / Week</h3>
            <div className="flex items-end gap-1.5 h-16">
              {closedPerDay.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-green-400 rounded-sm transition-all"
                    style={{ height: `${Math.max((count / maxBar) * 52, count > 0 ? 8 : 3)}px` }}
                  />
                  <span className="text-[9px] text-slate-400">
                    {["S","M","T","W","T","F","S"][new Date(last7[i]).getDay()]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Project Health */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Project Health</h3>
          {Object.keys(projectMap).length === 0 ? (
            <p className="text-sm text-slate-400">No project data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(projectMap).map(([proj, { total, done }]) => {
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={proj}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-orange-300 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{proj}</span>
                      </div>
                      <span className={`text-xs font-semibold ${pct === 100 ? "text-green-600" : pct > 50 ? "text-blue-600" : "text-orange-500"}`}>
                        {done}/{total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: pct === 100 ? "#22c55e" : pct > 50 ? "#3b82f6" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((t) => {
                const u = users[t.uid];
                return (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className={`w-6 h-6 ${t.status === "Done" ? "bg-green-100" : "bg-blue-100"} rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5`}>
                      {t.status === "Done" ? "✅" : "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">
                        <span className="font-medium">{t.title}</span>
                        {t.status === "Done" && <span className="text-slate-400"> marked Done</span>}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {u?.name || "Unknown"} · {timeAgo(t.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}