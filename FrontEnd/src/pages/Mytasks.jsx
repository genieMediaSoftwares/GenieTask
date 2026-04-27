// import { useState, useEffect } from "react";
// import { auth, db } from "../firebase";
// import { ref, onValue, push, update, remove } from "firebase/database";
// import { FaSearch, FaPlus, FaTimes, FaSyncAlt, FaCheck } from "react-icons/fa";

// const FILTERS = ["All", "Pending", "In Progress", "Done", "High Priority", "Recurring"];

// const PROJECT_COLORS = {
//   "Meera Basu":  "bg-purple-100 text-purple-700",
//   "Genie Media": "bg-blue-100 text-blue-700",
//   "EcoHomely":   "bg-green-100 text-green-700",
//   "Shopzzy":     "bg-orange-100 text-orange-700",
//   "Manyam":      "bg-rose-100 text-rose-700",
// };

// function projectColor(p) {
//   return PROJECT_COLORS[p] || "bg-slate-100 text-slate-600";
// }

// function priorityBadge(p) {
//   if (p === "High")   return "bg-red-50 text-red-600 border border-red-200";
//   if (p === "Medium") return "bg-orange-50 text-orange-600 border border-orange-200";
//   return "bg-green-50 text-green-600 border border-green-200";
// }

// function statusBadge(s) {
//   if (s === "Done")        return "bg-green-50 text-green-700 border border-green-200";
//   if (s === "In Progress") return "bg-blue-50 text-blue-700 border border-blue-200";
//   return "bg-orange-50 text-orange-600 border border-orange-200";
// }

// const EMPTY_FORM = {
//   title: "", project: "", dueDate: "",
//   priority: "Medium", status: "Pending",
//   tags: "", recurring: false,
// };

// export default function MyTasks() {
//   const user = auth.currentUser;
//   const [tasks, setTasks] = useState([]);
//   const [filter, setFilter] = useState("All");
//   const [search, setSearch] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [form, setForm] = useState(EMPTY_FORM);

//   useEffect(() => {
//     if (!user) return;
//     return onValue(ref(db, `tasks/${user.uid}`), (snap) => {
//       const data = snap.val() || {};
//       setTasks(Object.entries(data).map(([id, v]) => ({ id, ...v })));
//     });
//   }, [user?.uid]);

//   const filtered = tasks.filter((t) => {
//     const matchSearch = (t.title || "").toLowerCase().includes(search.toLowerCase());
//     if (!matchSearch) return false;
//     if (filter === "All") return true;
//     if (filter === "High Priority") return t.priority === "High";
//     if (filter === "Recurring") return !!t.recurring;
//     return t.status === filter;
//   });

//   const handleAdd = async () => {
//     if (!form.title.trim()) return;
//     await push(ref(db, `tasks/${user.uid}`), {
//       ...form,
//       tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
//       createdAt: new Date().toISOString(),
//     });
//     setForm(EMPTY_FORM);
//     setShowModal(false);
//   };

//   const toggleDone = (task) => {
//     const newStatus = task.status === "Done" ? "Pending" : "Done";
//     update(ref(db, `tasks/${user.uid}/${task.id}`), { status: newStatus });
//   };

//   const deleteTask = (id) => remove(ref(db, `tasks/${user.uid}/${id}`));

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-5">
//         <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
//         <button
//           onClick={() => setShowModal(true)}
//           className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition active:scale-95"
//         >
//           <FaPlus className="text-xs" /> Add Task
//         </button>
//       </div>

//       {/* Search */}
//       <div className="relative mb-4">
//         <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
//         <input
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           placeholder="Search..."
//           className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
//             text-slate-700 placeholder-slate-300 bg-white
//             focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
//         />
//       </div>

//       {/* Filter tabs */}
//       <div className="flex gap-2 flex-wrap mb-5">
//         {FILTERS.map((f) => (
//           <button
//             key={f}
//             onClick={() => setFilter(f)}
//             className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition active:scale-95
//               ${filter === f
//                 ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
//                 : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
//           filtered.map((task) => (
//             <div
//               key={task.id}
//               className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-slate-100 hover:shadow-md transition"
//             >
//               {/* Circle toggle */}
//               <button
//                 onClick={() => toggleDone(task)}
//                 className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90
//                   ${task.status === "Done"
//                     ? "bg-green-500 border-green-500"
//                     : "border-slate-300 hover:border-blue-400"
//                   }`}
//               >
//                 {task.status === "Done" && <FaCheck className="text-white text-[8px]" />}
//               </button>

//               {/* Content */}
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 flex-wrap">
//                   <span className={`text-sm font-medium ${task.status === "Done" ? "line-through text-slate-400" : "text-slate-700"}`}>
//                     {task.title}
//                   </span>
//                   {task.recurring && (
//                     <span className="flex items-center gap-0.5 text-blue-500 text-[11px] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
//                       <FaSyncAlt className="text-[8px]" /> Recurring
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-1.5 mt-1 flex-wrap">
//                   {task.project && (
//                     <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${projectColor(task.project)}`}>
//                       {task.project}
//                     </span>
//                   )}
//                   {task.dueDate && (
//                     <span className="text-[11px] text-slate-400">📅 {task.dueDate}</span>
//                   )}
//                   {(Array.isArray(task.tags) ? task.tags : []).map((tag) => (
//                     <span key={tag} className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
//                       {tag}
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               {/* Right badges */}
//               <div className="flex items-center gap-2 shrink-0">
//                 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
//                   {task.priority}
//                 </span>
//                 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(task.status)}`}>
//                   {task.status}
//                 </span>
//                 <button
//                   onClick={() => deleteTask(task.id)}
//                   className="text-slate-300 hover:text-red-400 transition ml-1"
//                 >
//                   <FaTimes className="text-xs" />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Add Task Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
//             <div className="flex items-center justify-between mb-5">
//               <h3 className="text-lg font-bold text-slate-800">Add New Task</h3>
//               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
//                 <FaTimes />
//               </button>
//             </div>

//             <div className="space-y-3.5">
//               {/* Title */}
//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Task Title *</label>
//                 <input
//                   value={form.title}
//                   onChange={(e) => setForm({ ...form, title: e.target.value })}
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                   placeholder="Enter task title..."
//                   autoFocus
//                 />
//               </div>

//               {/* Project + Due Date */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Project</label>
//                   <input
//                     value={form.project}
//                     onChange={(e) => setForm({ ...form, project: e.target.value })}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                     placeholder="Project name"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Due Date</label>
//                   <input
//                     type="date"
//                     value={form.dueDate}
//                     onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                   />
//                 </div>
//               </div>

//               {/* Priority + Status */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Priority</label>
//                   <select
//                     value={form.priority}
//                     onChange={(e) => setForm({ ...form, priority: e.target.value })}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
//                   >
//                     <option>High</option>
//                     <option>Medium</option>
//                     <option>Low</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
//                   <select
//                     value={form.status}
//                     onChange={(e) => setForm({ ...form, status: e.target.value })}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
//                   >
//                     <option>Pending</option>
//                     <option>In Progress</option>
//                     <option>Done</option>
//                   </select>
//                 </div>
//               </div>

//               {/* Tags */}
//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Tags (comma-separated)</label>
//                 <input
//                   value={form.tags}
//                   onChange={(e) => setForm({ ...form, tags: e.target.value })}
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                   placeholder="Ads, Meta, Video"
//                 />
//               </div>

