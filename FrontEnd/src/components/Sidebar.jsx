// // import { useState, useEffect } from "react";
// // import { NavLink, useNavigate } from "react-router-dom";
// // import { auth, db } from "../firebase";
// // import { signOut } from "firebase/auth";
// // import { ref, onValue } from "firebase/database";
// // import {
// //   FaThLarge, FaTasks, FaComments, FaMapMarkerAlt,
// //   FaCalendarAlt, FaList, FaSyncAlt, FaUser, FaUmbrellaBeach,
// //   FaUserShield,
// // } from "react-icons/fa";

// // export default function Sidebar() {
// //   const navigate = useNavigate();
// //   const user = auth.currentUser;
// //   const parts = (user?.displayName || "User|employee").split("|");
// //   const name = parts[0] || "User";
// //   const role = parts[1] || "employee";
// //   const isAdmin = role === "admin";
// //   const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

// //   const [pendingCount, setPendingCount] = useState(0);
// //   const [profile, setProfile] = useState({ designation: "Employee", department: "General" });

// //   useEffect(() => {
// //     if (!user) return;
// //     const unsub1 = onValue(ref(db, `tasks/${user.uid}`), (snap) => {
// //       const data = snap.val() || {};
// //       const count = Object.values(data).filter((t) => t.status !== "Done").length;
// //       setPendingCount(count);
// //     });
// //     const unsub2 = onValue(ref(db, `users/${user.uid}`), (snap) => {
// //       if (snap.val()) setProfile(snap.val());
// //     });
// //     return () => { unsub1(); unsub2(); };
// //   }, [user?.uid]);

// //   const handleSwitchRole = async () => {
// //     await signOut(auth);
// //     navigate("/login");
// //   };

// //   const basePrefix = isAdmin ? "/admin" : "/employee";

// //   const navItems = isAdmin
// //     ? [
// //         { to: "/admin", icon: FaThLarge, label: "Dashboard", end: true },
// //       ]
// //     : [
// //         { to: "/employee",            icon: FaThLarge,       label: "My Dashboard", end: true },
// //         { to: "/employee/tasks",      icon: FaTasks,         label: "My Tasks",     badge: pendingCount || null },
// //         { to: "/employee/messages",   icon: FaComments,      label: "Messages" },
// //         { to: "/employee/attendance", icon: FaMapMarkerAlt,  label: "Attendance" },
// //         { to: "/employee/leave",      icon: FaUmbrellaBeach, label: "My Leave" },
// //         { to: "/employee/calendar",   icon: FaCalendarAlt,   label: "Calendar" },
// //         { to: "/employee/lists",      icon: FaList,          label: "Item Lists" },
// //       ];

// //   return (
// //     <aside className="w-[215px] min-h-screen bg-[#0d1117] flex flex-col shrink-0 z-10">
// //       {/* Logo */}
// //       <div className="px-4 pt-5 pb-3">
// //         <div className="flex items-center gap-2.5">
// //           <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-sm font-bold select-none">
// //             G
// //           </div>
// //           <div>
// //             <div className="text-white text-sm font-semibold leading-tight">Genie Media</div>
// //             <div className="text-slate-500 text-[11px]">Workspace</div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Role badge */}
// //       <div className="px-4 pb-4">
// //         {isAdmin ? (
// //           <div className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
// //             <FaUserShield className="text-[9px]" /> ADMIN
// //           </div>
// //         ) : (
// //           <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
// //             <FaUser className="text-[9px]" /> EMPLOYEE
// //           </div>
// //         )}
// //       </div>

// //       {/* Nav items */}
// //       <nav className="flex-1 px-2.5 space-y-0.5">
// //         {navItems.map(({ to, icon: Icon, label, badge, end }) => (
// //           <NavLink
// //             key={to}
// //             to={to}
// //             end={end}
// //             className={({ isActive }) =>
// //               `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
// //                ${isActive
// //                  ? "bg-white/10 text-white font-medium"
// //                  : "text-slate-400 hover:text-white hover:bg-white/5"
// //                }`
// //             }
// //           >
// //             <Icon className="text-base shrink-0" />
// //             <span className="flex-1">{label}</span>
// //             {badge > 0 && (
// //               <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
// //                 {badge}
// //               </span>
// //             )}
// //           </NavLink>
// //         ))}
// //       </nav>

