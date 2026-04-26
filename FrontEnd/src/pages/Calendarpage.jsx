import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { ref, onValue, push, remove } from "firebase/database";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function CalendarPage() {
  const user = auth.currentUser;
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState("Month");
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `calendarEvents/${user.uid}`), (snap) => {
      const data = snap.val() || {};
      setEvents(Object.entries(data).map(([id, v]) => ({ id, ...v })));
    });
  }, [user?.uid]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const toDateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getEventsForDay = (day) => {
    const ds = toDateStr(day);
    return events.filter((e) => e.date === ds);
  };

  const isToday = (day) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  const handleDayClick = (day) => {
    setSelectedDate(toDateStr(day));
    setEventTitle("");
    setShowModal(true);
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) return;
    await push(ref(db, `calendarEvents/${user.uid}`), {
      title: eventTitle.trim(),
      date: selectedDate,
      color: "#3b82f6",
    });
    setEventTitle("");
    setShowModal(false);
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    await remove(ref(db, `calendarEvents/${user.uid}/${id}`));
  };

  // Week view helpers
  const getWeekDates = () => {
    const today = new Date(year, month, now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
            {["Week", "Month"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium transition
                  ${view === v ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <FaChevronLeft className="text-xs" />
          </button>
          <span className="text-sm font-semibold text-slate-700 w-32 text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-500">
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      {/* Month view */}
      {view === "Month" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map((d) => (
              <div key={d} className="text-xs font-semibold text-slate-400 text-center py-3">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, i) => {
              const day = i - firstDay + 1;
              const valid = day >= 1 && day <= daysInMonth;
              const dayEvents = valid ? getEventsForDay(day) : [];

              return (
                <div
                  key={i}
                  onClick={() => valid && handleDayClick(day)}
                  className={`min-h-[90px] border-t border-r border-slate-100 p-2 last:border-r-0 transition
                    ${valid ? "cursor-pointer" : "bg-slate-50/40"}
                    ${valid && !isToday(day) ? "hover:bg-blue-50/30" : ""}
                    ${valid && isToday(day) ? "bg-blue-50" : ""}
                  `}
                >
                  {valid && (
                    <>
                      <span className={`text-sm font-medium inline-flex items-center justify-center w-7 h-7 rounded-full
                        ${isToday(day) ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-between text-[11px] bg-blue-600 text-white px-1.5 py-0.5 rounded group cursor-default"
                          >
                            <span className="truncate leading-tight">{ev.title}</span>
                            <button
                              onClick={(e) => handleDeleteEvent(ev.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition shrink-0 ml-1"
                            >
                              <FaTimes className="text-[8px]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week view */}
      {view === "Week" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100">
            {weekDates.map((d) => {
              const isTod = d.toDateString() === now.toDateString();
              return (
                <div key={d.toDateString()} className={`text-center py-3 ${isTod ? "bg-blue-50" : ""}`}>
                  <p className="text-[11px] font-semibold text-slate-400">{DAYS[d.getDay()]}</p>
                  <p className={`text-lg font-bold mt-0.5 ${isTod ? "text-blue-600" : "text-slate-700"}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDates.map((d) => {
              const ds = d.toISOString().split("T")[0];
              const dayEvs = events.filter((e) => e.date === ds);
              const isTod = d.toDateString() === now.toDateString();
              return (
                <div
                  key={ds}
                  onClick={() => { setSelectedDate(ds); setEventTitle(""); setShowModal(true); }}
                  className={`border-r border-slate-100 last:border-r-0 p-2 cursor-pointer
                    ${isTod ? "bg-blue-50/30" : "hover:bg-slate-50"} transition`}
                >
                  <div className="space-y-1 mt-1">
                    {dayEvs.map((ev) => (
                      <div key={ev.id}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between text-[11px] bg-blue-600 text-white px-1.5 py-0.5 rounded group"
                      >
                        <span className="truncate">{ev.title}</span>
                        <button onClick={(e) => handleDeleteEvent(ev.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition ml-1">
                          <FaTimes className="text-[8px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add event modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">Add Event</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">📅 {selectedDate}</p>
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
              placeholder="Event title..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-4
                focus:outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!eventTitle.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition active:scale-95"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}