//               {/* Recurring */}
//               <div
//                 className="flex items-center gap-2.5 cursor-pointer select-none"
//                 onClick={() => setForm({ ...form, recurring: !form.recurring })}
//               >
//                 <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition
//                   ${form.recurring ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
//                   {form.recurring && <FaCheck className="text-white text-[8px]" />}
//                 </div>
//                 <span className="text-sm text-slate-600">Recurring task</span>
//               </div>
//             </div>

//             <div className="flex gap-3 mt-5">
//               <button
//                 onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
//                 className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleAdd}
//                 disabled={!form.title.trim()}
//                 className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition active:scale-95"
//               >
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
// import { ref, onValue, update } from "firebase/database";
// import {
//   FaSearch, FaTimes, FaSyncAlt, FaChevronDown,
//   FaClock, FaCheckCircle, FaHourglassHalf, FaStickyNote,
// } from "react-icons/fa";

// const FILTERS = ["All", "Pending", "In Progress", "Done", "High Priority", "Recurring"];

// const STATUS_CYCLE = ["Pending", "In Progress", "Done"];

// const STATUS_COLORS = {
//   "Done":        { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500"  },
//   "In Progress": { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
//   "Pending":     { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", dot: "bg-orange-400" },
// };
// const PRIORITY_COLORS = {
//   "High":   { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200"    },
//   "Medium": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
//   "Low":    { bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200"  },
// };
// const PROJECT_COLORS = {
//   "Meera Basu":  "bg-purple-100 text-purple-700",
//   "Genie Media": "bg-blue-100 text-blue-700",
//   "EcoHomely":   "bg-green-100 text-green-700",
//   "Shopzzy":     "bg-orange-100 text-orange-700",
//   "Manyam":      "bg-rose-100 text-rose-700",
// };

// export default function MyTasks() {
//   const user = auth.currentUser;

//   const [tasks,         setTasks]         = useState([]);
//   const [filter,        setFilter]        = useState("All");
//   const [search,        setSearch]        = useState("");
//   const [expandedId,    setExpandedId]    = useState(null);   // task with open notes editor
//   const [noteInput,     setNoteInput]     = useState("");     // draft note text
//   const [updatingId,    setUpdatingId]    = useState(null);   // task being saved

//   useEffect(() => {
//     if (!user) return;
//     return onValue(ref(db, `tasks/${user.uid}`), (snap) => {
//       const data = snap.val() || {};
//       setTasks(
//         Object.entries(data)
//           .map(([id, v]) => ({ id, ...v }))
//           .sort((a, b) => {
//             // Sort: In Progress first, Pending second, Done last
//             const order = { "In Progress": 0, "Pending": 1, "Done": 2 };
//             return (order[a.status] ?? 1) - (order[b.status] ?? 1);
//           })
//       );
//     });
//   }, [user?.uid]);

//   const filtered = tasks.filter(t => {
//     const matchSearch = (t.title || "").toLowerCase().includes(search.toLowerCase())
//       || (t.project || "").toLowerCase().includes(search.toLowerCase());
//     if (!matchSearch) return false;
//     if (filter === "All")           return true;
//     if (filter === "High Priority") return t.priority === "High";
//     if (filter === "Recurring")     return !!t.recurring;
//     return t.status === filter;
//   });

//   // ── Status update ────────────────────────────────────────────────
//   const cycleStatus = async (task) => {
//     const idx    = STATUS_CYCLE.indexOf(task.status);
//     const next   = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
//     setUpdatingId(task.id);
//     await update(ref(db, `tasks/${user.uid}/${task.id}`), {
//       status:    next,
//       updatedAt: new Date().toISOString(),
//     });
//     setUpdatingId(null);
//   };

//   // ── Set specific status ──────────────────────────────────────────
//   const setStatus = async (task, status) => {
//     setUpdatingId(task.id);
//     await update(ref(db, `tasks/${user.uid}/${task.id}`), {
//       status,
//       updatedAt: new Date().toISOString(),
//     });
//     setUpdatingId(null);
//   };

//   // ── Save progress note ───────────────────────────────────────────
//   const saveNote = async (task) => {
//     if (!noteInput.trim()) return;
//     const existing = task.progressNotes || [];
//     const newNote  = {
//       text:    noteInput.trim(),
//       savedAt: new Date().toISOString(),
//     };
//     await update(ref(db, `tasks/${user.uid}/${task.id}`), {
//       progressNotes: [...existing, newNote],
//       updatedAt:     new Date().toISOString(),
//     });
//     setNoteInput("");
//     setExpandedId(null);
//   };

//   // ── Stats ────────────────────────────────────────────────────────
//   const total      = tasks.length;
//   const done       = tasks.filter(t => t.status === "Done").length;
//   const inProgress = tasks.filter(t => t.status === "In Progress").length;
//   const pending    = tasks.filter(t => t.status === "Pending").length;
//   const pct        = total > 0 ? Math.round((done / total) * 100) : 0;

//   return (
//     <div className="p-6 max-w-[900px] mx-auto">

//       {/* ── Header ── */}
//       <div className="mb-5">
//         <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
//         <p className="text-sm text-slate-400 mt-0.5">Tasks assigned to you by your admin</p>
//       </div>

//       {/* ── Progress Bar + Stats ── */}
//       <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-5">
//         <div className="flex items-center justify-between mb-2">
//           <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
//           <span className="text-sm font-bold text-blue-600">{pct}%</span>
//         </div>
//         <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
//           <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
//             style={{ width: `${pct}%` }} />
//         </div>
//         <div className="grid grid-cols-3 gap-3 text-center">
//           {[
//             { label:"Pending",     val:pending,    color:"text-orange-500" },
//             { label:"In Progress", val:inProgress, color:"text-blue-500"   },
//             { label:"Completed",   val:done,       color:"text-green-500"  },
//           ].map(s => (
//             <div key={s.label}>
//               <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
//               <p className="text-xs text-slate-400">{s.label}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── Search ── */}
//       <div className="relative mb-4">
//         <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
//         <input value={search} onChange={e => setSearch(e.target.value)}
//           placeholder="Search tasks or projects..."
//           className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm
//             text-slate-700 placeholder-slate-300 bg-white
//             focus:outline-none focus:ring-2 focus:ring-blue-200 transition" />
//         {search && (
//           <button onClick={() => setSearch("")}
//             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
//             <FaTimes className="text-xs" />
//           </button>
//         )}
//       </div>

//       {/* ── Filter tabs ── */}
//       <div className="flex gap-2 flex-wrap mb-5">
//         {FILTERS.map(f => (
//           <button key={f} onClick={() => setFilter(f)}
//             className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition active:scale-95
//               ${filter === f
//                 ? "bg-blue-600 text-white shadow-sm"
//                 : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
//               }`}>
//             {f}
//           </button>
//         ))}
//       </div>

//       {/* ── Task Cards ── */}
//       {total === 0 ? (
//         <div className="text-center py-20 text-slate-400">
//           <p className="text-4xl mb-3">📭</p>
//           <p className="text-sm font-medium">No tasks assigned yet.</p>
//           <p className="text-xs mt-1">Your admin will assign tasks to you soon.</p>
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="text-center py-16 text-slate-400">
//           <p className="text-3xl mb-2">🔍</p>
//           <p className="text-sm">No tasks match your filter.</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {filtered.map(task => {
//             const sc       = STATUS_COLORS[task.status]  || STATUS_COLORS["Pending"];
//             const pc       = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS["Low"];
//             const projColor = PROJECT_COLORS[task.project] || "bg-slate-100 text-slate-600";
//             const isExpanded = expandedId === task.id;
//             const isUpdating = updatingId === task.id;
//             const notes = task.progressNotes || [];

//             return (
//               <div key={task.id}
//                 className={`bg-white rounded-xl shadow-sm border transition
//                   ${task.status === "Done" ? "border-green-100 opacity-75" : "border-slate-100 hover:shadow-md"}`}>

