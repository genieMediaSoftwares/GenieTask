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



// import { useState, useEffect } from "react";
// import { db } from "../firebase";
// import { ref, onValue } from "firebase/database";
// import { useNavigate } from "react-router-dom";

// const AVATAR_COLORS = [
//   "bg-blue-500", "bg-purple-500", "bg-green-500",
//   "bg-yellow-500", "bg-red-500", "bg-indigo-500", "bg-pink-500",
// ];
// function avatarColor(uid) {
//   const hash = [...(uid || "x")].reduce((a, c) => a + c.charCodeAt(0), 0);
//   return AVATAR_COLORS[hash % AVATAR_COLORS.length];
// }
// function initials(name) {
//   return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
// }
// function timeAgo(ts) {
//   if (!ts) return "";
//   const diff = Date.now() - new Date(ts).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1) return "just now";
//   if (mins < 60) return `${mins} mins ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }

// export default function AdminDashboard() {
//   const navigate = useNavigate();

//   const [users, setUsers]           = useState({});
//   const [allTasks, setAllTasks]     = useState({});   // { uid: { taskId: task } }
//   const [allAttend, setAllAttend]   = useState({});   // { uid: { date: record } }
//   const [allLeaves, setAllLeaves]   = useState({});   // { uid: { leaveId: leave } }

//   useEffect(() => {
//     const unsubs = [];
//     unsubs.push(onValue(ref(db, "users"),      (s) => setUsers(s.val()      || {})));
//     unsubs.push(onValue(ref(db, "tasks"),      (s) => setAllTasks(s.val()   || {})));
//     unsubs.push(onValue(ref(db, "attendance"), (s) => setAllAttend(s.val()  || {})));
//     unsubs.push(onValue(ref(db, "leaves"),     (s) => setAllLeaves(s.val()  || {})));
//     return () => unsubs.forEach((u) => u());
//   }, []);

//   // Flatten all tasks into array with uid attached
//   const taskList = Object.entries(allTasks).flatMap(([uid, tasks]) =>
//     Object.entries(tasks || {}).map(([id, t]) => ({ id, uid, ...t }))
//   );
//   const totalTasks     = taskList.length;
//   const completedTasks = taskList.filter((t) => t.status === "Done").length;
//   const pendingTasks   = taskList.filter((t) => t.status === "Pending").length;
//   const inProgressTasks = taskList.filter((t) => t.status === "In Progress").length;
//   const highPriority   = taskList.filter((t) => t.priority === "High" && t.status !== "Done").length;
//   const completePct    = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

//   const teamMembers = Object.entries(users);
//   const memberCount = teamMembers.length;

//   // Pending leaves
//   const leaveList = Object.entries(allLeaves).flatMap(([uid, leaves]) =>
//     Object.entries(leaves || {}).map(([id, l]) => ({ id, uid, ...l }))
//   );
//   const pendingLeaves = leaveList.filter((l) => l.status === "Pending").length;

//   // Per-member stats
//   const memberStats = teamMembers.map(([uid, u]) => {
//     const tasks    = Object.values(allTasks[uid] || {});
//     const done     = tasks.filter((t) => t.status === "Done").length;
//     const pend     = tasks.filter((t) => t.status !== "Done").length;
//     const attRecs  = Object.values(allAttend[uid] || {});
//     const present  = attRecs.filter((a) => a.status === "Present" || a.status === "Late").length;
//     const total    = attRecs.length;
//     const pct      = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
//     return { uid, name: u.name || "—", designation: u.designation || u.role || "—",
//              tasks: tasks.length, done, pend, present, totalDays: total, pct };
//   });

//   // Project health: group tasks by project
//   const projectMap = {};
//   taskList.forEach((t) => {
//     if (!t.project) return;
//     if (!projectMap[t.project]) projectMap[t.project] = { total: 0, done: 0 };
//     projectMap[t.project].total++;
//     if (t.status === "Done") projectMap[t.project].done++;
//   });

//   // Recent activity: last 6 tasks sorted by createdAt desc
//   const recentActivity = [...taskList]
//     .filter((t) => t.createdAt || t.status === "Done")
//     .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
//     .slice(0, 6);

//   // Tasks closed per last 7 days
//   const last7 = Array.from({ length: 7 }, (_, i) => {
//     const d = new Date();
//     d.setDate(d.getDate() - (6 - i));
//     return d.toISOString().split("T")[0];
//   });
//   const closedPerDay = last7.map((day) =>
//     taskList.filter((t) => t.status === "Done" && (t.createdAt || "").startsWith(day)).length
//   );
//   const maxBar = Math.max(...closedPerDay, 1);

