// import { useState } from "react";
// import { auth } from "../firebase";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import { useNavigate } from "react-router-dom"; // ✅ FIX

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const navigate = useNavigate(); // ✅ FIX

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     try {
//       const userCred = await signInWithEmailAndPassword(
//         auth,
//         email,
//         password
//       );

//       const [name, role] = userCred.user.displayName.split("|");

//       if (role === "admin") {
//         navigate("/admin");
//       } else {
//         navigate("/employee");
//       }

//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   return (
//     <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
//       <form
//         onSubmit={handleLogin}
//         className="bg-gray-800 p-8 rounded-lg w-96"
//       >
//         <h2 className="text-2xl mb-4 text-center">Login</h2>

//         {/* Email */}
//         <input
//           type="email"
//           placeholder="Email"
//           className="w-full p-2 mb-3 rounded text-black"
//           onChange={(e) => setEmail(e.target.value)}
//         />

//         {/* Password */}
//         <div className="relative mb-3">
//           <input
//             type={showPassword ? "text" : "password"}
//             placeholder="Password"
//             className="w-full p-2 rounded text-black"
//             onChange={(e) => setPassword(e.target.value)}
//           />

//           <span
//             className="absolute right-3 top-2.5 cursor-pointer text-gray-700"
//             onClick={() => setShowPassword(!showPassword)}
//           >
//             {showPassword ? <FaEyeSlash /> : <FaEye />}
//           </span>
//         </div>

//         <button className="w-full bg-green-500 p-2 rounded hover:bg-green-600">
//           Login
//         </button>
//       </form>
//     </div>
//   );
// }
import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  FaEye, FaEyeSlash, FaEnvelope, FaLock,
  FaCheckDouble, FaUserShield, FaUser, FaArrowLeft,
  FaShieldAlt, FaCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // ✅ Set persistence BEFORE signing in
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const [name, role] = userCred.user.displayName.split("|");

      // ✅ Role mismatch guard
      if (role !== selectedRole) {
        await auth.signOut();
        if (selectedRole === "employee") {
          toast.error("⛔ Admin accounts are not allowed here. Please use the Admin Login portal.");
        } else {
          toast.error("⛔ Employee accounts are not allowed here. Please use the Employee Login portal.");
        }
        return;
      }

      toast.success(`Welcome back! Redirecting to ${role} dashboard...`);
      setTimeout(() => {
        if (role === "admin") navigate("/admin");
        else navigate("/employee");
      }, 1200);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent 📩 Check your inbox.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isAdmin = selectedRole === "admin";

  // ─── Role Selection Screen ─────────────────────────────────────────────────
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-10">
        <ToastContainer position="top-right" autoClose={4500} />

        <div className="w-full max-w-sm sm:max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <FaCheckDouble className="text-violet-600 text-xl sm:text-2xl" />
            <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
              GenieTask
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 leading-tight">
            Welcome to <span className="text-violet-600">GenieTask</span>
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Choose your login portal to continue
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setSelectedRole("admin")}
              className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6
                hover:border-violet-400 hover:shadow-xl hover:shadow-violet-100
                active:scale-95 transition-all duration-200 text-left group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-violet-100 rounded-full
                flex items-center justify-center mb-3 group-hover:bg-violet-200 transition-colors">
                <FaUserShield className="text-violet-600 text-lg sm:text-xl" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">Admin Login</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage users, tasks, projects and system settings.
              </p>
            </button>

            <button
              onClick={() => setSelectedRole("employee")}
              className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-6
                hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100
                active:scale-95 transition-all duration-200 text-left group"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-100 rounded-full
                flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors">
                <FaUser className="text-emerald-600 text-lg sm:text-xl" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">Employee Login</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                View your tasks, update progress and collaborate with your team.
              </p>
            </button>
          </div>

          <p className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <FaShieldAlt /> Secure. Simple. Productive.
          </p>
        </div>
      </div>
    );
  }

  // ─── Login Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <ToastContainer position="top-right" autoClose={4500} />

      {/* Left Panel */}
      <div className={`w-full lg:w-2/5 lg:min-h-screen flex flex-col
        px-6 py-8 sm:px-10 sm:py-10
        ${isAdmin
          ? "bg-gradient-to-br from-violet-700 to-purple-900"
          : "bg-gradient-to-br from-emerald-600 to-teal-800"
        }`}
      >
        <div className="flex items-center gap-2 mb-6 lg:mb-0">
          <FaCheckDouble className="text-white text-xl" />
          <span className="text-xl font-bold text-white tracking-tight">GenieTask</span>
        </div>

        <div className="hidden sm:block lg:mt-auto lg:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {isAdmin ? "Admin Login" : "Employee Login"}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            {isAdmin
              ? "Access the admin dashboard to manage the system efficiently."
              : "Access your workspace to view your tasks and stay productive."}
          </p>
        </div>

        <div className="hidden lg:flex bg-white/10 backdrop-blur rounded-2xl p-8
          flex-col items-center justify-center gap-4 border border-white/20 mb-8">
          {isAdmin
            ? <FaUserShield className="text-white/40 text-7xl" />
            : <FaUser className="text-white/40 text-7xl" />
          }
          <div className="space-y-2 w-full">
            <div className="h-2 bg-white/20 rounded-full w-3/4 mx-auto" />
            <div className="h-2 bg-white/20 rounded-full w-1/2 mx-auto" />
            <div className="h-2 bg-white/20 rounded-full w-2/3 mx-auto" />
          </div>
        </div>

        <p className="hidden lg:flex text-xs text-white/40 items-center gap-1.5">
          <FaShieldAlt /> Secure. Simple. Productive.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white
        px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
        <div className="w-full max-w-sm">

          {/* Mobile role pill */}
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold
            px-3 py-1 rounded-full mb-4 sm:hidden
            ${isAdmin ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
            {isAdmin ? <FaUserShield /> : <FaUser />}
            {isAdmin ? "Admin Portal" : "Employee Portal"}
          </div>

          <p className="text-sm text-slate-400 mb-0.5">Welcome Back! 👋</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-snug">
            Login to your{" "}
            <span className={isAdmin ? "text-violet-600" : "text-emerald-600"}>
              {isAdmin ? "admin" : "employee"}
            </span>{" "}
            account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  placeholder={isAdmin ? "admin@genietask.com" : "employee@genietask.com"}
                  className="w-full pl-9 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl
                    text-slate-800 text-sm placeholder-slate-300
                    focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 sm:py-3 border border-slate-200 rounded-xl
                    text-slate-800 text-sm placeholder-slate-300
                    focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 text-sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* ✅ Remember Me + Forgot Password */}
            <div className="flex items-center justify-between flex-wrap gap-2">

              {/* Clicking the entire row toggles the checkbox */}
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setRememberMe((prev) => !prev)}
              >
                {/* Custom checkbox box */}
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center
                    transition-all duration-150
                    ${rememberMe
                      ? isAdmin
                        ? "bg-violet-600 border-violet-600"
                        : "bg-emerald-600 border-emerald-600"
                      : "bg-white border-slate-300 hover:border-slate-400"
                    }`}
                >
                  {rememberMe && <FaCheck className="text-white text-[8px]" />}
                </div>

                <span className="text-xs text-slate-500">Remember me</span>

                {/* Badge shown when checked */}
                {rememberMe && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                    ${isAdmin
                      ? "bg-violet-100 text-violet-600"
                      : "bg-emerald-100 text-emerald-600"
                    }`}>
                    Stay signed in
                  </span>
                )}
              </div>

              <span
                onClick={handleForgotPassword}
                className="text-xs text-violet-500 cursor-pointer hover:underline"
              >
                Forgot Password?
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`w-full py-2.5 sm:py-3 rounded-xl text-white font-semibold text-sm
                transition-all duration-200 active:scale-95
                ${isAdmin
                  ? "bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                }`}
            >
              Login as {isAdmin ? "Admin" : "Employee"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Back to Role Selection */}
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="w-full py-2.5 sm:py-3 border border-slate-200 rounded-xl
                text-slate-600 text-sm font-medium
                hover:bg-slate-50 active:scale-95
                flex items-center justify-center gap-2 transition"
            >
              <FaArrowLeft className="text-xs" /> Back to Role Selection
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}