//                 {/* ── Main row ── */}
//                 <div className="px-4 py-3.5 flex items-start gap-3">

//                   {/* Status indicator dot */}
//                   <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${sc.dot}`} />

//                   {/* Content */}
//                   <div className="flex-1 min-w-0">
//                     <p className={`text-sm font-semibold ${task.status === "Done" ? "line-through text-slate-400" : "text-slate-800"}`}>
//                       {task.title}
//                     </p>
//                     <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
//                       {task.project && (
//                         <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${projColor}`}>
//                           {task.project}
//                         </span>
//                       )}
//                       {task.dueDate && (
//                         <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
//                           <FaClock className="text-[9px]" /> {task.dueDate}
//                         </span>
//                       )}
//                       {task.recurring && (
//                         <span className="flex items-center gap-0.5 text-[11px] text-blue-500 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
//                           <FaSyncAlt className="text-[8px]" /> Recurring
//                         </span>
//                       )}
//                       {(Array.isArray(task.tags) ? task.tags : []).map(tag => (
//                         <span key={tag} className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{tag}</span>
//                       ))}
//                       {notes.length > 0 && (
//                         <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
//                           <FaStickyNote className="text-[9px]" /> {notes.length} note{notes.length > 1 ? "s" : ""}
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   {/* Right actions */}
//                   <div className="flex items-center gap-2 shrink-0">
//                     {/* Priority badge */}
//                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${pc.bg} ${pc.text} ${pc.border}`}>
//                       {task.priority}
//                     </span>

//                     {/* Status dropdown */}
//                     <div className="relative group">
//                       <button
//                         onClick={() => cycleStatus(task)}
//                         disabled={isUpdating}
//                         title="Click to cycle status"
//                         className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border transition active:scale-95
//                           ${sc.bg} ${sc.text} ${sc.border} ${isUpdating ? "opacity-50 cursor-wait" : "cursor-pointer hover:opacity-80"}`}>
//                         {task.status === "Done"        && <FaCheckCircle className="text-[10px]" />}
//                         {task.status === "In Progress" && <FaSyncAlt className="text-[10px] animate-spin" />}
//                         {task.status === "Pending"     && <FaHourglassHalf className="text-[10px]" />}
//                         {task.status}
//                         <FaChevronDown className="text-[8px]" />
//                       </button>
//                     </div>

//                     {/* Notes toggle */}
//                     <button
//                       onClick={() => {
//                         setExpandedId(isExpanded ? null : task.id);
//                         setNoteInput(task.progressNotes?.slice(-1)[0]?.text || "");
//                       }}
//                       className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
//                       title="Add progress note">
//                       <FaStickyNote className="text-xs" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* ── Status quick-pick bar ── */}
//                 {task.status !== "Done" && (
//                   <div className="px-4 pb-3 flex items-center gap-2">
//                     <span className="text-[11px] text-slate-400 mr-1">Update:</span>
//                     {STATUS_CYCLE.map(s => (
//                       <button key={s} onClick={() => setStatus(task, s)}
//                         disabled={task.status === s || isUpdating}
//                         className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition active:scale-95
//                           ${task.status === s
//                             ? `${STATUS_COLORS[s].bg} ${STATUS_COLORS[s].text} ${STATUS_COLORS[s].border} opacity-60 cursor-default`
//                             : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
//                           }`}>
//                         {s}
//                       </button>
//                     ))}
//                   </div>
//                 )}

//                 {/* ── Progress Notes Panel ── */}
//                 {isExpanded && (
//                   <div className="px-4 pb-4 border-t border-slate-50 pt-3">
//                     {/* Existing notes */}
//                     {notes.length > 0 && (
//                       <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto">
//                         {notes.map((n, i) => (
//                           <div key={i} className="flex items-start gap-2 text-xs">
//                             <span className="text-slate-300 mt-0.5">#{i + 1}</span>
//                             <div className="flex-1 bg-slate-50 rounded-lg px-2.5 py-1.5 text-slate-600">
//                               <p>{n.text}</p>
//                               <p className="text-[10px] text-slate-400 mt-0.5">
//                                 {new Date(n.savedAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
//                               </p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                     {/* Add note */}
//                     <div className="flex gap-2">
//                       <textarea
//                         value={noteInput}
//                         onChange={e => setNoteInput(e.target.value)}
//                         placeholder="Add a progress note (e.g. completed design phase, waiting for review)..."
//                         rows={2}
//                         className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none
//                           focus:outline-none focus:ring-2 focus:ring-blue-200 transition text-slate-700 placeholder-slate-300" />
//                       <div className="flex flex-col gap-1.5">
//                         <button onClick={() => saveNote(task)}
//                           disabled={!noteInput.trim()}
//                           className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition active:scale-95">
//                           Save
//                         </button>
//                         <button onClick={() => { setExpandedId(null); setNoteInput(""); }}
//                           className="px-3 py-1.5 border border-slate-200 text-slate-500 text-xs rounded-lg hover:bg-slate-50 transition">
//                           Cancel
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }




// import { useState, useEffect, useRef, useCallback } from "react";
// import { auth, db } from "../firebase";
// import { ref, onValue, update } from "firebase/database";
// import { onAuthStateChanged } from "firebase/auth";

// // ─── Config ────────────────────────────────────────────────────────────────
// const STATUSES = ["To Do", "In Progress", "In Review", "Done"];

// const STATUS_CFG = {
//   "To Do":       { color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", text: "#475569", progress: 0   },
//   "In Progress": { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", progress: 40  },
//   "In Review":   { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9", progress: 75  },
//   "Done":        { color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", text: "#065f46", progress: 100 },
// };

// const PRIORITY_CFG = {
//   High:   { color: "#ef4444", bg: "#fef2f2", label: "High",   icon: "🔴" },
//   Medium: { color: "#f59e0b", bg: "#fffbeb", label: "Medium", icon: "🟡" },
//   Low:    { color: "#22c55e", bg: "#f0fdf4", label: "Low",    icon: "🟢" },
// };

// const FILTERS = ["All", "To Do", "In Progress", "In Review", "Done", "High Priority"];

// // ─── Helpers ───────────────────────────────────────────────────────────────
// function dueMeta(iso) {
//   if (!iso) return null;
//   const days = Math.ceil((new Date(iso) - new Date()) / 86400000);
//   if (days < 0)   return { label: `${Math.abs(days)}d overdue`, color: "#ef4444" };
//   if (days === 0) return { label: "Due today",                  color: "#f59e0b" };
//   if (days <= 3)  return { label: `${days}d left`,              color: "#f59e0b" };
//   return { label: new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), color: "#94a3b8" };
// }

// function timeAgo(iso) {
//   if (!iso) return "";
//   const diff = Date.now() - new Date(iso).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1)  return "just now";
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24)  return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }

// // ─── ProgressBar ───────────────────────────────────────────────────────────
// function ProgressBar({ value, color, height = 4 }) {
//   return (
//     <div style={{ height, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
//       <div style={{
//         height: "100%", width: `${value}%`, background: color,
//         borderRadius: 99, transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
//       }} />
//     </div>
//   );
// }

// // ─── StatusBadge ───────────────────────────────────────────────────────────
// function StatusBadge({ status, onClick, loading }) {
//   const cfg = STATUS_CFG[status] || STATUS_CFG["To Do"];
//   return (
//     <button
//       onClick={onClick}
//       disabled={loading}
//       style={{
//         background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text,
//         fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
//         cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1,
//         display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
//         transition: "all 0.15s",
//       }}
//     >
//       <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
//       {status}
//     </button>
//   );
// }

