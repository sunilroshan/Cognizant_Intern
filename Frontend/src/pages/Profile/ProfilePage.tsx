import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { createGuest, getAllGuests, updateGuest } from "../../services/guestService";
import { Guest } from "../../models/guest";
import { User, Phone, MapPin, Calendar, Award, CheckCircle, AlertTriangle, Loader2, Save, Edit3 } from "lucide-react";
import { toast } from "react-hot-toast";
import "./ProfilePage.css";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [guestProfile, setGuestProfile] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingMode, setOnboardingMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    name: "",
    dob: "",
    phone: "",
    address: "",
    loyaltyTier: "SILVER",
  });

  const email = user?.email || "";

  const loadProfile = async () => {
    try {
      setLoading(true);
      const allGuests: Guest[] = await getAllGuests();
      // Find guest by parsing contactInfoJSON and comparing emails
      const matched = allGuests.find((g) => {
        try {
          const contact = JSON.parse(g.contactInfoJSON);
          return contact.email?.toLowerCase() === email.toLowerCase();
        } catch {
          return false;
        }
      });

      if (matched) {
        setGuestProfile(matched);
        let phoneVal = "";
        let addressVal = "";
        try {
          phoneVal = JSON.parse(matched.contactInfoJSON).phone || "";
        } catch {}
        try {
          addressVal = JSON.parse(matched.addressJSON).address || "";
        } catch {}

        setForm({
          name: matched.name,
          dob: matched.dob,
          phone: phoneVal,
          address: addressVal,
          loyaltyTier: matched.loyaltyTier,
        });
        setOnboardingMode(false);
      } else {
        // No guest profile created yet for this authenticated user account
        setOnboardingMode(true);
        setForm((prev) => ({
          ...prev,
          name: user?.fullName || "",
          phone: user?.phoneNo || "",
          address: user?.address || "",
        }));
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load guest profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      loadProfile();
    }
  }, [email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dob || !form.phone || !form.address) {
      toast.error("Please fill in all profile details.");
      return;
    }

    if (form.name.trim().length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    const dobDate = new Date(form.dob);
    const today = new Date();
    if (Number.isNaN(dobDate.getTime()) || dobDate >= today) {
      toast.error("Date of birth must be a valid past date.");
      return;
    }

    if (form.address.trim().length < 5) {
      toast.error("Please enter a complete residential address.");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name,
      dob: form.dob,
      contactInfoJSON: JSON.stringify({ phone: form.phone, email }),
      addressJSON: JSON.stringify({ address: form.address }),
      loyaltyTier: form.loyaltyTier,
      status: "ACTIVE",
    };

    try {
      if (onboardingMode) {
        const newGuest = await createGuest(payload);
        toast.success("Guest profile created successfully!");
        setGuestProfile(newGuest);
        setOnboardingMode(false);
      } else if (guestProfile) {
        const updated = await updateGuest(guestProfile.guestId, payload);
        toast.success("Guest profile updated successfully!");
        setGuestProfile(updated);
        setEditMode(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to commit profile updates.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
          <p className="text-sm text-slate-400">Verifying guest credentials...</p>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return "from-slate-300 to-indigo-200 text-slate-900 shadow-slate-500/20";
      case "GOLD":
        return "from-amber-400 to-yellow-600 text-amber-950 shadow-yellow-500/20";
      default:
        return "from-slate-400 to-slate-600 text-slate-100 shadow-slate-600/20";
    }
  };

  return (
    <div className="profile-container">
      {onboardingMode && (
        <div className="onboarding-banner">
          <AlertTriangle size={18} className="text-amber-400 animate-bounce" />
          <div>
            <h4 className="font-bold text-amber-200">Onboarding Action Required</h4>
            <p className="text-xs text-amber-300">
              Welcome! Please complete your official guest registration details below to enable reservations, billing, and order histories.
            </p>
          </div>
        </div>
      )}

      <div className="profile-grid">
        {/* Left Side: Summary Card */}
        {!onboardingMode && guestProfile && (
          <div className="profile-summary-card">
            <div className={`loyalty-card bg-gradient-to-br ${getTierColor(form.loyaltyTier)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold">Loyalty Pass</span>
                  <h3 className="text-xl font-extrabold mt-1 truncate">{guestProfile.name}</h3>
                </div>
                <Award size={28} className="opacity-90" />
              </div>
              <div className="mt-8 flex justify-between items-end">
                <div>
                  <span className="text-[9px] uppercase tracking-widest opacity-75">Guest Ref Code</span>
                  <div className="font-mono text-sm font-bold">#GUEST-{guestProfile.guestId}</div>
                </div>
                <span className="text-xs font-black tracking-widest uppercase border border-current px-2 py-0.5 rounded-md">
                  {guestProfile.loyaltyTier}
                </span>
              </div>
            </div>

            <div className="profile-details-list">
              <div className="detail-item">
                <CheckCircle size={16} className="text-indigo-400" />
                <div>
                  <span className="label">Account Status</span>
                  <span className="value text-emerald-400 font-semibold">{guestProfile.status}</span>
                </div>
              </div>
              <div className="detail-item">
                <Calendar size={16} className="text-indigo-400" />
                <div>
                  <span className="label">Registered On</span>
                  <span className="value">
                    {guestProfile.createdAt ? new Date(guestProfile.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Profile Info Form */}
        <div className="profile-form-card">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {onboardingMode ? "Create Guest Ledger" : "Account Registry Information"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {onboardingMode
                  ? "Initialize your hotel guest registration card"
                  : "Review and modify your guest settings"}
              </p>
            </div>
            {!onboardingMode && !editMode && (
              <button onClick={() => setEditMode(true)} className="edit-btn">
                <Edit3 size={14} />
                <span>Modify</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="name"
                  disabled={!onboardingMode && !editMode}
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Alice Smith"
                  className="profile-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="date"
                  name="dob"
                  disabled={!onboardingMode && !editMode}
                  value={form.dob}
                  onChange={handleInputChange}
                  className="profile-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="phone"
                  maxLength={10}
                  disabled={!onboardingMode && !editMode}
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="9876543210 (10 digits)"
                  className="profile-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Residential Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="address"
                  disabled={!onboardingMode && !editMode}
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="Street No, City, State"
                  className="profile-input"
                />
              </div>
            </div>

            {(onboardingMode || editMode) && (
              <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                {!onboardingMode && (
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={submitting} className="save-btn">
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Information</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
