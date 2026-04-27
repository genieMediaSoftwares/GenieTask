// import { useState, useEffect } from "react";
// import { auth, db } from "../firebase";
// import { ref, onValue, push } from "firebase/database";
// import { FaPlus, FaTimes } from "react-icons/fa";

// const EMPTY_FORM = { type: "Casual", from: "", to: "", reason: "" };

// export default function MyLeave() {
//   const user = auth.currentUser;
//   const [leaves, setLeaves] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     if (!user) return;
//     return onValue(ref(db, `leaves/${user.uid}`), (snap) => {
//       const data = snap.val() || {};
//       const arr = Object.entries(data)
//         .map(([id, v]) => ({ id, ...v }))
//         .sort((a, b) => new Date(b.appliedOn) - new Date(a.appliedOn));
//       setLeaves(arr);
//     });
//   }, [user?.uid]);

//   const total    = leaves.length;
//   const approved = leaves.filter((l) => l.status === "Approved").length;
//   const pending  = leaves.filter((l) => l.status === "Pending").length;

//   const handleApply = async () => {
//     if (!form.from || !form.to || !form.reason.trim()) return;
//     setSubmitting(true);
//     await push(ref(db, `leaves/${user.uid}`), {
//       ...form,
//       status: "Pending",
//       appliedOn: new Date().toISOString().split("T")[0],
//     });
//     setForm(EMPTY_FORM);
//     setShowModal(false);
//     setSubmitting(false);
//   };

//   const statusBadge = (s) => {
//     if (s === "Approved") return "bg-green-100 text-green-700";
//     if (s === "Rejected") return "bg-red-100 text-red-700";
//     return "bg-yellow-100 text-yellow-700";
//   };

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
//         <button
//           onClick={() => setShowModal(true)}
//           className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition active:scale-95"
//         >
//           <FaPlus className="text-xs" /> Apply Leave
//         </button>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-b-blue-400">
//           <p className="text-3xl font-bold text-blue-500">{total}</p>
//           <p className="text-sm text-slate-500 mt-1">Total</p>
//         </div>
//         <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-b-green-400">
//           <p className="text-3xl font-bold text-green-500">{approved}</p>
//           <p className="text-sm text-slate-500 mt-1">Approved</p>
//         </div>
//         <div className="bg-white rounded-xl p-5 shadow-sm border-b-4 border-b-yellow-400">
//           <p className="text-3xl font-bold text-yellow-500">{pending}</p>
//           <p className="text-sm text-slate-500 mt-1">Pending</p>
//         </div>
//       </div>

//       {/* Leave table */}
//       {leaves.length > 0 ? (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="bg-slate-50">
//                   {["Type", "From", "To", "Reason", "Applied On", "Status"].map((h) => (
//                     <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-50">
//                 {leaves.map((l) => (
//                   <tr key={l.id} className="hover:bg-slate-50/50 transition">
//                     <td className="px-5 py-3.5 font-medium text-slate-700">{l.type}</td>
//                     <td className="px-5 py-3.5 text-slate-500">{l.from}</td>
//                     <td className="px-5 py-3.5 text-slate-500">{l.to}</td>
//                     <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate">{l.reason}</td>
//                     <td className="px-5 py-3.5 text-slate-400">{l.appliedOn}</td>
//                     <td className="px-5 py-3.5">
//                       <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(l.status)}`}>
//                         {l.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       ) : (
//         <div className="text-center py-16 text-slate-400">
//           <p className="text-4xl mb-3">🏖️</p>
//           <p className="text-sm">No leave requests yet.</p>
//         </div>
//       )}

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
//           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
//             <div className="flex items-center justify-between mb-5">
//               <h3 className="text-lg font-bold text-slate-800">Apply for Leave</h3>
//               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition">
//                 <FaTimes />
//               </button>
//             </div>