// // ─── Task Drawer ───────────────────────────────────────────────────────────
// function TaskDrawer({ task, onClose, onSaveUpdate }) {
//   const [status,  setStatus]  = useState(task.status  || "To Do");
//   const [percent, setPercent] = useState(task.progressPercent ?? STATUS_CFG[task.status]?.progress ?? 0);
//   const [note,    setNote]    = useState("");
//   const [saving,  setSaving]  = useState(false);
//   const [saved,   setSaved]   = useState(false);
//   const taRef = useRef(null);
//   const updates = task.updates || [];

//   useEffect(() => { taRef.current?.focus(); }, []);

//   useEffect(() => {
//     const h = e => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", h);
//     return () => window.removeEventListener("keydown", h);
//   }, [onClose]);

//   const handleSave = async () => {
//     setSaving(true);
//     await onSaveUpdate({ taskId: task.id, note: note.trim(), status, percent });
//     setNote("");
//     setSaved(true);
//     setTimeout(() => setSaved(false), 2500);
//     setSaving(false);
//   };

//   const cfg = STATUS_CFG[status] || STATUS_CFG["To Do"];

//   return (
//     <>
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
//           backdropFilter: "blur(3px)", zIndex: 40, animation: "fdIn 0.2s ease",
//         }}
//       />

//       <div style={{
//         position: "fixed", top: 0, right: 0, bottom: 0,
//         width: "min(540px, 100vw)", background: "#fff",
//         boxShadow: "-12px 0 40px rgba(0,0,0,0.14)",
//         zIndex: 50, display: "flex", flexDirection: "column",
//         animation: "slIn 0.28s cubic-bezier(.4,0,.2,1)",
//       }}>

//         {/* ── Drawer header ── */}
//         <div style={{
//           padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9",
//           background: "#fff", position: "sticky", top: 0, zIndex: 1,
//         }}>
//           <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
//                 {task.project && (
//                   <span style={{
//                     fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
//                     color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 4,
//                   }}>
//                     {task.project}
//                   </span>
//                 )}
//                 <span style={{
//                   fontSize: 10, fontWeight: 600,
//                   color:       PRIORITY_CFG[task.priority]?.color || "#94a3b8",
//                   background:  PRIORITY_CFG[task.priority]?.bg    || "#f8fafc",
//                   padding: "2px 8px", borderRadius: 4,
//                 }}>
//                   {PRIORITY_CFG[task.priority]?.icon} {task.priority || "Medium"}
//                 </span>
//               </div>
//               <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
//                 {task.title}
//               </h2>
//             </div>
//             <button onClick={onClose} style={{
//               width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0",
//               background: "#f8fafc", cursor: "pointer", color: "#64748b", fontSize: 15,
//               display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
//             }}>✕</button>
//           </div>

//           {/* Header progress */}
//           <div style={{ marginTop: 12 }}>
//             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
//               <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Progress</span>
//               <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color }}>{percent}%</span>
//             </div>
//             <ProgressBar value={percent} color={cfg.color} height={5} />
//           </div>
//         </div>

//         {/* ── Scrollable body ── */}
//         <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

//           {/* Description */}
//           {task.description && (
//             <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #f1f5f9" }}>
//               <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 5px" }}>
//                 Description
//               </p>
//               <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{task.description}</p>
//             </div>
//           )}

//           {/* Meta grid */}
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
//             {[
//               { label: "Assigned by", value: task.assignedByName || "Admin" },
//               { label: "Due date",    value: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No deadline" },
//               { label: "Created",     value: task.createdAt ? timeAgo(task.createdAt) : "—" },
//               { label: "Last update", value: task.updatedAt  ? timeAgo(task.updatedAt)  : "—" },
//             ].map(m => (
//               <div key={m.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "9px 11px", border: "1px solid #f1f5f9" }}>
//                 <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{m.label}</p>
//                 <p style={{ fontSize: 12, fontWeight: 600, color: "#334155", margin: 0 }}>{m.value}</p>
//               </div>
//             ))}
//           </div>

//           {/* ── Post Update Panel ── */}
//           <div style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
//             <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
//               <p style={{ fontSize: 13, fontWeight: 700, color: "#334155", margin: "0 0 1px" }}>Post an Update</p>
//               <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Share your progress with the admin</p>
//             </div>

//             <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 13 }}>

//               {/* Status pills */}
//               <div>
//                 <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 7 }}>
//                   Status
//                 </label>
//                 <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//                   {STATUSES.map(s => {
//                     const c = STATUS_CFG[s];
//                     const active = status === s;
//                     return (
//                       <button key={s} onClick={() => { setStatus(s); setPercent(c.progress); }}
//                         style={{
//                           padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 600,
//                           cursor: "pointer", transition: "all 0.15s",
//                           background: active ? c.color : c.bg,
//                           color:      active ? "#fff"  : c.text,
//                           border:     `1.5px solid ${active ? c.color : c.border}`,
//                           boxShadow:  active ? `0 2px 8px ${c.color}50` : "none",
//                         }}
//                       >{s}</button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Completion slider */}
//               <div>
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
//                   <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Completion</label>
//                   <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{percent}%</span>
//                 </div>
//                 <input type="range" min={0} max={100} step={5} value={percent}
//                   onChange={e => setPercent(Number(e.target.value))}
//                   style={{ width: "100%", accentColor: cfg.color, cursor: "pointer" }}
//                 />
//                 <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
//                   <div style={{ height: "100%", width: `${percent}%`, background: cfg.color, borderRadius: 99, transition: "width 0.2s" }} />
//                 </div>
//               </div>

//               {/* Note */}
//               <div>
//                 <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>
//                   Progress Note&nbsp;<span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
//                 </label>
//                 <textarea
//                   ref={taRef}
//                   value={note}
//                   onChange={e => setNote(e.target.value)}
//                   placeholder="What did you work on? Any blockers? What's next?"
//                   rows={3}
//                   style={{
//                     width: "100%", boxSizing: "border-box",
//                     border: "1.5px solid #e2e8f0", borderRadius: 10,
//                     padding: "10px 12px", fontSize: 13, color: "#334155",
//                     resize: "vertical", outline: "none", fontFamily: "inherit",
//                     lineHeight: 1.5, background: "#fff", transition: "border-color 0.15s",
//                   }}
//                   onFocus={e  => { e.target.style.borderColor = "#6366f1"; }}
//                   onBlur={e   => { e.target.style.borderColor = "#e2e8f0"; }}
//                 />
//               </div>

//               {/* Post button */}
//               <button onClick={handleSave} disabled={saving}
//                 style={{
//                   width: "100%", padding: "11px 0",
//                   background: saved ? "#10b981" : "#1e293b",
//                   color: "#fff", border: "none", borderRadius: 10,
//                   fontSize: 13, fontWeight: 700,
//                   cursor: saving ? "wait" : "pointer",
//                   transition: "background 0.25s",
//                   display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
//                 }}
//               >
//                 {saving ? "Saving…" : saved ? "✓ Update Posted!" : "Post Update"}
//               </button>
//             </div>
//           </div>

//           {/* ── Activity feed ── */}
//           {updates.length > 0 && (
//             <div>
//               <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
//                 Activity · {updates.length}
//               </p>
//               <div style={{ position: "relative" }}>
//                 {/* Timeline rail */}
//                 <div style={{ position: "absolute", left: 10, top: 14, bottom: 14, width: 1, background: "#f1f5f9" }} />

