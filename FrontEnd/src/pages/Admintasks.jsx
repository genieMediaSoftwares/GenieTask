import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import {
  FaPlus, FaTimes, FaSearch, FaChevronDown,
  FaCheck, FaClock, FaTrash, FaEdit, FaFilter,
  FaUsers, FaEllipsisH, FaExclamationTriangle, FaFire,
} from "react-icons/fa";


const PRIORITY_META = {
  High:   { label: "High",   dot: "#ef4444", badge: "bg-red-50 text-red-600 border border-red-100",       icon: "🔴" },
  Medium: { label: "Medium", dot: "#f59e0b", badge: "bg-amber-50 text-amber-600 border border-amber-100", icon: "🟡" },
  Low:    { label: "Low",    dot: "#22c55e", badge: "bg-green-50 text-green-600 border border-green-100", icon: "🟢" },
};

const STATUS_META = {
  "To Do":       { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", text: "#475569", barColor: "bg-slate-400",    order: 0, label: "Pending"     },
  "In Progress": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", barColor: "bg-blue-500",     order: 1, label: "In Progress" },
  "In Review":   { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6", barColor: "bg-violet-500",   order: 2, label: "In Review"   },
  "Done":        { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", barColor: "bg-emerald-500",  order: 3, label: "Done"        },
};

const STATUSES   = Object.keys(STATUS_META);
const PRIORITIES = ["High", "Medium", "Low"];

const MOODS = {
  great:   { emoji: "🚀", label: "Great",   color: "#059669" },
  good:    { emoji: "😊", label: "Good",    color: "#2563eb" },
  okay:    { emoji: "😐", label: "Okay",    color: "#d97706" },
  blocked: { emoji: "🚧", label: "Blocked", color: "#dc2626" },
};

const AVATAR_PALETTE = [
  ["#3b82f6", "#dbeafe"], ["#8b5cf6", "#ede9fe"], ["#10b981", "#d1fae5"],
  ["#f59e0b", "#fef3c7"], ["#ef4444", "#fee2e2"], ["#ec4899", "#fce7f3"],
  ["#06b6d4", "#cffafe"], ["#6366f1", "#e0e7ff"],
];


const todayISO  = () => new Date().toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

function avatarPalette(str) {
  const h = [...(str || "x")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}
function initials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function dueMeta(iso) {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso) - new Date()) / 86_400_000);
  if (days < 0)   return { label: `${Math.abs(days)}d overdue`, cls: "text-red-500",   urgent: true  };
  if (days === 0) return { label: "Due today",                  cls: "text-amber-500", urgent: true  };
  if (days <= 3)  return { label: `${days}d left`,              cls: "text-amber-400", urgent: false };
  return { label: new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), cls: "text-slate-400", urgent: false };
}
function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function calcStreak(logs) {
  if (!logs || Object.keys(logs).length === 0) return 0;
  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 365; i++) {
    const key = check.toISOString().slice(0, 10);
    if (logs[key]) streak++;
    else if (i > 0) break;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}
function completionRing(done, total) {
  const pct  = total > 0 ? done / total : 0;
  const r    = 10;
  const circ = 2 * Math.PI * r;
  return { pct: Math.round(pct * 100), offset: circ - pct * circ, circ };
}