// //       {/* User bottom */}
// //       <div className="px-2.5 pb-4 pt-3 border-t border-white/5">
// //         <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
// //           <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
// //             {initials}
// //           </div>
// //           <div className="min-w-0">
// //             <div className="text-white text-sm font-medium truncate">{name}</div>
// //             <div className="text-slate-400 text-[11px]">{profile.designation || role}</div>
// //           </div>
// //         </div>
// //         <button
// //           onClick={handleSwitchRole}
// //           className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
// //             bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
// //         >
// //           <FaSyncAlt className="text-[10px]" /> Switch Role
// //         </button>
// //       </div>
// //     </aside>
// //   );
// // }



// import { useState, useEffect } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import { auth, db } from "../firebase";
// import { signOut } from "firebase/auth";
// import { ref, onValue } from "firebase/database";
// import {
//   FaThLarge, FaTasks, FaComments, FaMapMarkerAlt,
//   FaCalendarAlt, FaList, FaSyncAlt, FaUser, FaUmbrellaBeach,
//   FaUserShield,
// } from "react-icons/fa";

// export default function Sidebar() {
//   const navigate = useNavigate();
//   const user = auth.currentUser;
//   const parts = (user?.displayName || "User|employee").split("|");
//   const name = parts[0] || "User";
//   const role = parts[1] || "employee";
//   const isAdmin = role === "admin";
//   const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

//   const [pendingCount, setPendingCount] = useState(0);
//   const [leaveBadge, setLeaveBadge]     = useState(0);
//   const [profile, setProfile] = useState({ designation: "Employee", department: "General" });

//   useEffect(() => {
//     if (!user) return;
//     const unsubs = [];
//     if (isAdmin) {
//       // Admin: count all pending leaves across all users
//       unsubs.push(onValue(ref(db, "leaves"), (snap) => {
//         const data = snap.val() || {};
//         let count = 0;
//         Object.values(data).forEach((userLeaves) => {
//           Object.values(userLeaves).forEach((l) => {
//             if (l.status === "Pending") count++;
//           });
//         });
//         setLeaveBadge(count);
//       }));
//       // Admin: count all non-done tasks
//       unsubs.push(onValue(ref(db, "tasks"), (snap) => {
//         const data = snap.val() || {};
//         let count = 0;
//         Object.values(data).forEach((userTasks) => {
//           Object.values(userTasks).forEach((t) => {
//             if (t.status !== "Done") count++;
//           });
//         });
//         setPendingCount(count);
//       }));
//     } else {
//       unsubs.push(onValue(ref(db, `tasks/${user.uid}`), (snap) => {
//         const data = snap.val() || {};
//         const count = Object.values(data).filter((t) => t.status !== "Done").length;
//         setPendingCount(count);
//       }));
//       unsubs.push(onValue(ref(db, `leaves/${user.uid}`), (snap) => {
//         const data = snap.val() || {};
//         const count = Object.values(data).filter((l) => l.status === "Pending").length;
//         setLeaveBadge(count);
//       }));
//     }
//     unsubs.push(onValue(ref(db, `users/${user.uid}`), (snap) => {
//       if (snap.val()) setProfile(snap.val());
//     }));
//     return () => unsubs.forEach((u) => u());
//   }, [user?.uid, isAdmin]);

//   const handleSwitchRole = async () => {
//     await signOut(auth);
//     navigate("/login");
//   };