//                 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//                   {[...updates].reverse().map((u, i) => {
//                     const uc = STATUS_CFG[u.status] || STATUS_CFG["To Do"];
//                     return (
//                       <div key={i} style={{ display: "flex", gap: 12 }}>
//                         {/* Timeline dot */}
//                         <div style={{
//                           width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
//                           background: uc.bg, border: `2px solid ${uc.color}`,
//                           display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
//                           marginTop: 2,
//                         }}>
//                           <div style={{ width: 6, height: 6, borderRadius: "50%", background: uc.color }} />
//                         </div>

//                         {/* Content card */}
//                         <div style={{
//                           flex: 1, background: "#fafafa", borderRadius: 10,
//                           border: "1px solid #f1f5f9", padding: "9px 12px",
//                         }}>
//                           <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: u.note ? 5 : 0, flexWrap: "wrap" }}>
//                             <span style={{
//                               fontSize: 10, fontWeight: 700, color: uc.text,
//                               background: uc.bg, border: `1px solid ${uc.border}`,
//                               padding: "1px 7px", borderRadius: 10,
//                             }}>
//                               {u.status}
//                             </span>
//                             {u.percent !== undefined && (
//                               <span style={{ fontSize: 10, fontWeight: 700, color: uc.color }}>{u.percent}%</span>
//                             )}
//                             <span style={{ fontSize: 10, color: "#cbd5e1", marginLeft: "auto" }}>
//                               {timeAgo(u.savedAt)}
//                             </span>
//                           </div>
//                           {u.note && (
//                             <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.55 }}>{u.note}</p>
//                           )}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           )}

//           {updates.length === 0 && (
//             <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8" }}>
//               <p style={{ fontSize: 12, margin: 0 }}>No updates yet. Post your first update above.</p>
//             </div>
//           )}
//         </div>
//       </div>

//       <style>{`
//         @keyframes fdIn { from { opacity: 0 } to { opacity: 1 } }
//         @keyframes slIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
//       `}</style>
//     </>
//   );
// }

// // ─── Main Export ───────────────────────────────────────────────────────────
// export default function MyTasks() {
//   const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
//   const [tasks,       setTasks]       = useState([]);
//   const [loading,     setLoading]     = useState(true);
//   const [filter,      setFilter]      = useState("All");
//   const [search,      setSearch]      = useState("");
//   const [activeTask,  setActiveTask]  = useState(null);
//   const [updatingId,  setUpdatingId]  = useState(null);

//   // ── Auth listener — fixes tasks not showing on hard refresh ───
//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
//     return () => unsub();
//   }, []);

//   // ── Realtime listener — re-runs when auth resolves ────────────
//   useEffect(() => {
//     if (!currentUser) { setTasks([]); setLoading(false); return; }

//     setLoading(true);
//     const unsub = onValue(
//       ref(db, "assignedTasks"),
//       snap => {
//         const data = snap.val() || {};
//         const mine = Object.entries(data)
//           .filter(([, v]) => v.assignedTo === currentUser.uid)
//           .map(([id, v]) => ({ id, ...v }))
//           .sort((a, b) => {
//             const o = { "In Progress": 0, "In Review": 1, "To Do": 2, "Done": 3 };
//             const s = (o[a.status] ?? 2) - (o[b.status] ?? 2);
//             if (s !== 0) return s;
//             return ["High","Medium","Low"].indexOf(a.priority) - ["High","Medium","Low"].indexOf(b.priority);
//           });
//         setTasks(mine);
//         setLoading(false);
//       },
//       err => { console.error("Firebase:", err); setLoading(false); }
//     );
//     return () => unsub();
//   }, [currentUser]);

//   // ── Quick status advance (single click on badge) ──────────────
//   const handleQuickStatus = useCallback(async (taskId, cur) => {
//     const next = { "To Do": "In Progress", "In Progress": "In Review", "In Review": "Done", "Done": "To Do" }[cur] || "To Do";
//     setUpdatingId(taskId);
//     await update(ref(db, `assignedTasks/${taskId}`), {
//       status: next,
//       progressPercent: STATUS_CFG[next]?.progress ?? 0,
//       updatedAt: new Date().toISOString(),
//     });
//     setUpdatingId(null);
//   }, []);

//   // ── Full update from drawer ────────────────────────────────────
//   const handleSaveUpdate = useCallback(async ({ taskId, note, status, percent }) => {
//     const task = tasks.find(t => t.id === taskId);
//     if (!task) return;
//     const prev    = task.updates || [];
//     const entry   = { status, percent, note, savedAt: new Date().toISOString() };
//     await update(ref(db, `assignedTasks/${taskId}`), {
//       status,
//       progressPercent: percent,
//       updates:   [...prev, entry],
//       updatedAt: new Date().toISOString(),
//     });
//   }, [tasks]);

//   // ── Filtered list ─────────────────────────────────────────────
//   const filtered = tasks.filter(t => {
//     const q = search.toLowerCase();
//     const ok = !q || (t.title || "").toLowerCase().includes(q) || (t.project || "").toLowerCase().includes(q);
//     if (!ok) return false;
//     if (filter === "All")           return true;
//     if (filter === "High Priority") return t.priority === "High";
//     return t.status === filter;
//   });

//   // ── Stats ──────────────────────────────────────────────────────
//   const total   = tasks.length;
//   const done    = tasks.filter(t => t.status === "Done").length;
//   const active  = tasks.filter(t => t.status === "In Progress" || t.status === "In Review").length;
//   const todo    = tasks.filter(t => t.status === "To Do").length;
//   const overPct = total > 0
//     ? Math.round(tasks.reduce((s, t) => s + (t.progressPercent ?? STATUS_CFG[t.status]?.progress ?? 0), 0) / total)
//     : 0;

//   if (loading) return (
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 14 }}>
//       <div style={{
//         width: 34, height: 34, borderRadius: "50%",
//         border: "3px solid #e2e8f0", borderTopColor: "#6366f1",
//         animation: "sp 0.75s linear infinite",
//       }} />
//       <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Loading your tasks…</p>
//       <style>{`@keyframes sp { to { transform: rotate(360deg) } }`}</style>
//     </div>
//   );

//   return (
//     <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>

//       {/* ── Header ── */}
//       <div style={{ marginBottom: 22 }}>
//         <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 3px" }}>My Tasks</h1>
//         <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
//           {total === 0 ? "No tasks assigned yet" : `${total} task${total !== 1 ? "s" : ""} · ${done} completed`}
//         </p>
//       </div>

//       {/* ── Stats cards ── */}
//       {total > 0 && (
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
//           {[
//             { label: "Total",       val: total,  color: "#6366f1" },
//             { label: "Active",      val: active, color: "#3b82f6" },
//             { label: "To Do",       val: todo,   color: "#f59e0b" },
//             { label: "Done",        val: done,   color: "#10b981" },
//           ].map(s => (
//             <div key={s.label} style={{
//               background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12,
//               padding: "13px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
//             }}>
//               <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: "0 0 1px" }}>{s.val}</p>
//               <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, fontWeight: 500 }}>{s.label}</p>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ── Overall progress ── */}
//       {total > 0 && (
//         <div style={{
//           background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12,
//           padding: "14px 16px", marginBottom: 18,
//           boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
//         }}>
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
//             <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Overall Progress</span>
//             <span style={{ fontSize: 14, fontWeight: 800, color: "#6366f1" }}>{overPct}%</span>
//           </div>
//           <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
//             <div style={{
//               height: "100%", width: `${overPct}%`,
//               background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
//               borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
//             }} />
//           </div>
//         </div>
//       )}

