import React, { useEffect, useState } from "react";
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../../services/scheduleService";
import { getAllStaff } from "../../services/staffService";
import { StaffSchedule, ShiftType, StaffScheduleStatus } from "../../models/schedule";
import { Staff } from "../../models/staff";
import { Plus, Search, Clock, Calendar, Check, X, Loader2, User, HelpCircle, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import "./SchedulesPage.css";

export const SchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null);
  const [form, setForm] = useState({
    staffId: "",
    shiftDate: "",
    startTime: "",
    endTime: "",
    shiftType: "MORNING" as ShiftType,
    status: "SCHEDULED" as StaffScheduleStatus,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedData, staffData] = await Promise.all([
        getAllSchedules(),
        getAllStaff().catch(() => []),
      ]);
      setSchedules(schedData);
      setStaffList(staffData);
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff shifts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingSchedule(null);
    setForm({
      staffId: "",
      shiftDate: "",
      startTime: "",
      endTime: "",
      shiftType: "MORNING",
      status: "SCHEDULED",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sched: StaffSchedule) => {
    setEditingSchedule(sched);
    setForm({
      staffId: sched.staffId.toString(),
      shiftDate: sched.shiftDate,
      startTime: sched.startTime.substring(0, 5), // Keep only HH:MM
      endTime: sched.endTime.substring(0, 5),     // Keep only HH:MM
      shiftType: sched.shiftType,
      status: sched.status,
      notes: sched.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staffId || !form.shiftDate || !form.startTime || !form.endTime) {
      toast.error("Please fill in all shift details.");
      return;
    }

    const staffId = Number(form.staffId);
    if (!Number.isInteger(staffId) || staffId <= 0) {
      toast.error("Please select a valid staff member.");
      return;
    }

    const shiftDateObj = new Date(form.shiftDate);
    if (Number.isNaN(shiftDateObj.getTime())) {
      toast.error("Please select a valid shift date.");
      return;
    }

    if (form.startTime >= form.endTime) {
      toast.error("Shift end time must be after start time.");
      return;
    }

    setSubmitting(true);
    // Append seconds ":00" to match LocalTime (HH:MM:SS) expected by backend
    const formattedStartTime = form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime;
    const formattedEndTime = form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime;

    const payload = {
      staffId,
      shiftDate: form.shiftDate,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      shiftType: form.shiftType,
      status: form.status,
      notes: form.notes,
    };

    try {
      if (editingSchedule) {
        if (editingSchedule.id === undefined || editingSchedule.id === null) {
          toast.error("Cannot update this shift: missing schedule id.");
          return;
        }
        await updateSchedule(editingSchedule.id, payload);
        toast.success("Shift schedule updated successfully!");
      } else {
        await createSchedule(payload);
        toast.success("Work shift scheduled successfully!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize shift schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatusOnly = async (sched: StaffSchedule, newStatus: StaffScheduleStatus) => {
    try {
      if (sched.id === undefined || sched.id === null) {
        toast.error("Cannot update shift status: missing schedule id.");
        return;
      }
      const payload = {
        staffId: sched.staffId,
        shiftDate: sched.shiftDate,
        startTime: sched.startTime,
        endTime: sched.endTime,
        shiftType: sched.shiftType,
        status: newStatus,
        notes: sched.notes || "",
      };
      await updateSchedule(sched.id, payload);
      toast.success(`Shift status changed to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update shift status.");
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scheduled shift?")) return;
    try {
      if (id === undefined || id === null) {
        toast.error("Cannot delete shift: missing schedule id.");
        return;
      }
      await deleteSchedule(id);
      toast.success("Shift schedule removed.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove shift.");
    }
  };

  const getShiftTypeColor = (type: ShiftType) => {
    switch (type) {
      case "MORNING":
        return "bg-amber-500/10 text-amber-600 border-2 border-amber-500/60";
      case "AFTERNOON":
        return "bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/40";
      case "NIGHT":
        return "bg-purple-500/10 text-purple-400 border-2 border-purple-500/40";
      default:
        return "bg-slate-500/10 text-slate-400 border-2 border-slate-500/20";
    }
  };

  const getStatusColor = (status: StaffScheduleStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/60";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-2 border-rose-500/40";
      default: // SCHEDULED
        return "bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/40";
    }
  };

  const getStaffRole = (staffId: number) => {
    const staff = staffList.find((s) => s.staffId === staffId);
    return staff?.role || "Property Staff";
  };

  const filteredSchedules = schedules.filter((s) => {
    const sName = s.staffName || `Staff #${s.staffId}`;
    const notesStr = s.notes || "";
    return (
      sName.toLowerCase().includes(search.toLowerCase()) ||
      notesStr.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">Staff Shift Planner</h3>
          <p className="text-xs text-slate-400">Plan shifts, assign work times, and track coordinator notes</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 border-2 border-indigo-700/60"
        >
          <Plus size={16} />
          <span>Plan Work Shift</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search shift logs by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Grid view of schedules */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No shifts scheduled in ledger.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map((sched) => (
            <div
              key={sched.id}
              className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 space-y-4 shadow hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
            >
              {/* Header card details */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-200 text-base">
                    {sched.staffName || `Employee ID #${sched.staffId}`}
                  </h4>
                  <span className="text-xs text-slate-300 font-semibold tracking-wider block mt-1">
                    Role: {getStaffRole(sched.staffId)}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(sched)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#4f46e5] text-white border-2 border-[#4338ca] hover:bg-[#4338ca] transition text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteShift(sched.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#dc2626] text-white border-2 border-[#b91c1c] hover:bg-[#b91c1c] transition text-xs font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Time Slot Details */}
              <div className="space-y-2 text-sm text-slate-200 bg-slate-950/60 border border-slate-800/60 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="font-semibold">Date: {new Date(sched.shiftDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-semibold">Hours: {sched.startTime.substring(0, 5)} - {sched.endTime.substring(0, 5)}</span>
                </div>
              </div>

              {/* Notes */}
              {sched.notes && (
                <p className="text-xs text-slate-400 italic bg-slate-950/30 p-2 border border-dashed border-slate-800 rounded-lg">
                  "{sched.notes}"
                </p>
              )}

              {/* Action buttons and badges */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/40">
                <div className="flex gap-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${getShiftTypeColor(
                      sched.shiftType
                    )}`}
                  >
                    {sched.shiftType}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold tracking-wider ${getStatusColor(
                      sched.status
                    )}`}
                  >
                    {sched.status}
                  </span>
                </div>

                {sched.status === "SCHEDULED" && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdateStatusOnly(sched, "COMPLETED")}
                      className="p-1 text-[#16a34a] border-2 border-[#16a34a]/30 rounded"
                      title="Mark complete"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleUpdateStatusOnly(sched, "CANCELLED")}
                      className="p-1 text-[#dc2626] border-2 border-[#dc2626]/30 rounded"
                      title="Cancel shift"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Shift Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? "Modify Shift Schedule" : "Plan Employee Shift"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Staff Member
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                name="staffId"
                value={form.staffId}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Select staff member...</option>
                {staffList.map((s) => (
                  <option key={s.staffId} value={s.staffId}>
                    {s.userName || `Staff #${s.staffId}`} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Shift Date
              </label>
              <input
                type="date"
                name="shiftDate"
                value={form.shiftDate}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Shift Type Category
              </label>
              <select
                name="shiftType"
                value={form.shiftType}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="MORNING">MORNING</option>
                <option value="AFTERNOON">AFTERNOON</option>
                <option value="NIGHT">NIGHT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={form.endTime}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Shift Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Coordinator Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Cover receptionist shift, clean lobby area..."
              value={form.notes}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4 border-2 border-indigo-700/60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Scheduling shift...</span>
              </>
            ) : (
              <span>Schedule Shift</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SchedulesPage;
