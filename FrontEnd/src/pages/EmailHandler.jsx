import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaCheckDouble, FaSpinner } from "react-icons/fa";

export default function EmailHandler() {
  const [status, setStatus] = useState("verifying"); // verifying | success | error | needEmail
  const [manualEmail, setManualEmail] = useState("");
  const navigate = useNavigate();

  const processSignIn = async (emailToUse) => {
    try {
      const result = await signInWithEmailLink(auth, emailToUse, window.location.href);
      window.localStorage.removeItem("emailForSignIn");

      const displayName = result.user.displayName || "";
      const role = displayName.split("|")[1] || "employee";

      setStatus("success");

      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/employee");
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStatus("error");
      return;
    }

    const savedEmail = window.localStorage.getItem("emailForSignIn");

    if (savedEmail) {
      processSignIn(savedEmail);
    } else {
      setStatus("needEmail");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">

        <div className="flex items-center justify-center gap-2 mb-6">
          <FaCheckDouble className="text-violet-600 text-xl" />
          <span className="text-xl font-bold text-slate-800 tracking-tight">GenieTask</span>
        </div>

        {status === "verifying" && (
          <>
            <FaSpinner className="text-violet-500 text-4xl mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Verifying your link</h2>
            <p className="text-sm text-slate-400">Just a moment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">You're in!</h2>
            <p className="text-sm text-slate-400">Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Invalid or expired link</h2>
            <p className="text-sm text-slate-400 mb-4">
              This link may have already been used or has expired.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700
                text-white text-sm font-semibold transition"
            >
              Back to Login
            </button>
          </>
        )}

        {status === "needEmail" && (
          <>
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Confirm your email</h2>
            <p className="text-sm text-slate-400 mb-4">
              Looks like you opened this link on a different device. Please enter your email to continue.
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm
                text-slate-800 placeholder-slate-300 mb-3
                focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <button
              onClick={() => processSignIn(manualEmail)}
              disabled={!manualEmail}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700
                disabled:opacity-50 text-white text-sm font-semibold transition"
            >
              Continue
            </button>
          </>
        )}

      </div>
    </div>
  );
}