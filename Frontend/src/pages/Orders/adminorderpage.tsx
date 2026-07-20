import React, { useEffect, useState } from "react";
import { getAdminOrders, adminAssignStaff, adminUpdateStatus } from "../../services/serviceOrderService";
import { getAllStaff } from "../../services/staffService";
import { Staff } from "../../models/staff";
import { Search, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../AuthContext";
import "./OrdersPage.css";

const AdminOrderPage: React.FC = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 5;
  const [selectedStaffByOrder, setSelectedStaffByOrder] = useState<Record<number, string>>({});
  const [assignedStaffNameByOrder, setAssignedStaffNameByOrder] = useState<Record<number, string>>({});
  const [inactiveAssignedStaffIds, setInactiveAssignedStaffIds] = useState<number[]>([]);

  const email = user?.email || "";
  const canAssignStaff = role !== "SERVICE_STAFF";

  const fetchOrdersAndData = async () => {
    try {
      setLoading(true);
      const staffData = await getAllStaff().catch(() => []);
      const serviceStaffOnly = (staffData || []).filter((staff: Staff) => {
        const role = String(staff.role || "").toUpperCase();
        const status = String(staff.status || "").toUpperCase();
        return role === "SERVICE_STAFF" && status === "ACTIVE" && !inactiveAssignedStaffIds.includes(staff.staffId);
      });
      setStaffList(serviceStaffOnly);

      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (staffFilter) params.staffId = Number(staffFilter);

      const adminOrders = await getAdminOrders(params).catch(() => []);
      setOrders(adminOrders);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load admin service orders.");
    } finally {
      setLoading(false);
    }
  };

  const getDetailsDisplay = (jsonStr: any) => {
    if (!jsonStr && jsonStr !== "") return "";
    // If it's already a plain string like 'gym', return it
    if (typeof jsonStr === "string") {
      // Try JSON parse first
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed == null) return "";
        if (typeof parsed === "string") return parsed;
        if (parsed.details) return String(parsed.details);
        // If object with values, join them
        const vals = Object.values(parsed).filter((v) => v != null && v !== "");
        if (vals.length === 1) return String(vals[0]);
        if (vals.length > 1) return vals.join(", ");
      } catch {
        // Not valid JSON; attempt to strip braces and key names like '{ details : gym }'
        const stripped = jsonStr.replace(/^[\{\s]+|[\}\s]+$/g, "");
        // remove 'details' key if present
        const afterKey = stripped.replace(/details\s*[:=]\s*/i, "");
        // remove quotes
        const cleaned = afterKey.replace(/^\s*["']?|["']?\s*$/g, "").trim();
        return cleaned;
      }
    }
    // If it's an object already
    if (typeof jsonStr === "object") {
      if (jsonStr.details) return String((jsonStr as any).details);
      const vals = Object.values(jsonStr).filter((v) => v != null && v !== "");
      return vals.length > 0 ? String(vals[0]) : "";
    }
    return String(jsonStr);
  };

  useEffect(() => {
    if (email) fetchOrdersAndData();
    // reset to first page when filters/search change
    setCurrentPage(1);
  }, [email, statusFilter, staffFilter, inactiveAssignedStaffIds]);

  const handleAssign = async (orderId: number) => {
    const selectedStaffId = Number(selectedStaffByOrder[orderId]);
    if (!selectedStaffId) {
      toast.error("Please select an active service staff member.");
      return;
    }

    const selectedStaff = staffList.find((s) => s.staffId === selectedStaffId);
    if (!selectedStaff) {
      toast.error("Selected staff is no longer available.");
      return;
    }

    try {
      setLoading(true);
      await adminAssignStaff(orderId, selectedStaffId);

      setSelectedStaffByOrder((prev) => ({ ...prev, [orderId]: "" }));
      setAssignedStaffNameByOrder((prev) => ({
        ...prev,
        [orderId]: selectedStaff.userName || `Staff #${selectedStaff.staffId}`,
      }));
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                assignedStaffId: selectedStaffId,
                assignedStaffName: selectedStaff.userName || `Staff #${selectedStaff.staffId}`,
                staffName: selectedStaff.userName || `Staff #${selectedStaff.staffId}`,
              }
            : order
        )
      );
      setInactiveAssignedStaffIds((prev) => (prev.includes(selectedStaffId) ? prev : [...prev, selectedStaffId]));
      setStaffList((prev) => prev.filter((s) => s.staffId !== selectedStaffId));
      toast.success("Service staff assigned and marked inactive.");
      fetchOrdersAndData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign staff.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      setLoading(true);
      await adminUpdateStatus(orderId, status);
      toast.success("Order status updated");
      fetchOrdersAndData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    const guestName = (o.guestName || "").toLowerCase();
    const room = (o.roomNumber || "").toLowerCase();
    const desc = (getDetailsDisplay(o.details || o.detailsJson) || "").toLowerCase();
    return (
      guestName.includes(search.toLowerCase()) ||
      room.includes(search.toLowerCase()) ||
      desc.includes(search.toLowerCase())
    );
  });

  // Pagination: slice the filteredOrders to current page
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusTextColor = (status: string) => {
    const normalized = (status || "").toUpperCase().replace(/\s+/g, "_");

    switch (normalized) {
      case "IN_PROGRESS":
        return "text-[#fbbf24]";
      case "NEEDS_CLEANING":
      case "CANCELLED":
        return "text-[#dc2626]";
      case "CLEAN_AND_READY":
      case "FULFILLED":
        return "text-[#16a34a]";
      case "PENDING":
        return "text-[#4f46e5]";
      default:
        return "text-[#475569]";
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Service Orders — Admin</h3>
          <p className="text-xs text-slate-400">View guest requests and assign staff</p>
        </div>
      </div>

      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4 gap-4 flex-col sm:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Search orders by guest, room, or details..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
        </div>

        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300">
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {canAssignStaff && (
            <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300">
              <option value="">All Service Staff</option>
              {staffList.map((s) => (
                <option key={s.staffId} value={s.staffId}>{s.userName || `Staff #${s.staffId}`}</option>
              ))}
            </select>
          )}

          {/* global admin search removed */}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">No service orders recorded.</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-100 uppercase">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Assigned Staff</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {paginatedOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-300">#{ord.orderId}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">{ord.guestName}</td>
                     <td className="px-6 py-4 text-sm font-semibold text-slate-300">{ord.roomNumber}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-300">{ord.serviceType}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-300 max-w-xs break-words">{getDetailsDisplay(ord.details || ord.detailsJson) || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                      {assignedStaffNameByOrder[ord.orderId] || ord.staffName || ord.assignedStaffName || 'Unassigned'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${getStatusTextColor(ord.status)}`}>
                      {ord.status}
                    </td>
                    <td className="px-6 py-4 text-right flex flex-col gap-2 items-end">
                      {canAssignStaff && (
                        <>
                          <select
                            value={selectedStaffByOrder[ord.orderId] || ""}
                            onChange={(e) => setSelectedStaffByOrder((prev) => ({ ...prev, [ord.orderId]: e.target.value }))}
                             className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-2 text-sm font-semibold text-slate-300 w-40"
                          >
                            <option value="">Select service staff</option>
                            {staffList.map((s) => (
                              <option key={s.staffId} value={s.staffId}>
                                {s.userName || `Staff #${s.staffId}`}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => handleAssign(ord.orderId)} className="inline-flex items-center justify-center gap-1 bg-[#4f46e5] text-white border border-[#4338ca] hover:bg-[#4338ca] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition w-40">Assign Staff</button>
                        </>
                      )}
                      {ord.status !== 'FULFILLED' && (
                        <button onClick={() => handleUpdateStatus(ord.orderId, 'FULFILLED')} className="inline-flex items-center justify-center gap-1 bg-[#16a34a] text-white border border-[#15803d] hover:bg-[#15803d] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition w-40">Mark Done</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          {filteredOrders.length > PAGE_SIZE && (
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900">
              <div className="text-sm text-slate-400">Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredOrders.length)} - {Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50"
                >
                  Prev
                </button>

                {/* Simple page numbers */}
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 rounded-lg ${page === currentPage ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrderPage;
