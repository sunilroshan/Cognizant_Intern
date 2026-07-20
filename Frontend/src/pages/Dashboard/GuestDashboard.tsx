import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { getAllGuests, createGuest } from "../../services/guestService";
import { getReservationsByGuest } from "../../services/reservationService";
import { getOrdersByGuest } from "../../services/serviceOrderService";
import { getByGuest } from "../../services/invoiceService";
import { Guest } from "../../models/guest";
import { Reservation } from "../../models/reservation";
import { ServiceOrder } from "../../models/serviceOrder";
import { Invoice } from "../../models/invoice";
import { Award, Loader2, ArrowRight, Key, Coffee, CreditCard } from "lucide-react";
import { toast } from "react-hot-toast";
import "./DashboardPage.css";

const GuestDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [guestProfile, setGuestProfile] = useState<Guest | null>(null);
  const [guestReservations, setGuestReservations] = useState<Reservation[]>([]);
  const [guestOrders, setGuestOrders] = useState<ServiceOrder[]>([]);
  const [guestInvoices, setGuestInvoices] = useState<Invoice[]>([]);

  const email = user?.email || "";

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        setLoading(true);
        const guestsList: Guest[] = await getAllGuests();
        let matched = guestsList.find((g) => {
          try {
            const contact = JSON.parse(g.contactInfoJSON);
            return contact.email?.toLowerCase() === email.toLowerCase();
          } catch {
            return false;
          }
        });

        if (!matched && user) {
          try {
            matched = await createGuest({
              name: user.fullName || "Guest",
              dob: "2000-01-01",
              contactInfoJSON: JSON.stringify({ phone: user.phoneNo || "1234567890", email: user.email }),
              addressJSON: JSON.stringify({ address: user.address || "Default Address" }),
              loyaltyTier: "SILVER",
            });
          } catch (e) {
            console.error("Auto-creating guest profile failed:", e);
          }
        }

        if (matched) {
          setGuestProfile(matched);
          const [resData, ordersData, invoicesData] = await Promise.all([
            getReservationsByGuest(matched.guestId).catch(() => []),
            getOrdersByGuest(matched.guestId).catch(() => []),
            getByGuest(matched.guestId).catch(() => []),
          ]);
          setGuestReservations(resData);
          setGuestOrders(ordersData);
          setGuestInvoices(invoicesData);
        } else {
          toast.error("Please complete your profile to access your dashboard.");
          navigate("/profile");
        }
      } catch (err) {
        console.error("Guest dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (email) fetchGuest();
  }, [email, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={36} />
          <p className="text-sm text-black">Loading hotel dashboard logs...</p>
        </div>
      </div>
    );
  }

  const activeStay = guestReservations.find((r) => r.status === "CHECKED_IN");
  const upcomingStay = guestReservations.find((r) => r.status === "BOOKED");
  const unpaidInvoicesTotal = guestInvoices
    .filter((i) => i.status === "UNPAID")
    .reduce((sum, item) => sum + item.totalAmount, 0);

  const getTierColor = (tier: string) => {
    // Use solid white background with dark text for the loyalty pass
    return "bg-white text-black";
  };

  return (
    <div className="guest-dashboard-container p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 shadow-sm relative overflow-hidden text-white">
        <div className="space-y-2 relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back, {guestProfile?.name || user?.fullName}
          </h2>
          <p className="text-sm text-indigo-100 max-w-xl">
            We are delighted to host your stay here at HospEase. Explore your stay details, order room service, or manage payments seamlessly.
          </p>
        </div>

        {guestProfile && (
          <div className={`loyalty-pill ${getTierColor(guestProfile.loyaltyTier)} px-5 py-3 rounded-2xl flex items-center gap-3 font-semibold shadow-lg`}>
            <Award size={20} className="text-black" />
            <div className="text-xs">
              <span className="block opacity-75 text-[10px] uppercase font-bold tracking-widest leading-none text-black">Loyalty Pass</span>
              <span className="text-sm uppercase tracking-wide text-black">{guestProfile.loyaltyTier} MEMBER</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Active Stay</h3>
              <Key size={18} className="text-indigo-500 animate-pulse" />
            </div>
            {activeStay ? (
              <div className="space-y-3">
                <div>
                  <span className="text-2xl font-black text-slate-100">Room {activeStay.roomNumber || activeStay.roomId}</span>
                  <span className="block text-xs text-indigo-600 mt-0.5">Checked In</span>
                </div>
                <div className="text-xs text-black space-y-1">
                  <div>Check-In: {new Date(activeStay.checkInDate).toLocaleDateString()}</div>
                  <div>Check-Out: {new Date(activeStay.checkOutDate).toLocaleDateString()}</div>
                </div>
              </div>
            ) : (
              <div className="text-black text-sm py-4">No active stay currently checked in.</div>
            )}
          </div>
          {activeStay && (
            <button onClick={() => navigate("/reservations")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition">
              <span>View stay history</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Room Service Orders</h3>
              <Coffee size={18} className="text-indigo-500" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-black text-slate-100">{guestOrders.length} Orders</div>
              <div className="text-xs text-black">Pending requests: {guestOrders.filter((o) => !o.fulfilled).length}</div>
            </div>
          </div>
          <button onClick={() => navigate("/orders")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition">
            <span>Order room service</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">Outstanding Balance</h3>
              <CreditCard size={18} className="text-indigo-500" />
            </div>
            <div className="space-y-2">
              <div className={`text-2xl font-black ${unpaidInvoicesTotal > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                {unpaidInvoicesTotal.toFixed(2)} INR
              </div>
              <div className="text-xs text-black">Unsettled invoices: {guestInvoices.filter((i) => i.status === "UNPAID").length}</div>
            </div>
          </div>
          <button onClick={() => navigate("/billing")} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition">
            <span>Pay invoices online</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {!activeStay && upcomingStay && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex justify-between items-center text-slate-100 shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Upcoming Lodging Reservation</span>
            <h4 className="text-base font-bold text-slate-100">Room {upcomingStay.roomNumber || upcomingStay.roomId}</h4>
            <p className="text-xs text-black">Arriving {new Date(upcomingStay.checkInDate).toLocaleDateString()}</p>
          </div>
          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-lg text-xs font-bold uppercase">CONFIRMED</span>
        </div>
      )}
    </div>
  );
};

export default GuestDashboard;