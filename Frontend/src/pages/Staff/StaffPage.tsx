import React, { useEffect, useState } from "react";
import { getAllStaff, createStaff, updateStaff, deleteStaff } from "../../services/staffService";
import { Staff } from "../../models/staff";
import { Plus, Search, Edit2, Trash2, Loader2, User, Mail, Phone, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import "./StaffPage.css";

export const StaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "FRONTDESK_STAFF",
    contact: "",
    email: "",
    status: "ACTIVE",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await getAllStaff();
      setStaffList(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load hotel staff directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setForm({
      name: "",
      role: "FRONTDESK_STAFF",
      contact: "",
      email: "",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    
    // Parse contact
    let contactVal = "";
    let emailVal = "";

    try {
      const parsed = JSON.parse(staff.contactInfoJson);
      contactVal = parsed.phone || "";
      emailVal = parsed.email || "";
    } catch {
      contactVal = staff.contactInfoJson;
    }

    setForm({
      name: staff.userName || "",
      role: staff.role,
      contact: contactVal,
      email: emailVal || "",
      status: staff.status,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role || !form.contact || !form.email) {
      toast.error("Please fill in all staff profile details.");
      return;
    }

    if (form.name.trim().length < 2) {
      toast.error("Staff full name must be at least 2 characters.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid staff email address.");
      return;
    }

    if (!/^\d{10}$/.test(form.contact)) {
      toast.error("Contact phone number must be exactly 10 digits.");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name,
      role: form.role,
      contact: form.contact,
      email: form.email,
      status: form.status,
    };

    try {
      if (editingStaff) {
        await updateStaff(editingStaff.staffId, payload);
        toast.success("Staff profile updated successfully.");
      } else {
        await createStaff(payload);
        toast.success("Staff profile created successfully.");
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Failed to commit staff record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member ${name}?`)) return;
    try {
      await deleteStaff(id);
      toast.success("Staff profile removed successfully.");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff profile.");
    }
  };

  const getPhoneDisplay = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.phone || jsonStr;
    } catch {
      return jsonStr;
    }
  };

  const getEmailDisplay = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.email || "";
    } catch {
      return "";
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const fullName = s.userName || "";
    const email = getEmailDisplay(s.contactInfoJson) || "";
    const role = s.role || "";
    return (
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      role.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Pagination state for staff directory
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5; // show 5 staff per page

  useEffect(() => {
    // reset to first page when filter or staff list changes
    setCurrentPage(1);
  }, [search, staffList]);

  const totalStaff = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalStaff / pageSize));
  const pagedStaff = filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">Staff Registry</h3>
          <p className="text-xs text-slate-400">Total headcount: {staffList.length} employees</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Add Staff Profile</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by full name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No employees found matching search.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-100 uppercase">
                  <th className="px-6 py-4">Staff ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {pagedStaff.map((staff) => (
                  <tr key={staff.staffId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-300">
                      #{staff.staffId}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">
                      <div className="flex flex-col">
                        <span>{staff.userName || `User #${staff.userId}`}</span>
                        <span className="text-xs text-slate-400">{getEmailDisplay(staff.contactInfoJson)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
                      {staff.role}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-300">
                      {getPhoneDisplay(staff.contactInfoJson)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${
                          staff.status === "ACTIVE"
                            ? "text-[#065f46]"
                            : "text-[#dc2626]"
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(staff)}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition"
                        title="Edit profile"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(staff.staffId, staff.userName || `ID #${staff.staffId}`)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition"
                        title="Delete profile"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={totalStaff} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? "Modify Staff Profile" : "Register Staff Profile"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Staff Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                name="email"
                disabled={!!editingStaff}
                value={form.email}
                onChange={handleInputChange}
                placeholder="e.g. john@hospease.com"
                className="w-full bg-slate-950 disabled:bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Operational Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="FRONTDESK_STAFF">FRONTDESK STAFF</option>
                  <option value="HOUSEKEEPING_STAFF">HOUSEKEEPING STAFF</option>
                  <option value="SERVICE_STAFF">SERVICE STAFF</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Phone Number (10 digits)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  name="contact"
                  maxLength={10}
                  value={form.contact}
                  onChange={handleInputChange}
                  placeholder="e.g. 9876543212"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Employment Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
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
                <span>Saving employee details...</span>
              </>
            ) : (
              <span>Confirm Profile</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default StaffPage;