function DailyLogDrawer({ task, logs, employeeName, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const entries = useMemo(() => {
    return Object.entries(logs || {})
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const streak      = calcStreak(logs);
  const totalDays   = entries.length;
  const checkedToday= !!logs?.[todayISO()];
  const hasBlocker  = entries.some(e => e.blockers && e.blockers.trim());
  const avgPercent  = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + (e.percent ?? 0), 0) / entries.length)
    : 0;

  const sCfg = STATUS_META[task.status] || STATUS_META["To Do"];

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)", zIndex: 40,
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(560px, 98vw)",
        background: "#fff", boxShadow: "-24px 0 72px rgba(0,0,0,0.13)",
        zIndex: 50, display: "flex", flexDirection: "column",
        animation: "slIn 0.3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden",
      }}>

        <div style={{ flexShrink: 0, borderBottom: "1px solid #f1f5f9", padding: "18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                {task.project && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#4f46e5",
                    background: "#eef2ff", padding: "2px 7px", borderRadius: 4,
                  }}>{task.project}</span>
                )}
                {!checkedToday && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "#b45309",
                    background: "#fef3c7", padding: "2px 7px", borderRadius: 4,
                    border: "1px solid #fde68a",
                  }}>⚠ No check-in today</span>
                )}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#0f172a", margin: "0 0 3px" }}>{task.title}</h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Employee: {employeeName}</p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              cursor: "pointer", color: "#64748b", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "Streak",     value: streak > 0 ? `🔥 ${streak}d` : "0d", sub: "check-ins"    },
              { label: "Total Days", value: totalDays,                            sub: "logged"        },
              { label: "Avg Progress",value: `${avgPercent}%`,                   sub: "completion"    },
              { label: "Blockers",   value: hasBlocker ? "⚠ Yes" : "None",       sub: "reported",
                color: hasBlocker ? "#dc2626" : "#059669"                                               },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 9, padding: "8px 10px", border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>{s.label}</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: s.color || "#0f172a", margin: "0 0 1px" }}>{s.value}</p>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", WebkitOverflowScrolling: "touch" }}>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 32, margin: "0 0 10px" }}>📭</p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>No check-ins submitted for this task yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.map(entry => {
                const sc   = STATUS_META[entry.status] || STATUS_META["To Do"];
                const mood = MOODS[entry.mood] || MOODS.good;
                const isToday = entry.date === todayISO();
                const isYest  = entry.date === yesterday();

                return (
                  <div key={entry.date} style={{
                    border: `1px solid ${isToday ? "#ddd6fe" : "#f1f5f9"}`,
                    borderLeft: `3px solid ${sc.color}`,
                    borderRadius: 10, background: isToday ? "#f5f3ff" : "#fff",
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${isToday ? "#ede9fe" : "#f8fafc"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                            {new Date(entry.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {isToday && <span style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 6px", borderRadius: 4 }}>TODAY</span>}
                          {isYest  && <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>YESTERDAY</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14 }} title={mood.label}>{mood.emoji}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: sc.text, background: sc.bg,
                            border: `1px solid ${sc.border}`,
                            padding: "2px 8px", borderRadius: 10,
                          }}>{sc.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: sc.color }}>{entry.percent ?? 0}%</span>
                        </div>
                      </div>
                      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${entry.percent ?? 0}%`, background: sc.color, borderRadius: 99 }} />
                      </div>
                    </div>

                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {entry.achieved && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>✅ Accomplished</p>
                          <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.55 }}>{entry.achieved}</p>
                        </div>
                      )}
                      {entry.planned && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>📅 Plan for next day</p>
                          <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.55 }}>{entry.planned}</p>
                        </div>
                      )}
                      {entry.blockers && (
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 10px" }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>🚧 Blockers / Risks</p>
                          <p style={{ fontSize: 12, color: "#7f1d1d", margin: 0, lineHeight: 1.55 }}>{entry.blockers}</p>
                        </div>
                      )}
                      {!entry.achieved && !entry.planned && !entry.blockers && (
                        <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Status & progress updated — no notes added.</p>
                      )}
                      {entry.submittedAt && (
                        <p style={{ fontSize: 10, color: "#cbd5e1", margin: 0, textAlign: "right" }}>
                          Submitted {timeAgo(entry.submittedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}


export default function AdminTasks() {
  const adminUser = auth.currentUser;

  const [tasks,       setTasks]       = useState([]);
  const [dailyLogs,   setDailyLogs]   = useState({});
  const [users,       setUsers]       = useState({});
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const subs = [
      onValue(ref(db, "assignedTasks"), s => {
        const d = s.val() || {};
        setTasks(Object.entries(d).map(([id, v]) => ({ id, ...v })));
      }),
      onValue(ref(db, "dailyLogs"), s => {
        setDailyLogs(s.val() || {});
      }),
      onValue(ref(db, "users"), s => setUsers(s.val() || {})),
      onValue(ref(db, "teamMembers"), s => {
        const d = s.val() || {};
        setTeamMembers(Object.entries(d).map(([id, v]) => ({ id, ...v })));
      }),
    ];
    return () => subs.forEach(u => u());
  }, []);

  const employees = useMemo(() =>
    Object.entries(users)
      .filter(([, u]) => u.role !== "admin")
      .map(([uid, u]) => ({ uid, name: u.name || "Unnamed", role: u.role }))
  , [users]);


  const [selectedEmp,  setSelectedEmp]  = useState("all");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioFilter,   setPrioFilter]   = useState("all");
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [logDrawer,    setLogDrawer]    = useState(null); // { task, logs, employeeName }

  const [modal,     setModal]     = useState(false);
  const [editId,    setEditId]    = useState(null);
  const FORM_INIT = { title: "", description: "", assignedTo: "", priority: "Medium",
                      status: "To Do", project: "", dueDate: "" };
  const [form,      setForm]      = useState(FORM_INIT);
  const [saving,    setSaving]    = useState(false);
  const [formErr,   setFormErr]   = useState("");
  const [empSearch, setEmpSearch] = useState("");


  function empStats(uid) {
    const mine  = tasks.filter(t => t.assignedTo === uid);
    const done  = mine.filter(t => t.status === "Done").length;
    const over  = mine.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done").length;
    const today = mine.filter(t => dailyLogs[t.id]?.[todayISO()]?.submittedAt).length;
    const blockers = mine.some(t => {
      const todayLog = dailyLogs[t.id]?.[todayISO()];
      return todayLog?.blockers?.trim();
    });
    return { total: mine.length, done, over, today, blockers };
  }


  const displayed = useMemo(() => tasks.filter(t => {
    if (selectedEmp !== "all" && t.assignedTo !== selectedEmp) return false;
    if (statusFilter !== "all" && t.status !== statusFilter)   return false;
    if (prioFilter   !== "all" && t.priority !== prioFilter)   return false;
    if (search && ![ t.title, t.assignedToName, t.project ]
      .some(s => (s || "").toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    const so = (STATUS_META[a.status]?.order ?? 0) - (STATUS_META[b.status]?.order ?? 0);
    if (so !== 0) return so;
    return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
  }), [tasks, selectedEmp, statusFilter, prioFilter, search]);


  const totalTasks    = tasks.length;
  const doneTasks     = tasks.filter(t => t.status === "Done").length;
  const urgentTasks   = tasks.filter(t => t.priority === "High" && t.status !== "Done").length;
  const overdueTasks  = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Done").length;
  const checkedToday  = tasks.filter(t => dailyLogs[t.id]?.[todayISO()]?.submittedAt).length;
  const blockerTasks  = tasks.filter(t => dailyLogs[t.id]?.[todayISO()]?.blockers?.trim()).length;


  function openNew() {
    setEditId(null);
    setForm({ ...FORM_INIT, assignedTo: selectedEmp !== "all" ? selectedEmp : "" });
    setEmpSearch(""); setFormErr(""); setModal(true);
  }
  function openEdit(task) {
    setEditId(task.id);
    setForm({ title: task.title, description: task.description || "",
              assignedTo: task.assignedTo, priority: task.priority,
              status: task.status, project: task.project || "", dueDate: task.dueDate || "" });
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
    if (!window.confirm("Delete this task? All daily logs will be removed too.")) return;
    await remove(ref(db, `assignedTasks/${taskId}`));
    await remove(ref(db, `dailyLogs/${taskId}`));
  }

  const filteredEmps = employees.filter(e =>
    e.name.toLowerCase().includes(empSearch.toLowerCase())
  );


  function openLogDrawer(task) {
    const emp = employees.find(e => e.uid === task.assignedTo);
    setLogDrawer({ task, logs: dailyLogs[task.id] || {}, employeeName: emp?.name || task.assignedToName || "Employee" });
  }


  const SidebarContent = () => (
    <>
      <div className="px-4 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h2 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Team</h2>
        <button onClick={() => setShowSidebar(false)}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
          <FaTimes className="text-xs"/>
        </button>
      </div>

      <div className="mx-3 mt-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100 shrink-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Today's Activity</p>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-base font-bold text-slate-800">{checkedToday}/{totalTasks}</p>
            <p className="text-[9px] text-slate-400">checked in</p>
          </div>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${totalTasks > 0 ? Math.round(checkedToday / totalTasks * 100) : 0}%` }}/>
          </div>
          <span className="text-xs font-bold text-indigo-600">
            {totalTasks > 0 ? Math.round(checkedToday / totalTasks * 100) : 0}%
          </span>
        </div>
        {blockerTasks > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-red-500">
            <FaExclamationTriangle className="text-[10px]"/>
            <span className="text-[10px] font-semibold">{blockerTasks} blocker{blockerTasks !== 1 ? "s" : ""} reported today</span>
          </div>
        )}
      </div>

      <button
        onClick={() => { setSelectedEmp("all"); setShowSidebar(false); }}
        className={`flex items-center gap-3 mx-3 mt-2 px-3 py-2.5 rounded-lg text-sm transition
          ${selectedEmp === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0
          ${selectedEmp === "all" ? "bg-white/20" : "bg-slate-100"}`}>👥</div>
        <span className="font-medium flex-1 text-left">All Members</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded
          ${selectedEmp === "all" ? "bg-white/20 text-white" : "text-slate-400"}`}>
          {tasks.length}
        </span>
      </button>

      <div className="flex-1 overflow-y-auto px-3 pb-4 mt-1 space-y-1">
        {employees.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No employees yet</p>
        ) : employees.map(emp => {
          const { total, done, over, today, blockers: hasBlocker } = empStats(emp.uid);
          const ring     = completionRing(done, total);
          const [fg, bg] = avatarPalette(emp.uid);
          const active   = selectedEmp === emp.uid;

          return (
            <button key={emp.uid}
              onClick={() => { setSelectedEmp(emp.uid); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition relative
                ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <div className="relative shrink-0 w-8 h-8">
                <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 26 26">
                  <circle cx="13" cy="13" r={10} fill="none"
                    stroke={active ? "rgba(255,255,255,0.2)" : "#f1f5f9"} strokeWidth="2.5"/>
                  <circle cx="13" cy="13" r={10} fill="none"
                    stroke={active ? "white" : fg} strokeWidth="2.5" strokeLinecap="round"
                    strokeDasharray={ring.circ} strokeDashoffset={ring.offset}
                    style={{ transition: "stroke-dashoffset 0.4s ease" }}/>
                </svg>
                <div className="absolute inset-[3px] rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.15)" : bg, color: active ? "white" : fg }}>
                  {initials(emp.name)}
                </div>
                {hasBlocker && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <p className={`text-xs font-semibold truncate ${active ? "text-white" : "text-slate-700"}`}>
                  {emp.name}
                </p>
                <p className={`text-[10px] ${active ? "text-white/60" : "text-slate-400"}`}>
                  {done}/{total} done
                  {today > 0 && <span className={active ? " text-green-300" : " text-green-500"}> · {today} checked in</span>}
                  {over > 0 && <span className={active ? " text-red-300" : " text-red-400"}> · {over} late</span>}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0">
        {[
          { label: "Urgent",  val: urgentTasks,  cls: "text-red-500"   },
          { label: "Overdue", val: overdueTasks, cls: "text-amber-500" },
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
    <div className="flex bg-slate-50 overflow-hidden mt-[52px] h-[calc(100vh-52px)] lg:mt-0 lg:h-[calc(100vh-64px)]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

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
              <button onClick={() => setShowSidebar(true)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0">
                <FaUsers className="text-sm"/>
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-slate-800 leading-tight truncate">
                  {selectedEmp === "all"
                    ? "All Tasks"
                    : `${employees.find(e => e.uid === selectedEmp)?.name || "Employee"}'s Tasks`}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
                  {displayed.length} task{displayed.length !== 1 ? "s" : ""}
                  {checkedToday > 0 && ` · ${checkedToday} checked in today`}
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
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FaTimes className="text-[10px]"/>
                </button>
              )}
            </div>
            <FilterPill value={statusFilter} onChange={setStatusFilter}
              options={[["all", "Status"], ...STATUSES.map(s => [s, s])]}/>
            <FilterPill value={prioFilter} onChange={setPrioFilter}
              options={[["all", "Priority"], ...PRIORITIES.map(p => [p, p])]}/>
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 px-3 sm:px-5 py-2 flex items-center
          gap-3 sm:gap-5 shrink-0 overflow-x-auto scrollbar-hide">
          {STATUSES.map(s => {
            const count = displayed.filter(t => t.status === s).length;
            const meta  = STATUS_META[s];
            return (
              <button key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold
                  whitespace-nowrap py-1 border-b-2 transition shrink-0
                  ${statusFilter === s ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }}/>
                <span className="hidden sm:inline">{s}</span>
                <span className="sm:hidden">{s.split(" ")[0]}</span>
                <span className={`px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold
                  ${statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <div className="hidden sm:block h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0}%` }}/>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium whitespace-nowrap">
              {totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0}% done
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4">📋</div>
              <p className="text-slate-600 font-semibold text-sm sm:text-base">No tasks found</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {tasks.length === 0 ? "Click 'Assign Task' to get started." : "Try changing the filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-w-4xl">
              {displayed.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  todayLog={dailyLogs[task.id]?.[todayISO()]}
                  logsCount={Object.keys(dailyLogs[task.id] || {}).length}
                  streak={calcStreak(dailyLogs[task.id])}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onViewLogs={() => openLogDrawer(task)}
                  empColor={avatarPalette(task.assignedTo || "x")}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setModal(false)}
        >
          <div className="bg-white w-full sm:w-auto sm:max-w-xl
            rounded-t-2xl sm:rounded-2xl shadow-2xl
            flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">

            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0"/>

            <div className="px-5 pt-3 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
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
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
                    placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition font-medium"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                <textarea value={form.description} rows={2}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
                        onClick={() => setForm(f => ({ ...f, assignedTo: emp.uid }))}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition
                          ${selected ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                                     : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: selected ? "rgba(255,255,255,0.15)" : bg, color: selected ? "white" : fg }}>
                          {initials(emp.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${selected ? "text-white" : "text-slate-800"}`}>{emp.name}</p>
                          <p className={`text-[10px] ${selected ? "text-white/60" : "text-slate-400"}`}>{total} task{total !== 1 ? "s" : ""} · {done} done</p>
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
                    onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                    placeholder="e.g. EcoHomely"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800
                      placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Due Date</label>
                  <input type="date" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800
                      focus:outline-none focus:ring-2 focus:ring-slate-400 transition"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => {
                    const m   = PRIORITY_META[p];
                    const sel = form.priority === p;
                    return (
                      <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                          border-2 text-xs font-semibold transition
                          ${sel ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-100 text-slate-500 hover:border-slate-200 bg-white"}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.dot }}/>
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
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={`py-2 rounded-xl border-2 text-[10px] sm:text-[11px] font-semibold transition
                          ${sel ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-100 text-slate-500 hover:border-slate-200 bg-white"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={() => setModal(false)}
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

      {logDrawer && (
        <DailyLogDrawer
          task={logDrawer.task}
          logs={logDrawer.logs}
          employeeName={logDrawer.employeeName}
          onClose={() => setLogDrawer(null)}
        />
      )}
    </div>
  );
}


function TaskRow({ task, todayLog, logsCount, streak, onEdit, onDelete, onStatusChange, onViewLogs, empColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const pr  = PRIORITY_META[task.priority] || PRIORITY_META.Medium;
  const st  = STATUS_META[task.status]     || STATUS_META["To Do"];
  const due = dueMeta(task.dueDate);
  const [fg, bg] = empColor;
  const isDone    = task.status === "Done";
  const hasLog    = !!todayLog?.submittedAt;
  const hasBlocker= !!todayLog?.blockers?.trim();
  const mood      = todayLog?.mood ? (({ emoji: e, label: l } = { emoji: "😊", label: "Good" }) => `${e} ${l}`)
    .call(null, ...[Object.assign({ emoji: "😊", label: "Good" }, todayLog?.mood ? { emoji: (MOODS[todayLog.mood] || MOODS.good).emoji, label: (MOODS[todayLog.mood] || MOODS.good).label } : {})]) : null;

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  return (
    <div className={`group bg-white rounded-xl border transition-all
      ${isDone ? "border-slate-100 opacity-60"
        : hasBlocker ? "border-red-200 shadow-sm shadow-red-50"
        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"}`}
    >
      <div className="flex items-start sm:items-center gap-3 px-3 sm:px-4 py-3">

        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 mt-1.5 sm:mt-0"
          style={{ backgroundColor: pr.dot }}/>

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
            {hasBlocker && (
              <span className="text-[9px] sm:text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold border border-red-100 shrink-0">
                🚧 Blocker
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-bold"
                style={{ backgroundColor: bg, color: fg }}>
                {initials(task.assignedToName || "?")}
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400">{task.assignedToName || "Unassigned"}</span>
            </div>

            {due && (
              <span className={`text-[9px] sm:text-[10px] font-medium flex items-center gap-0.5 ${due.cls}`}>
                <FaClock className="text-[8px]"/>
                {due.label}
                {due.urgent && " ⚠"}
              </span>
            )}

            {hasLog ? (
              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                ✓ Checked in {timeAgo(todayLog.submittedAt)}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                📌 No check-in today
              </span>
            )}

            {streak > 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold text-orange-600">
                🔥 {streak}d streak
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className={`hidden sm:inline-flex text-[10px] font-semibold px-2 py-1 rounded-full border ${pr.badge}`}>
            {pr.icon} {pr.label}
          </span>

          <button onClick={onViewLogs}
            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold
              px-2 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600
              transition border border-slate-200 hover:border-indigo-200 whitespace-nowrap">
            📊 {logsCount > 0 ? `${logsCount}d` : "Logs"}
          </button>

          <div className="relative">
            <select value={task.status}
              onChange={e => onStatusChange(task.id, e.target.value)}
              className={`text-[10px] sm:text-[11px] font-semibold pl-2 sm:pl-2.5 pr-5 sm:pr-6
                py-1 sm:py-1.5 rounded-full cursor-pointer appearance-none border-0
                focus:outline-none focus:ring-2 focus:ring-slate-300`}
              style={{ background: st.bg, color: st.text }}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FaChevronDown className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[8px] opacity-50 pointer-events-none"/>
          </div>

          {/* Context menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-7 h-7 flex items-center justify-center rounded-lg
                hover:bg-slate-100 text-slate-400 transition
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
              <FaEllipsisH className="text-xs"/>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200
                rounded-xl shadow-lg z-10 py-1 w-36 overflow-hidden">
                <button onClick={() => { onEdit(task); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition">
                  <FaEdit className="text-slate-400"/> Edit Task
                </button>
                <button onClick={() => { onViewLogs(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-600 hover:bg-indigo-50 transition">
                  📊 View Daily Logs
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

      {hasBlocker && (
        <div className="mx-3 mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
          <p className="text-[10px] font-bold text-red-500 mb-1">🚧 Today's Blocker</p>
          <p className="text-[11px] text-red-700 line-clamp-2">{todayLog.blockers}</p>
        </div>
      )}
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
          ${value !== "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <FaChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-50 pointer-events-none"/>
    </div>
  );
}