//       {/* ── Search + Filters ── */}
//       <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
//         <div style={{ position: "relative", flex: "1 1 180px" }}>
//           <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8" }}>🔍</span>
//           <input
//             value={search} onChange={e => setSearch(e.target.value)}
//             placeholder="Search tasks or projects…"
//             style={{
//               width: "100%", boxSizing: "border-box",
//               paddingLeft: 30, paddingRight: search ? 28 : 10,
//               paddingTop: 8, paddingBottom: 8,
//               border: "1.5px solid #e2e8f0", borderRadius: 10,
//               fontSize: 13, color: "#334155", background: "#fff",
//               outline: "none", fontFamily: "inherit",
//             }}
//           />
//           {search && (
//             <button onClick={() => setSearch("")} style={{
//               position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
//               background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
//             }}>✕</button>
//           )}
//         </div>
//         <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
//           {FILTERS.map(f => (
//             <button key={f} onClick={() => setFilter(f)} style={{
//               padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600,
//               cursor: "pointer", transition: "all 0.15s",
//               background: filter === f ? "#1e293b" : "#f8fafc",
//               color:      filter === f ? "#fff"    : "#64748b",
//               border:     `1.5px solid ${filter === f ? "#1e293b" : "#e2e8f0"}`,
//             }}>{f}</button>
//           ))}
//         </div>
//       </div>

//       {/* ── Task list ── */}
//       {total === 0 ? (
//         <div style={{
//           textAlign: "center", padding: "56px 20px",
//           background: "#fff", borderRadius: 16, border: "1.5px dashed #e2e8f0",
//         }}>
//           <p style={{ fontSize: 38, margin: "0 0 10px" }}>📭</p>
//           <p style={{ fontSize: 15, fontWeight: 700, color: "#334155", margin: "0 0 4px" }}>No tasks assigned yet</p>
//           <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Your admin will assign tasks to you soon.</p>
//         </div>
//       ) : filtered.length === 0 ? (
//         <div style={{ textAlign: "center", padding: "48px 20px" }}>
//           <p style={{ fontSize: 26, margin: "0 0 8px" }}>🔍</p>
//           <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No tasks match your search or filter.</p>
//         </div>
//       ) : (
//         <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//           {filtered.map(task => {
//             const sCfg  = STATUS_CFG[task.status] || STATUS_CFG["To Do"];
//             const pCfg  = PRIORITY_CFG[task.priority] || PRIORITY_CFG["Medium"];
//             const due   = dueMeta(task.dueDate);
//             const pct   = task.progressPercent ?? sCfg.progress;
//             const isUpd = updatingId === task.id;
//             const upds  = task.updates || [];

//             return (
//               <div
//                 key={task.id}
//                 onClick={() => setActiveTask(task)}
//                 style={{
//                   background: "#fff",
//                   border: "1px solid #f1f5f9",
//                   borderLeft: `3.5px solid ${sCfg.color}`,
//                   borderRadius: 12, padding: "14px 16px",
//                   cursor: "pointer", transition: "all 0.15s",
//                   opacity: task.status === "Done" ? 0.65 : 1,
//                   boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
//                 }}
//                 onMouseEnter={e => {
//                   e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.09)";
//                   e.currentTarget.style.transform = "translateY(-1px)";
//                 }}
//                 onMouseLeave={e => {
//                   e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
//                   e.currentTarget.style.transform = "none";
//                 }}
//               >
//                 <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

//                   {/* Content */}
//                   <div style={{ flex: 1, minWidth: 0 }}>
//                     {/* Tag row */}
//                     <div style={{ display: "flex", gap: 6, marginBottom: 5, flexWrap: "wrap", alignItems: "center" }}>
//                       {task.project && (
//                         <span style={{
//                           fontSize: 10, fontWeight: 700, color: "#6366f1",
//                           background: "#eef2ff", padding: "1px 7px", borderRadius: 4,
//                           textTransform: "uppercase", letterSpacing: "0.06em",
//                         }}>{task.project}</span>
//                       )}
//                       {due && (
//                         <span style={{ fontSize: 10, fontWeight: 600, color: due.color }}>
//                           🕐 {due.label}
//                         </span>
//                       )}
//                     </div>

//                     {/* Title */}
//                     <p style={{
//                       fontSize: 14, fontWeight: 700,
//                       color: task.status === "Done" ? "#94a3b8" : "#0f172a",
//                       textDecoration: task.status === "Done" ? "line-through" : "none",
//                       margin: "0 0 5px", lineHeight: 1.3,
//                     }}>{task.title}</p>

//                     {task.description && (
//                       <p style={{
//                         fontSize: 12, color: "#94a3b8", margin: "0 0 8px",
//                         overflow: "hidden", display: "-webkit-box",
//                         WebkitLineClamp: 1, WebkitBoxOrient: "vertical",
//                         lineHeight: 1.4,
//                       }}>{task.description}</p>
//                     )}

//                     {/* Progress bar */}
//                     <div style={{ marginBottom: 8 }}>
//                       <ProgressBar value={pct} color={sCfg.color} height={3} />
//                     </div>

//                     {/* Footer meta */}
//                     <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
//                       <span style={{ fontSize: 10, fontWeight: 600, color: pCfg.color, background: pCfg.bg, padding: "2px 6px", borderRadius: 4 }}>
//                         {pCfg.icon} {pCfg.label}
//                       </span>
//                       {upds.length > 0 && (
//                         <span style={{ fontSize: 10, color: "#94a3b8" }}>
//                           💬 {upds.length} update{upds.length !== 1 ? "s" : ""}
//                         </span>
//                       )}
//                       {task.assignedByName && (
//                         <span style={{ fontSize: 10, color: "#cbd5e1" }}>by {task.assignedByName}</span>
//                       )}
//                       <span style={{ fontSize: 11, fontWeight: 800, color: sCfg.text, marginLeft: "auto" }}>{pct}%</span>
//                     </div>
//                   </div>

//                   {/* Status badge (stops propagation so click doesn't open drawer) */}
//                   <div
//                     style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}
//                     onClick={e => e.stopPropagation()}
//                   >
//                     <StatusBadge status={task.status} loading={isUpd} onClick={() => handleQuickStatus(task.id, task.status)} />
//                     <span style={{ fontSize: 9, color: "#cbd5e1", textAlign: "right" }}>tap to advance</span>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* ── Drawer ── */}
//       {activeTask && (
//         <TaskDrawer
//           task={tasks.find(t => t.id === activeTask.id) || activeTask}
//           onClose={() => setActiveTask(null)}
//           onSaveUpdate={handleSaveUpdate}
//         />
//       )}
//     </div>
//   );
// }



import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const STATUSES   = ["To Do", "In Progress", "In Review", "Done"];
const PRIORITIES = ["High", "Medium", "Low"];

