// import { useState, useEffect } from "react";
// import { db } from "../firebase";
// import { ref, onValue, push, update, remove } from "firebase/database";
// import { FaSearch, FaPlus, FaTimes, FaSyncAlt, FaCheck } from "react-icons/fa";

// const FILTERS = ["All", "Pending", "In Progress", "Done", "High Priority", "Recurring"];

// const AVATAR_COLORS = ["bg-blue-500","bg-purple-500","bg-green-500","bg-yellow-500","bg-red-500","bg-indigo-500","bg-pink-500"];
// function avatarColor(uid) {
//   const h = [...(uid||"x")].reduce((a,c)=>a+c.charCodeAt(0),0);
//   return AVATAR_COLORS[h % AVATAR_COLORS.length];
// }
// function initials(name) {
//   return (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
// }
// function projectColor(p) {
//   const map = {
//     "Meera Basu":"bg-purple-100 text-purple-700",
//     "Genie Media":"bg-blue-100 text-blue-700",
//     "EcoHomely":"bg-green-100 text-green-700",
//     "Shopzzy":"bg-orange-100 text-orange-700",
//     "Manyam":"bg-rose-100 text-rose-700",
//   };
//   return map[p] || "bg-slate-100 text-slate-600";
// }
// function priorityBadge(p) {
//   if (p==="High")   return "bg-red-50 text-red-600 border border-red-200";
//   if (p==="Medium") return "bg-orange-50 text-orange-600 border border-orange-200";
//   return "bg-green-50 text-green-600 border border-green-200";
// }
// function statusBadge(s) {
//   if (s==="Done")        return "bg-green-50 text-green-700 border border-green-200";
//   if (s==="In Progress") return "bg-blue-50 text-blue-700 border border-blue-200";
//   return "bg-orange-50 text-orange-600 border border-orange-200";
// }

// const EMPTY = { title:"", project:"", dueDate:"", priority:"Medium", status:"Pending", tags:"", recurring:false, assignedTo:"" };

// export default function AdminTasks() {
//   const [users, setUsers]       = useState({});
//   const [allTasks, setAllTasks] = useState({});
//   const [filter, setFilter]     = useState("All");
//   const [search, setSearch]     = useState("");
//   const [projectFilter, setProjectFilter] = useState("All Projects");
//   const [showModal, setShowModal] = useState(false);
//   const [form, setForm]         = useState(EMPTY);

//   useEffect(() => {
//     const u1 = onValue(ref(db,"users"), (s) => setUsers(s.val()||{}));
//     const u2 = onValue(ref(db,"tasks"), (s) => setAllTasks(s.val()||{}));
//     return () => { u1(); u2(); };
//   }, []);

//   // Flatten tasks with uid
//   const taskList = Object.entries(allTasks).flatMap(([uid, tasks]) =>
//     Object.entries(tasks||{}).map(([id,t]) => ({ id, uid, ...t }))
//   );

//   // All projects for dropdown
//   const projects = ["All Projects", ...new Set(taskList.map(t=>t.project).filter(Boolean))];

//   const filtered = taskList.filter((t) => {
//     const matchSearch  = (t.title||"").toLowerCase().includes(search.toLowerCase());
//     const matchProject = projectFilter === "All Projects" || t.project === projectFilter;
//     if (!matchSearch || !matchProject) return false;
//     if (filter==="All") return true;
//     if (filter==="High Priority") return t.priority==="High";
//     if (filter==="Recurring") return !!t.recurring;
//     return t.status===filter;
//   });

//   const handleAdd = async () => {
//     if (!form.title.trim()) return;
//     const uid = form.assignedTo || Object.keys(users)[0];
//     if (!uid) return;
//     await push(ref(db, `tasks/${uid}`), {
//       title: form.title.trim(),
//       project: form.project,
//       dueDate: form.dueDate,
//       priority: form.priority,
//       status: form.status,
//       tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
//       recurring: form.recurring,
//       createdAt: new Date().toISOString(),
//     });
//     setForm(EMPTY);
//     setShowModal(false);
//   };

//   const toggleDone = (task) => {
//     const s = task.status==="Done" ? "Pending" : "Done";
//     update(ref(db,`tasks/${task.uid}/${task.id}`), { status: s });
//   };

//   const deleteTask = (task) => remove(ref(db,`tasks/${task.uid}/${task.id}`));

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-5">
//         <h1 className="text-2xl font-bold text-slate-800">All Tasks</h1>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setShowModal(true)}
//             className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition active:scale-95"
//           >
//             <FaPlus className="text-xs" /> Add Task
//           </button>
//         </div>
//       </div>

//       {/* Search + Project filter */}
//       <div className="flex gap-3 mb-4">
//         <div className="relative flex-1">
//           <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search tasks..."
//             className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
//               focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
//           />
//         </div>
//         <select
//           value={projectFilter}
//           onChange={(e) => setProjectFilter(e.target.value)}
//           className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
//         >
//           {projects.map(p => <option key={p}>{p}</option>)}
//         </select>
//       </div>

//       {/* Filter tabs */}
//       <div className="flex gap-2 flex-wrap mb-5">
//         {FILTERS.map((f) => (
//           <button key={f} onClick={() => setFilter(f)}
//             className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition
//               ${filter===f
//                 ? "bg-blue-600 text-white shadow-sm"
//                 : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
//               }`}
//           >
//             {f}
//           </button>
//         ))}
//       </div>

//       {/* Task list */}
//       <div className="space-y-2.5">
//         {filtered.length === 0 ? (
//           <div className="text-center py-16 text-slate-400">
//             <p className="text-4xl mb-3">📭</p>
//             <p className="text-sm">No tasks found</p>
//           </div>
//         ) : (
//           filtered.map((task) => {
//             const owner = users[task.uid];
//             return (
//               <div key={task.id}
//                 className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-slate-100 hover:shadow-md transition"
//               >
//                 {/* Toggle */}
//                 <button onClick={() => toggleDone(task)}
//                   className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
//                     ${task.status==="Done" ? "bg-green-500 border-green-500" : "border-slate-300 hover:border-blue-400"}`}
//                 >
//                   {task.status==="Done" && <FaCheck className="text-white text-[8px]" />}
//                 </button>

