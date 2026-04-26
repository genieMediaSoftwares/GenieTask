import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { FaSearch, FaPlus, FaTimes, FaSyncAlt, FaCheck } from "react-icons/fa";

const FILTERS = ["All", "Pending", "In Progress", "Done", "High Priority", "Recurring"];

const PROJECT_COLORS = {
  "Meera Basu":  "bg-purple-100 text-purple-700",
  "Genie Media": "bg-blue-100 text-blue-700",
  "EcoHomely":   "bg-green-100 text-green-700",
  "Shopzzy":     "bg-orange-100 text-orange-700",
  "Manyam":      "bg-rose-100 text-rose-700",
};

function projectColor(p) {
  return PROJECT_COLORS[p] || "bg-slate-100 text-slate-600";
}

function priorityBadge(p) {
  if (p === "High")   return "bg-red-50 text-red-600 border border-red-200";
  if (p === "Medium") return "bg-orange-50 text-orange-600 border border-orange-200";
  return "bg-green-50 text-green-600 border border-green-200";
}

function statusBadge(s) {
  if (s === "Done")        return "bg-green-50 text-green-700 border border-green-200";
  if (s === "In Progress") return "bg-blue-50 text-blue-700 border border-blue-200";
  return "bg-orange-50 text-orange-600 border border-orange-200";
}

const EMPTY_FORM = {
  title: "", project: "", dueDate: "",
  priority: "Medium", status: "Pending",
  tags: "", recurring: false,
};

export default function MyTasks() {
  const user = auth.currentUser;
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `tasks/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setTasks(Object.entries(data).map(([id, v]) => ({ id, ...v })));
    });
  }, [user?.uid]);

  const filtered = tasks.filter((t) => {
    const matchSearch = (t.title || "").toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "All") return true;
    if (filter === "High Priority") return t.priority === "High";
    if (filter === "Recurring") return !!t.recurring;
    return t.status === filter;
  });

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await push(ref(db, `tasks/${user.uid}`), {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    });
    setForm(EMPTY_FORM);
    setShowModal(false);
  };

  const toggleDone = (task) => {
    const newStatus = task.status === "Done" ? "Pending" : "Done";
    update(ref(db, `tasks/${user.uid}/${task.id}`), { status: newStatus });
  };

  const deleteTask = (id) => remove(ref(db, `tasks/${user.uid}/${id}`));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition active:scale-95"
        >
          <FaPlus className="text-xs" /> Add Task
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
            text-slate-700 placeholder-slate-300 bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition active:scale-95
              ${filter === f
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-slate-100 hover:shadow-md transition"
            >
              {/* Circle toggle */}
              <button
                onClick={() => toggleDone(task)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition active:scale-90
                  ${task.status === "Done"
                    ? "bg-green-500 border-green-500"
                    : "border-slate-300 hover:border-blue-400"
                  }`}
              >
                {task.status === "Done" && <FaCheck className="text-white text-[8px]" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${task.status === "Done" ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {task.title}
                  </span>
                  {task.recurring && (
                    <span className="flex items-center gap-0.5 text-blue-500 text-[11px] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      <FaSyncAlt className="text-[8px]" /> Recurring
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {task.project && (
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${projectColor(task.project)}`}>
                      {task.project}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className="text-[11px] text-slate-400">📅 {task.dueDate}</span>
                  )}
                  {(Array.isArray(task.tags) ? task.tags : []).map((tag) => (
                    <span key={tag} className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right badges */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(task.status)}`}>
                  {task.status}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-300 hover:text-red-400 transition ml-1"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Add New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Task Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Enter task title..."
                  autoFocus
                />
              </div>

              {/* Project + Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Project</label>
                  <input
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  >
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Ads, Meta, Video"
                />
              </div>

              {/* Recurring */}
              <div
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => setForm({ ...form, recurring: !form.recurring })}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition
                  ${form.recurring ? "bg-blue-600 border-blue-600" : "border-slate-300"}`}>
                  {form.recurring && <FaCheck className="text-white text-[8px]" />}
                </div>
                <span className="text-sm text-slate-600">Recurring task</span>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.title.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition active:scale-95"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}