const STATUS_META = {
  "To Do":       { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", progress: 0,   order: 0, label: "Pending"     },
  "In Progress": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", progress: 40,  order: 1, label: "In Progress" },
  "In Review":   { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6", progress: 75,  order: 2, label: "In Review"   },
  "Done":        { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", progress: 100, order: 3, label: "Done"        },
};

const PRIORITY_META = {
  High:   { color: "#dc2626", bg: "#fef2f2", icon: "🔴", label: "High"   },
  Medium: { color: "#d97706", bg: "#fffbeb", icon: "🟡", label: "Medium" },
  Low:    { color: "#16a34a", bg: "#f0fdf4", icon: "🟢", label: "Low"    },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────
function dueMeta(iso) {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (days < 0)   return { label: `${Math.abs(days)}d overdue`, color: "#dc2626", urgent: true  };
  if (days === 0) return { label: "Due today",                  color: "#d97706", urgent: true  };
  if (days <= 3)  return { label: `${days}d left`,              color: "#d97706", urgent: false };
  return {
    label: `Due ${new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    color: "#9ca3af", urgent: false,
  };
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TaskDrawer — restructured so Post Update button is ALWAYS visible
//  Layout: Header (sticky top) | Scrollable info body | Footer (sticky bottom)
// ─────────────────────────────────────────────────────────────────────────────
function TaskDrawer({ task, onClose, onSaveUpdate }) {
  const [status,  setStatus]  = useState(task.status || "To Do");
  const [percent, setPercent] = useState(task.progressPercent ?? STATUS_META[task.status]?.progress ?? 0);
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const updates = task.updates || [];

  // Sync when task updates in realtime
  useEffect(() => {
    setStatus(task.status || "To Do");
    setPercent(task.progressPercent ?? STATUS_META[task.status]?.progress ?? 0);
  }, [task.status, task.progressPercent]);

  // Escape key closes drawer
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handlePost = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSaveUpdate({ taskId: task.id, note: note.trim(), status, percent });
      setNote("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Post update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const cfg  = STATUS_META[status]          || STATUS_META["To Do"];
  const pCfg = PRIORITY_META[task.priority] || PRIORITY_META["Medium"];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 40,
          animation: "fdIn 0.2s ease",
        }}
      />

      {/* Drawer — fixed height, flex column so footer is always visible */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(520px, 100vw)",
        background: "#fff",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.14)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        animation: "slIn 0.3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'Outfit', system-ui, sans-serif",
        overflow: "hidden",           /* ← critical: children handle their own scroll */
      }}>

        {/* ── STICKY HEADER ── */}
        <div style={{
          flexShrink: 0,
          padding: "20px 22px 16px",
          borderBottom: "1px solid #f3f4f6",
          background: "#fff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {task.project && (
                <span style={{
                  display: "inline-block", fontSize: 10, fontWeight: 800,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#4f46e5", background: "#eef2ff",
                  padding: "3px 9px", borderRadius: 6, marginBottom: 8,
                }}>{task.project}</span>
              )}
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#111827", margin: 0, lineHeight: 1.3 }}>
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                border: "1px solid #e5e7eb", background: "#f9fafb",
                cursor: "pointer", color: "#6b7280", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>
          </div>

          {/* Header progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Progress</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color }}>{percent}%</span>
            </div>
            <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${percent}%`,
                background: cfg.color, borderRadius: 99,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE MIDDLE SECTION ── */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>

          {/* Description */}
          {task.description && (
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "11px 13px", border: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Description</p>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{task.description}</p>
            </div>
          )}

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[
              { label: "Assigned by", value: task.assignedByName || "Admin" },
              { label: "Priority",    value: `${pCfg.icon} ${task.priority || "Medium"}` },
              { label: "Due date",    value: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No deadline" },
              { label: "Last update", value: task.updatedAt ? timeAgo(task.updatedAt) : "—" },
            ].map(m => (
              <div key={m.label} style={{ background: "#f9fafb", borderRadius: 9, padding: "9px 11px", border: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{m.label}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#1f2937", margin: 0 }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Status selector */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
              Update Status
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUSES.map(s => {
                const c = STATUS_META[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setPercent(c.progress); }}
                    style={{
                      padding: "6px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s",
                      background: active ? c.color : c.bg,
                      color:      active ? "#fff"  : c.text,
                      border:     `1.5px solid ${active ? c.color : c.border}`,
                      boxShadow:  active ? `0 2px 8px ${c.color}50` : "none",
                    }}
                  >{c.label}</button>
                );
              })}
            </div>
          </div>

          {/* Completion slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Completion</p>
              <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>{percent}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={5} value={percent}
              onChange={e => setPercent(Number(e.target.value))}
              style={{ width: "100%", accentColor: cfg.color, cursor: "pointer", display: "block" }}
            />
            <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", marginTop: 5 }}>
              <div style={{ height: "100%", width: `${percent}%`, background: cfg.color, borderRadius: 99, transition: "width 0.2s" }} />
            </div>
          </div>

          {/* Note textarea */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 7px" }}>
              Progress Note <span style={{ fontWeight: 400, color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you work on? Any blockers? What's next?"
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box",
                border: "1.5px solid #e5e7eb", borderRadius: 10,
                padding: "10px 12px", fontSize: 13, color: "#1f2937",
                resize: "vertical", outline: "none", fontFamily: "inherit",
                lineHeight: 1.5, background: "#fff", transition: "border-color 0.15s",
                display: "block",
              }}
              onFocus={e => { e.target.style.borderColor = "#4f46e5"; }}
              onBlur={e  => { e.target.style.borderColor = "#e5e7eb"; }}
            />
          </div>

          {/* Activity feed */}
          {updates.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "4px 0 12px" }}>
                Activity · {updates.length}
              </p>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 10, top: 14, bottom: 14, width: 1, background: "#f3f4f6" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...updates].reverse().map((u, i) => {
                    const uc = STATUS_META[u.status] || STATUS_META["To Do"];
                    return (
                      <div key={i} style={{ display: "flex", gap: 12 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          background: uc.bg, border: `2px solid ${uc.color}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          zIndex: 1, marginTop: 2,
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: uc.color }} />
                        </div>
                        <div style={{ flex: 1, background: "#f9fafb", borderRadius: 10, border: "1px solid #f3f4f6", padding: "9px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: u.note ? 5 : 0, flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: uc.text,
                              background: uc.bg, border: `1px solid ${uc.border}`,
                              padding: "1px 7px", borderRadius: 10,
                            }}>{uc.label}</span>
                            {u.percent !== undefined && (
                              <span style={{ fontSize: 10, fontWeight: 800, color: uc.color }}>{u.percent}%</span>
                            )}
                            <span style={{ fontSize: 10, color: "#d1d5db", marginLeft: "auto" }}>{timeAgo(u.savedAt)}</span>
                          </div>
                          {u.note && (
                            <p style={{ fontSize: 12, color: "#4b5563", margin: 0, lineHeight: 1.55 }}>{u.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {updates.length === 0 && (
            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "4px 0 8px" }}>
              No updates yet.
            </p>
          )}
        </div>

        {/* ── STICKY FOOTER — Post Update button ALWAYS visible ── */}
        <div style={{
          flexShrink: 0,
          padding: "14px 22px 20px",
          borderTop: "1px solid #f3f4f6",
          background: "#fff",
        }}>
          <button
            onClick={handlePost}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px 0",
              background: saved   ? "#059669"
                        : saving  ? "#374151"
                        :           "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: saving ? "wait" : "pointer",
              transition: "background 0.25s, transform 0.1s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              letterSpacing: "0.01em",
              boxShadow: saved ? "0 4px 14px rgba(5,150,105,0.35)" : "0 4px 14px rgba(17,24,39,0.2)",
            }}
            onMouseEnter={e => { if (!saving && !saved) e.currentTarget.style.background = "#1f2937"; }}
            onMouseLeave={e => { if (!saving && !saved) e.currentTarget.style.background = "#111827"; }}
            onMouseDown={e  => { e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={e    => { e.currentTarget.style.transform = "scale(1)";    }}
          >
            {saving ? (
              <>
                <span style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  display: "inline-block",
                  animation: "spin 0.65s linear infinite",
                }} />
                Saving…
              </>
            ) : saved ? (
              <>✓ Update Posted!</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Post Update
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fdIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin  { to   { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TaskCard
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onOpen, onQuickStatus, updating }) {
  const sCfg = STATUS_META[task.status] || STATUS_META["To Do"];
  const due  = dueMeta(task.dueDate);
  const pct  = task.progressPercent ?? sCfg.progress;

  return (
    <div
      onClick={() => onOpen(task)}
      style={{
        background: "#fff", borderRadius: 16,
        border: "1px solid #f3f4f6", padding: 0,
        cursor: "pointer", overflow: "hidden",
        transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        animation: "cardIn 0.35s ease both",
        animationDelay: `${index * 0.06}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "#e5e7eb";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = "#f3f4f6";
      }}
    >
      {/* Top accent strip */}
      <div style={{ height: 4, background: sCfg.color }} />

      <div style={{ padding: "15px 17px 17px" }}>
        {/* Project tag */}
        {task.project && (
          <div style={{ marginBottom: 9 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.09em",
              textTransform: "uppercase", color: "#4f46e5",
              background: "#eef2ff", padding: "3px 9px", borderRadius: 5,
            }}>{task.project}</span>
          </div>
        )}

        {/* Title */}
        <p style={{
          fontSize: 15, fontWeight: 800,
          color: task.status === "Done" ? "#9ca3af" : "#111827",
          textDecoration: task.status === "Done" ? "line-through" : "none",
          margin: "0 0 13px", lineHeight: 1.35,
        }}>{task.title}</p>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: sCfg.color, borderRadius: 99,
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: sCfg.color }}>{pct}%</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {/* Assignee + due */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: "#f3f4f6", border: "1.5px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#374151",
            }}>
              {(task.assignedToName || "?")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.assignedToName || "You"}
            </span>
            {due && (
              <>
                <span style={{ fontSize: 10, color: "#d1d5db", flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: due.color, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {due.label}
                </span>
              </>
            )}
          </div>

          {/* Status badge */}
          <div
            onClick={e => { e.stopPropagation(); onQuickStatus(task.id, task.status); }}
            style={{ flexShrink: 0 }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
              color: sCfg.text, background: sCfg.bg,
              border: `1.5px solid ${sCfg.border}`,
              padding: "5px 12px", borderRadius: 20,
              cursor: updating ? "wait" : "pointer",
              opacity: updating ? 0.6 : 1,
              transition: "all 0.15s",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sCfg.color, display: "inline-block" }} />
              {updating ? "…" : sCfg.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MyTasks — main export
// ─────────────────────────────────────────────────────────────────────────────
export default function MyTasks() {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTask,  setActiveTask]  = useState(null);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [filter,      setFilter]      = useState("All");

  // Auth listener — fixes hard-refresh blank state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Firebase realtime listener
  useEffect(() => {
    if (!currentUser) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const unsub = onValue(
      ref(db, "assignedTasks"),
      snap => {
        const data = snap.val() || {};
        const mine = Object.entries(data)
          .filter(([, v]) => v.assignedTo === currentUser.uid)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => {
            const sA = STATUS_META[a.status]?.order ?? 0;
            const sB = STATUS_META[b.status]?.order ?? 0;
            if (sA !== sB) return sA - sB;
            return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
          });
        setTasks(mine);
        setLoading(false);
      },
      err => { console.error("Firebase read error:", err); setLoading(false); }
    );
    return () => unsub();
  }, [currentUser]);

  // Quick status advance (badge click)
  const handleQuickStatus = useCallback(async (taskId, currentStatus) => {
    const NEXT = {
      "To Do": "In Progress", "In Progress": "In Review",
      "In Review": "Done",    "Done": "To Do",
    };
    const next = NEXT[currentStatus] || "To Do";
    setUpdatingId(taskId);
    try {
      await update(ref(db, `assignedTasks/${taskId}`), {
        status: next,
        progressPercent: STATUS_META[next]?.progress ?? 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) { console.error("Quick status error:", err); }
    setUpdatingId(null);
  }, []);

  // Full update from drawer — appends to updates array in Firebase
  const handleSaveUpdate = useCallback(async ({ taskId, note, status, percent }) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const prev  = Array.isArray(task.updates) ? task.updates : [];
    const entry = {
      status,
      percent,
      note:    note || "",
      savedAt: new Date().toISOString(),
    };
    await update(ref(db, `assignedTasks/${taskId}`), {
      status,
      progressPercent: percent,
      updates:   [...prev, entry],
      updatedAt: new Date().toISOString(),
    });
  }, [tasks]);

  // Filter tabs
  const TABS = [
    { key: "All",         label: "All",        count: tasks.length },
    { key: "To Do",       label: "Pending",    count: tasks.filter(t => t.status === "To Do").length },
    { key: "In Progress", label: "In Progress",count: tasks.filter(t => t.status === "In Progress").length },
    { key: "In Review",   label: "In Review",  count: tasks.filter(t => t.status === "In Review").length },
    { key: "Done",        label: "Done",       count: tasks.filter(t => t.status === "Done").length },
  ];

  const filtered = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === "Done").length;
  const avgPct   = total > 0
    ? Math.round(tasks.reduce((s, t) => s + (t.progressPercent ?? STATUS_META[t.status]?.progress ?? 0), 0) / total)
    : 0;

  // ── Loading ──
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", flexDirection: "column", gap: 14,
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid #f3f4f6", borderTopColor: "#4f46e5",
        animation: "spin 0.7s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Loading your tasks…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  // ── Main ──
  return (
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "28px 20px",
      fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
    }}>

      {/* Page heading */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px" }}>
            My Assigned Tasks
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111827", margin: "0 0 4px", lineHeight: 1.2 }}>
            Tasks assigned by your admin
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            {total === 0 ? "No tasks yet" : `${total} task${total !== 1 ? "s" : ""} · ${done} completed`}
          </p>
        </div>

        {/* Progress ring */}
        {total > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid #f3f4f6",
            borderRadius: 14, padding: "10px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, margin: "0 0 2px", textAlign: "right" }}>Overall</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5", margin: 0 }}>{avgPct}%</p>
            </div>
            <svg viewBox="0 0 40 40" style={{ width: 44, height: 44, transform: "rotate(-90deg)", flexShrink: 0 }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="#f3f4f6" strokeWidth="4" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#4f46e5" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - avgPct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      {total > 0 && (
        <div style={{
          display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap",
          background: "#f9fafb", borderRadius: 12, padding: 4,
          border: "1px solid #f3f4f6", width: "fit-content",
        }}>
          {TABS.map(tab => {
            const active = filter === tab.key;
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: "7px 15px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                cursor: "pointer", transition: "all 0.15s",
                background: active ? "#fff"       : "transparent",
                color:      active ? "#111827"    : "#6b7280",
                border:     active ? "1px solid #e5e7eb" : "1px solid transparent",
                boxShadow:  active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {tab.label}
                <span style={{
                  fontSize: 10, fontWeight: 800, minWidth: 18, height: 18,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 9, padding: "0 4px",
                  background: active ? "#111827" : "#e5e7eb",
                  color:      active ? "#fff"    : "#6b7280",
                }}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty states */}
      {total === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 20px",
          background: "#fff", borderRadius: 20, border: "1.5px dashed #e5e7eb",
        }}>
          <p style={{ fontSize: 48, margin: "0 0 14px" }}>📋</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>No tasks assigned yet</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Your admin will assign tasks to you soon.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "52px 20px" }}>
          <p style={{ fontSize: 30, margin: "0 0 10px" }}>🔍</p>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No tasks in this category.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: 14,
        }}>
          {filtered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              onOpen={setActiveTask}
              onQuickStatus={handleQuickStatus}
              updating={updatingId === task.id}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {activeTask && (
        <TaskDrawer
          task={tasks.find(t => t.id === activeTask.id) || activeTask}
          onClose={() => setActiveTask(null)}
          onSaveUpdate={handleSaveUpdate}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}