//                 {/* Content */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <span className={`text-sm font-medium ${task.status==="Done" ? "line-through text-slate-400" : "text-slate-700"}`}>
//                       {task.title}
//                     </span>
//                     {task.recurring && (
//                       <span className="flex items-center gap-0.5 text-blue-500 text-[11px] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
//                         <FaSyncAlt className="text-[8px]" /> Recurring
//                       </span>
//                     )}
//                   </div>
//                   <div className="flex items-center gap-1.5 mt-1 flex-wrap">
//                     {task.project && (
//                       <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${projectColor(task.project)}`}>
//                         {task.project}
//                       </span>
//                     )}
//                     {task.dueDate && <span className="text-[11px] text-slate-400">📅 {task.dueDate}</span>}
//                     {(Array.isArray(task.tags)?task.tags:[]).map(tag=>(
//                       <span key={tag} className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{tag}</span>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Right */}
//                 <div className="flex items-center gap-2 shrink-0">
//                   <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
//                     {task.priority}
//                   </span>
//                   <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(task.status)}`}>
//                     {task.status}
//                   </span>
//                   {/* Assignee avatar */}
//                   {owner && (
//                     <div className={`w-7 h-7 ${avatarColor(task.uid)} rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
//                       title={owner.name}>
//                       {initials(owner.name)}
//                     </div>
//                   )}
//                   <button onClick={() => deleteTask(task)} className="text-slate-300 hover:text-red-400 transition ml-1">
//                     <FaTimes className="text-xs" />
//                   </button>
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>

//       {/* Add Task Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
//             <div className="flex items-center justify-between mb-5">
//               <h3 className="text-lg font-bold text-slate-800">Add New Task</h3>
//               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
//                 <FaTimes />
//               </button>
//             </div>

//             <div className="space-y-3.5">
//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Task Title *</label>
//                 <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus
//                   placeholder="Enter task title..."
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
//               </div>

//               {/* Assign to */}
//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Assign To *</label>
//                 <select value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
//                   <option value="">Select team member...</option>
//                   {Object.entries(users).map(([uid,u])=>(
//                     <option key={uid} value={uid}>{u.name} — {u.designation||u.role||"Member"}</option>
//                   ))}
//                 </select>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Project</label>
//                   <input value={form.project} onChange={e=>setForm({...form,project:e.target.value})}
//                     placeholder="Project name"
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Due Date</label>
//                   <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Priority</label>
//                   <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
//                     {["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
//                   <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
//                     {["Pending","In Progress","Done"].map(s=><option key={s}>{s}</option>)}
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Tags (comma-separated)</label>
//                 <input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}
//                   placeholder="Social, Content, Ads"
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
//               </div>

//               <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={()=>setForm({...form,recurring:!form.recurring})}>
//                 <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition
//                   ${form.recurring ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
//                   {form.recurring && <FaCheck className="text-white text-[8px]" />}
//                 </div>
//                 <span className="text-sm text-slate-600">Recurring task</span>
//               </div>
//             </div>

//             <div className="flex gap-3 mt-5">
//               <button onClick={()=>{setShowModal(false);setForm(EMPTY);}}
//                 className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
//                 Cancel
//               </button>
//               <button onClick={handleAdd} disabled={!form.title.trim()||!form.assignedTo}
//                 className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition active:scale-95">
//                 Add Task
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// import { useState, useEffect } from "react";
// import { auth, db } from "../firebase";
// import { ref, onValue, push, remove } from "firebase/database";
// import { useNavigate } from "react-router-dom";
// import {
//   FaPlus, FaTimes, FaUserTie, FaIdBadge,
//   FaUser, FaSearch, FaTrash, FaUsers,
// } from "react-icons/fa";

// // ── Helpers ───────────────────────────────────────────────────────────────────
// const AVATAR_COLORS = [
//   "bg-blue-500","bg-purple-500","bg-green-500",
//   "bg-yellow-500","bg-red-500","bg-indigo-500","bg-pink-500",
// ];
// function avatarColor(uid) {
//   const hash = [...(uid||"x")].reduce((a,c) => a + c.charCodeAt(0), 0);
//   return AVATAR_COLORS[hash % AVATAR_COLORS.length];
// }
// function initials(name) {
//   return (name||"?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
// }
// function timeAgo(ts) {
//   if (!ts) return "";
//   const diff = Date.now() - new Date(ts).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1)  return "just now";
//   if (mins < 60) return `${mins} mins ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24)  return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }

// export default function AdminDashboard() {
//   const navigate  = useNavigate();
//   const user      = auth.currentUser;

//   // ── Firebase state ──────────────────────────────────────────────
//   const [users,       setUsers]       = useState({});
//   const [allTasks,    setAllTasks]    = useState({});
//   const [allAttend,   setAllAttend]   = useState({});
//   const [allLeaves,   setAllLeaves]   = useState({});
//   const [teamMembers, setTeamMembers] = useState([]);

//   useEffect(() => {
//     const unsubs = [];
//     unsubs.push(onValue(ref(db, "users"),       s => setUsers(s.val()     || {})));
//     unsubs.push(onValue(ref(db, "tasks"),       s => setAllTasks(s.val()  || {})));
//     unsubs.push(onValue(ref(db, "attendance"),  s => setAllAttend(s.val() || {})));
//     unsubs.push(onValue(ref(db, "leaves"),      s => setAllLeaves(s.val() || {})));
//     unsubs.push(onValue(ref(db, "teamMembers"), s => {
//       const data = s.val() || {};
//       setTeamMembers(Object.entries(data).map(([id, v]) => ({ id, ...v })));
//     }));
//     return () => unsubs.forEach(u => u());
//   }, []);

