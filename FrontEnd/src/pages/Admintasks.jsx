import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import {
  FaPlus, FaTimes, FaSearch, FaChevronDown,
  FaCheck, FaClock, FaTrash, FaEdit, FaFilter,
  FaFlag, FaUser, FaEllipsisH, FaUsers,
} from "react-icons/fa";


const PRIORITY_META = {
  High:   { label:"High",   dot:"#ef4444", badge:"bg-red-50 text-red-600 border border-red-100",       icon:"🔴" },
  Medium: { label:"Medium", dot:"#f59e0b", badge:"bg-amber-50 text-amber-600 border border-amber-100", icon:"🟡" },
  Low:    { label:"Low",    dot:"#22c55e", badge:"bg-green-50 text-green-600 border border-green-100", icon:"🟢" },
};
const STATUS_META = {
  "To Do":       { color:"bg-slate-100 text-slate-500",     bar:"bg-slate-400",    order:0 },
  "In Progress": { color:"bg-sky-100 text-sky-600",         bar:"bg-sky-500",      order:1 },
  "In Review":   { color:"bg-violet-100 text-violet-600",   bar:"bg-violet-500",   order:2 },
  "Done":        { color:"bg-emerald-100 text-emerald-600", bar:"bg-emerald-500",  order:3 },
};
const STATUSES   = Object.keys(STATUS_META);
const PRIORITIES = ["High", "Medium", "Low"];

const AVATAR_PALETTE = [
  ["#3b82f6","#dbeafe"],["#8b5cf6","#ede9fe"],["#10b981","#d1fae5"],
  ["#f59e0b","#fef3c7"],["#ef4444","#fee2e2"],["#ec4899","#fce7f3"],
  ["#06b6d4","#cffafe"],["#6366f1","#e0e7ff"],
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
  if (days < 0)   return { label:`${Math.abs(days)}d overdue`, cls:"text-red-500",   urgent:true  };
  if (days === 0) return { label:"Due today",                  cls:"text-amber-500", urgent:true  };
  if (days <= 3)  return { label:`${days}d left`,              cls:"text-amber-400", urgent:false };
  return { label:new Date(iso).toLocaleDateString("en-IN",{day:"numeric",month:"short"}), cls:"text-slate-400", urgent:false };
}
function completionRing(done, total) {
  const pct = total > 0 ? done / total : 0;
  const r = 10, circ = 2 * Math.PI * r;
  return { pct: Math.round(pct * 100), offset: circ - pct * circ, circ };
}


