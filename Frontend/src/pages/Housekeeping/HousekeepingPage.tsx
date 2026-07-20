import React, { useEffect, useState } from "react";
import { getAllRecords, addRecord, updateStatus } from "../../services/housekeepingService";
import { getAllRooms } from "../../services/roomService";
import { getAllStaff } from "../../services/staffService";
import { Housekeeping } from "../../models/housekeeping";
import { Room } from "../../models/room";
import { Staff } from "../../models/staff";
import { Plus, Search, Sparkles, User, Key, Loader2, Play, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import "./HousekeepingPage.css";

export const HousekeepingPage: React.FC = () => {
  const [records, setRecords] = useState<Housekeeping[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    roomId: "",
    assignedStaffId: "",
    cleaningStatus: "NEEDS_CLEANING",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recData, roomData, staffData] = await Promise.all([
        getAllRecords(),
        getAllRooms().catch(() => []),
        getAllStaff().catch(() => []),
      ]);
      setRecords(recData);
      setRooms(roomData);
      
      // Filter staff list to only show housekeeping-related staff by role
      const cleanStaff = staffData.filter(
        (s: Staff) => s.role === "HOUSEKEEPING_STAFF"
      );
      setStaffList(cleanStaff);
    } catch (err: any) {
      toast.error(err.message || "Failed to load housekeeping operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setForm({
      roomId: "",
      assignedStaffId: "",
      cleaningStatus: "NEEDS_CLEANING",
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomId || !form.assignedStaffId) {
      toast.error("Please select a room and staff member.");
      return;
    }

    const roomId = Number(form.roomId);
    const assignedStaffId = Number(form.assignedStaffId);
    if (!Number.isInteger(roomId) || roomId <= 0) {
      toast.error("Please select a valid room.");
      return;
    }
    if (!Number.isInteger(assignedStaffId) || assignedStaffId <= 0) {
      toast.error("Please select a valid staff member.");
      return;
    }

    const allowedStatuses = ["NEEDS_CLEANING", "IN_PROGRESS", "CLEAN_READY"];
    if (!allowedStatuses.includes(form.cleaningStatus)) {
      toast.error("Please select a valid cleaning status.");
      return;
    }

    setSubmitting(true);
    const payload = {
      roomId,
      assignedStaffId,
      cleaningStatus: form.cleaningStatus,
    };

    try {
      await addRecord(payload);
      toast.success("Housekeeping task assigned!");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create housekeeping task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (record: Housekeeping, newStatus: string) => {
    try {
      await updateStatus(record.hkId, {
        roomId: record.roomId,
        assignedStaffId: record.assignedStaffId,
        cleaningStatus: newStatus,
      });
      toast.success(`Task status updated to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update cleaning task status.");
    }
  };

  const getStatusColor = (status: string) => {
    const formatted = status.toUpperCase();
    if (formatted === "CLEAN_READY" || formatted === "CLEAN" || formatted === "COMPLETED") {
      return "bg-emerald-700 text-white border border-emerald-800";
    }
    if (formatted === "IN_PROGRESS" || formatted === "CLEANING" || formatted === "CLEANING_IN_PROGRESS" || formatted === "CLEANING IN PROGRESS") {
      return "bg-indigo-700 text-white border border-indigo-800";
    }
    return "bg-amber-700 text-white border border-amber-800";
  };

  const getStatusLabel = (status: string) => {
    const formatted = status.toUpperCase();
    if (formatted === "CLEAN_READY" || formatted === "CLEAN" || formatted === "COMPLETED") return "Clean & Ready";
    if (formatted === "IN_PROGRESS" || formatted === "CLEANING_IN_PROGRESS" || formatted === "CLEANING" || formatted === "CLEANING IN PROGRESS") return "In Progress";
    return "Needs Cleaning";
  };

  const filteredRecords = records.filter((rec) => {
    const rNum = rec.roomNumber || `Room #${rec.roomId}`;
    const staff = rec.assignedStaffName || `Staff #${rec.assignedStaffId}`;
    return (
      rNum.toLowerCase().includes(search.toLowerCase()) ||
      staff.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">Housekeeping Dispatch</h3>
          <p className="text-xs text-slate-400">Track and assign room cleaning services</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Assign Cleaning Task</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by room number or cleaner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No active cleaning tasks assigned.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }} className="w-full text-left text-sm text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-100 uppercase">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Room Number</th>
                  <th className="px-6 py-4">Assigned Attendant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Attendant Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredRecords.map((rec) => (
                  <tr key={rec.hkId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-400">
                      #{rec.hkId}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                      Room {rec.roomNumber || rec.roomId}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-400">{rec.assignedStaffName || `Staff #${rec.assignedStaffId || "Unassigned"}`}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                          rec.cleaningStatus
                        )}`}
                      >
                        {getStatusLabel(rec.cleaningStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {rec.cleaningStatus !== "CLEAN_READY" && rec.cleaningStatus !== "CLEAN" && rec.cleaningStatus !== "COMPLETED" && (
                        <>
                          {rec.cleaningStatus !== "IN_PROGRESS" &&
                            rec.cleaningStatus !== "CLEANING" &&
                            rec.cleaningStatus !== "CLEANING_IN_PROGRESS" && (
                              <button
                                onClick={() => handleUpdateStatus(rec, "IN_PROGRESS")}
                                className="inline-flex items-center gap-1 bg-indigo-700 text-white border border-indigo-800 hover:bg-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                              >
                                <Play size={12} />
                                <span>Start Cleaning</span>
                              </button>
                            )}
                          <button
                            onClick={() => handleUpdateStatus(rec, "CLEAN_READY")}
                            className="inline-flex items-center gap-1 bg-emerald-700 text-white border border-emerald-800 hover:bg-emerald-600 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            <CheckCircle size={12} />
                            <span>Mark Clean</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Room Cleaning">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Room
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                name="roomId"
                value={form.roomId}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Select room...</option>
                {rooms.map((r) => (
                  <option key={r.roomId} value={r.roomId}>
                    Room {r.roomNumber} ({r.roomType} - {r.availabilityStatus})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Attendant Staff
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                name="assignedStaffId"
                value={form.assignedStaffId}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Choose housekeeping staff...</option>
                {staffList.map((s) => (
                  <option key={s.staffId} value={s.staffId}>
                    {s.userName || `Staff #${s.staffId}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Initial Cleaning State
            </label>
            <select
              name="cleaningStatus"
              value={form.cleaningStatus}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="NEEDS_CLEANING">NEEDS CLEANING</option>
              <option value="IN_PROGRESS">IN PROGRESS (CLEANING)</option>
              <option value="CLEAN_READY">CLEAN & READY</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating task card...</span>
              </>
            ) : (
              <span>Confirm & Dispatch</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default HousekeepingPage;