//   // ── Team Members modal state ────────────────────────────────────
//   const [showModal,   setShowModal]   = useState(false);
//   const [newName,     setNewName]     = useState("");
//   const [newEmpId,    setNewEmpId]    = useState("");
//   const [newRole,     setNewRole]     = useState("employee");
//   const [newDept,     setNewDept]     = useState("");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [adding,      setAdding]      = useState(false);
//   const [modalError,  setModalError]  = useState("");

//   // ── Task stats ──────────────────────────────────────────────────
//   const taskList = Object.entries(allTasks).flatMap(([uid, tasks]) =>
//     Object.entries(tasks || {}).map(([id, t]) => ({ id, uid, ...t }))
//   );
//   const totalTasks      = taskList.length;
//   const completedTasks  = taskList.filter(t => t.status === "Done").length;
//   const pendingTasks    = taskList.filter(t => t.status === "Pending").length;
//   const inProgressTasks = taskList.filter(t => t.status === "In Progress").length;
//   const highPriority    = taskList.filter(t => t.priority === "High" && t.status !== "Done").length;
//   const completePct     = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

//   // ── Leave stats ─────────────────────────────────────────────────
//   const leaveList = Object.entries(allLeaves).flatMap(([uid, leaves]) =>
//     Object.entries(leaves || {}).map(([id, l]) => ({ id, uid, ...l }))
//   );
//   const pendingLeaves = leaveList.filter(l => l.status === "Pending").length;

//   // ── Per-member stats — cross-reference teamMembers for role/designation ──
//   const memberStats = Object.entries(users).map(([uid, u]) => {
//     const tasks      = Object.values(allTasks[uid]   || {});
//     const done       = tasks.filter(t => t.status === "Done").length;
//     const pend       = tasks.filter(t => t.status !== "Done").length;
//     const attRecs    = Object.values(allAttend[uid]  || {});
//     const present    = attRecs.filter(a => a.status === "Present" || a.status === "Late").length;
//     const pct        = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
//     // Cross-ref teamMembers to get richer designation/employeeId data
//     const roster     = teamMembers.find(m => m.uid === uid);
//     const designation = roster?.designation || u.designation || (u.role === "admin" ? "Administrator" : "Employee");
//     const employeeId  = roster?.employeeId  || u.employeeId  || "—";
//     const roleBadge   = u.role || roster?.role || "employee";
//     return {
//       uid, name: u.name || "—", designation, employeeId, roleBadge,
//       tasks: tasks.length, done, pend, present, totalDays: attRecs.length, pct,
//     };
//   });

//   // ── Project health ──────────────────────────────────────────────
//   const projectMap = {};
//   taskList.forEach(t => {
//     if (!t.project) return;
//     if (!projectMap[t.project]) projectMap[t.project] = { total: 0, done: 0 };
//     projectMap[t.project].total++;
//     if (t.status === "Done") projectMap[t.project].done++;
//   });

//   // ── Recent activity ─────────────────────────────────────────────
//   const recentActivity = [...taskList]
//     .filter(t => t.createdAt || t.status === "Done")
//     .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
//     .slice(0, 6);

//   // ── Bar chart (last 7 days) ─────────────────────────────────────
//   const last7 = Array.from({ length: 7 }, (_, i) => {
//     const d = new Date(); d.setDate(d.getDate() - (6 - i));
//     return d.toISOString().split("T")[0];
//   });
//   const closedPerDay = last7.map(day =>
//     taskList.filter(t => t.status === "Done" && (t.createdAt || "").startsWith(day)).length
//   );
//   const maxBar = Math.max(...closedPerDay, 1);

//   // ── Donut ───────────────────────────────────────────────────────
//   const radius = 42;
//   const circ   = 2 * Math.PI * radius;
//   const offset = circ - (completePct / 100) * circ;

//   // ── Team member role counts ──────────────────────────────────────
//   const empCount   = teamMembers.filter(m => m.role === "employee").length;
//   const adminCount = teamMembers.filter(m => m.role === "admin").length;

//   // ── Filtered members (search) ───────────────────────────────────
//   const filteredMembers = teamMembers.filter(m =>
//     m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (m.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
//     (m.department || "").toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // ── Add member ──────────────────────────────────────────────────
//   const handleAddMember = async () => {
//     setModalError("");
//     if (!newName.trim())  { setModalError("Name is required.");        return; }
//     if (!newEmpId.trim()) { setModalError("Employee ID is required."); return; }
//     const dup = teamMembers.find(m => (m.employeeId||"").toLowerCase() === newEmpId.trim().toLowerCase());
//     if (dup) { setModalError("Employee ID already exists."); return; }
//     setAdding(true);
//     await push(ref(db, "teamMembers"), {
//       name:       newName.trim(),
//       employeeId: newEmpId.trim().toUpperCase(),
//       role:       newRole,
//       department: newDept.trim() || "General",
//       addedAt:    new Date().toISOString(),
//       addedBy:    user?.uid || "",
//     });
//     setNewName(""); setNewEmpId(""); setNewRole("employee");
//     setNewDept(""); setShowModal(false); setAdding(false);
//   };

//   const handleDeleteMember = async (id) => remove(ref(db, `teamMembers/${id}`));

//   const today = new Date().toLocaleDateString("en-US", {
//     weekday:"long", day:"numeric", month:"long", year:"numeric",
//   });

//   return (
//     <div className="p-6 max-w-[1400px] mx-auto">

//       {/* ── Page Header ── */}
//       <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
//         <span className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-full">
//           🛡 ADMIN VIEW
//         </span>
//         {pendingLeaves > 0 && (
//           <button onClick={() => navigate("/admin/leave")}
//             className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700
//               text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-100 transition">
//             ⚠ {pendingLeaves} Leave{pendingLeaves > 1 ? "s" : ""} Pending · Review →
//           </button>
//         )}
//       </div>
//       <h1 className="text-2xl font-bold text-slate-800 mb-0.5">Team Command Center</h1>
//       <p className="text-slate-400 text-sm mb-6">{today}</p>