//   // Donut
//   const radius = 42;
//   const circ   = 2 * Math.PI * radius;
//   const offset = circ - (completePct / 100) * circ;

//   const today = new Date().toLocaleDateString("en-US", {
//     weekday: "long", day: "numeric", month: "long", year: "numeric",
//   });

//   return (
//     <div className="p-6 max-w-[1400px] mx-auto">

//       {/* Header */}
//       <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
//         <div className="flex items-center gap-2">
//           <span className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full">
//             🛡 ADMIN VIEW
//           </span>
//         </div>
//         {pendingLeaves > 0 && (
//           <button
//             onClick={() => navigate("/admin/leave")}
//             className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-100 transition"
//           >
//             ⚠ {pendingLeaves} Leave{pendingLeaves > 1 ? "s" : ""} Pending · Review →
//           </button>
//         )}
//       </div>

//       <h1 className="text-2xl font-bold text-slate-800 mb-0.5">Team Command Center</h1>
//       <p className="text-slate-400 text-sm mb-6">{today}</p>

//       {/* Stats row */}
//       <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
//         {[
//           { label: "TOTAL TASKS",    value: totalTasks,   sub: `${inProgressTasks} in progress`, color: "border-l-blue-400",   icon: "📋" },
//           { label: "COMPLETED",      value: completedTasks, sub: `${completePct}% rate`,         color: "border-l-green-400",  icon: "✅" },
//           { label: "PENDING",        value: pendingTasks + inProgressTasks, sub: `${highPriority} high priority`, color: "border-l-yellow-400", icon: "⏳" },
//           { label: "TEAM MEMBERS",   value: memberCount,  sub: "All active",                     color: "border-l-purple-400", icon: "👥" },
//           { label: "LEAVE REQUESTS", value: pendingLeaves, sub: "Awaiting approval",              color: "border-l-red-400",    icon: "📅" },
//         ].map((s) => (
//           <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm`}>
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">{s.label}</p>
//                 <p className="text-2xl font-bold text-slate-700">{s.value}</p>
//                 <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
//               </div>
//               <span className="text-2xl">{s.icon}</span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Main grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

//         {/* Team Performance table */}
//         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
//           <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
//             <h3 className="font-semibold text-slate-800">Team Performance</h3>
//             <button onClick={() => navigate("/admin/attendance")} className="text-xs text-blue-500 hover:underline">
//               View Attendance →
//             </button>
//           </div>
//           {memberStats.length === 0 ? (
//             <p className="text-sm text-slate-400 text-center py-10">No team members yet.</p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="bg-slate-50">
//                     {["Member", "Tasks", "Done", "Pend.", "Attend.", "Progress"].map((h) => (
//                       <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-50">
//                   {memberStats.map((m) => (
//                     <tr key={m.uid} className="hover:bg-slate-50/60 transition">
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-2.5">
//                           <div className={`w-8 h-8 ${avatarColor(m.uid)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
//                             {initials(m.name)}
//                           </div>
//                           <div>
//                             <p className="font-medium text-slate-700 text-sm">{m.name}</p>
//                             <p className="text-[11px] text-slate-400">{m.designation}</p>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-slate-600 font-medium">{m.tasks}</td>
//                       <td className="px-4 py-3 font-semibold text-green-600">{m.done}</td>
//                       <td className="px-4 py-3 font-semibold text-orange-500">{m.pend}</td>
//                       <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
//                         {m.totalDays > 0 ? `${m.present}/${m.totalDays}` : "—"}
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-2">
//                           <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
//                             <div
//                               className="h-full rounded-full transition-all"
//                               style={{
//                                 width: `${m.pct}%`,
//                                 backgroundColor: m.pct === 100 ? "#22c55e" : m.pct > 50 ? "#f59e0b" : "#3b82f6",
//                               }}
//                             />
//                           </div>
//                           <span className="text-xs text-slate-500 w-8 text-right">{m.pct}%</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Right column */}
//         <div className="space-y-4">
//           {/* Completion Overview donut */}
//           <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
//             <h3 className="font-semibold text-slate-800 mb-4">Completion Overview</h3>
//             <div className="flex items-center gap-4">
//               <div className="relative w-24 h-24 shrink-0">
//                 <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
//                   <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
//                   <circle cx="50" cy="50" r={radius} fill="none"
//                     stroke="#3b82f6" strokeWidth="12"
//                     strokeDasharray={circ} strokeDashoffset={offset}
//                     strokeLinecap="round"
//                     style={{ transition: "stroke-dashoffset 0.6s ease" }}
//                   />
//                 </svg>
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <span className="text-lg font-bold text-slate-700">{completePct}%</span>
//                 </div>
//               </div>
//               <div className="space-y-2 text-sm">
//                 <div className="flex items-center gap-2">
//                   <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
//                   <span className="text-slate-600">Done: {completedTasks}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
//                   <span className="text-slate-600">Active: {inProgressTasks}</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
//                   <span className="text-slate-600">Pending: {pendingTasks}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Tasks Closed / Week bar chart */}
//           <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
//             <h3 className="font-semibold text-slate-800 mb-4">Tasks Closed / Week</h3>
//             <div className="flex items-end gap-1.5 h-16">
//               {closedPerDay.map((count, i) => (
//                 <div key={i} className="flex-1 flex flex-col items-center gap-1">
//                   <div
//                     className="w-full bg-green-400 rounded-sm transition-all"
//                     style={{ height: `${Math.max((count / maxBar) * 52, count > 0 ? 8 : 3)}px` }}
//                   />
//                   <span className="text-[9px] text-slate-400">
//                     {["S","M","T","W","T","F","S"][new Date(last7[i]).getDay()]}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Bottom grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

