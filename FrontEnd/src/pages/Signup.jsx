import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile, sendSignInLinkToEmail } from "firebase/auth";
import { ref, set, push, get, query, orderByChild, equalTo } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  FaEye, FaEyeSlash, FaEnvelope, FaLock,
  FaUser, FaCheckDouble, FaUserShield, FaShieldAlt, FaIdBadge,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Signup() {
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role,            setRole]            = useState("employee");
  const [employeeId,      setEmployeeId]      = useState("");

  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,             setLoading]             = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) { toast.error("Passwords do not match!");              return; }
    if (password.length < 6)          { toast.error("Password must be at least 6 characters"); return; }
    if (role === "employee" && !employeeId.trim()) {
      toast.error("Employee ID is required");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      const empIdClean = role === "employee" ? employeeId.trim().toUpperCase() : "";
      await updateProfile(userCred.user, {
        displayName: role === "employee"
          ? `${name.trim()}|${role}|${empIdClean}`
          : `${name.trim()}|${role}`,
      });


      await set(ref(db, `users/${uid}`), {
        uid,
        name:        name.trim(),
        email:       email.trim().toLowerCase(),
        role,
        employeeId:  empIdClean,
        designation: role === "admin" ? "Administrator" : "Employee",
        department:  "General",
        createdAt:   new Date().toISOString(),
      });


      let isDuplicate = false;
      if (role === "employee" && empIdClean) {
        const snap = await get(ref(db, "teamMembers"));
        const existing = snap.val() || {};
        isDuplicate = Object.values(existing).some(
          (m) => (m.employeeId || "").toLowerCase() === empIdClean.toLowerCase()
        );
      }

      if (!isDuplicate) {
        await push(ref(db, "teamMembers"), {
          uid,                          // Links roster entry back to Firebase Auth
          name:        name.trim(),
          employeeId:  role === "employee" ? empIdClean : `ADM-${uid.slice(0, 6).toUpperCase()}`,
          role,
          department:  "General",
          designation: role === "admin" ? "Administrator" : "Employee",
          email:       email.trim().toLowerCase(),
          addedAt:     new Date().toISOString(),
          addedBy:     uid,
        });
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/email-handler`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);

      toast.success("Account created! Check your email for the sign-in link.");
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin    = role === "admin";
  const isEmployee = role === "employee";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className={`w-full lg:w-2/5 lg:min-h-screen flex flex-col px-6 py-8 sm:px-10 sm:py-10
        ${isAdmin ? "bg-gradient-to-br from-violet-700 to-purple-900"
                  : "bg-gradient-to-br from-emerald-600 to-teal-800"}`}>

        <div className="flex items-center gap-2 mb-6 lg:mb-0">
          <FaCheckDouble className="text-white text-xl" />
          <span className="text-xl font-bold text-white tracking-tight">GenieTask</span>
        </div>

        <div className="hidden sm:block lg:mt-auto lg:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            {isAdmin
              ? "Set up your admin account to start managing your team and projects."
              : "Join your team on GenieTask and start collaborating today."}
          </p>
        </div>

        <div className="hidden lg:flex bg-white/10 backdrop-blur rounded-2xl p-8
          flex-col items-center justify-center gap-4 border border-white/20 mb-8">
          {isAdmin ? <FaUserShield className="text-white/40 text-7xl" /> : <FaUser className="text-white/40 text-7xl" />}
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

      <div className="flex-1 flex items-center justify-center bg-white px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
        <div className="w-full max-w-sm">

          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1
            rounded-full mb-4 sm:hidden
            ${isAdmin ? "bg-violet-100 text-violet-700" : "bg-emerald-100 text-emerald-700"}`}>
            {isAdmin ? <FaUserShield /> : <FaUser />}
            {isAdmin ? "Admin Account" : "Employee Account"}
          </div>

          <p className="text-sm text-slate-400 mb-0.5">Get started 🚀</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-snug">
            Create your{" "}
            <span className={isAdmin ? "text-violet-600" : "text-emerald-600"}>
              {isAdmin ? "admin" : "employee"}
            </span>{" "}
            account
          </h2>

          <form onSubmit={handleSignup} className="space-y-4">

            <FormField label="Full Name" icon={<FaUser />} isAdmin={isAdmin}>
              <input type="text" placeholder="John Doe" required
                className={inputCls}
                onChange={(e) => setName(e.target.value)} />
            </FormField>

            {isEmployee && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Employee ID <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    <FaIdBadge />
                  </span>
                  <input type="text" placeholder="e.g. EMP-2024-001"
                    value={employeeId}
                    className={inputCls}
                    onChange={(e) => setEmployeeId(e.target.value)} />
                </div>
                <p className="text-xs text-slate-400 mt-1 pl-1">Ask your admin for your Employee ID</p>
              </div>
            )}

            <FormField label="Email Address" icon={<FaEnvelope />} isAdmin={isAdmin}>
              <input type="email" placeholder="you@example.com" required
                className={inputCls}
                onChange={(e) => setEmail(e.target.value)} />
            </FormField>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><FaLock /></span>
                <input type={showPassword ? "text" : "password"} placeholder="Min. 6 characters"
                  className={inputCls} onChange={(e) => setPassword(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 text-sm"
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"><FaLock /></span>
                <input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password"
                  className={inputCls} onChange={(e) => setConfirmPassword(e.target.value)} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 text-sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole("employee")}
                  className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3
                    rounded-xl border text-sm font-medium transition-all active:scale-95
                    ${role === "employee"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}>
                  <FaUser className="text-xs shrink-0" /> Employee
                </button>
                <button type="button" onClick={() => { setRole("admin"); setEmployeeId(""); }}
                  className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3
                    rounded-xl border text-sm font-medium transition-all active:scale-95
                    ${role === "admin"
                      ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm shadow-violet-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}>
                  <FaUserShield className="text-xs shrink-0" /> Admin
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-2.5 sm:py-3 rounded-xl text-white font-semibold text-sm
                transition-all duration-200 active:scale-95 disabled:opacity-60
                ${isAdmin
                  ? "bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                }`}>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-xs text-slate-500 pt-1">
              Already have an account?{" "}
              <span className="text-violet-500 cursor-pointer hover:underline font-medium"
                onClick={() => navigate("/login")}>
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputCls = `w-full pl-9 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-xl
  text-slate-800 text-sm placeholder-slate-300
  focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition`;

function FormField({ label, icon, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{icon}</span>
        {children}
      </div>
    </div>
  );
}