//       {/* ── Stats Row ── */}
//       <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
//         {[
//           { label:"TOTAL TASKS",    value: totalTasks,                     sub:`${inProgressTasks} in progress`,        color:"border-l-blue-400",   icon:"📋" },
//           { label:"COMPLETED",      value: completedTasks,                 sub:`${completePct}% rate`,                  color:"border-l-green-400",  icon:"✅" },
//           { label:"PENDING",        value: pendingTasks + inProgressTasks, sub:`${highPriority} high priority`,         color:"border-l-yellow-400", icon:"⏳" },
//           { label:"TEAM MEMBERS",   value: teamMembers.length,             sub:`${empCount} emp · ${adminCount} admin`, color:"border-l-purple-400", icon:"👥" },
//           { label:"LEAVE REQUESTS", value: pendingLeaves,                  sub:"Awaiting approval",                     color:"border-l-red-400",    icon:"📅" },
//         ].map(s => (
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

//       {/* ── Main Grid ── */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

//         {/* Team Performance */}
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
//                     {["Member","Emp ID","Tasks","Done","Pend.","Attend.","Progress"].map(h => (
//                       <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-50">
//                   {memberStats.map(m => (
//                     <tr key={m.uid} className="hover:bg-slate-50/60 transition">
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-2.5">
//                           <div className={`w-8 h-8 ${avatarColor(m.uid)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
//                             {initials(m.name)}
//                           </div>
//                           <div>
//                             <p className="font-medium text-slate-700 text-sm">{m.name}</p>
//                             <div className="flex items-center gap-1 mt-0.5">
//                               <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
//                                 ${m.roleBadge === "admin" ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"}`}>
//                                 {m.roleBadge === "admin" ? "Admin" : "Emp"}
//                               </span>
//                               <span className="text-[10px] text-slate-400">{m.designation}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3">
//                         <span className="text-xs font-mono text-slate-500">{m.employeeId}</span>
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
//                             <div className="h-full rounded-full transition-all"
//                               style={{ width:`${m.pct}%`, backgroundColor: m.pct===100?"#22c55e":m.pct>50?"#f59e0b":"#3b82f6" }}
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
//           {/* Completion donut */}
//           <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
//             <h3 className="font-semibold text-slate-800 mb-4">Completion Overview</h3>
//             <div className="flex items-center gap-4">
//               <div className="relative w-24 h-24 shrink-0">
//                 <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
//                   <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
//                   <circle cx="50" cy="50" r={radius} fill="none" stroke="#3b82f6" strokeWidth="12"
//                     strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
//                     style={{ transition:"stroke-dashoffset 0.6s ease" }} />
//                 </svg>
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <span className="text-lg font-bold text-slate-700">{completePct}%</span>
//                 </div>
//               </div>
//               <div className="space-y-2 text-sm">
//                 {[
//                   { color:"bg-blue-500",   label:"Done",    val:completedTasks  },
//                   { color:"bg-orange-400", label:"Active",  val:inProgressTasks },
//                   { color:"bg-slate-300",  label:"Pending", val:pendingTasks    },
//                 ].map(d => (
//                   <div key={d.label} className="flex items-center gap-2">
//                     <span className={`w-2.5 h-2.5 rounded-full ${d.color} shrink-0`} />
//                     <span className="text-slate-600">{d.label}: {d.val}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Bar chart */}
//           <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
//             <h3 className="font-semibold text-slate-800 mb-4">Tasks Closed / Week</h3>
//             <div className="flex items-end gap-1.5 h-16">
//               {closedPerDay.map((count, i) => (
//                 <div key={i} className="flex-1 flex flex-col items-center gap-1">
//                   <div className="w-full bg-green-400 rounded-sm transition-all"
//                     style={{ height:`${Math.max((count/maxBar)*52, count>0?8:3)}px` }} />
//                   <span className="text-[9px] text-slate-400">
//                     {["S","M","T","W","T","F","S"][new Date(last7[i]).getDay()]}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ── Bottom Grid ── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
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
//                       <span className={`text-xs font-semibold ${pct===100?"text-green-600":pct>50?"text-blue-600":"text-orange-500"}`}>
//                         {done}/{total} · {pct}%
//                       </span>
//                     </div>
//                     <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                       <div className="h-full rounded-full transition-all"
//                         style={{ width:`${pct}%`, backgroundColor:pct===100?"#22c55e":pct>50?"#3b82f6":"#f59e0b" }} />
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
//               {recentActivity.map(t => {
//                 const u = users[t.uid];
//                 return (
//                   <div key={t.id} className="flex items-start gap-3">
//                     <div className={`w-6 h-6 ${t.status==="Done"?"bg-green-100":"bg-blue-100"} rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5`}>
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

//       {/* ══ Team Members Full Panel ══ */}
//       <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
//         {/* Header */}
//         <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
//           <div>
//             <h3 className="font-semibold text-slate-800 text-lg">Team Members</h3>
//             <p className="text-xs text-slate-400 mt-0.5">
//               {teamMembers.length} members · {empCount} employees · {adminCount} admins
//             </p>
//           </div>
//           <button onClick={() => { setShowModal(true); setModalError(""); }}
//             className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700
//               text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-100
//               transition active:scale-95 self-start sm:self-auto">
//             <FaPlus className="text-xs" /> Add Member
//           </button>
//         </div>

