import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, set, update } from "firebase/database";

const SHIFTS = [
  { id: "morning",  name: "Morning Shift",  start: "07:00", end: "15:00" },
  { id: "general",  name: "General Shift",  start: "09:00", end: "21:00" },
  { id: "evening",  name: "Evening Shift",  start: "14:00", end: "02:00" },
  { id: "night",    name: "Night Shift",    start: "22:00", end: "10:00" },
];

function to12hr(time24) {
  if (!time24 || time24 === "--:--") return "--:--";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function shiftDisplay(shift) {
  return `${to12hr(shift.start)} – ${to12hr(shift.end)}`;
}

function isLateForShift(shift, now) {
  const [sh, sm] = shift.start.split(":").map(Number);
  const graceH = sh;
  const graceM = sm + 15;
  return now.getHours() > graceH || (now.getHours() === graceH && now.getMinutes() > graceM);
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
  const user = auth.currentUser;
  const todayKey = new Date().toISOString().split("T")[0];

  const [todayRecord, setTodayRecord]   = useState(null);
  const [logs, setLogs]                 = useState([]);
  const [selectedShift, setSelectedShift] = useState(null); // from Firebase
  const [locationLabel, setLocationLabel] = useState("Location not enabled");
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | checking | granted | denied | overridden
  const [inZone, setInZone]             = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);

  const todayDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Load today's record + logs
  useEffect(() => {
    if (!user) return;
    const unsub1 = onValue(ref(db, `attendance/${user.uid}/${todayKey}`), (snap) => {
      setTodayRecord(snap.val());
    });
    const unsub2 = onValue(ref(db, `attendance/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      const sorted = Object.entries(data)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
      setLogs(sorted);
    });
    return () => { unsub1(); unsub2(); };
  }, [user?.uid, todayKey]);

  // Load selected shift from Firebase
  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `shifts/${user.uid}/current`), (snap) => {
      const val = snap.val();
      if (val) {
        const found = SHIFTS.find((s) => s.id === val);
        setSelectedShift(found || SHIFTS[1]);
      } else {
        setSelectedShift(null);
      }
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
      setLocationLabel("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus("granted");
        setInZone(true);
        setLocationLabel("Location verified ✓");
      },
      (err) => {
        setLocationStatus("denied");
        setInZone(false);
        if (err.code === 1) {
          setLocationLabel("Location blocked by browser — reset in site settings or use override");
        } else if (err.code === 2) {
          setLocationLabel("Location unavailable — check your GPS or use override");
        } else {
          setLocationLabel("Location timed out — try again or use override");
        }
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
    const now = new Date();
    const time24 = nowTime24();
    const time12 = nowTime12();

    if (!todayRecord?.punchIn) {
      const late = selectedShift ? isLateForShift(selectedShift, now) : false;
      await set(ref(db, `attendance/${user.uid}/${todayKey}`), {
        date: todayKey,
        shift: selectedShift?.id || "general",
        shiftName: selectedShift?.name || "General Shift",
        punchIn: time24,
        punchIn12: time12,
        punchOut: "",
        punchOut12: "",
        status: late ? "Late" : "Present",
        hours: "",
        locationOverride: overrideMode,
      });
    } else if (!todayRecord.punchOut) {
      const [inH, inM] = todayRecord.punchIn.split(":").map(Number);
      const [outH, outM] = time24.split(":").map(Number);
      let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
      if (totalMins < 0) totalMins += 24 * 60; // crosses midnight
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      await update(ref(db, `attendance/${user.uid}/${todayKey}`), {
        punchOut: time24,
        punchOut12: time12,
        hours: `${h}h ${m}m`,
      });
    }
  };

  const punchedIn  = !!todayRecord?.punchIn;
  const punchedOut = !!todayRecord?.punchOut;
  const canPunch   = inZone && selectedShift && !punchedOut;

  const punchLabel = punchedOut
    ? "Punched Out ✓"
    : punchedIn
      ? "Punch Out"
      : "Punch In";

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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Attendance Tracker</h1>
      <p className="text-slate-400 text-sm mb-6">{todayDisplay}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

        {/* Today's Punch Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-5">Today's Attendance</h3>

          {/* Punch times */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs text-slate-400 mb-1">Punch In</p>
              <p className="text-2xl font-bold text-slate-700 font-mono">
                {todayRecord?.punchIn12 || "--:--"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Punch Out</p>
              <p className="text-2xl font-bold text-slate-700 font-mono">
                {todayRecord?.punchOut12 || "--:--"}
              </p>
            </div>
          </div>

          {/* Shift indicator */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 mb-3 text-sm">
            <span className="text-slate-400 text-xs">Selected shift:</span>
            {selectedShift ? (
              <span className="text-blue-600 font-semibold text-xs">
                {selectedShift.name} · {shiftDisplay(selectedShift)}
              </span>
            ) : (
              <span className="text-orange-500 font-semibold text-xs">⚠ No shift selected</span>
            )}
          </div>

          {/* Location */}
          <div className={`px-3 py-2.5 rounded-xl mb-4 border text-sm ${locationBtnStyle()}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs flex items-center gap-1.5">
                📍 {locationLabel}
              </span>
              {locationStatus !== "granted" && locationStatus !== "overridden" && (
                <button
                  onClick={handleEnableLocation}
                  disabled={locationStatus === "checking"}
                  className="text-xs font-semibold text-blue-600 hover:underline shrink-0 ml-2 disabled:opacity-50"
                >
                  {locationStatus === "checking" ? "Checking..." : "Enable"}
                </button>
              )}
            </div>
            {/* Denied — show how to fix + override */}
            {locationStatus === "denied" && (
              <div className="mt-2.5 pt-2.5 border-t border-red-100 space-y-2">
                <p className="text-[11px] text-red-500 leading-relaxed">
                  To fix: click the 🔒 / ⓘ icon in your browser address bar → Site settings → Location → Allow
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

          {/* Warnings */}
          {!selectedShift && (
            <p className="text-xs text-orange-500 mb-3 text-center">Select a shift below before punching in</p>
          )}

          <button
            onClick={handlePunch}
            disabled={!canPunch}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition active:scale-95
              ${punchedOut
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : !canPunch
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : punchedIn
                    ? "bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200"
                    : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
              }`}
          >
            {punchLabel}
          </button>

          {punchedOut && todayRecord?.hours && (
            <p className="text-center text-sm text-slate-500 mt-3">
              Total hours: <span className="font-semibold text-slate-700">{todayRecord.hours}</span>
            </p>
          )}
        </div>

        {/* Shift Selection */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Select Your Shift</h3>
            {selectedShift && (
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="space-y-3">
            {SHIFTS.map((shift) => {
              const isActive = selectedShift?.id === shift.id;
              return (
                <button
                  key={shift.id}
                  onClick={() => handleSelectShift(shift)}
                  disabled={punchedIn} // can't change shift after punch in
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition text-left
                    ${isActive
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-blue-50/40"
                    }
                    ${punchedIn ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                      {shift.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {shiftDisplay(shift)}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
                    ${isActive ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                    {isActive && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {punchedIn && !punchedOut && (
            <p className="text-xs text-slate-400 text-center mt-3">
              Shift locked after punch in
            </p>
          )}
        </div>
      </div>

      {/* Attendance Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="font-semibold text-slate-800">Attendance Log</h3>
        </div>
        <div className="overflow-x-auto">
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
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {rec.shiftName || "—"}
                    </td>
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
      </div>
    </div>
  );
}