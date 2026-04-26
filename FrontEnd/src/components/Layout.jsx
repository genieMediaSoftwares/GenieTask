// import Header from "./Header";
// import Footer from "./Footer";

// export default function Layout({ children }) {
//   return (
//     <>
//       <Header />
//       <div className="min-h-screen">{children}</div>
//       <Footer />
//     </>
//   );
// }


import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

/**
 * Layout supports two usage patterns:
 *  1. Nested routes: <Layout />  → renders <Outlet /> for child routes
 *  2. Direct wrap:  <Layout><AdminDashboard /></Layout>  → renders children
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}