//         {/* Stat strip */}
//         <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
//           {[
//             { icon:<FaUsers />,   label:"Total",     value:teamMembers.length, color:"text-violet-600 bg-violet-50"  },
//             { icon:<FaUser />,    label:"Employees", value:empCount,           color:"text-emerald-600 bg-emerald-50"},
//             { icon:<FaUserTie />, label:"Admins",    value:adminCount,         color:"text-blue-600 bg-blue-50"      },
//           ].map(s => (
//             <div key={s.label} className="flex items-center gap-2.5 px-5 py-3">
//               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${s.color}`}>{s.icon}</div>
//               <div>
//                 <p className="text-lg font-bold text-slate-700 leading-none">{s.value}</p>
//                 <p className="text-[11px] text-slate-400">{s.label}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Search */}
//         <div className="px-5 py-3 border-b border-slate-100">
//           <div className="relative max-w-md">
//             <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
//             <input type="text" placeholder="Search by name, Employee ID or department..."
//               value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
//               className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm
//                 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2
//                 focus:ring-violet-200 focus:border-transparent transition bg-white" />
//             {searchQuery && (
//               <button onClick={() => setSearchQuery("")}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
//                 <FaTimes className="text-xs" />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Column headers */}
//         <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_40px_48px] gap-4
//           px-5 py-2.5 bg-slate-50 border-b border-slate-100
//           text-xs font-semibold text-slate-500 uppercase tracking-wide">
//           <span>Name</span>
//           <span>Employee ID</span>
//           <span>Department</span>
//           <span>Role</span>
//           <span>Src</span>
//           <span />
//         </div>

//         {/* Rows */}
//         {filteredMembers.length === 0 ? (
//           <div className="py-14 text-center text-slate-400">
//             <p className="text-3xl mb-2">👥</p>
//             <p className="text-sm font-medium">
//               {teamMembers.length === 0 ? "No team members yet." : "No results found."}
//             </p>
//           </div>
//         ) : (
//           <div className="divide-y divide-slate-50">
//             {filteredMembers.map(member => {
//               const isAdminRole = member.role === "admin";
//               const ini = (member.name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
//               const hasAccount = !!member.uid; // signed up via Auth
//               return (
//                 <div key={member.id}
//                   className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_40px_48px]
//                     gap-2 sm:gap-4 px-5 py-3.5 items-center group hover:bg-slate-50/60 transition">

//                   {/* Avatar + Name */}
//                   <div className="flex items-center gap-3">
//                     <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
//                       ${isAdminRole ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
//                       {ini}
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold text-slate-800">{member.name}</p>
//                       <p className="text-xs text-slate-400 sm:hidden">{member.employeeId}</p>
//                     </div>
//                   </div>

//                   {/* Employee ID */}
//                   <div className="hidden sm:flex items-center gap-1.5">
//                     <FaIdBadge className="text-slate-300 text-xs shrink-0" />
//                     <span className="text-sm text-slate-600 font-mono">{member.employeeId}</span>
//                   </div>

//                   {/* Department */}
//                   <div className="hidden sm:block">
//                     <span className="text-sm text-slate-500">{member.department || "General"}</span>
//                   </div>

//                   {/* Role badge */}
//                   <div>
//                     <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
//                       ${isAdminRole ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
//                       {isAdminRole ? <FaUserTie className="text-[10px]" /> : <FaUser className="text-[10px]" />}
//                       {isAdminRole ? "Admin" : "Employee"}
//                     </span>
//                   </div>

//                   {/* Auth indicator */}
//                   <div className="hidden sm:flex justify-center">
//                     <span title={hasAccount ? "Registered account" : "Manually added"}
//                       className={`text-[10px] px-1.5 py-0.5 rounded font-semibold
//                         ${hasAccount ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"}`}>
//                       {hasAccount ? "✓" : "—"}
//                     </span>
//                   </div>

//                   {/* Delete */}
//                   <button onClick={() => handleDeleteMember(member.id)}
//                     className="opacity-0 group-hover:opacity-100 p-2 text-slate-400
//                       hover:text-red-500 hover:bg-red-50 rounded-lg transition justify-self-end">
//                     <FaTrash className="text-xs" />
//                   </button>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── Add Member Modal ── */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
//             <div className="flex items-center justify-between mb-5">
//               <div>
//                 <h3 className="text-lg font-bold text-slate-800">Add Team Member</h3>
//                 <p className="text-xs text-slate-400 mt-0.5">Fill in the member's details below</p>
//               </div>
//               <button onClick={() => { setShowModal(false); setModalError(""); }}
//                 className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
//                 <FaTimes />
//               </button>
//             </div>
//             {modalError && (
//               <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
//                 {modalError}
//               </div>
//             )}
//             <div className="space-y-4">
//               <MField label="Full Name"   icon={<FaUser />}    placeholder="e.g. Ravi Kumar"      value={newName}  onChange={e => setNewName(e.target.value)} />
//               <MField label="Employee ID" icon={<FaIdBadge />} placeholder="e.g. EMP-2024-001"    value={newEmpId} onChange={e => setNewEmpId(e.target.value)} />
//               <MField label="Department"  icon={<FaUsers />}   placeholder="e.g. Marketing, Dev…" value={newDept}  onChange={e => setNewDept(e.target.value)} />
//               <div>
//                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
//                 <div className="grid grid-cols-2 gap-3">
//                   {["employee","admin"].map(r => (
//                     <button key={r} type="button" onClick={() => setNewRole(r)}
//                       className={`flex items-center justify-center gap-2 py-2.5 px-3
//                         rounded-xl border text-sm font-medium transition-all active:scale-95
//                         ${newRole===r
//                           ? r==="admin" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-emerald-500 bg-emerald-50 text-emerald-700"
//                           : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
//                         }`}>
//                       {r==="admin" ? <FaUserTie className="text-xs" /> : <FaUser className="text-xs" />}
//                       <span className="capitalize">{r}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//             <div className="flex gap-3 mt-6">
//               <button onClick={() => { setShowModal(false); setModalError(""); }}
//                 className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
//                 Cancel
//               </button>
//               <button onClick={handleAddMember} disabled={adding}
//                 className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-200">
//                 {adding ? "Adding..." : "Add Member"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function MField({ label, icon, placeholder, value, onChange }) {
//   return (
//     <div>
//       <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
//       <div className="relative">
//         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{icon}</span>
//         <input type="text" placeholder={placeholder} value={value} onChange={onChange}
//           className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm
//             placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-transparent transition" />
//       </div>
//     </div>
//   );
// }