//   const navItems = isAdmin
//     ? [
//         { to: "/admin",            icon: FaThLarge,       label: "Dashboard",   end: true },
//         { to: "/admin/tasks",      icon: FaTasks,         label: "All Tasks",   badge: pendingCount || null },
//         { to: "/admin/messages",   icon: FaComments,      label: "Messages" },
//         { to: "/admin/attendance", icon: FaMapMarkerAlt,  label: "Attendance" },
//         { to: "/admin/leave",      icon: FaUmbrellaBeach, label: "Leave",       badge: leaveBadge || null },
//         { to: "/admin/calendar",   icon: FaCalendarAlt,   label: "Calendar" },
//         { to: "/admin/lists",      icon: FaList,          label: "Item Lists" },
//       ]
//     : [
//         { to: "/employee",            icon: FaThLarge,       label: "My Dashboard", end: true },
//         { to: "/employee/tasks",      icon: FaTasks,         label: "My Tasks",     badge: pendingCount || null },
//         { to: "/employee/messages",   icon: FaComments,      label: "Messages" },
//         { to: "/employee/attendance", icon: FaMapMarkerAlt,  label: "Attendance" },
//         { to: "/employee/leave",      icon: FaUmbrellaBeach, label: "My Leave",     badge: leaveBadge || null },
//         { to: "/employee/calendar",   icon: FaCalendarAlt,   label: "Calendar" },
//         { to: "/employee/lists",      icon: FaList,          label: "Item Lists" },
//       ];

//   return (
//     <aside className="w-[215px] min-h-screen bg-[#0d1117] flex flex-col shrink-0 z-10">
//       {/* Logo */}
//       <div className="px-4 pt-5 pb-3">
//         <div className="flex items-center gap-2.5">
//           <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-sm font-bold select-none">
//             G
//           </div>
//           <div>
//             <div className="text-white text-sm font-semibold leading-tight">Genie Media</div>
//             <div className="text-slate-500 text-[11px]">Workspace</div>
//           </div>
//         </div>
//       </div>

//       {/* Role badge */}
//       <div className="px-4 pb-4">
//         {isAdmin ? (
//           <div className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
//             <FaUserShield className="text-[9px]" /> ADMIN
//           </div>
//         ) : (
//           <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
//             <FaUser className="text-[9px]" /> EMPLOYEE
//           </div>
//         )}
//       </div>

//       {/* Nav items */}
//       <nav className="flex-1 px-2.5 space-y-0.5">
//         {navItems.map(({ to, icon: Icon, label, badge, end }) => (
//           <NavLink
//             key={to}
//             to={to}
//             end={end}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
//                ${isActive
//                  ? "bg-white/10 text-white font-medium"
//                  : "text-slate-400 hover:text-white hover:bg-white/5"
//                }`
//             }
//           >
//             <Icon className="text-base shrink-0" />
//             <span className="flex-1">{label}</span>
//             {badge > 0 && (
//               <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
//                 {badge}
//               </span>
//             )}
//           </NavLink>
//         ))}
//       </nav>

//       {/* User bottom */}
//       <div className="px-2.5 pb-4 pt-3 border-t border-white/5">
//         <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
//           <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
//             {initials}
//           </div>
//           <div className="min-w-0">
//             <div className="text-white text-sm font-medium truncate">{name}</div>
//             <div className="text-slate-400 text-[11px]">{profile.designation || role}</div>
//           </div>
//         </div>
//         <button
//           onClick={handleSwitchRole}
//           className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
//             bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
//         >
//           <FaSyncAlt className="text-[10px]" /> Switch Role
//         </button>
//       </div>
//     </aside>
//   );
// }




