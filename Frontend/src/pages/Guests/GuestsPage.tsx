import React, { useEffect, useState } from "react";
import { getAllGuests, createGuest, updateGuest } from "../../services/guestService";
import { Guest } from "../../models/guest";
import { Plus, Search, Loader2, User, Phone, MapPin, Calendar, Award } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import useFormValidation from "../../hooks/useFormValidation";
import Pagination from "../../components/Pagination";
import "./GuestsPage.css";

export const GuestsPage: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const { values: form, setValues: setForm, errors, touched, handleChange: handleInputChange, handleBlur, handleSubmit } = useFormValidation(
    { name: "", dob: "", phone: "", address: "", loyaltyTier: "SILVER", status: "ACTIVE" },
    (vals) => {
      const errs: any = {};
      if (!vals.name) errs.name = "Please enter the guest name.";
      if (!vals.dob) errs.dob = "Please select the date of birth.";
      if (!vals.phone) errs.phone = "Please enter the contact number.";
      else if (!/^\d{10}$/.test(vals.phone)) errs.phone = "Phone number must be exactly 10 digits.";
      if (!vals.address) errs.address = "Please enter the address.";
      return errs;
    }
  );
  const [submitting, setSubmitting] = useState(false);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await getAllGuests();
      setGuests(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load hotel guests directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleOpenAddModal = () => {
    setEditingGuest(null);
    setForm({ name: "", dob: "", phone: "", address: "", loyaltyTier: "SILVER", status: "ACTIVE" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    
    let phoneVal = "";
    let addressVal = "";

    try {
      phoneVal = JSON.parse(guest.contactInfoJSON).phone || "";
    } catch {
      phoneVal = guest.contactInfoJSON;
    }

    try {
      addressVal = JSON.parse(guest.addressJSON).address || "";
    } catch {
      addressVal = guest.addressJSON;
    }

    setForm({ name: guest.name, dob: guest.dob, phone: phoneVal, address: addressVal, loyaltyTier: guest.loyaltyTier, status: guest.status });
    setIsModalOpen(true);
  };

  const onValidSubmit = async (vals: any) => {
    setSubmitting(true);
    const payload = {
      name: vals.name,
      dob: vals.dob,
      contactInfoJSON: JSON.stringify({ phone: vals.phone, email: editingGuest ? JSON.parse(editingGuest.contactInfoJSON).email || "" : "" }),
      addressJSON: JSON.stringify({ address: vals.address }),
      loyaltyTier: vals.loyaltyTier,
      status: vals.status,
    };

    try {
      if (editingGuest) {
        await updateGuest(editingGuest.guestId, payload);
        toast.success("Guest registry updated successfully.");
      } else {
        await createGuest(payload);
        toast.success("Guest profile created successfully.");
      }
      setIsModalOpen(false);
      fetchGuests();
    } catch (err: any) {
      toast.error(err.message || "Failed to save guest record.");
    } finally {
      setSubmitting(false);
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

  const getAddressDisplay = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.address || jsonStr;
    } catch {
      return jsonStr;
    }
  };

  const filteredGuests = guests.filter((g) => {
    const fullName = g.name || "";
    const email = getEmailDisplay(g.contactInfoJSON);
    const addr = getAddressDisplay(g.addressJSON);
    return (
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      addr.toLowerCase().includes(search.toLowerCase())
    );
  });

  React.useEffect(() => {
    setPage(1);
  }, [search, guests.length]);

  const pagedGuests = filteredGuests.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">Guests Registry</h3>
          <p className="text-xs text-slate-400">Total registered guests: {guests.length}</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Add Guest Ledger</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by guest name, email, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table View */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No guest profiles found matching search.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }} className="w-full text-left text-sm text-slate-100">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-100 uppercase">
                  <th className="px-6 py-4">Guest ID</th>
                  <th className="px-6 py-4">Guest Name</th>
                  <th className="px-6 py-4">Birth Date</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Residential Address</th>
                  <th className="px-6 py-4">Loyalty Tier</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {pagedGuests.map((guest) => (
                  <tr key={guest.guestId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-300">#{guest.guestId}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-100">{guest.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200">{guest.dob}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">Phone: <span className="font-semibold text-slate-200">{getPhoneDisplay(guest.contactInfoJSON)}</span></span>
                        <span className="font-semibold">Email: <span className="font-semibold text-slate-200">{getEmailDisplay(guest.contactInfoJSON)}</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-xs truncate"><span className="font-semibold text-slate-200">{getAddressDisplay(guest.addressJSON)}</span></td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold">
                        <Award size={13} className="text-blue-700" />
                        <span className="font-semibold text-blue-600">{guest.loyaltyTier}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex w-28 justify-center px-2.5 py-1.5 rounded text-sm font-semibold text-white ${guest.status === "ACTIVE" ? "bg-[#16a34a] border border-[#16a34a]/20" : "bg-[#dc2626] border border-[#dc2626]/20"}`}>
                        {guest.status}
                      </span>
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={filteredGuests.length} pageSize={pageSize} currentPage={page} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* Add/Edit Guest Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGuest ? "Modify Guest Profile" : "Register Guest Profile"}
      >
        <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Guest Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g. Alice Smith"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              {touched.name && errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
                {touched.dob && errors.dob && <p className="text-red-400 text-sm mt-1">{errors.dob}</p>}
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
                  name="phone"
                  maxLength={10}
                  value={form.phone}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
                {touched.phone && errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g. 123 Forest Hill, New York"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              {touched.address && errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Loyalty Pass Tier
              </label>
              <select
                name="loyaltyTier"
                value={form.loyaltyTier}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="PLATINUM">PLATINUM</option>
                <option value="GOLD">GOLD</option>
                <option value="SILVER">SILVER</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Profile Status
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
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving guest details...</span>
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

export default GuestsPage;
