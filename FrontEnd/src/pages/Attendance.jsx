import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, set, update } from "firebase/database";

const SHIFTS = [
  { id: "morning", name: "Morning Shift", start: "09:00", end: "14:00" },
  { id: "evening", name: "Evening Shift", start: "14:00", end: "20:00" },
  { id: "night",   name: "Night Shift",   start: "21:00", end: "04:00" },
];

function to12hr(time24) {
  if (!time24 || time24 === "--:--") return "--:--";
  const [h, m] = time24.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function shiftDisplay(shift) {
  return `${to12hr(shift.start)} – ${to12hr(shift.end)}`;
}

function isLateForShift(shift, now) {
  const [sh, sm] = shift.start.split(":").map(Number);
  return now.getHours() > sh || (now.getHours() === sh && now.getMinutes() > sm + 15);
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function nowTime12() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function nowTime24() {
  return new Date().toTimeString().slice(0, 5);
}

export default function Attendance() {
  const user     = auth.currentUser;
  const todayKey = new Date().toISOString().split("T")[0];

  const [todayRecord,    setTodayRecord]    = useState(null);
  const [logs,           setLogs]           = useState([]);
  const [selectedShift,  setSelectedShift]  = useState(null);
  const [locationLabel,  setLocationLabel]  = useState("Location not enabled");
  const [locationStatus, setLocationStatus] = useState("idle");
  const [inZone,         setInZone]         = useState(false);
  const [overrideMode,   setOverrideMode]   = useState(false);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  useEffect(() => {
    if (!user) return;
    const u1 = onValue(ref(db, `attendance/${user.uid}/${todayKey}`), (snap) => setTodayRecord(snap.val()));
    const u2 = onValue(ref(db, `attendance/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setLogs(
        Object.entries(data)
          .map(([date, v]) => ({ date, ...v }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
      );
    });
    return () => { u1(); u2(); };
  }, [user?.uid, todayKey]);

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `shifts/${user.uid}/current`), (snap) => {
      const val = snap.val();
      setSelectedShift(val ? (SHIFTS.find((s) => s.id === val) || SHIFTS[1]) : null);
    });
  }, [user?.uid]);

  const handleSelectShift = async (shift) => {
    setSelectedShift(shift);
    await set(ref(db, `shifts/${user.uid}/current`), shift.id);
  };

  const handleEnableLocation = () => {
    setLocationStatus("checking");
    setLocationLabel("Requesting location...");
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      setLocationLabel("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => { setLocationStatus("granted"); setInZone(true); setLocationLabel("Location verified ✓"); },
      (err) => {
        setLocationStatus("denied");
        setInZone(false);
        setLocationLabel(
          err.code === 1 ? "Location blocked — reset in site settings or use override"
          : err.code === 2 ? "Location unavailable — check GPS or use override"
          : "Location timed out — try again or use override"
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOverride = () => {
    setOverrideMode(true);
    setInZone(true);
    setLocationStatus("overridden");
    setLocationLabel("Manual override — marked as on-site");
  };

  const handlePunch = async () => {
    const now     = new Date();
    const time24  = nowTime24();
    const time12  = nowTime12();

    if (!todayRecord?.punchIn) {
      const late = selectedShift ? isLateForShift(selectedShift, now) : false;
      await set(ref(db, `attendance/${user.uid}/${todayKey}`), {
        date: todayKey,
        shift: selectedShift?.id || "general",
        shiftName: selectedShift?.name || "General Shift",
        punchIn: time24, punchIn12: time12,
        punchOut: "", punchOut12: "",
        status: late ? "Late" : "Present",
        hours: "",
        locationOverride: overrideMode,
      });
    } else if (!todayRecord.punchOut) {
      const [inH, inM] = todayRecord.punchIn.split(":").map(Number);
      const [outH, outM] = time24.split(":").map(Number);
      let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMins < 0) totalMins += 24 * 60;
      await update(ref(db, `attendance/${user.uid}/${todayKey}`), {
        punchOut: time24, punchOut12: time12,
        hours: `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`,
      });
    }
  };

  const punchedIn  = !!todayRecord?.punchIn;
  const punchedOut = !!todayRecord?.punchOut;
  const canPunch   = inZone && selectedShift && !punchedOut;

  const punchLabel = punchedOut ? "Punched Out ✓" : punchedIn ? "Punch Out" : "Punch In";

  const statusBadge = (s) => {
    if (s === "Present") return "bg-green-100 text-green-700";
    if (s === "Late")    return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const locationBtnStyle = () => {
    if (locationStatus === "granted")    return "bg-green-50 border-green-200 text-green-700";
    if (locationStatus === "overridden") return "bg-blue-50 border-blue-200 text-blue-700";
    if (locationStatus === "denied")     return "bg-red-50 border-red-200 text-red-600";
    if (locationStatus === "checking")   return "bg-yellow-50 border-yellow-200 text-yellow-700";
    return "bg-slate-50 border-slate-200 text-slate-500";
  };

  return (
 
    <div className="pt-[68px] px-3 pb-6 sm:px-5 sm:pt-[68px] lg:pt-6 lg:px-6 max-w-[1100px] mx-auto">

      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-0.5">Attendance Tracker</h1>
      <p className="text-slate-400 text-xs sm:text-sm mb-5 sm:mb-6">{todayDisplay}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">

        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 sm:mb-5 text-sm sm:text-base">
            Today's Attendance
          </h3>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="bg-slate-50 rounded-xl p-3 sm:p-0 sm:bg-transparent sm:rounded-none">
              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Punch In</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700 font-mono leading-none">
                {todayRecord?.punchIn12 || "--:--"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 sm:p-0 sm:bg-transparent sm:rounded-none">
              <p className="text-[10px] sm:text-xs text-slate-400 mb-1">Punch Out</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700 font-mono leading-none">
                {todayRecord?.punchOut12 || "--:--"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 mb-3">
            <span className="text-slate-400 text-[10px] sm:text-xs shrink-0">Shift:</span>
            {selectedShift ? (
              <span className="text-blue-600 font-semibold text-[10px] sm:text-xs truncate">
                {selectedShift.name} · {shiftDisplay(selectedShift)}
              </span>
            ) : (
              <span className="text-orange-500 font-semibold text-[10px] sm:text-xs">⚠ No shift selected</span>
            )}
          </div>

          <div className={`px-3 py-2.5 rounded-xl mb-4 border ${locationBtnStyle()}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-xs flex items-center gap-1.5 min-w-0 leading-snug">
                📍 {locationLabel}
              </span>
              {locationStatus !== "granted" && locationStatus !== "overridden" && (
                <button
                  onClick={handleEnableLocation}
                  disabled={locationStatus === "checking"}
                  className="text-[10px] sm:text-xs font-semibold text-blue-600 hover:underline shrink-0 disabled:opacity-50"
                >
                  {locationStatus === "checking" ? "Checking…" : "Enable"}
                </button>
              )}
            </div>
            {locationStatus === "denied" && (
              <div className="mt-2.5 pt-2.5 border-t border-red-100 space-y-2">
                <p className="text-[10px] sm:text-[11px] text-red-500 leading-relaxed">
                  Fix: tap 🔒 in your browser address bar → Site settings → Location → Allow
                </p>
                <button
                  onClick={handleOverride}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition active:scale-95"
                >
                  Mark as On-Site (Override)
                </button>
              </div>
            )}
          </div>

          {!selectedShift && (
            <p className="text-[10px] sm:text-xs text-orange-500 mb-3 text-center">
              Select a shift below before punching in
            </p>
          )}

          <button
            onClick={handlePunch}
            disabled={!canPunch}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition active:scale-95
              ${punchedOut || !canPunch
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : punchedIn
                  ? "bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200"
                  : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
              }`}
          >
            {punchLabel}
          </button>

          {punchedOut && todayRecord?.hours && (
            <p className="text-center text-xs sm:text-sm text-slate-500 mt-3">
              Total: <span className="font-semibold text-slate-700">{todayRecord.hours}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Select Your Shift</h3>
            {selectedShift && (
              <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-700 font-semibold px-2 sm:px-2.5 py-1 rounded-full">
                Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-1 gap-2 sm:gap-3">
            {SHIFTS.map((shift) => {
              const isActive = selectedShift?.id === shift.id;
              return (
                <button
                  key={shift.id}
                  onClick={() => handleSelectShift(shift)}
                  disabled={punchedIn}
                  className={`w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5
                    rounded-xl border transition text-left
                    ${isActive
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/40"
                    }
                    ${punchedIn ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate
                      ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                      {shift.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-mono">
                      {shiftDisplay(shift)}
                    </p>
                  </div>
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center
                    justify-center shrink-0 ml-2 transition
                    ${isActive ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                    {isActive && (
                      <svg className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {punchedIn && !punchedOut && (
            <p className="text-[10px] sm:text-xs text-slate-400 text-center mt-3">
              Shift locked after punch in
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-50">
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Attendance Log</h3>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {["Date", "Shift", "Status", "In", "Out", "Hours"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No attendance records yet
                  </td>
                </tr>
              ) : (
                logs.map((rec) => (
                  <tr key={rec.date} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatDateLabel(rec.date)}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{rec.shiftName || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-green-600 font-medium font-mono whitespace-nowrap">
                      {rec.punchIn12 || to12hr(rec.punchIn)}
                    </td>
                    <td className="px-5 py-3.5 text-red-500 font-medium font-mono whitespace-nowrap">
                      {rec.punchOut12 || to12hr(rec.punchOut) || "--:--"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{rec.hours || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-slate-50">
          {logs.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-400 text-sm">No attendance records yet</p>
          ) : (
            logs.map((rec) => (
              <div key={rec.date} className="px-4 py-3.5">
                {/* Row 1: date + status badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">{formatDateLabel(rec.date)}</span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${statusBadge(rec.status)}`}>
                    {rec.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{rec.shiftName || "—"}</p>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">In</span>
                    <span className="font-mono font-semibold text-green-600">
                      {rec.punchIn12 || to12hr(rec.punchIn) || "--:--"}
                    </span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Out</span>
                    <span className="font-mono font-semibold text-red-500">
                      {rec.punchOut12 || to12hr(rec.punchOut) || "--:--"}
                    </span>
                  </div>
                  {rec.hours && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 font-medium">{rec.hours}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}