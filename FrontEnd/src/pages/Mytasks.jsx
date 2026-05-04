import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, update, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";


const STATUSES = ["To Do", "In Progress", "In Review", "Done"];
const PRIORITIES = ["High", "Medium", "Low"];

const STATUS_CFG = {
  "To Do": { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", text: "#475569", progress: 0, order: 0, label: "Pending" },
  "In Progress": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", progress: 40, order: 1, label: "In Progress" },
  "In Review": { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6", progress: 75, order: 2, label: "In Review" },
  "Done": { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46", progress: 100, order: 3, label: "Done" },
};

const PRIORITY_CFG = {
  High: { color: "#dc2626", bg: "#fef2f2", icon: "●", label: "High" },
  Medium: { color: "#d97706", bg: "#fffbeb", icon: "●", label: "Medium" },
  Low: { color: "#16a34a", bg: "#f0fdf4", icon: "●", label: "Low" },
};

const MOODS = [
  { value: "great", label: "Great", emoji: "🚀", color: "#059669" },
  { value: "good", label: "Good", emoji: "😊", color: "#2563eb" },
  { value: "okay", label: "Okay", emoji: "😐", color: "#d97706" },
  { value: "blocked", label: "Blocked", emoji: "🚧", color: "#dc2626" },
];


const todayISO = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function dueMeta(iso) {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso) - new Date()) / 86_400_000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "#dc2626", urgent: true };
  if (days === 0) return { label: "Due today", color: "#d97706", urgent: true };
  if (days <= 3) return { label: `${days}d left`, color: "#d97706", urgent: false };
  return {
    label: new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    color: "#94a3b8",
    urgent: false,
  };
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
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

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}


