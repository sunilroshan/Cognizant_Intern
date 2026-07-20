import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { getAllGuests } from "../../services/guestService";
import { getAllRooms } from "../../services/roomService";
import { getAllReservations } from "../../services/reservationService";
import { getAllRecords } from "../../services/housekeepingService";
import { getAdminOrders } from "../../services/serviceOrderService";
import { Guest } from "../../models/guest";
import { Room } from "../../models/room";
import { Reservation } from "../../models/reservation";
import { Housekeeping } from "../../models/housekeeping";
import { ServiceOrder } from "../../models/serviceOrder";
import { Users, Bed, Calendar, Sparkles, Loader2, TrendingUp, ShieldCheck } from "lucide-react";
import ServiceStaffDashboard from "./ServiceStaffDashboard";
import StatCard from "../../components/StatCard";
import GuestDashboard from "./GuestDashboard";
import "./DashboardPage.css";

export const DashboardPage: React.FC = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [allGuests, setAllGuests] = useState<Guest[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [allHk, setAllHk] = useState<Housekeeping[]>([]);
  const [allServiceOrders, setAllServiceOrders] = useState<ServiceOrder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gList, rList, resList, hkList] = await Promise.all([
          getAllGuests().catch(() => []),
          getAllRooms().catch(() => []),
          getAllReservations().catch(() => []),
          getAllRecords().catch(() => []),
        ]);

        const serviceOrders = await getAdminOrders().catch(() => []);
        setAllGuests(gList);
        setAllRooms(rList);
        setAllReservations(resList);
        setAllHk(hkList);
        setAllServiceOrders(Array.isArray(serviceOrders) ? serviceOrders : []);
      } catch (err) {
        console.error("Dashboard fetching error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-indigo-500 mx-auto" size={36} />
          <p className="text-sm text-slate-400">Loading hotel dashboard logs...</p>
        </div>
      </div>
    );
  }

  // If the current user is a guest, render the guest dashboard
  if (role === "GUEST") {
    return <GuestDashboard />;
  }

  // Housekeeping Staff Dashboard
  if (role === "HOUSEKEEPING_STAFF") {
    const normalizeStatus = (status: string | undefined | null) =>
      String(status || "").trim().toUpperCase().replace(/\s+/g, "_");

    const totalRoomsCount = allRooms.length;
    const cleanRoomsCount = allRooms.filter((r) => {
      const normalized = normalizeStatus(r.availabilityStatus);
      return normalized === "AVAILABLE" || normalized === "CLEAN_READY" || normalized === "CLEAN";
    }).length;
    const needsCleaningRooms = allRooms.filter((r) => {
      const normalized = normalizeStatus(r.availabilityStatus);
      return normalized === "NEEDS_CLEANING" || normalized === "CLEANING_REQUIRED";
    });

    return (
      <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 shadow-sm text-white">
          <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="text-indigo-200" size={24} />
            <span>Housekeeping Tasks Dashboard</span>
          </h3>
          <p className="text-sm text-indigo-100 mt-1 max-w-xl">
            Welcome to the housekeeping interface. Clean vacant rooms and mark them as ready for guests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Rooms" value={totalRoomsCount.toString()} subtext="Hotel room count" icon={Bed} color="indigo" />
          <StatCard title="Clean & Ready" value={cleanRoomsCount.toString()} subtext="Available for booking" icon={ShieldCheck} color="emerald" />
          <StatCard title="Needs Cleaning" value={needsCleaningRooms.length.toString()} subtext="Pending service" icon={Sparkles} color="amber" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-850 pb-3">Rooms Requiring Cleaning</h3>
          {needsCleaningRooms.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">All rooms are clean and ready.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold text-slate-200 uppercase">
                      <th className="py-3">Room Number</th>
                      <th className="py-3">Room Type</th>
                      <th className="py-3">Max Capacity</th>
                      <th className="py-3 text-right">Action Needed</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {needsCleaningRooms.map((r) => (
                    <tr key={r.roomId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-300">Room {r.roomNumber}</td>
                      <td className="py-3.5 text-sm font-semibold text-slate-300">{r.roomType}</td>
                      <td className="py-3.5 text-sm font-semibold text-slate-300">{r.capacity} Guests</td>
                      <td className="py-3.5 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/10 text-amber-400 border-2 border-amber-500/40">Needs Cleaning</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (role === "SERVICE_STAFF") {
    return (
      <ServiceStaffDashboard
        user={user}
        allReservations={allReservations}
        allServiceOrders={allServiceOrders}
        allHk={allHk}
      />
    );
  }

  // Finance Officer / Auditor Dashboard
  if (role === "FINANCE_OFFICER" || role === "AUDITOR") {
    const totalReservations = allReservations.length;
    const checkedOutReservations = allReservations.filter((r) => r.status === "CHECKED_OUT").length;
    const checkedInReservations = allReservations.filter((r) => r.status === "CHECKED_IN").length;
    
    return (
      <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 shadow-sm text-white">
          <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="text-emerald-200" size={24} />
            <span>Finance & Billing Ledger Overview</span>
          </h3>
            <p className="text-sm text-black mt-1 max-w-xl">
            Welcome to the financial manager workspace. Oversee guest checkout invoices, payment collections, and room stay rates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Bookings" value={totalReservations.toString()} subtext="Cumulative stays logged" icon={Calendar} color="indigo" />
          <StatCard title="Checked-In Stays" value={checkedInReservations.toString()} subtext="Active leases accruing bills" icon={Bed} color="violet" />
          <StatCard title="Checked-Out" value={checkedOutReservations.toString()} subtext="Stays requiring final invoice" icon={ShieldCheck} color="emerald" />
          <StatCard title="Loyalty Guests" value={allGuests.length.toString()} subtext="Total registered guest profiles" icon={Users} color="amber" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-black mb-4 border-b border-slate-850 pb-3">Active Guest Stays (Invoicing Candidates)</h3>
          {allReservations.filter(r => r.status === "CHECKED_IN" || r.status === "CHECKED_OUT").length === 0 ? (
            <div className="py-8 text-center text-black text-sm">No stays currently checking in or out.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-black">
                <thead>
                  <tr className="border-b border-slate-800 text-sm font-bold text-black uppercase">
                    <th className="py-3">Res ID</th>
                    <th className="py-3">Guest Name</th>
                    <th className="py-3">Room Number</th>
                    <th className="py-3">Duration</th>
                    <th className="py-3 text-right">Checkout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allReservations.filter(r => r.status === "CHECKED_IN" || r.status === "CHECKED_OUT").map((res) => (
                    <tr key={res.resId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-mono text-sm text-slate-400 font-semibold">#{res.resId}</td>
                      <td className="py-3.5 text-slate-400 font-semibold">{res.guestName || `Guest #${res.guestId}`}</td>
                      <td className="py-3.5 font-mono text-sm text-slate-400 font-semibold">Room {res.roomNumber || res.roomId}</td>
                      <td className="py-3.5 text-sm text-slate-400 font-semibold">
                        {new Date(res.checkInDate).toLocaleDateString()} - {new Date(res.checkOutDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-flex w-28 justify-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.status === "CHECKED_IN" ? "bg-[#16a34a] text-white border border-[#16a34a]/20" : res.status === "CHECKED_OUT" ? "bg-[#fbbf24] text-white border border-[#fbbf24]/20" : res.status === "BOOKED" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-[#dc2626] text-white border border-[#dc2626]/20"
                        }`}>{res.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- ADMIN/STAFF VIEW RENDER ---
  const activeGuestsCount = allGuests.filter((g) => g.status === "ACTIVE").length;
  const totalRoomsCount = allRooms.length;
  const availableRoomsCount = allRooms.filter((r) => r.availabilityStatus === "AVAILABLE").length;
  const occupiedRoomsCount = allRooms.filter((r) => r.availabilityStatus === "OCCUPIED" || r.availabilityStatus === "BOOKED").length;
  const occupancyRate = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;
  const activeReservationsCount = allReservations.filter((r) => r.status === "CHECKED_IN").length;
  const pendingCleanCount = allHk.filter((h) => h.cleaningStatus === "needs cleaning" || h.cleaningStatus === "NEEDS_CLEANING").length;

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" size={24} />
              <span>Operations Control Center</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Welcome to the HospEase administrative console. View real-time room occupancy, pending cleaning orders, and check-in schedules.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4">
            <TrendingUp className="text-emerald-600" size={24} />
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Occupancy Rate</div>
              <div className="text-xl font-bold text-slate-100">{occupancyRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Guests"
          value={activeGuestsCount.toString()}
          subtext={`Out of ${allGuests.length} total registered`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Available Rooms"
          value={`${availableRoomsCount} / ${totalRoomsCount}`}
          subtext="Ready for walk-in booking"
          icon={Bed}
          color="emerald"
        />
        <StatCard
          title="Checked-In Now"
          value={activeReservationsCount.toString()}
          subtext="Active reservation logs"
          icon={Calendar}
          color="violet"
        />
        <StatCard
          title="Needs Cleaning"
          value={pendingCleanCount.toString()}
          subtext="Housekeeping queue size"
          icon={Sparkles}
          color="amber"
        />
      </div>

      {/* Tables/Overview Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Reservations Table */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-855 pb-3">
            <h3 className="text-lg font-bold text-slate-100">Recent Reservation Activity</h3>
            <span className="text-xs text-indigo-600 font-semibold uppercase">Realtime Feed</span>
          </div>

          {allReservations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No recent reservations logged in system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-sm font-bold text-black uppercase">
                    <th className="py-3">Room</th>
                    <th className="py-3">Guest</th>
                    <th className="py-3">Check-In</th>
                    <th className="py-3">Check-Out</th>
                    <th className="py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {allReservations.slice(0, 5).map((res) => (
                    <tr key={res.resId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 text-sm text-slate-400 font-semibold">Room {res.roomNumber || res.roomId}</td>
                      <td className="py-3.5 text-sm text-slate-400 font-semibold">{res.guestName || `Guest #${res.guestId}`}</td>
                      <td className="py-3.5 text-sm text-slate-400 font-semibold">{new Date(res.checkInDate).toLocaleDateString()}</td>
                      <td className="py-3.5 text-sm text-slate-400 font-semibold">{new Date(res.checkOutDate).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex w-28 justify-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            res.status === "CHECKED_IN"
                              ? "bg-[#16a34a] text-white border border-[#16a34a]/20"
                              : res.status === "BOOKED"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : res.status === "CHECKED_OUT"
                              ? "bg-[#fbbf24] text-white border border-[#fbbf24]/20"
                              : "bg-[#dc2626] text-white border border-[#dc2626]/20"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Room Status Breakdown Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-855 pb-3">
            Room Status Board
          </h3>
          {allRooms.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No rooms registered.
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Available", count: availableRoomsCount, color: "bg-emerald-500" },
                { label: "Occupied / Booked", count: occupiedRoomsCount, color: "bg-indigo-500" },
                {
                  label: "Needs Cleaning",
                  count: allRooms.filter((r) => r.availabilityStatus === "NEEDS_CLEANING").length,
                  color: "bg-amber-500",
                },
                {
                  label: "Under Maintenance",
                  count: allRooms.filter((r) => r.availabilityStatus === "MAINTENANCE").length,
                  color: "bg-rose-500",
                },
              ].map((status, i) => {
                const percentage = totalRoomsCount > 0 ? (status.count / totalRoomsCount) * 100 : 0;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">{status.label}</span>
                      <span className="text-slate-200 font-semibold">{status.count} rooms</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${status.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


