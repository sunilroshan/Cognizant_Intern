import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";
import { toast } from "react-hot-toast";
import { Mail, Lock, User, Phone, MapPin, Loader2, ArrowRight } from "lucide-react";
import "./RegisterPage.css";
import useFormValidation from "../../hooks/useFormValidation";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useFormValidation(
    { fullName: "", email: "", password: "", phoneNo: "", address: "" },
    (vals) => {
      const errs: { fullName?: string; email?: string; password?: string; phoneNo?: string; address?: string } = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\d{10}$/;
      if (!vals.fullName) errs.fullName = "Please enter the full name.";
      if (!vals.email) errs.email = "Please enter the email address.";
      else if (!emailRegex.test(vals.email)) errs.email = "Please enter a valid email.";
      if (!vals.password) errs.password = "Please enter the password.";
      else if (vals.password.length < 6) errs.password = "Password must be at least 6 characters.";
      if (!vals.phoneNo) errs.phoneNo = "Please enter the contact number.";
      else if (!phoneRegex.test(vals.phoneNo)) errs.phoneNo = "Contact number must be exactly 10 digits.";
      if (!vals.address) errs.address = "Please enter the address.";
      return errs;
    }
  );

  const onValidSubmit = async (vals: any) => {
    setLoading(true);
    try {
      await registerUser(vals);
      toast.success("Guest account registered successfully! Please log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-glow-1" />
      <div className="register-glow-2" />

      <div className="auth-shell">
        <div className="auth-side">
          <div className="auth-side-badge">HospEase</div>
          <h1 className="auth-side-title">Create your guest account in minutes</h1>
          <p className="auth-side-subtitle">Sign up to manage bookings, room services, billing, and your stay details in one place.</p>
        </div>

        <div className="register-card">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg mb-4">
              <span className="text-2xl font-bold font-sans">H</span>
            </div>
            <h2 className="text-2xl font-extrabold text-black tracking-tight">Create Account</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Join HospEase to manage your hotel stays</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Alice Smith"
                  value={values.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="register-input"
                />
                {touched.fullName && errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  name="email"
                  placeholder="alice@gmail.com"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="register-input"
                />
                {touched.email && errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="register-input"
                />
                {touched.password && errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="phoneNo"
                  placeholder="9876543210 (10 digits)"
                  maxLength={10}
                  value={values.phoneNo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="register-input"
                />
                {touched.phoneNo && errors.phoneNo && <p className="text-red-400 text-sm mt-1">{errors.phoneNo}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="address"
                  placeholder="123 Forest Hill, New York"
                  value={values.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="register-input"
                />
                {touched.address && errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="register-btn mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registering profile...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <span>Register Account</span>
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link to="/login" className="text-indigo-500 hover:text-indigo-600 font-semibold transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