import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import {
  FaThLarge, FaTasks, FaComments, FaMapMarkerAlt,
  FaCalendarAlt, FaSyncAlt, FaUser, FaUmbrellaBeach,
  FaUserShield,
} from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const parts = (user?.displayName || "User|employee").split("|");
  const name    = parts[0] || "User";
  const role    = parts[1] || "employee";
  const isAdmin = role === "admin";
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const [pendingCount, setPendingCount] = useState(0);
  const [leaveBadge,   setLeaveBadge]   = useState(0);
  const [profile,      setProfile]      = useState({ designation: "Employee", department: "General" });

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    if (isAdmin) {
      // Pending leaves across all users
      unsubs.push(onValue(ref(db, "leaves"), (snap) => {
        const data = snap.val() || {};
        let count = 0;
        Object.values(data).forEach((userLeaves) =>
          Object.values(userLeaves).forEach((l) => { if (l.status === "Pending") count++; })
        );
        setLeaveBadge(count);
      }));
      // Non-done tasks across all users
      unsubs.push(onValue(ref(db, "tasks"), (snap) => {
        const data = snap.val() || {};
        let count = 0;
        Object.values(data).forEach((userTasks) =>
          Object.values(userTasks).forEach((t) => { if (t.status !== "Done") count++; })
        );
        setPendingCount(count);
      }));
    } else {
      unsubs.push(onValue(ref(db, `tasks/${user.uid}`), (snap) => {
        const data = snap.val() || {};
        setPendingCount(Object.values(data).filter((t) => t.status !== "Done").length);
      }));
      unsubs.push(onValue(ref(db, `leaves/${user.uid}`), (snap) => {
        const data = snap.val() || {};
        setLeaveBadge(Object.values(data).filter((l) => l.status === "Pending").length);
      }));
    }

    unsubs.push(onValue(ref(db, `users/${user.uid}`), (snap) => {
      if (snap.val()) setProfile(snap.val());
    }));

    return () => unsubs.forEach((u) => u());
  }, [user?.uid, isAdmin]);

  const handleSwitchRole = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navItems = isAdmin
    ? [
        { to: "/admin",            icon: FaThLarge,       label: "Dashboard",  end: true },
        { to: "/admin/tasks",      icon: FaTasks,         label: "All Tasks",  badge: pendingCount || null },
        { to: "/admin/messages",   icon: FaComments,      label: "Messages" },
        { to: "/admin/attendance", icon: FaMapMarkerAlt,  label: "Attendance" },
        { to: "/admin/leave",      icon: FaUmbrellaBeach, label: "Leave",      badge: leaveBadge || null },
        { to: "/admin/calendar",   icon: FaCalendarAlt,   label: "Calendar" },
      ]
    : [
        { to: "/employee",            icon: FaThLarge,       label: "My Dashboard", end: true },
        { to: "/employee/tasks",      icon: FaTasks,         label: "My Tasks",     badge: pendingCount || null },
        { to: "/employee/messages",   icon: FaComments,      label: "Messages" },
        { to: "/employee/attendance", icon: FaMapMarkerAlt,  label: "Attendance" },
        { to: "/employee/leave",      icon: FaUmbrellaBeach, label: "My Leave",     badge: leaveBadge || null },
        { to: "/employee/calendar",   icon: FaCalendarAlt,   label: "Calendar" },
      ];

  return (
    <aside className="w-[215px] min-h-screen bg-[#0d1117] flex flex-col shrink-0 z-10">

      {/* ── Logo ── */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-sm font-bold select-none">
            G
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">Genie Media</div>
            <div className="text-slate-500 text-[11px]">Workspace</div>
          </div>
        </div>
      </div>

      {/* ── Role badge ── */}
      <div className="px-4 pb-4">
        {isAdmin ? (
          <div className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
            <FaUserShield className="text-[9px]" /> ADMIN
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
            <FaUser className="text-[9px]" /> EMPLOYEE
          </div>
        )}
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 px-2.5 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, badge, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
               ${isActive
                 ? "bg-white/10 text-white font-medium"
                 : "text-slate-400 hover:text-white hover:bg-white/5"
               }`
            }
          >
            <Icon className="text-base shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5
                rounded-full min-w-[18px] text-center leading-none">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User bottom ── */}
      <div className="px-2.5 pb-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{name}</div>
            <div className="text-slate-400 text-[11px]">{profile.designation || role}</div>
          </div>
        </div>
        <button
          onClick={handleSwitchRole}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
            bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
        >
          <FaSyncAlt className="text-[10px]" /> Switch Role
        </button>
      </div>
    </aside>
  );
}