//             <div className="space-y-3.5">
//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Leave Type</label>
//                 <select
//                   value={form.type}
//                   onChange={(e) => setForm({ ...form, type: e.target.value })}
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
//                 >
//                   {["Casual", "Sick", "Privilege", "Emergency"].map((t) => (
//                     <option key={t}>{t}</option>
//                   ))}
//                 </select>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">From *</label>
//                   <input
//                     type="date"
//                     value={form.from}
//                     onChange={(e) => setForm({ ...form, from: e.target.value })}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-slate-500 mb-1 block">To *</label>
//                   <input
//                     type="date"
//                     value={form.to}
//                     onChange={(e) => setForm({ ...form, to: e.target.value })}
//                     className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="text-xs font-medium text-slate-500 mb-1 block">Reason *</label>
//                 <textarea
//                   value={form.reason}
//                   onChange={(e) => setForm({ ...form, reason: e.target.value })}
//                   rows={3}
//                   placeholder="Reason for leave..."
//                   className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
//                 />
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
//                 onClick={handleApply}
//                 disabled={submitting || !form.from || !form.to || !form.reason.trim()}
//                 className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition active:scale-95"
//               >
//                 {submitting ? "Submitting..." : "Submit"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push } from "firebase/database";
import { FaPlus, FaTimes, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const EMPTY_FORM = { type: "Casual", from: "", to: "", reason: "" };

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

  // ── Stats ────────────────────────────────────────────────────────
  const total    = leaves.length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const pending  = leaves.filter(l => l.status === "Pending").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;

  // ── Apply leave ──────────────────────────────────────────────────
  const handleApply = async () => {
    setFormError("");
    if (!form.from)         { setFormError("Please select a start date.");   return; }
    if (!form.to)           { setFormError("Please select an end date.");     return; }
    if (!form.reason.trim()) { setFormError("Please provide a reason.");      return; }
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

  const daysBetween = (from, to) => {
    if (!from || !to) return 0;
    const diff = new Date(to) - new Date(from);
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const statusConfig = (s) => {
    if (s === "Approved") return { bg:"bg-green-100",  text:"text-green-700",  icon:<FaCheckCircle className="text-[10px]" /> };
    if (s === "Rejected") return { bg:"bg-red-100",    text:"text-red-600",    icon:<FaTimesCircle className="text-[10px]" /> };
    return                       { bg:"bg-yellow-100", text:"text-yellow-700", icon:<FaClock className="text-[10px]" /> };
  };

  const typeColor = (t) => {
    if (t === "Sick")      return "bg-red-50 text-red-600 border-red-200";
    if (t === "Privilege") return "bg-purple-50 text-purple-600 border-purple-200";
    if (t === "Emergency") return "bg-rose-50 text-rose-600 border-rose-200";
    return "bg-blue-50 text-blue-600 border-blue-200";
  };

  return (
    <div className="p-6 max-w-[860px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Leave</h1>
          <p className="text-sm text-slate-400 mt-0.5">Apply for leave and track your requests</p>
        </div>
        <button onClick={() => { setShowModal(true); setFormError(""); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition active:scale-95">
          <FaPlus className="text-xs" /> Apply Leave
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Total",    value:total,    color:"border-l-blue-400",   vcolor:"text-blue-500"   },
          { label:"Approved", value:approved, color:"border-l-green-400",  vcolor:"text-green-500"  },
          { label:"Pending",  value:pending,  color:"border-l-yellow-400", vcolor:"text-yellow-500" },
          { label:"Rejected", value:rejected, color:"border-l-red-400",    vcolor:"text-red-500"    },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 border-l-4 ${s.color} shadow-sm`}>
            <p className={`text-2xl font-bold ${s.vcolor}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Leave List ── */}
      {leaves.length === 0 ? (
        <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-100">
          <p className="text-4xl mb-3">🏖️</p>
          <p className="text-sm font-medium">No leave requests yet.</p>
          <p className="text-xs mt-1">Click "Apply Leave" to submit your first request.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => {
            const sc   = statusConfig(leave.status);
            const days = daysBetween(leave.from, leave.to);
            return (
              <div key={leave.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">

                  {/* Left */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Type badge */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 mt-0.5 ${typeColor(leave.type)}`}>
                      {leave.type}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-sm text-slate-600 font-medium">
                          <FaCalendarAlt className="text-slate-400 text-[10px]" />
                          {leave.from} → {leave.to}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({days} day{days > 1 ? "s" : ""})
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{leave.reason}</p>
                      <p className="text-xs text-slate-400 mt-1">Applied on: {leave.appliedOn}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                    px-2.5 py-1.5 rounded-full shrink-0 ${sc.bg} ${sc.text}`}>
                    {sc.icon}
                    {leave.status}
                  </span>
                </div>

                {/* Pending indicator */}
                {leave.status === "Pending" && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <p className="text-xs text-slate-400">Awaiting admin approval</p>
                  </div>
                )}
                {leave.status === "Approved" && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5">
                    <FaCheckCircle className="text-green-500 text-xs" />
                    <p className="text-xs text-green-600 font-medium">Leave approved by admin</p>
                  </div>
                )}
                {leave.status === "Rejected" && (
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5">
                    <FaTimesCircle className="text-red-400 text-xs" />
                    <p className="text-xs text-red-500 font-medium">Leave rejected by admin</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Apply Leave Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Apply for Leave</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your request will be sent to the admin</p>
              </div>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(""); }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                <FaTimes />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition active:scale-95
                        ${form.type === t
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}>
                      {t === "Sick" && "🤒 "}
                      {t === "Casual" && "🌴 "}
                      {t === "Privilege" && "⭐ "}
                      {t === "Emergency" && "🚨 "}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">From *</label>
                  <input type="date" value={form.from}
                    onChange={e => setForm({ ...form, from: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block">To *</label>
                  <input type="date" value={form.to}
                    onChange={e => setForm({ ...form, to: e.target.value })}
                    min={form.from}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              {/* Duration preview */}
              {form.from && form.to && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-600 font-medium">
                  📅 {daysBetween(form.from, form.to)} day{daysBetween(form.from, form.to) > 1 ? "s" : ""} of {form.type} leave
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Reason *</label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  rows={3} placeholder="Briefly explain the reason for your leave..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700 placeholder-slate-300" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); setFormError(""); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleApply} disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                  text-white rounded-xl text-sm font-semibold transition active:scale-95">
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}