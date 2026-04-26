import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push } from "firebase/database";
import { FaPlus, FaTimes } from "react-icons/fa";

const EMPTY_FORM = { type: "Casual", from: "", to: "", reason: "" };

export default function MyLeave() {
  const user = auth.currentUser;
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `leaves/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
      setLeaves(arr);
    });
  }, [user?.uid]);

  const total    = leaves.length;
  const approved = leaves.filter((l) => l.status === "Approved").length;
  const pending  = leaves.filter((l) => l.status === "Pending").length;

  const handleApply = async () => {
    if (!form.from || !form.to || !form.reason.trim()) return;
    setSubmitting(true);
    await push(ref(db, `leaves/${user.uid}`), {
      ...form,
      status: "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
    });
    setForm(EMPTY_FORM);
    setShowModal(false);
    setSubmitting(false);
  };

  const statusBadge = (s) => {
    if (s === "Approved") return "bg-green-100 text-green-700";
    if (s === "Rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition active:scale-95"
        >
          <FaPlus className="text-xs" /> Apply Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-b-blue-400">
          <p className="text-3xl font-bold text-blue-500">{total}</p>
          <p className="text-sm text-slate-500 mt-1">Total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-b-green-400">
          <p className="text-3xl font-bold text-green-500">{approved}</p>
          <p className="text-sm text-slate-500 mt-1">Approved</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-b-yellow-400">
          <p className="text-3xl font-bold text-yellow-500">{pending}</p>
          <p className="text-sm text-slate-500 mt-1">Pending</p>
        </div>
      </div>

      {/* Leave table */}
      {leaves.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  {["Type", "From", "To", "Reason", "Applied On", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-700">{l.type}</td>
                    <td className="px-5 py-3.5 text-slate-500">{l.from}</td>
                    <td className="px-5 py-3.5 text-slate-500">{l.to}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{l.reason}</td>
                    <td className="px-5 py-3.5 text-slate-400">{l.appliedOn}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(l.status)}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏖️</p>
          <p className="text-sm">No leave requests yet.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Apply for Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Leave Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {["Casual", "Sick", "Privilege", "Emergency"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">From *</label>
                  <input
                    type="date"
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">To *</label>
                  <input
                    type="date"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Reason *</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  placeholder="Reason for leave..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
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
                onClick={handleApply}
                disabled={submitting || !form.from || !form.to || !form.reason.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition active:scale-95"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}