import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";


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


function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}


function TaskDrawer({ task, onClose, onSaveUpdate }) {
  const [status,  setStatus]  = useState(task.status || "To Do");
  const [percent, setPercent] = useState(task.progressPercent ?? STATUS_META[task.status]?.progress ?? 0);
  const [note,    setNote]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const updates = task.updates || [];
  const width   = useWindowWidth();
  const isMobile = width < 640;

  useEffect(() => {
    setStatus(task.status || "To Do");
    setPercent(task.progressPercent ?? STATUS_META[task.status]?.progress ?? 0);
  }, [task.status, task.progressPercent]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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
  const px   = isMobile ? "14px" : "22px";

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 40,
          animation: "fdIn 0.2s ease",
        }}
      />

      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: isMobile ? "100vw" : "min(520px, 92vw)",
        background: "#fff",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.14)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        animation: "slIn 0.3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'Outfit', system-ui, sans-serif",
        overflow: "hidden",
      }}>

        <div style={{
          flexShrink: 0,
          padding: isMobile ? "14px 14px 12px" : "20px 22px 16px",
          borderBottom: "1px solid #f3f4f6",
          background: "#fff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {task.project && (
                <span style={{
                  display: "inline-block", fontSize: 10, fontWeight: 800,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#4f46e5", background: "#eef2ff",
                  padding: "3px 9px", borderRadius: 6, marginBottom: 8,
                }}>{task.project}</span>
              )}
              <h2 style={{
                fontSize: isMobile ? 15 : 17,
                fontWeight: 900, color: "#111827", margin: 0, lineHeight: 1.3,
              }}>
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

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "14px 14px" : "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          WebkitOverflowScrolling: "touch",
        }}>

          {task.description && (
            <div style={{ background: "#f9fafb", borderRadius: 10, padding: "11px 13px", border: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Description</p>
              <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{task.description}</p>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr",
            gap: isMobile ? 6 : 7,
          }}>
            {[
              { label: "Assigned by", value: task.assignedByName || "Admin" },
              { label: "Priority",    value: `${pCfg.icon} ${task.priority || "Medium"}` },
              { label: "Due date",    value: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No deadline" },
              { label: "Last update", value: task.updatedAt ? timeAgo(task.updatedAt) : "—" },
            ].map(m => (
              <div key={m.label} style={{ background: "#f9fafb", borderRadius: 9, padding: isMobile ? "8px 10px" : "9px 11px", border: "1px solid #f3f4f6" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>{m.label}</p>
                <p style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#1f2937", margin: 0 }}>{m.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
              Update Status
            </p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {STATUSES.map(s => {
                const c = STATUS_META[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setPercent(c.progress); }}
                    style={{
                      padding: isMobile ? "6px 10px" : "6px 13px",
                      borderRadius: 20,
                      fontSize: isMobile ? 10 : 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
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

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 7px" }}>
              Progress Note <span style={{ fontWeight: 400, color: "#9ca3af", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you work on? Any blockers? What's next?"
              rows={isMobile ? 2 : 3}
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
                        <div style={{ flex: 1, background: "#f9fafb", borderRadius: 10, border: "1px solid #f3f4f6", padding: isMobile ? "8px 10px" : "9px 12px" }}>
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

        <div style={{
          flexShrink: 0,
          padding: isMobile ? "12px 14px 20px" : "14px 22px 20px",
          borderTop: "1px solid #f3f4f6",
          background: "#fff",
        }}>
          <button
            onClick={handlePost}
            disabled={saving}
            style={{
              width: "100%",
              padding: isMobile ? "13px 0" : "14px 0",
              background: saved   ? "#059669"
                        : saving  ? "#374151"
                        :           "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: isMobile ? 14 : 15,
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
      <div style={{ height: 4, background: sCfg.color }} />

      <div style={{ padding: "14px 15px 15px" }}>
        {task.project && (
          <div style={{ marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.09em",
              textTransform: "uppercase", color: "#4f46e5",
              background: "#eef2ff", padding: "3px 9px", borderRadius: 5,
            }}>{task.project}</span>
          </div>
        )}

        <p style={{
          fontSize: 14, fontWeight: 800,
          color: task.status === "Done" ? "#9ca3af" : "#111827",
          textDecoration: task.status === "Done" ? "line-through" : "none",
          margin: "0 0 12px", lineHeight: 1.35,
        }}>{task.title}</p>

        <div style={{ marginBottom: 13 }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: "#f3f4f6", border: "1.5px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#374151",
            }}>
              {(task.assignedToName || "?")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.assignedToName || "You"}
            </span>
            {due && (
              <>
                <span style={{ fontSize: 10, color: "#d1d5db", flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: due.color, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {due.label}
                </span>
              </>
            )}
          </div>

          <div
            onClick={e => { e.stopPropagation(); onQuickStatus(task.id, task.status); }}
            style={{ flexShrink: 0 }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 800, whiteSpace: "nowrap",
              color: sCfg.text, background: sCfg.bg,
              border: `1.5px solid ${sCfg.border}`,
              padding: "4px 10px", borderRadius: 20,
              cursor: updating ? "wait" : "pointer",
              opacity: updating ? 0.6 : 1,
              transition: "all 0.15s",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: sCfg.color, display: "inline-block" }} />
              {updating ? "…" : sCfg.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function MyTasks() {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTask,  setActiveTask]  = useState(null);
  const [updatingId,  setUpdatingId]  = useState(null);
  const [filter,      setFilter]      = useState("All");
  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setCurrentUser(user));
    return () => unsub();
  }, []);

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

  const handleSaveUpdate = useCallback(async ({ taskId, note, status, percent }) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const prev  = Array.isArray(task.updates) ? task.updates : [];
    const entry = { status, percent, note: note || "", savedAt: new Date().toISOString() };
    await update(ref(db, `assignedTasks/${taskId}`), {
      status,
      progressPercent: percent,
      updates:   [...prev, entry],
      updatedAt: new Date().toISOString(),
    });
  }, [tasks]);

  const TABS = [
    { key: "All",         label: "All",         count: tasks.length },
    { key: "To Do",       label: "Pending",      count: tasks.filter(t => t.status === "To Do").length },
    { key: "In Progress", label: "In Progress",  count: tasks.filter(t => t.status === "In Progress").length },
    { key: "In Review",   label: "In Review",    count: tasks.filter(t => t.status === "In Review").length },
    { key: "Done",        label: "Done",         count: tasks.filter(t => t.status === "Done").length },
  ];

  const filtered = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === "Done").length;
  const avgPct   = total > 0
    ? Math.round(tasks.reduce((s, t) => s + (t.progressPercent ?? STATUS_META[t.status]?.progress ?? 0), 0) / total)
    : 0;

  const gridCols = isMobile
    ? "1fr"
    : isTablet
    ? "repeat(2, 1fr)"
    : "repeat(auto-fill, minmax(290px, 1fr))";

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

  return (
    <div style={{
      maxWidth: 960,
      margin: "0 auto",
      
      padding: isMobile ? "64px 14px 28px" : isTablet ? "28px 18px" : "28px 20px",
      fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
    }}>

      <div style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "flex-start",
        justifyContent: "space-between",
        marginBottom: isMobile ? 18 : 24,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px",
          }}>
            My Assigned Tasks
          </p>
          <h1 style={{
            fontSize: isMobile ? 18 : 24,
            fontWeight: 900, color: "#111827", margin: "0 0 4px", lineHeight: 1.2,
          }}>
            {isMobile ? "My Tasks" : "Tasks assigned by your admin"}
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
            {total === 0 ? "No tasks yet" : `${total} task${total !== 1 ? "s" : ""} · ${done} completed`}
          </p>
        </div>

        {total > 0 && !isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid #f3f4f6",
            borderRadius: 14, padding: "10px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            flexShrink: 0,
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

        {total > 0 && isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#eef2ff", borderRadius: 10,
            padding: "7px 12px", flexShrink: 0,
          }}>
            <svg viewBox="0 0 40 40" style={{ width: 28, height: 28, transform: "rotate(-90deg)" }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="#c7d2fe" strokeWidth="5" />
              <circle cx="20" cy="20" r="16" fill="none" stroke="#4f46e5" strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - avgPct / 100)}`}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#4f46e5" }}>{avgPct}%</span>
          </div>
        )}
      </div>

      {total > 0 && (
        <div style={{
          overflowX: isMobile ? "auto" : "visible",
          WebkitOverflowScrolling: "touch",
          marginBottom: isMobile ? 16 : 20,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}>
          <div style={{
            display: "flex",
            gap: 4,
            background: "#f9fafb",
            borderRadius: 12,
            padding: 4,
            border: "1px solid #f3f4f6",
            width: isMobile ? "max-content" : "fit-content",
            minWidth: isMobile ? "100%" : "auto",
          }}>
            {TABS.map(tab => {
              const active = filter === tab.key;
              return (
                <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                  padding: isMobile ? "6px 11px" : "7px 15px",
                  borderRadius: 9,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: active ? "#fff"       : "transparent",
                  color:      active ? "#111827"    : "#6b7280",
                  border:     active ? "1px solid #e5e7eb" : "1px solid transparent",
                  boxShadow:  active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  display: "flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap",
                }}>
                  {tab.label}
                  <span style={{
                    fontSize: 10, fontWeight: 800, minWidth: 16, height: 16,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 9, padding: "0 3px",
                    background: active ? "#111827" : "#e5e7eb",
                    color:      active ? "#fff"    : "#6b7280",
                  }}>{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 ? (
        <div style={{
          textAlign: "center", padding: isMobile ? "48px 16px" : "64px 20px",
          background: "#fff", borderRadius: 20, border: "1.5px dashed #e5e7eb",
        }}>
          <p style={{ fontSize: 40, margin: "0 0 14px" }}>📋</p>
          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>No tasks assigned yet</p>
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
          gridTemplateColumns: gridCols,
          gap: isMobile ? 10 : 14,
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
        @keyframes spin  { to { transform: rotate(360deg) } }
        /* Hide filter scrollbar on webkit */
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}