import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import {
  FaPlus, FaTimes, FaSearch, FaChevronDown,
  FaCheck, FaClock, FaTrash, FaEdit, FaFilter,
  FaFlag, FaUser, FaEllipsisH,
} from "react-icons/fa";

// ─────────────────────────────────────────────────────────────────────────────
//  Constants & Helpers
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_META = {
  High:   { label:"High",   dot:"#ef4444", badge:"bg-red-50 text-red-600 border border-red-100",      icon:"🔴" },
  Medium: { label:"Medium", dot:"#f59e0b", badge:"bg-amber-50 text-amber-600 border border-amber-100", icon:"🟡" },
  Low:    { label:"Low",    dot:"#22c55e", badge:"bg-green-50 text-green-600 border border-green-100", icon:"🟢" },
};
const STATUS_META = {
  "To Do":       { color:"bg-slate-100 text-slate-500", bar:"bg-slate-400",  order:0 },
  "In Progress": { color:"bg-sky-100 text-sky-600",     bar:"bg-sky-500",    order:1 },
  "In Review":   { color:"bg-violet-100 text-violet-600", bar:"bg-violet-500", order:2 },
  "Done":        { color:"bg-emerald-100 text-emerald-600", bar:"bg-emerald-500", order:3 },
};
const STATUSES  = Object.keys(STATUS_META);
const PRIORITIES = ["High", "Medium", "Low"];

