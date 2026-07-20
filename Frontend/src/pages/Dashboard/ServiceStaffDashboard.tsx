import React from "react";
import { User } from "../../models/users";
import { Reservation } from "../../models/reservation";
import { Housekeeping } from "../../models/housekeeping";
import { ServiceOrder } from "../../models/serviceOrder";
import { Bed, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import StatCard from "../../components/StatCard";
import "./DashboardPage.css";

interface Props {
  user: User | null;
  allReservations: Reservation[];
  allServiceOrders: ServiceOrder[];
  allHk: Housekeeping[];
}

const ServiceStaffDashboard: React.FC<Props> = ({ user, allReservations, allServiceOrders, allHk }) => {
  const staffOrders = allServiceOrders.filter((o) =>
    Boolean(
      user && (o.assignedStaffId === user.userId || o.assignedStaffName === user.email || o.assignedStaffName === user.fullName)
    )
  );

  const staffHk = allHk.filter((h) => Boolean(user && h.assignedStaffId === user.userId));

  const totalBookingsCount = allReservations.length;
  // Overall counts across all service orders (guest requests and admin fulfillments)
  const requestedServicesCount = allServiceOrders.filter((order) => {
    const normalized = String(order.status || "").trim().toUpperCase();
    if (normalized === "CANCELLED") return false;
    return !Boolean(order.fulfilled);
  }).length;

  const completedServicesCount = allServiceOrders.filter((order) => {
    const normalized = String(order.status || "").trim().toUpperCase();
    return Boolean(order.fulfilled) || normalized === "FULFILLED" || normalized === "COMPLETED" || normalized === "DONE";
  }).length;

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 shadow-sm text-white">
        <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Bed className="text-violet-200" size={24} />
          <span>Service Staff Room Dashboard</span>
        </h3>
        <p className="text-sm text-violet-100 mt-1 max-w-xl">
          Welcome to your service workspace. Manage your assigned service orders and cleaning tasks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Bookings" value={totalBookingsCount.toString()} subtext="All logged stays" icon={Calendar} color="indigo" />
        <StatCard title="Requested Services" value={requestedServicesCount.toString()} subtext="Pending service requests" icon={Sparkles} color="amber" />
        <StatCard title="Completed Services" value={completedServicesCount.toString()} subtext="Fulfilled service requests" icon={ShieldCheck} color="emerald" />
      </div>

      {/* Per-staff pending vs completed table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-850 pb-3">Service Orders — Per Staff</h3>
        <p className="text-sm text-slate-400 mb-4">Pending vs Completed counts based on assigned staff</p>

        {/* compute aggregation */}
        {(() => {
          const map: Record<string, { displayName: string; pending: number; completed: number }> = {};
          allServiceOrders.forEach((o) => {
            const normalized = String(o.status || "").trim().toUpperCase();
            // treat CANCELLED as neither pending nor completed
            if (normalized === "CANCELLED") return;

            const assignedKey = o.assignedStaffName && String(o.assignedStaffName).trim() !== ""
              ? String(o.assignedStaffName).trim()
              : o.assignedStaffId
              ? `Staff #${o.assignedStaffId}`
              : "Unassigned";

            if (!map[assignedKey]) map[assignedKey] = { displayName: assignedKey, pending: 0, completed: 0 };

            const isCompleted = Boolean(o.fulfilled) || normalized === "FULFILLED" || normalized === "COMPLETED" || normalized === "DONE";
            if (isCompleted) map[assignedKey].completed += 1;
            else map[assignedKey].pending += 1;
          });

          const rows = Object.values(map).sort((a, b) => b.pending - a.pending || b.completed - a.completed);

          return rows.length === 0 ? (
            <div className="py-6 text-center text-slate-500">No service order assignments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold text-black uppercase">
                    <th className="py-3">Staff</th>
                    <th className="py-3 text-right">Pending</th>
                    <th className="py-3 text-right">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rows.map((r) => (
                    <tr key={r.displayName} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-300">{r.displayName}</td>
                      <td className="py-3.5 text-right text-slate-300 font-semibold">{r.pending}</td>
                      <td className="py-3.5 text-right text-slate-300 font-semibold">{r.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Active room cleaning tasks removed from service staff dashboard */}
    </div>
  );
};

export default ServiceStaffDashboard;
