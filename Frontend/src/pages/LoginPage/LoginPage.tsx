import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../AuthContext";
import { toast } from "react-hot-toast";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import "./LoginPage.css";
import useFormValidation from "../../hooks/useFormValidation";

export const LoginPage: React.FC = () => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useFormValidation(
    { email: "", password: "" },
    (vals) => {
      const errs: { email?: string; password?: string } = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!vals.email) errs.email = "Please enter the email address.";
      else if (!emailRegex.test(vals.email)) errs.email = "Please enter a valid email address.";
      if (!vals.password) errs.password = "Please enter the password.";
      else if (vals.password.length < 6) errs.password = "Password must be at least 6 characters.";
      return errs;
    }
  );
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const onValidSubmit = async (vals: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await loginUser({ email: vals.email, password: vals.password });
      login(res.token, res.role, res.user);
      toast.success("Welcome back to HospEase!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Access Denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      <div className="auth-shell">
        <div className="auth-side">
          <div className="auth-side-badge">HospEase</div>
          <h1 className="auth-side-title">Smarter hotel operations start here</h1>
          <p className="auth-side-subtitle">Manage guests, reservations, housekeeping, and billing from one streamlined portal.</p>
        </div>

        <div className="login-card">
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg mb-4">
              <span className="text-2xl font-bold font-sans">H</span>
            </div>
            <h2 className="text-2xl font-extrabold text-black tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Sign in to continue to your HospEase dashboard</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="login-input"
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="login-input"
                />
              </div>
              {touched.password && errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="login-btn mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Identity...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <span>Are you a guest? </span>
            <Link to="/register" className="text-indigo-500 hover:text-indigo-600 font-semibold transition">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