const AVATAR_PALETTE = [
  ["#3b82f6","#dbeafe"], ["#8b5cf6","#ede9fe"], ["#10b981","#d1fae5"],
  ["#f59e0b","#fef3c7"], ["#ef4444","#fee2e2"], ["#ec4899","#fce7f3"],
  ["#06b6d4","#cffafe"], ["#6366f1","#e0e7ff"],
];
function avatarPalette(str) {
  const h = [...(str||"x")].reduce((a,c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
function initials(name) {
  return (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
}
function dueMeta(iso) {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (days < 0)  return { label:`${Math.abs(days)}d overdue`, cls:"text-red-500",   urgent:true  };
  if (days === 0) return { label:"Due today",                 cls:"text-amber-500", urgent:true  };
  if (days <= 3)  return { label:`${days}d left`,             cls:"text-amber-400", urgent:false };
  return              { label:new Date(iso).toLocaleDateString("en-IN",{day:"numeric",month:"short"}), cls:"text-slate-400", urgent:false };
}
function completionRing(done, total) {
  const pct = total > 0 ? done / total : 0;
  const r = 10, circ = 2 * Math.PI * r;
  return { pct: Math.round(pct * 100), offset: circ - pct * circ, circ };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminTasks() {
  const adminUser = auth.currentUser;

  // Firebase data
  const [tasks,       setTasks]       = useState([]);
  const [users,       setUsers]       = useState({});
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "assignedTasks"), s => {
        const d = s.val() || {};
        setTasks(Object.entries(d).map(([id, v]) => ({ id, ...v })));
      }),
      onValue(ref(db, "users"),       s => setUsers(s.val()       || {})),
      onValue(ref(db, "teamMembers"), s => {
        const d = s.val() || {};
        setTeamMembers(Object.entries(d).map(([id, v]) => ({ id, ...v })));
      }),
    ];
    return () => subs.forEach(u => u());
  }, []);

  // Employees list (non-admin users)
  const employees = Object.entries(users)
    .filter(([, u]) => u.role !== "admin")
    .map(([uid, u]) => ({ uid, name: u.name || "Unnamed", role: u.role }));

  // Sidebar selection
  const [selectedEmp, setSelectedEmp] = useState("all");

  // Filters
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioFilter,   setPrioFilter]   = useState("all");

  // Modal
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const FORM_INIT = { title:"", description:"", assignedTo:"", priority:"Medium",
                      status:"To Do", project:"", dueDate:"" };
  const [form, setForm] = useState(FORM_INIT);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  // Per-employee task stats
  function empStats(uid) {
    const mine  = tasks.filter(t => t.assignedTo === uid);
    const done  = mine.filter(t => t.status === "Done").length;
    const over  = mine.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done").length;
    return { total: mine.length, done, over };
  }

  // Filtered tasks
  const displayed = tasks.filter(t => {
    if (selectedEmp !== "all" && t.assignedTo !== selectedEmp) return false;
    if (statusFilter !== "all" && t.status !== statusFilter)   return false;
    if (prioFilter   !== "all" && t.priority !== prioFilter)   return false;
    if (search && ![ t.title, t.assignedToName, t.project ]
      .some(s => (s||"").toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    const so = (STATUS_META[a.status]?.order ?? 0) - (STATUS_META[b.status]?.order ?? 0);
    if (so !== 0) return so;
    const po = PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
    return po;
  });

  // Stats for header
  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter(t => t.status === "Done").length;
  const urgentTasks = tasks.filter(t => t.priority === "High" && t.status !== "Done").length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done").length;

  // Open modal
  function openNew() {
    setEditId(null);
    setForm({ ...FORM_INIT, assignedTo: selectedEmp !== "all" ? selectedEmp : "" });
    setEmpSearch(""); setFormErr(""); setModal(true);
  }
  function openEdit(task) {
    setEditId(task.id);
    setForm({ title:task.title, description:task.description||"",
              assignedTo:task.assignedTo, priority:task.priority,
              status:task.status, project:task.project||"", dueDate:task.dueDate||"" });
    setEmpSearch(""); setFormErr(""); setModal(true);
  }

  async function handleSave() {
    setFormErr("");
    if (!form.title.trim()) { setFormErr("Task title is required.");         return; }
    if (!form.assignedTo)   { setFormErr("Please select an employee first."); return; }
    setSaving(true);
    const emp = employees.find(e => e.uid === form.assignedTo);
    const payload = {
      ...form,
      title:          form.title.trim(),
      description:    form.description.trim(),
      project:        form.project.trim(),
      assignedToName: emp?.name || "Unknown",
      assignedBy:     adminUser?.uid || "",
      assignedByName: users[adminUser?.uid]?.name || "Admin",
      updatedAt:      new Date().toISOString(),
    };
    if (editId) {
      await update(ref(db, `assignedTasks/${editId}`), payload);
    } else {
      await push(ref(db, "assignedTasks"), { ...payload, createdAt: new Date().toISOString() });
    }
    setSaving(false); setModal(false);
  }

  async function handleStatusChange(taskId, status) {
    await update(ref(db, `assignedTasks/${taskId}`), { status, updatedAt: new Date().toISOString() });
  }
  async function handleDelete(taskId) {
    if (!window.confirm("Delete this task?")) return;
    await remove(ref(db, `assignedTasks/${taskId}`));
  }

  const filteredEmps = employees.filter(e =>
    e.name.toLowerCase().includes(empSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">

      {/* ══════════════════════════════════════════
          LEFT SIDEBAR — People Panel
      ══════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-100 flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <h2 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Team</h2>
        </div>

        {/* All Tasks option */}
        <button
          onClick={() => setSelectedEmp("all")}
          className={`flex items-center gap-3 mx-3 mt-3 px-3 py-2.5 rounded-lg text-sm transition
            ${selectedEmp === "all"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"}`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0
            ${selectedEmp === "all" ? "bg-white/20" : "bg-slate-100"}`}>
            👥
          </div>
          <span className="font-medium flex-1 text-left">All Members</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded
            ${selectedEmp === "all" ? "bg-white/20 text-white" : "text-slate-400"}`}>
            {tasks.length}
          </span>
        </button>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 mt-2 space-y-1">
          {employees.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No employees yet</p>
          ) : (
            employees.map(emp => {
              const { total, done, over } = empStats(emp.uid);
              const ring = completionRing(done, total);
              const [fg, bg] = avatarPalette(emp.uid);
              const active = selectedEmp === emp.uid;
              return (
                <button key={emp.uid}
                  onClick={() => setSelectedEmp(emp.uid)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
                    ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {/* Avatar with completion ring */}
                  <div className="relative shrink-0 w-8 h-8">
                    <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 26 26">
                      <circle cx="13" cy="13" r={10} fill="none" stroke={active?"rgba(255,255,255,0.2)":"#f1f5f9"} strokeWidth="2.5"/>
                      <circle cx="13" cy="13" r={10} fill="none" stroke={active?"white":fg}
                        strokeWidth="2.5" strokeLinecap="round"
                        strokeDasharray={ring.circ} strokeDashoffset={ring.offset}
                        style={{transition:"stroke-dashoffset 0.4s ease"}}/>
                    </svg>
                    <div className="absolute inset-[3px] rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ backgroundColor: active ? "rgba(255,255,255,0.15)" : bg, color: active ? "white" : fg }}>
                      {initials(emp.name)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className={`text-xs font-semibold truncate ${active?"text-white":"text-slate-700"}`}>
                      {emp.name}
                    </p>
                    <p className={`text-[10px] ${active?"text-white/60":"text-slate-400"}`}>
                      {done}/{total} done
                      {over > 0 && <span className={active?"text-red-300":" text-red-400"}> · {over} late</span>}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar footer stats */}
        <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-2">
          {[
            { label:"Urgent", val:urgentTasks,  cls:"text-red-500"   },
            { label:"Overdue",val:overdueTasks, cls:"text-amber-500" },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-lg px-2.5 py-2 text-center">
              <p className={`text-base font-bold ${s.cls}`}>{s.val}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT — Task Panel
      ══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              {selectedEmp === "all"
                ? "All Tasks"
                : `${employees.find(e=>e.uid===selectedEmp)?.name || "Employee"}'s Tasks`}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {displayed.length} task{displayed.length !== 1 ? "s" : ""}
              {statusFilter !== "all" && ` · ${statusFilter}`}
              {prioFilter !== "all" && ` · ${prioFilter} priority`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"/>
              <input type="text" placeholder="Search…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-44
                  focus:outline-none focus:ring-2 focus:ring-slate-300 focus:w-56 transition-all bg-white"/>
              {search && <button onClick={()=>setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><FaTimes className="text-[10px]"/></button>}
            </div>

            {/* Status filter */}
            <FilterPill
              value={statusFilter}
              onChange={setStatusFilter}
              options={[["all","Status"], ...STATUSES.map(s=>[s,s])]}
            />

            {/* Priority filter */}
            <FilterPill
              value={prioFilter}
              onChange={setPrioFilter}
              options={[["all","Priority"], ...PRIORITIES.map(p=>[p,p])]}
            />

            {/* Assign button */}
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700
                text-white text-sm font-semibold rounded-lg transition active:scale-95 shadow-sm">
              <FaPlus className="text-[10px]"/> Assign Task
            </button>
          </div>
        </div>

        {/* Status summary bar */}
        <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-6 shrink-0 overflow-x-auto">
          {STATUSES.map(s => {
            const count = displayed.filter(t => t.status === s).length;
            const meta  = STATUS_META[s];
            return (
              <button key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap py-1 border-b-2 transition
                  ${statusFilter === s ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <span className={`w-2 h-2 rounded-full ${meta.bar}`}/>
                {s}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold
                  ${statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width:`${totalTasks>0?Math.round(doneTasks/totalTasks*100):0}%` }}/>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {totalTasks>0?Math.round(doneTasks/totalTasks*100):0}% done
            </span>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">📋</div>
              <p className="text-slate-600 font-semibold">No tasks found</p>
              <p className="text-slate-400 text-sm mt-1">
                {tasks.length === 0 ? "Click 'Assign Task' to get started." : "Try changing the filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-w-4xl">
              {displayed.map(task => <TaskRow key={task.id} task={task}
                onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange}
                empColor={avatarPalette(task.assignedTo || "x")}
              />)}
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════════
          ASSIGN / EDIT MODAL
      ══════════════════════════════════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden
            flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editId ? "Edit Task" : "Assign New Task"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editId ? "Update task details" : "Create a task and assign it to a team member"}
                </p>
              </div>
              <button onClick={() => setModal(false)}
                className="p-2 -mr-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                <FaTimes className="text-sm"/>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Error */}
              {formErr && (
                <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                  <span className="text-base">⚠️</span>{formErr}
                </div>
              )}

              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Task Title <span className="text-red-400">*</span></label>
                <input type="text" value={form.title} autoFocus
                  onChange={e => setForm(f=>({...f,title:e.target.value}))}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800
                    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition font-medium"/>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Description</label>
                <textarea value={form.description} rows={2}
                  onChange={e => setForm(f=>({...f,description:e.target.value}))}
                  placeholder="Add context, links, or instructions…"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800
                    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"/>
              </div>

              {/* ── Assign To — visual employee picker ── */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Assign To <span className="text-red-400">*</span>
                </label>

                {/* Search employees */}
                <div className="relative mb-2.5">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"/>
                  <input type="text" placeholder="Search employees…" value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-slate-300 transition"/>
                </div>

                {/* Employee cards grid */}
                <div className={`grid gap-2 ${filteredEmps.length > 4 ? "grid-cols-2" : "grid-cols-2"}`}>
                  {filteredEmps.length === 0 ? (
                    <p className="col-span-2 text-xs text-slate-400 py-3 text-center">No employees found</p>
                  ) : filteredEmps.map(emp => {
                    const selected = form.assignedTo === emp.uid;
                    const [fg, bg] = avatarPalette(emp.uid);
                    const { total, done } = empStats(emp.uid);
                    return (
                      <button key={emp.uid} type="button"
                        onClick={() => setForm(f => ({...f, assignedTo: emp.uid}))}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition
                          ${selected
                            ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: selected?"rgba(255,255,255,0.15)":bg, color: selected?"white":fg }}>
                          {initials(emp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${selected?"text-white":"text-slate-800"}`}>
                            {emp.name}
                          </p>
                          <p className={`text-[10px] ${selected?"text-white/60":"text-slate-400"}`}>
                            {total} task{total!==1?"s":""} · {done} done
                          </p>
                        </div>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <FaCheck className="text-white text-[9px]"/>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Project / Client</label>
                  <input type="text" value={form.project}
                    onChange={e => setForm(f=>({...f,project:e.target.value}))}
                    placeholder="e.g. EcoHomely"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                      placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Due Date</label>
                  <input type="date" value={form.dueDate}
                    onChange={e => setForm(f=>({...f,dueDate:e.target.value}))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                      focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => {
                    const m = PRIORITY_META[p];
                    const sel = form.priority === p;
                    return (
                      <button key={p} type="button" onClick={() => setForm(f=>({...f,priority:p}))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition
                          ${sel ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 text-slate-500 hover:border-slate-200 bg-white"}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.dot }}/>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Initial Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {STATUSES.map(s => {
                    const m   = STATUS_META[s];
                    const sel = form.status === s;
                    return (
                      <button key={s} type="button" onClick={() => setForm(f=>({...f,status:s}))}
                        className={`py-2 rounded-xl border-2 text-[11px] font-semibold transition
                          ${sel ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 text-slate-500 hover:border-slate-200 bg-white"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold
                  transition active:scale-95 disabled:opacity-50">
                {saving ? "Saving…" : editId ? "Save Changes" : "Assign Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TaskRow
// ─────────────────────────────────────────────────────────────────────────────
function TaskRow({ task, onEdit, onDelete, onStatusChange, empColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pr  = PRIORITY_META[task.priority]  || PRIORITY_META.Medium;
  const st  = STATUS_META[task.status]       || STATUS_META["To Do"];
  const due = dueMeta(task.dueDate);
  const [fg, bg] = empColor;
  const isDone = task.status === "Done";

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  return (
    <div className={`group bg-white rounded-xl border transition-all
      ${isDone ? "border-slate-100 opacity-60" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"}`}>
      <div className="flex items-center gap-4 px-4 py-3.5">

        {/* Priority dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pr.dot }}/>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
              {task.title}
            </span>
            {task.project && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                {task.project}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Assigned to */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{ backgroundColor: bg, color: fg }}>
                {initials(task.assignedToName || "?")}
              </div>
              <span className="text-[10px] text-slate-400">{task.assignedToName || "Unassigned"}</span>
            </div>
            {/* Due */}
            {due && (
              <span className={`text-[10px] font-medium flex items-center gap-1 ${due.cls}`}>
                <FaClock className="text-[9px]"/>
                {due.label}
                {due.urgent && "⚠"}
              </span>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Priority badge */}
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${pr.badge}`}>
            {pr.icon} {pr.label}
          </span>

          {/* Status selector */}
          <div className="relative">
            <select value={task.status}
              onChange={e => onStatusChange(task.id, e.target.value)}
              className={`text-[11px] font-semibold pl-2.5 pr-6 py-1.5 rounded-full cursor-pointer
                appearance-none border-0 focus:outline-none focus:ring-2 focus:ring-slate-300 ${st.color}`}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-50 pointer-events-none"/>
          </div>

          {/* Context menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center
                rounded-lg hover:bg-slate-100 text-slate-400 transition">
              <FaEllipsisH className="text-xs"/>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 w-36 overflow-hidden">
                <button onClick={() => { onEdit(task); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition">
                  <FaEdit className="text-slate-400"/> Edit Task
                </button>
                <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition">
                  <FaTrash className="text-red-400"/> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  FilterPill
// ─────────────────────────────────────────────────────────────────────────────
function FilterPill({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`pl-3 pr-7 py-2 border rounded-lg text-xs font-semibold
          appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300 transition
          ${value !== "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
        {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-50 pointer-events-none"/>
    </div>
  );
}