import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push } from "firebase/database";
import { FaPlus, FaTimes, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const EMPTY_FORM  = { type: "Casual", from: "", to: "", reason: "" };
const LEAVE_TYPES = ["Casual", "Sick", "Privilege", "Emergency"];

export default function MyLeave() {
  const user = auth.currentUser;

  const [leaves,     setLeaves]     = useState([]);
  const [showModal,  setShowModal]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `leaves/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setLeaves(
        Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn))
      );
    });
  }, [user?.uid]);

  const total    = leaves.length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const pending  = leaves.filter(l => l.status === "Pending").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;

  const handleApply = async () => {
    setFormError("");
    if (!form.from)          { setFormError("Please select a start date.");  return; }
    if (!form.to)            { setFormError("Please select an end date.");    return; }
    if (!form.reason.trim()) { setFormError("Please provide a reason.");     return; }
    if (new Date(form.to) < new Date(form.from)) {
      setFormError("End date cannot be before start date.");
      return;
    }
    setSubmitting(true);
    await push(ref(db, `leaves/${user.uid}`), {
      ...form,
      status:    "Pending",
      appliedOn: new Date().toISOString().split("T")[0],
    });
    setForm(EMPTY_FORM);
    setShowModal(false);
    setSubmitting(false);
  };

  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setFormError(""); };

  const daysBetween = (from, to) => {
    if (!from || !to) return 0;
    return Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
  };

  const statusConfig = (s) => {
    if (s === "Approved") return { bg: "bg-green-100",  text: "text-green-700",  icon: <FaCheckCircle className="text-[10px]" /> };
    if (s === "Rejected") return { bg: "bg-red-100",    text: "text-red-600",    icon: <FaTimesCircle className="text-[10px]" /> };
    return                       { bg: "bg-yellow-100", text: "text-yellow-700", icon: <FaClock className="text-[10px]" /> };
  };

  const typeColor = (t) => {
    if (t === "Sick")      return "bg-red-50 text-red-600 border-red-200";
    if (t === "Privilege") return "bg-purple-50 text-purple-600 border-purple-200";
    if (t === "Emergency") return "bg-rose-50 text-rose-600 border-rose-200";
    return "bg-blue-50 text-blue-600 border-blue-200";
  };

  const typeEmoji = (t) => ({ Sick: "🤒", Casual: "🌴", Privilege: "⭐", Emergency: "🚨" }[t] || "");

  return (
    
    <div className="pt-[68px] px-3 pb-6 sm:px-5 sm:pt-[68px] lg:pt-6 lg:px-6 max-w-[860px] mx-auto">

      <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">My Leave</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Apply and track your requests</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(""); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white
            text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl
            shadow-lg shadow-blue-200 transition active:scale-95 whitespace-nowrap"
        >
          <FaPlus className="text-[10px] sm:text-xs" />
          <span className="hidden xs:inline">Apply </span>Leave
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
        {[
          { label: "Total",    value: total,    color: "border-l-blue-400",   vcolor: "text-blue-500"   },
          { label: "Approved", value: approved, color: "border-l-green-400",  vcolor: "text-green-500"  },
          { label: "Pending",  value: pending,  color: "border-l-yellow-400", vcolor: "text-yellow-500" },
          { label: "Rejected", value: rejected, color: "border-l-red-400",    vcolor: "text-red-500"    },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-3 sm:p-4 border-l-4 ${s.color} shadow-sm`}>
            <p className={`text-xl sm:text-2xl font-bold ${s.vcolor}`}>{s.value}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {leaves.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-slate-400 bg-white rounded-xl border border-slate-100">
          <p className="text-3xl sm:text-4xl mb-3">🏖️</p>
          <p className="text-sm font-medium">No leave requests yet.</p>
          <p className="text-xs mt-1">Tap "Apply Leave" to submit your first request.</p>
        </div>
      ) : (
        <div className="space-y-2.5 sm:space-y-3">
          {leaves.map(leave => {
            const sc   = statusConfig(leave.status);
            const days = daysBetween(leave.from, leave.to);
            return (
              <div
                key={leave.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm
                  px-4 sm:px-5 py-3.5 sm:py-4 hover:shadow-md transition"
              >
                {/* ── Top row: type badge + status ── */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1
                    rounded-full border shrink-0 ${typeColor(leave.type)}`}>
                    {typeEmoji(leave.type)} {leave.type}
                  </span>
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs
                    font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full shrink-0
                    ${sc.bg} ${sc.text}`}>
                    {sc.icon}
                    {leave.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1.5">
                  <FaCalendarAlt className="text-slate-300 text-[10px] shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-600 font-medium">
                    {leave.from} → {leave.to}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    ({days} day{days > 1 ? "s" : ""})
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-1.5">{leave.reason}</p>

                <p className="text-[10px] sm:text-xs text-slate-400">Applied: {leave.appliedOn}</p>

                {leave.status === "Pending" && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                    <p className="text-[10px] sm:text-xs text-slate-400">Awaiting admin approval</p>
                  </div>
                )}
                {leave.status === "Approved" && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
                    <FaCheckCircle className="text-green-500 text-xs shrink-0" />
                    <p className="text-[10px] sm:text-xs text-green-600 font-medium">Leave approved by admin</p>
                  </div>
                )}
                {leave.status === "Rejected" && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
                    <FaTimesCircle className="text-red-400 text-xs shrink-0" />
                    <p className="text-[10px] sm:text-xs text-red-500 font-medium">Leave rejected by admin</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

 
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50
            flex items-end sm:items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white w-full sm:w-auto sm:max-w-md
            rounded-t-2xl sm:rounded-2xl shadow-2xl
            flex flex-col
            max-h-[92vh] sm:max-h-[90vh]
            overflow-hidden">

            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

            <div className="flex items-start justify-between px-5 pt-4 sm:pt-5 pb-3 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">Apply for Leave</h3>
                <p className="text-xs text-slate-400 mt-0.5">Request will be sent to admin</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">

              {formError && (
                <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg
                  text-xs text-red-600 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-medium
                        transition active:scale-95 text-left
                        ${form.type === t
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                    >
                      {typeEmoji(t)} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">From *</label>
                  <input
                    type="date"
                    value={form.from}
                    onChange={e => setForm({ ...form, from: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">To *</label>
                  <input
                    type="date"
                    value={form.to}
                    min={form.from}
                    onChange={e => setForm({ ...form, to: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {form.from && form.to && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2
                  text-xs text-blue-600 font-medium">
                  📅 {daysBetween(form.from, form.to)} day{daysBetween(form.from, form.to) > 1 ? "s" : ""} of {form.type} leave
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Reason *</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  placeholder="Briefly explain the reason for your leave..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl
                    text-xs sm:text-sm resize-none focus:outline-none focus:ring-2
                    focus:ring-blue-200 text-slate-700 placeholder-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 pt-3 pb-5 sm:pb-5 shrink-0 border-t border-slate-50">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl
                  text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                  text-white rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95"
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}