export default function AdminTasks() {
  const adminUser = auth.currentUser;

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

  const employees = Object.entries(users)
    .filter(([, u]) => u.role !== "admin")
    .map(([uid, u]) => ({ uid, name: u.name || "Unnamed", role: u.role }));

  const [selectedEmp,  setSelectedEmp]  = useState("all");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioFilter,   setPrioFilter]   = useState("all");
  const [showSidebar,  setShowSidebar]  = useState(false); // mobile team drawer

  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const FORM_INIT = { title:"", description:"", assignedTo:"", priority:"Medium",
                      status:"To Do", project:"", dueDate:"" };
  const [form,     setForm]     = useState(FORM_INIT);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");
  const [empSearch,setEmpSearch]= useState("");

  function empStats(uid) {
    const mine = tasks.filter(t => t.assignedTo === uid);
    const done = mine.filter(t => t.status === "Done").length;
    const over = mine.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done").length;
    return { total: mine.length, done, over };
  }

  const displayed = tasks.filter(t => {
    if (selectedEmp !== "all" && t.assignedTo !== selectedEmp) return false;
    if (statusFilter !== "all" && t.status !== statusFilter)   return false;
    if (prioFilter   !== "all" && t.priority !== prioFilter)   return false;
    if (search && ![ t.title, t.assignedToName, t.project ]
      .some(s => (s||"").toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    const so = (STATUS_META[a.status]?.order??0) - (STATUS_META[b.status]?.order??0);
    if (so !== 0) return so;
    return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
  });

  const totalTasks  = tasks.length;
  const doneTasks   = tasks.filter(t => t.status === "Done").length;
  const urgentTasks = tasks.filter(t => t.priority === "High" && t.status !== "Done").length;
  const overdueTasks= tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done").length;

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
    if (!form.title.trim()) { setFormErr("Task title is required.");          return; }
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

  const SidebarContent = () => (
    <>
      <div className="px-4 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h2 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Team</h2>
        <button onClick={() => setShowSidebar(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
          <FaTimes className="text-xs"/>
        </button>
      </div>

      <button
        onClick={() => { setSelectedEmp("all"); setShowSidebar(false); }}
        className={`flex items-center gap-3 mx-3 mt-3 px-3 py-2.5 rounded-lg text-sm transition
          ${selectedEmp==="all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0
          ${selectedEmp==="all" ? "bg-white/20" : "bg-slate-100"}`}>👥</div>
        <span className="font-medium flex-1 text-left">All Members</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded
          ${selectedEmp==="all" ? "bg-white/20 text-white" : "text-slate-400"}`}>
          {tasks.length}
        </span>
      </button>

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
                onClick={() => { setSelectedEmp(emp.uid); setShowSidebar(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition
                  ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <div className="relative shrink-0 w-8 h-8">
                  <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 26 26">
                    <circle cx="13" cy="13" r={10} fill="none"
                      stroke={active?"rgba(255,255,255,0.2)":"#f1f5f9"} strokeWidth="2.5"/>
                    <circle cx="13" cy="13" r={10} fill="none"
                      stroke={active?"white":fg} strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={ring.circ} strokeDashoffset={ring.offset}
                      style={{transition:"stroke-dashoffset 0.4s ease"}}/>
                  </svg>
                  <div className="absolute inset-[3px] rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: active?"rgba(255,255,255,0.15)":bg, color: active?"white":fg }}>
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

      <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0">
        {[
          { label:"Urgent",  val:urgentTasks,  cls:"text-red-500"   },
          { label:"Overdue", val:overdueTasks, cls:"text-amber-500" },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 rounded-lg px-2.5 py-2 text-center">
            <p className={`text-base font-bold ${s.cls}`}>{s.val}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );

  return (

    <div className="flex bg-slate-50 overflow-hidden
      mt-[52px] h-[calc(100vh-52px)]
      lg:mt-0  lg:h-[calc(100vh-64px)]">

      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)} />
      )}
      <div className={`
        lg:hidden fixed top-[52px] left-0 bottom-0 z-50
        w-64 bg-white flex flex-col shadow-2xl border-r border-slate-100
        transition-transform duration-300 ease-in-out
        ${showSidebar ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </div>

      <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-100 flex-col">
        <SidebarContent />
      </aside>


      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        <div className="bg-white border-b border-slate-100 px-3 sm:px-5 py-3 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
                  bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
              >
                <FaUsers className="text-sm"/>
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-slate-800 leading-tight truncate">
                  {selectedEmp === "all"
                    ? "All Tasks"
                    : `${employees.find(e=>e.uid===selectedEmp)?.name||"Employee"}'s Tasks`}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                  {displayed.length} task{displayed.length!==1?"s":""}
                  {statusFilter!=="all"&&` · ${statusFilter}`}
                  {prioFilter!=="all"&&` · ${prioFilter} priority`}
                </p>
              </div>
            </div>
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-700
                text-white text-xs sm:text-sm font-semibold rounded-lg transition active:scale-95 shadow-sm shrink-0">
              <FaPlus className="text-[10px]"/>
              <span className="hidden xs:inline">Assign </span>Task
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[120px]">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"/>
              <input type="text" placeholder="Search tasks…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-7 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm
                  focus:outline-none focus:ring-2 focus:ring-slate-300 transition bg-white"/>
              {search && (
                <button onClick={()=>setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaTimes className="text-[10px]"/>
                </button>
              )}
            </div>
            <FilterPill value={statusFilter} onChange={setStatusFilter}
              options={[["all","Status"],...STATUSES.map(s=>[s,s])]}/>
            <FilterPill value={prioFilter} onChange={setPrioFilter}
              options={[["all","Priority"],...PRIORITIES.map(p=>[p,p])]}/>
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 px-3 sm:px-5 py-2 flex items-center
          gap-3 sm:gap-5 shrink-0 overflow-x-auto scrollbar-hide">
          {STATUSES.map(s => {
            const count = displayed.filter(t => t.status === s).length;
            const meta  = STATUS_META[s];
            return (
              <button key={s}
                onClick={() => setStatusFilter(statusFilter===s?"all":s)}
                className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold
                  whitespace-nowrap py-1 border-b-2 transition shrink-0
                  ${statusFilter===s ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${meta.bar}`}/>
                <span className="hidden sm:inline">{s}</span>
                <span className="sm:hidden">{s.split(" ")[0]}</span>
                <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold
                  ${statusFilter===s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:block h-1.5 w-16 sm:w-24 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width:`${totalTasks>0?Math.round(doneTasks/totalTasks*100):0}%` }}/>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap">
              {totalTasks>0?Math.round(doneTasks/totalTasks*100):0}% done
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4">📋</div>
              <p className="text-slate-600 font-semibold text-sm sm:text-base">No tasks found</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {tasks.length===0 ? "Click 'Assign Task' to get started." : "Try changing the filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-w-4xl">
              {displayed.map(task => (
                <TaskRow key={task.id} task={task}
                  onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange}
                  empColor={avatarPalette(task.assignedTo||"x")}
                />
              ))}
            </div>
          )}
        </div>
      </main>


      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => e.target===e.currentTarget && setModal(false)}
        >
          <div className="bg-white w-full sm:w-auto sm:max-w-xl
            rounded-t-2xl sm:rounded-2xl shadow-2xl
            flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">

            {/* Drag handle — mobile */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0"/>

            {/* Header */}
            <div className="px-5 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-100
              flex items-start justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editId ? "Edit Task" : "Assign New Task"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editId ? "Update task details" : "Create and assign to a team member"}
                </p>
              </div>
              <button onClick={() => setModal(false)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition">
                <FaTimes className="text-sm"/>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 sm:space-y-5">
              {formErr && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl
                  text-xs text-red-600 font-medium flex items-center gap-2">
                  <span>⚠️</span>{formErr}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Task Title <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.title} autoFocus
                  onChange={e => setForm(f=>({...f,title:e.target.value}))}
                  placeholder="What needs to be done?"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition font-medium"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea value={form.description} rows={2}
                  onChange={e => setForm(f=>({...f,description:e.target.value}))}
                  placeholder="Add context, links, or instructions…"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition resize-none"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Assign To <span className="text-red-400">*</span>
                </label>
                <div className="relative mb-2">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"/>
                  <input type="text" placeholder="Search employees…" value={empSearch}
                    onChange={e => setEmpSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-slate-300 transition"/>
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  {filteredEmps.length === 0 ? (
                    <p className="col-span-2 text-xs text-slate-400 py-3 text-center">No employees found</p>
                  ) : filteredEmps.map(emp => {
                    const selected = form.assignedTo === emp.uid;
                    const [fg, bg] = avatarPalette(emp.uid);
                    const { total, done } = empStats(emp.uid);
                    return (
                      <button key={emp.uid} type="button"
                        onClick={() => setForm(f=>({...f,assignedTo:emp.uid}))}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition
                          ${selected
                            ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                      >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor:selected?"rgba(255,255,255,0.15)":bg, color:selected?"white":fg }}>
                          {initials(emp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${selected?"text-white":"text-slate-800"}`}>{emp.name}</p>
                          <p className={`text-[10px] ${selected?"text-white/60":"text-slate-400"}`}>{total} task{total!==1?"s":""} · {done} done</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project / Client</label>
                  <input type="text" value={form.project}
                    onChange={e => setForm(f=>({...f,project:e.target.value}))}
                    placeholder="e.g. EcoHomely"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800
                      placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate}
                    onChange={e => setForm(f=>({...f,dueDate:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800
                      focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => {
                    const m = PRIORITY_META[p];
                    const sel = form.priority === p;
                    return (
                      <button key={p} type="button" onClick={()=>setForm(f=>({...f,priority:p}))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                          border-2 text-xs font-semibold transition
                          ${sel ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 text-slate-500 hover:border-slate-200 bg-white"}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:m.dot}}/>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Initial Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STATUSES.map(s => {
                    const sel = form.status === s;
                    return (
                      <button key={s} type="button" onClick={()=>setForm(f=>({...f,status:s}))}
                        className={`py-2 rounded-xl border-2 text-[10px] sm:text-[11px] font-semibold transition
                          ${sel ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 text-slate-500 hover:border-slate-200 bg-white"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={()=>setModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                  text-xs sm:text-sm font-medium hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700
                  text-white text-xs sm:text-sm font-bold transition active:scale-95 disabled:opacity-50">
                {saving ? "Saving…" : editId ? "Save Changes" : "Assign Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function TaskRow({ task, onEdit, onDelete, onStatusChange, empColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pr  = PRIORITY_META[task.priority] || PRIORITY_META.Medium;
  const st  = STATUS_META[task.status]     || STATUS_META["To Do"];
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
      <div className="flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3">

        {/* Priority dot */}
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 mt-1.5 sm:mt-0"
          style={{ backgroundColor: pr.dot }}/>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 flex-wrap">
            <span className={`text-xs sm:text-sm font-semibold leading-snug
              ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
              {task.title}
            </span>
            {task.project && (
              <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium shrink-0">
                {task.project}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Assignee */}
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-bold"
                style={{ backgroundColor: bg, color: fg }}>
                {initials(task.assignedToName||"?")}
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400">{task.assignedToName||"Unassigned"}</span>
            </div>
            {due && (
              <span className={`text-[9px] sm:text-[10px] font-medium flex items-center gap-0.5 ${due.cls}`}>
                <FaClock className="text-[8px]"/>
                {due.label}
                {due.urgent && "⚠"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className={`hidden sm:inline-flex text-[10px] font-semibold px-2 py-1 rounded-full border ${pr.badge}`}>
            {pr.icon} {pr.label}
          </span>

          <div className="relative">
            <select value={task.status}
              onChange={e => onStatusChange(task.id, e.target.value)}
              className={`text-[10px] sm:text-[11px] font-semibold pl-2 sm:pl-2.5 pr-5 sm:pr-6
                py-1 sm:py-1.5 rounded-full cursor-pointer appearance-none border-0
                focus:outline-none focus:ring-2 focus:ring-slate-300 ${st.color}`}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FaChevronDown className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[8px] opacity-50 pointer-events-none"/>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o=>!o)}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                hover:bg-slate-100 text-slate-400 transition
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <FaEllipsisH className="text-xs"/>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200
                rounded-xl shadow-lg z-10 py-1 w-36 overflow-hidden">
                <button onClick={()=>{ onEdit(task); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition">
                  <FaEdit className="text-slate-400"/> Edit Task
                </button>
                <button onClick={()=>{ onDelete(task.id); setMenuOpen(false); }}
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


function FilterPill({ value, onChange, options }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`pl-2.5 sm:pl-3 pr-6 sm:pr-7 py-2 border rounded-lg
          text-[10px] sm:text-xs font-semibold appearance-none cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-slate-300 transition
          ${value!=="all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
        {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-50 pointer-events-none"/>
    </div>
  );
}