function ProgressBar({ percent, color, showLabel = true }) {
  return (
    <div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>PROGRESS</span>
          <span style={{ fontSize: 11, fontWeight: 800, color }}>{percent}%</span>
        </div>
      )}
      <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${percent}%`,
          background: color, borderRadius: 99,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function StatusPill({ status, active, onClick, size = "sm" }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["To Do"];
  const pad = size === "xs" ? "4px 9px" : "6px 13px";
  const fs = size === "xs" ? 10 : 11;
  return (
    <button onClick={onClick} style={{
      padding: pad, borderRadius: 20, fontSize: fs, fontWeight: 700,
      cursor: "pointer", transition: "all 0.15s",
      background: active ? cfg.color : cfg.bg,
      color: active ? "#fff" : cfg.text,
      border: `1.5px solid ${active ? cfg.color : cfg.border}`,
      boxShadow: active ? `0 2px 8px ${cfg.color}40` : "none",
    }}>{cfg.label}</button>
  );
}


function CheckInDrawer({ task, todayLog, onClose, onSubmit }) {
  const width = useWindowWidth();
  const mobile = width < 640;
  const cfg = STATUS_CFG[task.status] || STATUS_CFG["To Do"];

  const [status, setStatus] = useState(todayLog?.status || task.status || "To Do");
  const [percent, setPercent] = useState(todayLog?.percent ?? task.progressPercent ?? cfg.progress);
  const [mood, setMood] = useState(todayLog?.mood || "good");
  const [achieved, setAchieved] = useState(todayLog?.achieved || "");
  const [planned, setPlanned] = useState(todayLog?.planned || "");
  const [blockers, setBlockers] = useState(todayLog?.blockers || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const activeCfg = STATUS_CFG[status] || STATUS_CFG["To Do"];

  const alreadyCheckedIn = !!todayLog?.submittedAt;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({ taskId: task.id, status, percent, mood, achieved: achieved.trim(), planned: planned.trim(), blockers: blockers.trim() });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1800);
    } catch (err) {
      console.error("Check-in failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    padding: "9px 12px", fontSize: 13, color: "#1e293b",
    resize: "vertical", outline: "none", fontFamily: "inherit",
    lineHeight: 1.55, background: "#fff", transition: "border-color 0.15s",
    display: "block",
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
        zIndex: 40, animation: "fdIn 0.2s ease",
      }} />

      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: mobile ? "100vw" : "min(540px, 94vw)",
        background: "#fff",
        boxShadow: "-24px 0 72px rgba(0,0,0,0.12)",
        zIndex: 50,
        display: "flex", flexDirection: "column",
        animation: "slIn 0.3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
        overflow: "hidden",
      }}>

        <div style={{
          flexShrink: 0,
          borderBottom: "1px solid #f1f5f9",
          padding: mobile ? "14px 16px" : "18px 24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                {task.project && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "#4f46e5",
                    background: "#eef2ff", padding: "3px 8px", borderRadius: 5,
                  }}>{task.project}</span>
                )}
                {alreadyCheckedIn && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: "#059669",
                    background: "#ecfdf5", padding: "3px 8px", borderRadius: 5,
                    border: "1px solid #a7f3d0",
                  }}>✓ Checked in today</span>
                )}
              </div>
              <h2 style={{ fontSize: mobile ? 15 : 17, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                {task.title}
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0", fontWeight: 500 }}>
                Daily Check-In · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {task.description && (
                <div style={{
                  marginTop: 10,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}>
                  <p style={{
                    fontSize: 9, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    margin: "0 0 4px",
                  }}>📋 Task Description</p>
                  <p style={{
                    fontSize: 12, color: "#334155",
                    margin: 0, lineHeight: 1.6, fontWeight: 400,
                  }}>{task.description}</p>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              cursor: "pointer", color: "#64748b", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          <ProgressBar percent={percent} color={activeCfg.color} />
        </div>

        <div style={{
          flex: 1, overflowY: "auto",
          padding: mobile ? "14px 16px" : "18px 24px",
          display: "flex", flexDirection: "column", gap: 16,
          WebkitOverflowScrolling: "touch",
        }}>

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
              How's it going?
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => setMood(m.value)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10,
                  fontSize: mobile ? 11 : 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: mood === m.value ? m.color : "#f8fafc",
                  color: mood === m.value ? "#fff" : "#64748b",
                  border: `1.5px solid ${mood === m.value ? m.color : "#e2e8f0"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                }}>
                  <span style={{ fontSize: 16 }}>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>
              Task Status
            </p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {STATUSES.map(s => (
                <StatusPill
                  key={s} status={s}
                  active={status === s}
                  onClick={() => { setStatus(s); setPercent(STATUS_CFG[s].progress); }}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                Completion
              </p>
              <span style={{ fontSize: 12, fontWeight: 800, color: activeCfg.color }}>{percent}%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={percent}
              onChange={e => setPercent(Number(e.target.value))}
              style={{ width: "100%", accentColor: activeCfg.color, cursor: "pointer", display: "block", marginBottom: 4 }}
            />
            <ProgressBar percent={percent} color={activeCfg.color} showLabel={false} />
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              ✅ What I accomplished today
            </label>
            <textarea
              value={achieved} onChange={e => setAchieved(e.target.value)}
              placeholder="Describe what you completed or progressed on…"
              rows={mobile ? 2 : 3}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "#4f46e5"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              📅 Plan for tomorrow
            </label>
            <textarea
              value={planned} onChange={e => setPlanned(e.target.value)}
              placeholder="What will you work on next?"
              rows={mobile ? 2 : 2}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "#4f46e5"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              🚧 Blockers / Risks <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#94a3b8" }}>(optional)</span>
            </label>
            <textarea
              value={blockers} onChange={e => setBlockers(e.target.value)}
              placeholder="Any blockers slowing you down?"
              rows={2}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "#dc2626"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; }}
            />
          </div>

        </div>

        <div style={{
          flexShrink: 0,
          padding: mobile ? "12px 16px 22px" : "14px 24px 22px",
          borderTop: "1px solid #f1f5f9",
          background: "#fff",
        }}>
          <button
            onClick={handleSubmit} disabled={saving}
            style={{
              width: "100%",
              padding: mobile ? "13px 0" : "14px 0",
              background: saved ? "#059669"
                : saving ? "#334155"
                  : "#0f172a",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: mobile ? 14 : 15, fontWeight: 800,
              cursor: saving ? "wait" : "pointer",
              transition: "background 0.25s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: saved ? "0 4px 14px rgba(5,150,105,0.35)" : "0 4px 16px rgba(15,23,42,0.2)",
            }}
          >
            {saving ? (
              <>
                <span style={{
                  width: 15, height: 15, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                  display: "inline-block", animation: "spin 0.65s linear infinite",
                }} />
                Submitting…
              </>
            ) : saved ? "✓ Check-In Saved!" : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {alreadyCheckedIn ? "Update Today's Check-In" : "Submit Daily Check-In"}
              </>
            )}
          </button>
          {alreadyCheckedIn && (
            <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "8px 0 0" }}>
              Last submitted {timeAgo(todayLog.submittedAt)}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fdIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin  { to   { transform: rotate(360deg)   } }
      `}</style>
    </>
  );
}


function HistoryDrawer({ task, logs, onClose }) {
  const width = useWindowWidth();
  const mobile = width < 640;

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

  const streak = calcStreak(logs);
  const totalDays = entries.length;

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)", zIndex: 40, animation: "fdIn 0.2s ease",
      }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: mobile ? "100vw" : "min(500px, 94vw)",
        background: "#fff", boxShadow: "-24px 0 72px rgba(0,0,0,0.12)",
        zIndex: 50, display: "flex", flexDirection: "column",
        animation: "slIn 0.3s cubic-bezier(.4,0,.2,1)",
        fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
        overflow: "hidden",
      }}>

        <div style={{ flexShrink: 0, borderBottom: "1px solid #f1f5f9", padding: mobile ? "14px 16px" : "18px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h2 style={{ fontSize: mobile ? 15 : 17, fontWeight: 900, color: "#0f172a", margin: 0 }}>Activity Log</h2>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid #e2e8f0", background: "#f8fafc",
              cursor: "pointer", color: "#64748b", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>{task.title}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Check-in streak", value: `🔥 ${streak}d`, sub: streak > 0 ? "Keep going!" : "Start today" },
              { label: "Total updates", value: totalDays, sub: "across all days" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px", border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>{s.label}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "0 0 1px" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? "14px 16px" : "16px 24px", WebkitOverflowScrolling: "touch" }}>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 32, margin: "0 0 10px" }}>📋</p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>No check-ins yet. Submit your first daily update!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {entries.map((entry, i) => {
                const sCfg = STATUS_CFG[entry.status] || STATUS_CFG["To Do"];
                const mCfg = MOODS.find(m => m.value === entry.mood) || MOODS[1];
                const isToday = entry.date === todayISO();
                return (
                  <div key={entry.date} style={{
                    border: `1px solid ${isToday ? "#ddd6fe" : "#f1f5f9"}`,
                    borderRadius: 12,
                    background: isToday ? "#f5f3ff" : "#fff",
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${isToday ? "#ede9fe" : "#f8fafc"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                            {new Date(entry.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 6px", borderRadius: 4 }}>TODAY</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13 }}>{mCfg.emoji}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: sCfg.text,
                            background: sCfg.bg, border: `1px solid ${sCfg.border}`,
                            padding: "2px 8px", borderRadius: 10,
                          }}>{sCfg.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: sCfg.color }}>{entry.percent}%</span>
                        </div>
                      </div>
                      <div style={{ height: 3, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${entry.percent}%`, background: sCfg.color, borderRadius: 99 }} />
                      </div>
                    </div>

                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
                      {entry.achieved && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>✅ Accomplished</p>
                          <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.55 }}>{entry.achieved}</p>
                        </div>
                      )}
                      {entry.planned && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>📅 Planned next</p>
                          <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.55 }}>{entry.planned}</p>
                        </div>
                      )}
                      {entry.blockers && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>🚧 Blockers</p>
                          <p style={{ fontSize: 12, color: "#334155", margin: 0, lineHeight: 1.55 }}>{entry.blockers}</p>
                        </div>
                      )}
                      {!entry.achieved && !entry.planned && !entry.blockers && (
                        <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>Status updated — no notes added.</p>
                      )}
                      {entry.submittedAt && (
                        <p style={{ fontSize: 10, color: "#cbd5e1", margin: "2px 0 0", textAlign: "right" }}>
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
        @keyframes fdIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
}


function TaskCard({ task, index, todayLog, logs, onCheckIn, onHistory, onQuickStatus, updating }) {
  const sCfg = STATUS_CFG[task.status] || STATUS_CFG["To Do"];
  const pCfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG["Medium"];
  const due = dueMeta(task.dueDate);
  const pct = task.progressPercent ?? sCfg.progress;
  const streak = useMemo(() => calcStreak(logs), [logs]);
  const checkedIn = !!todayLog?.submittedAt;

  return (
    <div
      style={{
        background: "#fff", borderRadius: 16,
        border: `1px solid ${checkedIn ? "#ddd6fe" : "#f1f5f9"}`,
        overflow: "hidden", cursor: "default",
        transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
        boxShadow: checkedIn ? "0 2px 12px rgba(124,58,237,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
        animation: "cardIn 0.35s ease both",
        animationDelay: `${index * 0.07}s`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = checkedIn ? "0 2px 12px rgba(124,58,237,0.08)" : "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: sCfg.color }} />

      <div style={{ padding: "14px 15px 15px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {task.project && (
              <div style={{ marginBottom: 5 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#4f46e5",
                  background: "#eef2ff", padding: "2px 8px", borderRadius: 4,
                }}>{task.project}</span>
              </div>
            )}
            <p style={{
              fontSize: 14, fontWeight: 800, lineHeight: 1.35, margin: 0,
              color: task.status === "Done" ? "#94a3b8" : "#0f172a",
              textDecoration: task.status === "Done" ? "line-through" : "none",
            }}>{task.title}</p>
            {task.description && (
              <p style={{
                fontSize: 12, fontWeight: 400, color: "#64748b",
                margin: "5px 0 0", lineHeight: 1.55,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{task.description}</p>
            )}
          </div>

          {/* Streak badge */}
          {streak > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
              background: "#fff7ed", border: "1px solid #fed7aa",
              borderRadius: 8, padding: "3px 7px",
            }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#c2410c" }}>{streak}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 12 }}>
          <ProgressBar percent={pct} color={sCfg.color} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: "#f1f5f9", border: "1.5px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800, color: "#475569",
            }}>
              {(task.assignedToName || "?")[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {task.assignedToName || "You"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, color: pCfg.color, fontWeight: 700 }}>
              {pCfg.icon} {task.priority}
            </span>
            {due && (
              <>
                <span style={{ fontSize: 9, color: "#cbd5e1" }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: due.color, whiteSpace: "nowrap" }}>
                  {due.label}{due.urgent ? " ⚠" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {checkedIn ? (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 8, padding: "7px 10px", marginBottom: 10,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 12 }}>
              {MOODS.find(m => m.value === todayLog.mood)?.emoji || "✓"}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", margin: 0 }}>
                Checked in — {todayLog.mood || "good"}
              </p>
              {todayLog.achieved && (
                <p style={{ fontSize: 11, color: "#166534", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {todayLog.achieved}
                </p>
              )}
            </div>
            <span style={{ fontSize: 10, color: "#86efac", flexShrink: 0 }}>{timeAgo(todayLog.submittedAt)}</span>
          </div>
        ) : (
          <div style={{
            background: "#fffbeb", border: "1px solid #fed7aa",
            borderRadius: 8, padding: "7px 10px", marginBottom: 10,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", margin: 0 }}>
              📌 No check-in today yet
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onCheckIn(task)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 10,
              background: checkedIn ? "#f5f3ff" : "#0f172a",
              color: checkedIn ? "#7c3aed" : "#fff",
              border: checkedIn ? "1.5px solid #ddd6fe" : "none",
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {checkedIn ? "✏ Update" : "✓ Check In"}
          </button>

          <button
            onClick={() => onHistory(task)}
            style={{
              padding: "8px 12px", borderRadius: 10,
              background: "#f8fafc", border: "1px solid #e2e8f0",
              color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            📊
          </button>

          <div
            onClick={() => onQuickStatus(task.id, task.status)}
            style={{
              padding: "8px 10px", borderRadius: 10, cursor: updating ? "wait" : "pointer",
              background: sCfg.bg, border: `1px solid ${sCfg.border}`,
              fontSize: 11, fontWeight: 700, color: sCfg.text,
              opacity: updating ? 0.6 : 1, transition: "all 0.15s",
              display: "flex", alignItems: "center",
            }}
          >
            {updating ? "…" : sCfg.label}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function MyTasks() {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [tasks, setTasks] = useState([]);
  const [dailyLogs, setDailyLogs] = useState({});  // { taskId: { "YYYY-MM-DD": {...} } }
  const [loading, setLoading] = useState(true);
  const [checkInTask, setCheckInTask] = useState(null);  // task for check-in drawer
  const [historyTask, setHistoryTask] = useState(null);  // task for history drawer
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("All");

  const width = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  // Auth
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
            const so = (STATUS_CFG[a.status]?.order ?? 0) - (STATUS_CFG[b.status]?.order ?? 0);
            if (so !== 0) return so;
            return PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority);
          });
        setTasks(mine);
        setLoading(false);
      },
      err => { console.error("Firebase read error:", err); setLoading(false); }
    );
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onValue(
      ref(db, "dailyLogs"),
      snap => {
        const data = snap.val() || {};
        const myLogs = {};
        Object.entries(data).forEach(([taskId, days]) => {
          myLogs[taskId] = days;
        });
        setDailyLogs(myLogs);
      }
    );
    return () => unsub();
  }, [currentUser]);

  const handleQuickStatus = useCallback(async (taskId, currentStatus) => {
    const NEXT = {
      "To Do": "In Progress", "In Progress": "In Review",
      "In Review": "Done", "Done": "To Do",
    };
    const next = NEXT[currentStatus] || "To Do";
    setUpdatingId(taskId);
    try {
      await update(ref(db, `assignedTasks/${taskId}`), {
        status: next,
        progressPercent: STATUS_CFG[next]?.progress ?? 0,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) { console.error("Quick status error:", err); }
    setUpdatingId(null);
  }, []);

  const handleCheckIn = useCallback(async ({ taskId, status, percent, mood, achieved, planned, blockers }) => {
    const today = todayISO();
    const now = new Date().toISOString();

    await set(ref(db, `dailyLogs/${taskId}/${today}`), {
      status, percent, mood, achieved, planned, blockers,
      submittedAt: now,
      employeeId: currentUser?.uid || "",
    });

    await update(ref(db, `assignedTasks/${taskId}`), {
      status,
      progressPercent: percent,
      updatedAt: now,
      lastCheckIn: now,
    });
  }, [currentUser]);


  const TABS = useMemo(() => [
    { key: "All", label: "All", count: tasks.length },
    { key: "To Do", label: "Pending", count: tasks.filter(t => t.status === "To Do").length },
    { key: "In Progress", label: "In Progress", count: tasks.filter(t => t.status === "In Progress").length },
    { key: "In Review", label: "In Review", count: tasks.filter(t => t.status === "In Review").length },
    { key: "Done", label: "Done", count: tasks.filter(t => t.status === "Done").length },
  ], [tasks]);

  const filtered = useMemo(
    () => filter === "All" ? tasks : tasks.filter(t => t.status === filter),
    [tasks, filter]
  );

  const total = tasks.length;
  const done = tasks.filter(t => t.status === "Done").length;
  const avgPct = total > 0
    ? Math.round(tasks.reduce((s, t) => s + (t.progressPercent ?? STATUS_CFG[t.status]?.progress ?? 0), 0) / total)
    : 0;

  const checkedInToday = tasks.filter(t => dailyLogs[t.id]?.[todayISO()]?.submittedAt).length;

  const gridCols = isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(300px, 1fr))";


  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", flexDirection: "column", gap: 14,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid #f1f5f9", borderTopColor: "#4f46e5",
        animation: "spin 0.7s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Loading your tasks…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );


  return (
    <div style={{
      maxWidth: 980, margin: "0 auto",
      padding: isMobile ? "64px 14px 32px" : isTablet ? "28px 18px" : "28px 20px",
      fontFamily: "'DM Sans', 'Outfit', system-ui, -apple-system, sans-serif",
    }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 5px" }}>
            My Assigned Tasks
          </p>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.2 }}>
            {isMobile ? "My Tasks" : "Tasks assigned to you"}
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            {total === 0
              ? "No tasks yet"
              : `${total} task${total !== 1 ? "s" : ""} · ${done} done · ${checkedInToday}/${total} checked in today`}
          </p>
        </div>

        {total > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#fff", border: "1px solid #f1f5f9",
            borderRadius: 14, padding: isMobile ? "8px 12px" : "10px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexShrink: 0,
          }}>
            <div>
              <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, margin: "0 0 2px", textAlign: "right" }}>Overall</p>
              <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "#4f46e5", margin: 0 }}>{avgPct}%</p>
            </div>
            <svg viewBox="0 0 40 40" style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, transform: "rotate(-90deg)", flexShrink: 0 }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="#f1f5f9" strokeWidth="4" />
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

      {total > 0 && (
        <div style={{
          background: checkedInToday === total ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${checkedInToday === total ? "#bbf7d0" : "#fed7aa"}`,
          borderRadius: 12, padding: "10px 14px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>{checkedInToday === total ? "🎉" : "📌"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: checkedInToday === total ? "#15803d" : "#92400e", margin: "0 0 2px" }}>
              {checkedInToday === total
                ? "All tasks checked in today!"
                : `${checkedInToday} of ${total} daily check-ins done`}
            </p>
            <p style={{ fontSize: 11, color: checkedInToday === total ? "#166534" : "#a16207", margin: 0 }}>
              {checkedInToday === total
                ? "Great work — your admin can see today's progress."
                : "Check in on your remaining tasks to keep your admin updated."}
            </p>
          </div>
          <div style={{ height: 32, width: 32, borderRadius: "50%", flexShrink: 0, position: "relative" }}>
            <svg viewBox="0 0 36 36" style={{ width: 32, height: 32, transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke={checkedInToday === total ? "#bbf7d0" : "#fed7aa"} strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={checkedInToday === total ? "#16a34a" : "#f59e0b"} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - (total > 0 ? checkedInToday / total : 0))}`}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
          </div>
        </div>
      )}

      {total > 0 && (
        <div style={{
          overflowX: "auto", WebkitOverflowScrolling: "touch",
          marginBottom: 18, scrollbarWidth: "none",
        }}>
          <div style={{
            display: "flex", gap: 4,
            background: "#f8fafc", borderRadius: 12, padding: 4,
            border: "1px solid #f1f5f9",
            width: isMobile ? "max-content" : "fit-content",
            minWidth: isMobile ? "100%" : "auto",
          }}>
            {TABS.map(tab => {
              const active = filter === tab.key;
              return (
                <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                  padding: isMobile ? "6px 11px" : "7px 15px",
                  borderRadius: 9, fontSize: isMobile ? 11 : 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                  background: active ? "#fff" : "transparent",
                  color: active ? "#0f172a" : "#64748b",
                  border: active ? "1px solid #e2e8f0" : "1px solid transparent",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                  display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                }}>
                  {tab.label}
                  <span style={{
                    fontSize: 10, fontWeight: 800, minWidth: 16, height: 16,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 9, padding: "0 3px",
                    background: active ? "#0f172a" : "#e2e8f0",
                    color: active ? "#fff" : "#64748b",
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
          background: "#fff", borderRadius: 20, border: "1.5px dashed #e2e8f0",
        }}>
          <p style={{ fontSize: 40, margin: "0 0 14px" }}>📋</p>
          <p style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>No tasks assigned yet</p>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Your admin will assign tasks to you soon.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "52px 20px" }}>
          <p style={{ fontSize: 30, margin: "0 0 10px" }}>🔍</p>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No tasks in this category.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isMobile ? 10 : 14 }}>
          {filtered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              index={i}
              todayLog={dailyLogs[task.id]?.[todayISO()]}
              logs={dailyLogs[task.id]}
              onCheckIn={setCheckInTask}
              onHistory={setHistoryTask}
              onQuickStatus={handleQuickStatus}
              updating={updatingId === task.id}
            />
          ))}
        </div>
      )}

      {checkInTask && (
        <CheckInDrawer
          task={tasks.find(t => t.id === checkInTask.id) || checkInTask}
          todayLog={dailyLogs[checkInTask.id]?.[todayISO()]}
          onClose={() => setCheckInTask(null)}
          onSubmit={handleCheckIn}
        />
      )}

      {historyTask && (
        <HistoryDrawer
          task={tasks.find(t => t.id === historyTask.id) || historyTask}
          logs={dailyLogs[historyTask.id]}
          onClose={() => setHistoryTask(null)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}