//         {/* Project Health */}
//         <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
//           <h3 className="font-semibold text-slate-800 mb-4">Project Health</h3>
//           {Object.keys(projectMap).length === 0 ? (
//             <p className="text-sm text-slate-400">No project data yet.</p>
//           ) : (
//             <div className="space-y-3">
//               {Object.entries(projectMap).map(([proj, { total, done }]) => {
//                 const pct = total > 0 ? Math.round((done / total) * 100) : 0;
//                 return (
//                   <div key={proj}>
//                     <div className="flex items-center justify-between mb-1">
//                       <div className="flex items-center gap-2">
//                         <span className="w-2.5 h-2.5 rounded-sm bg-orange-300 shrink-0" />
//                         <span className="text-sm font-medium text-slate-700">{proj}</span>
//                       </div>
//                       <span className={`text-xs font-semibold ${pct === 100 ? "text-green-600" : pct > 50 ? "text-blue-600" : "text-orange-500"}`}>
//                         {done}/{total} · {pct}%
//                       </span>
//                     </div>
//                     <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full rounded-full transition-all"
//                         style={{
//                           width: `${pct}%`,
//                           backgroundColor: pct === 100 ? "#22c55e" : pct > 50 ? "#3b82f6" : "#f59e0b",
//                         }}
//                       />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Recent Activity */}
//         <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
//           <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
//           {recentActivity.length === 0 ? (
//             <p className="text-sm text-slate-400">No activity yet.</p>
//           ) : (
//             <div className="space-y-3">
//               {recentActivity.map((t) => {
//                 const u = users[t.uid];
//                 return (
//                   <div key={t.id} className="flex items-start gap-3">
//                     <div className={`w-6 h-6 ${t.status === "Done" ? "bg-green-100" : "bg-blue-100"} rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5`}>
//                       {t.status === "Done" ? "✅" : "📋"}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm text-slate-700 truncate">
//                         <span className="font-medium">{t.title}</span>
//                         {t.status === "Done" && <span className="text-slate-400"> marked Done</span>}
//                       </p>
//                       <p className="text-xs text-slate-400 mt-0.5">
//                         {u?.name || "Unknown"} · {timeAgo(t.createdAt)}
//                       </p>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  FaPlus, FaTimes, FaUserTie, FaIdBadge,
  FaUser, FaSearch, FaTrash, FaUsers,
} from "react-icons/fa";

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500","bg-purple-500","bg-green-500",
  "bg-yellow-500","bg-red-500","bg-indigo-500","bg-pink-500",
];
function avatarColor(uid) {
  const hash = [...(uid||"x")].reduce((a,c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
function initials(name) {
  return (name||"?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
}
function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const navigate  = useNavigate();
  const user      = auth.currentUser;

  // ── Firebase state ──────────────────────────────────────────────
  const [users,       setUsers]       = useState({});
  const [allTasks,    setAllTasks]    = useState({});
  const [allAttend,   setAllAttend]   = useState({});
  const [allLeaves,   setAllLeaves]   = useState({});
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const unsubs = [];
    unsubs.push(onValue(ref(db, "users"),       s => setUsers(s.val()     || {})));
    unsubs.push(onValue(ref(db, "tasks"),       s => setAllTasks(s.val()  || {})));
    unsubs.push(onValue(ref(db, "attendance"),  s => setAllAttend(s.val() || {})));
    unsubs.push(onValue(ref(db, "leaves"),      s => setAllLeaves(s.val() || {})));
    unsubs.push(onValue(ref(db, "teamMembers"), s => {
      const data = s.val() || {};
      setTeamMembers(Object.entries(data).map(([id, v]) => ({ id, ...v })));
    }));
    return () => unsubs.forEach(u => u());
  }, []);

  // ── Team Members modal state ────────────────────────────────────
  const [showModal,   setShowModal]   = useState(false);
  const [newName,     setNewName]     = useState("");
  const [newEmpId,    setNewEmpId]    = useState("");
  const [newRole,     setNewRole]     = useState("employee");
  const [newDept,     setNewDept]     = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adding,      setAdding]      = useState(false);
  const [modalError,  setModalError]  = useState("");

  // ── Task stats ──────────────────────────────────────────────────
  const taskList = Object.entries(allTasks).flatMap(([uid, tasks]) =>
    Object.entries(tasks || {}).map(([id, t]) => ({ id, uid, ...t }))
  );
  const totalTasks      = taskList.length;
  const completedTasks  = taskList.filter(t => t.status === "Done").length;
  const pendingTasks    = taskList.filter(t => t.status === "Pending").length;
  const inProgressTasks = taskList.filter(t => t.status === "In Progress").length;
  const highPriority    = taskList.filter(t => t.priority === "High" && t.status !== "Done").length;
  const completePct     = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ── Leave stats ─────────────────────────────────────────────────
  const leaveList = Object.entries(allLeaves).flatMap(([uid, leaves]) =>
    Object.entries(leaves || {}).map(([id, l]) => ({ id, uid, ...l }))
  );
  const pendingLeaves = leaveList.filter(l => l.status === "Pending").length;

  // ── Per-member stats — cross-reference teamMembers for role/designation ──
  const memberStats = Object.entries(users).map(([uid, u]) => {
    const tasks      = Object.values(allTasks[uid]   || {});
    const done       = tasks.filter(t => t.status === "Done").length;
    const pend       = tasks.filter(t => t.status !== "Done").length;
    const attRecs    = Object.values(allAttend[uid]  || {});
    const present    = attRecs.filter(a => a.status === "Present" || a.status === "Late").length;
    const pct        = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
    // Cross-ref teamMembers to get richer designation/employeeId data
    const roster     = teamMembers.find(m => m.uid === uid);
    const designation = roster?.designation || u.designation || (u.role === "admin" ? "Administrator" : "Employee");
    const employeeId  = roster?.employeeId  || u.employeeId  || "—";
    const roleBadge   = u.role || roster?.role || "employee";
    return {
      uid, name: u.name || "—", designation, employeeId, roleBadge,
      tasks: tasks.length, done, pend, present, totalDays: attRecs.length, pct,
    };
  });

  // ── Project health ──────────────────────────────────────────────
  const projectMap = {};
  taskList.forEach(t => {
    if (!t.project) return;
    if (!projectMap[t.project]) projectMap[t.project] = { total: 0, done: 0 };
    projectMap[t.project].total++;
    if (t.status === "Done") projectMap[t.project].done++;
  });

  // ── Recent activity ─────────────────────────────────────────────
  const recentActivity = [...taskList]
    .filter(t => t.createdAt || t.status === "Done")
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  // ── Bar chart (last 7 days) ─────────────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const closedPerDay = last7.map(day =>
    taskList.filter(t => t.status === "Done" && (t.createdAt || "").startsWith(day)).length
  );
  const maxBar = Math.max(...closedPerDay, 1);

  // ── Donut ───────────────────────────────────────────────────────
  const radius = 42;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (completePct / 100) * circ;

  // ── Team member role counts ──────────────────────────────────────
  const empCount   = teamMembers.filter(m => m.role === "employee").length;
  const adminCount = teamMembers.filter(m => m.role === "admin").length;

  // ── Filtered members (search) ───────────────────────────────────
  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.department || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Add member ──────────────────────────────────────────────────
  const handleAddMember = async () => {
    setModalError("");
    if (!newName.trim())  { setModalError("Name is required.");        return; }
    if (!newEmpId.trim()) { setModalError("Employee ID is required."); return; }
    const dup = teamMembers.find(m => (m.employeeId||"").toLowerCase() === newEmpId.trim().toLowerCase());
    if (dup) { setModalError("Employee ID already exists."); return; }
    setAdding(true);
    await push(ref(db, "teamMembers"), {
      name:       newName.trim(),
      employeeId: newEmpId.trim().toUpperCase(),
      role:       newRole,
      department: newDept.trim() || "General",
      addedAt:    new Date().toISOString(),
      addedBy:    user?.uid || "",
    });
    setNewName(""); setNewEmpId(""); setNewRole("employee");
    setNewDept(""); setShowModal(false); setAdding(false);
  };

  const handleDeleteMember = async (id) => remove(ref(db, `teamMembers/${id}`));

  const today = new Date().toLocaleDateString("en-US", {
    weekday:"long", day:"numeric", month:"long", year:"numeric",
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <span className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full">
          🛡 ADMIN VIEW
        </span>
        {pendingLeaves > 0 && (
          <button onClick={() => navigate("/admin/leave")}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700
              text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-100 transition">
            ⚠ {pendingLeaves} Leave{pendingLeaves > 1 ? "s" : ""} Pending · Review →
          </button>
        )}
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-0.5">Team Command Center</h1>
      <p className="text-slate-400 text-sm mb-6">{today}</p>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label:"TOTAL TASKS",    value: totalTasks,                     sub:`${inProgressTasks} in progress`,        color:"border-l-blue-400",   icon:"📋" },
          { label:"COMPLETED",      value: completedTasks,                 sub:`${completePct}% rate`,                  color:"border-l-green-400",  icon:"✅" },
          { label:"PENDING",        value: pendingTasks + inProgressTasks, sub:`${highPriority} high priority`,         color:"border-l-yellow-400", icon:"⏳" },
          { label:"TEAM MEMBERS",   value: teamMembers.length,             sub:`${empCount} emp · ${adminCount} admin`, color:"border-l-purple-400", icon:"👥" },
          { label:"LEAVE REQUESTS", value: pendingLeaves,                  sub:"Awaiting approval",                     color:"border-l-red-400",    icon:"📅" },
        ].map(s => (
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

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Team Performance */}
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
                    {["Member","Emp ID","Tasks","Done","Pend.","Attend.","Progress"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {memberStats.map(m => (
                    <tr key={m.uid} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 ${avatarColor(m.uid)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {initials(m.name)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-700 text-sm">{m.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                                ${m.roleBadge === "admin" ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"}`}>
                                {m.roleBadge === "admin" ? "Admin" : "Emp"}
                              </span>
                              <span className="text-[10px] text-slate-400">{m.designation}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-slate-500">{m.employeeId}</span>
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
                            <div className="h-full rounded-full transition-all"
                              style={{ width:`${m.pct}%`, backgroundColor: m.pct===100?"#22c55e":m.pct>50?"#f59e0b":"#3b82f6" }}
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
          {/* Completion donut */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Completion Overview</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="#3b82f6" strokeWidth="12"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transition:"stroke-dashoffset 0.6s ease" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-700">{completePct}%</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { color:"bg-blue-500",   label:"Done",    val:completedTasks  },
                  { color:"bg-orange-400", label:"Active",  val:inProgressTasks },
                  { color:"bg-slate-300",  label:"Pending", val:pendingTasks    },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${d.color} shrink-0`} />
                    <span className="text-slate-600">{d.label}: {d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4">Tasks Closed / Week</h3>
            <div className="flex items-end gap-1.5 h-16">
              {closedPerDay.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-green-400 rounded-sm transition-all"
                    style={{ height:`${Math.max((count/maxBar)*52, count>0?8:3)}px` }} />
                  <span className="text-[9px] text-slate-400">
                    {["S","M","T","W","T","F","S"][new Date(last7[i]).getDay()]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
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
                      <span className={`text-xs font-semibold ${pct===100?"text-green-600":pct>50?"text-blue-600":"text-orange-500"}`}>
                        {done}/{total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width:`${pct}%`, backgroundColor:pct===100?"#22c55e":pct>50?"#3b82f6":"#f59e0b" }} />
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
              {recentActivity.map(t => {
                const u = users[t.uid];
                return (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className={`w-6 h-6 ${t.status==="Done"?"bg-green-100":"bg-blue-100"} rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5`}>
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

      {/* ══ Team Members Full Panel ══ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">Team Members</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {teamMembers.length} members · {empCount} employees · {adminCount} admins
            </p>
          </div>
          <button onClick={() => { setShowModal(true); setModalError(""); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700
              text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-100
              transition active:scale-95 self-start sm:self-auto">
            <FaPlus className="text-xs" /> Add Member
          </button>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
          {[
            { icon:<FaUsers />,   label:"Total",     value:teamMembers.length, color:"text-violet-600 bg-violet-50"  },
            { icon:<FaUser />,    label:"Employees", value:empCount,           color:"text-emerald-600 bg-emerald-50"},
            { icon:<FaUserTie />, label:"Admins",    value:adminCount,         color:"text-blue-600 bg-blue-50"      },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2.5 px-5 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-lg font-bold text-slate-700 leading-none">{s.value}</p>
                <p className="text-[11px] text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input type="text" placeholder="Search by name, Employee ID or department..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm
                text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2
                focus:ring-violet-200 focus:border-transparent transition bg-white" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_40px_48px] gap-4
          px-5 py-2.5 bg-slate-50 border-b border-slate-100
          text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Name</span>
          <span>Employee ID</span>
          <span>Department</span>
          <span>Role</span>
          <span>Src</span>
          <span />
        </div>

        {/* Rows */}
        {filteredMembers.length === 0 ? (
          <div className="py-14 text-center text-slate-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm font-medium">
              {teamMembers.length === 0 ? "No team members yet." : "No results found."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredMembers.map(member => {
              const isAdminRole = member.role === "admin";
              const ini = (member.name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
              const hasAccount = !!member.uid; // signed up via Auth
              return (
                <div key={member.id}
                  className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_40px_48px]
                    gap-2 sm:gap-4 px-5 py-3.5 items-center group hover:bg-slate-50/60 transition">

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${isAdminRole ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {ini}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-400 sm:hidden">{member.employeeId}</p>
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <FaIdBadge className="text-slate-300 text-xs shrink-0" />
                    <span className="text-sm text-slate-600 font-mono">{member.employeeId}</span>
                  </div>

                  {/* Department */}
                  <div className="hidden sm:block">
                    <span className="text-sm text-slate-500">{member.department || "General"}</span>
                  </div>

                  {/* Role badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
                      ${isAdminRole ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {isAdminRole ? <FaUserTie className="text-[10px]" /> : <FaUser className="text-[10px]" />}
                      {isAdminRole ? "Admin" : "Employee"}
                    </span>
                  </div>

                  {/* Auth indicator */}
                  <div className="hidden sm:flex justify-center">
                    <span title={hasAccount ? "Registered account" : "Manually added"}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold
                        ${hasAccount ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"}`}>
                      {hasAccount ? "✓" : "—"}
                    </span>
                  </div>

                  {/* Delete */}
                  <button onClick={() => handleDeleteMember(member.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400
                      hover:text-red-500 hover:bg-red-50 rounded-lg transition justify-self-end">
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Member Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add Team Member</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the member's details below</p>
              </div>
              <button onClick={() => { setShowModal(false); setModalError(""); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                <FaTimes />
              </button>
            </div>
            {modalError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
                {modalError}
              </div>
            )}
            <div className="space-y-4">
              <MField label="Full Name"   icon={<FaUser />}    placeholder="e.g. Ravi Kumar"      value={newName}  onChange={e => setNewName(e.target.value)} />
              <MField label="Employee ID" icon={<FaIdBadge />} placeholder="e.g. EMP-2024-001"    value={newEmpId} onChange={e => setNewEmpId(e.target.value)} />
              <MField label="Department"  icon={<FaUsers />}   placeholder="e.g. Marketing, Dev…" value={newDept}  onChange={e => setNewDept(e.target.value)} />
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {["employee","admin"].map(r => (
                    <button key={r} type="button" onClick={() => setNewRole(r)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3
                        rounded-xl border text-sm font-medium transition-all active:scale-95
                        ${newRole===r
                          ? r==="admin" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}>
                      {r==="admin" ? <FaUserTie className="text-xs" /> : <FaUser className="text-xs" />}
                      <span className="capitalize">{r}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setModalError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleAddMember} disabled={adding}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-200">
                {adding ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MField({ label, icon, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{icon}</span>
        <input type="text" placeholder={placeholder} value={value} onChange={onChange}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm
            placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-transparent transition" />
      </div>
    </div>
  );
}