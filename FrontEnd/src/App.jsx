// import { Routes, Route } from "react-router-dom";
// import Signup from "./pages/Signup";
// import Login from "./pages/Login";
// import AdminDashboard from "./pages/AdminDashboard";
// import EmployeeDashboard from "./pages/EmployeeDashboard";
// import Header from "./components/Header";
// import Footer from "./components/Footer";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Layout from "./components/Layout";
// import EmailHandler from "./pages/EmailHandler";


// function App() {
//   return (

//    <>

//     <Routes>
//       <Route path="/" element={<Signup />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/email-handler" element={<EmailHandler />} />

//        {/* 🔐 Admin */}
//       <Route
//         path="/admin"
//         element={
//           <ProtectedRoute roleRequired="admin">
//             <Layout>
//               <AdminDashboard />
//             </Layout>
//           </ProtectedRoute>
//         }
//       />

//       {/* 🔐 Employee */}
//       <Route
//         path="/employee"
//         element={
//           <ProtectedRoute roleRequired="employee">
//             <Layout>
//               <EmployeeDashboard />
//             </Layout>
//           </ProtectedRoute>
//         }
//       />
//     </Routes>

//    </>
//   );
// }

// export default App;



import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EmailHandler from "./pages/EmailHandler";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminTasks from "./pages/AdminTasks";
import AdminAttendance from "./pages/AdminAttendance";
import AdminLeave from "./pages/AdminLeave";

// Employee pages
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyTasks from "./pages/MyTasks";
import Attendance from "./pages/Attendance";
import MyLeave from "./pages/MyLeave";

// Shared pages
import Messages from "./pages/Messages";
import CalendarPage from "./pages/CalendarPage";
import ItemLists from "./pages/ItemLists";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import TeamMembers from "./pages/Teammembers";

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Signup />} />
        <Route path="/email-handler" element={<EmailHandler />} />

        {/* Admin nested routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="messages" element={<Messages />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="leave" element={<AdminLeave />} />
          <Route path="calendar" element={<CalendarPage />} />
          {/* <Route path="lists"      element={<ItemLists />} /> */}
          <Route path="teammembers" element={<TeamMembers />} />
        </Route>

        {/* Employee nested routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute roleRequired="employee">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeDashboard />} />
          <Route path="tasks" element={<MyTasks />} />
          <Route path="messages" element={<Messages />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leave" element={<MyLeave />} />
          <Route path="calendar" element={<CalendarPage />} />
          {/* <Route path="lists"      element={<ItemLists />} /> */}
          <Route path="teammembers" element={<TeamMembers />} />

        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}