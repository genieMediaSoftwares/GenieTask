import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, remove } from "firebase/database";
import {
  FaPlus, FaTimes, FaUserTie, FaIdBadge,
  FaUser, FaSearch, FaTrash, FaUsers,
} from "react-icons/fa";

export default function TeamMembers() {
  const user = auth.currentUser;

  const [members, setMembers]         = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [newName, setNewName]         = useState("");
  const [newEmpId, setNewEmpId]       = useState("");
  const [newRole, setNewRole]         = useState("employee");
  const [newDept, setNewDept]         = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adding, setAdding]           = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, "teamMembers"), (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
      setMembers(arr);
    });
  }, [user?.uid]);

  const handleAdd = async () => {
    setError("");
    if (!newName.trim())  { setError("Name is required.");        return; }
    if (!newEmpId.trim()) { setError("Employee ID is required."); return; }

    const duplicate = members.find(
      (m) => m.employeeId.toLowerCase() === newEmpId.trim().toLowerCase()
    );
    if (duplicate) { setError("Employee ID already exists."); return; }

    setAdding(true);
    await push(ref(db, "teamMembers"), {
      name:       newName.trim(),
      employeeId: newEmpId.trim().toUpperCase(),
      role:       newRole,
      department: newDept.trim() || "General",
      addedAt:    new Date().toISOString(),
      addedBy:    user.uid,
    });

    setNewName(""); setNewEmpId(""); setNewRole("employee");
    setNewDept(""); setShowModal(false); setAdding(false);
  };

  const handleDelete = async (id) => {
    await remove(ref(db, `teamMembers/${id}`));
  };

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.department || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEmployees = members.filter((m) => m.role === "employee").length;
  const totalAdmins    = members.filter((m) => m.role === "admin").length;

  return (
    <div className="p-6 h-full">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage your organisation's team roster</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700
            text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-200
            transition active:scale-95"
        >
          <FaPlus className="text-xs" /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<FaUsers />} label="Total Members" value={members.length} color="violet" />
        <StatCard icon={<FaUser />}  label="Employees"     value={totalEmployees}  color="emerald" />
        <StatCard icon={<FaUserTie />} label="Admins"      value={totalAdmins}     color="blue" />
      </div>

      <div className="relative mb-5">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          placeholder="Search by name, Employee ID or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm
            text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2
            focus:ring-violet-200 focus:border-transparent transition bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1fr_48px] gap-4
          px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Name</span>
          <span>Employee ID</span>
          <span>Department</span>
          <span>Role</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm font-medium">
              {members.length === 0 ? "No team members yet." : "No results found."}
            </p>
            {members.length === 0 && (
              <p className="text-xs mt-1">Click "Add Member" to get started.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onDelete={() => handleDelete(member.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add Team Member</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the member's details below</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setError(""); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <FaTimes />
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg
                text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <ModalField
                label="Full Name"
                icon={<FaUser />}
                placeholder="e.g. Ravi Kumar"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <ModalField
                label="Employee ID"
                icon={<FaIdBadge />}
                placeholder="e.g. EMP-2024-001"
                value={newEmpId}
                onChange={(e) => setNewEmpId(e.target.value)}
              />

              <ModalField
                label="Department"
                icon={<FaUsers />}
                placeholder="e.g. Marketing, Design, Dev..."
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
              />

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {["employee", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3
                        rounded-xl border text-sm font-medium transition-all active:scale-95
                        ${newRole === r
                          ? r === "admin"
                            ? "border-violet-500 bg-violet-50 text-violet-700"
                            : "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      {r === "admin" ? <FaUserTie className="text-xs" /> : <FaUser className="text-xs" />}
                      <span className="capitalize">{r}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                  text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700
                  text-white text-sm font-semibold transition active:scale-95
                  disabled:opacity-50 shadow-lg shadow-violet-200"
              >
                {adding ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function StatCard({ icon, label, value, color }) {
  const colors = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue:   "bg-blue-50 text-blue-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3.5
      flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function MemberRow({ member, onDelete }) {
  const isAdmin = member.role === "admin";
  const initials = member.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_48px]
      gap-2 sm:gap-4 px-5 py-4 items-center group hover:bg-slate-50/60 transition">

      {/* Name + Avatar */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs
          font-bold shrink-0 ${isAdmin ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
          {initials}
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

      <div className="hidden sm:block">
        <span className="text-sm text-slate-500">{member.department || "General"}</span>
      </div>

      <div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
          px-2.5 py-1 rounded-full
          ${isAdmin
            ? "bg-violet-100 text-violet-700"
            : "bg-emerald-100 text-emerald-700"
          }`}>
          {isAdmin ? <FaUserTie className="text-[10px]" /> : <FaUser className="text-[10px]" />}
          {isAdmin ? "Admin" : "Employee"}
        </span>
      </div>

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400
          hover:text-red-500 hover:bg-red-50 rounded-lg transition justify-self-end"
      >
        <FaTrash className="text-xs" />
      </button>
    </div>
  );
}

function ModalField({ label, icon, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {icon}
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-800
            text-sm placeholder-slate-300 focus:outline-none focus:ring-2
            focus:ring-violet-200 focus:border-transparent transition"
        />
      </div>
    </div>
  );
}