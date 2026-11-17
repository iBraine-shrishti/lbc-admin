import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaArrowRight, FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";

const ADMIN_CREDENTIALS = {
  email: "support@lbcmoto.com",
  password: "Admin@123",
};

const AdminLogin = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const enteredUser = formData.username.trim().toLowerCase();
    const enteredPass = formData.password;

    // DIRECT ADMIN VERIFICATION (Only 1 admin account)
    const isDirectMatch =
      (enteredUser === ADMIN_CREDENTIALS.email.toLowerCase() || enteredUser === "support") &&
      enteredPass === ADMIN_CREDENTIALS.password;

    if (isDirectMatch) {
      setTimeout(() => {
        const token = "lbc_admin_token_" + Date.now();
        localStorage.setItem("lbc_admin_token", token);
        localStorage.setItem("orm_admin_token", token);
        localStorage.setItem(
          "lbc_admin_user",
          JSON.stringify({
            username: "LBC Admin",
            email: ADMIN_CREDENTIALS.email,
            role: "Super Admin",
          })
        );
        localStorage.setItem(
          "orm_admin_user",
          JSON.stringify({
            username: "LBC Admin",
            email: ADMIN_CREDENTIALS.email,
            role: "Super Admin",
          })
        );
        setLoading(false);
        navigate("/react-admin/dashboard");
      }, 400);
      return;
    }

    // Optional API Fallback if backend configured
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/api/admin-login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (response.ok && data.token) {
          localStorage.setItem("lbc_admin_token", data.token);
          localStorage.setItem("orm_admin_token", data.token);
          navigate("/react-admin/dashboard");
          return;
        }
      }
      setError("Invalid credentials. Please enter authorized LBC Admin login.");
    } catch (err) {
      setError("Invalid credentials. Please enter authorized LBC Admin login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex justify-center items-center relative overflow-hidden font-sans bg-[#121212]">
      {/* BACKGROUND MOVING BIKE VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 scale-105"
      >
        <source
          src="https://pub-d58a86e1a4524cba87ce65b0bedfda66.r2.dev/motoearth/assets/video/moto-video.mp4"
          type="video/mp4"
        />
      </video>

      {/* DARK OVERLAY FOR READABILITY */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/90 via-[#181818]/85 to-[#121212]/95 z-[1]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(254,205,8,0.08)_0%,transparent_70%)] z-[1]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[92%] max-w-[430px]"
      >
        <div className="bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {/* LOGO & HEADER */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/images/lbcmoto-logo.png"
                alt="LBC Moto"
                className="h-10 w-auto object-contain drop-shadow"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className="w-14 h-14 bg-[#FECD08]/20 border border-[#FECD08]/40 rounded-2xl flex items-center justify-center text-[#212121] dark:text-[#FECD08] mx-auto mb-4 shadow-sm">
              <FaUserShield size={24} className="text-[#212121] dark:text-[#FECD08]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
              LBC MOTO ADMIN
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-[#FECD08]/15 border border-[#FECD08]/30 rounded-full">
              <FaLock size={9} className="text-[#212121] dark:text-[#FECD08]" />
              <p className="text-[#212121] dark:text-[#FECD08] text-[0.65rem] font-bold uppercase tracking-[0.25em]">
                Restricted Admin Access
              </p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Admin Email / Username
              </label>
              <input
                type="text"
                placeholder="support@lbcmoto.com"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl text-slate-900 dark:text-white text-xs font-semibold tracking-wide outline-none focus:border-[#FECD08] focus:ring-2 focus:ring-[#FECD08]/20 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Password Field with Eye Toggle */}
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 p-3.5 rounded-xl text-slate-900 dark:text-white text-xs font-semibold tracking-wide outline-none focus:border-[#FECD08] focus:ring-2 focus:ring-[#FECD08]/20 transition-all placeholder:text-slate-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-[#FECD08] transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FECD08] hover:bg-[#e8bb07] text-[#212121] h-12 rounded-xl font-bold text-xs uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2.5 active:scale-98 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? "AUTHENTICATING..." : "ENTER ADMIN PORTAL"}
              {!loading && <FaArrowRight size={12} />}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 text-center pt-4 border-t border-slate-200/60 dark:border-white/5">
            <p className="text-[0.62rem] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
              LBC MOTO &bull; Authorized Management Console
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
