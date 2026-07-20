import React, { useEffect, useState, useCallback } from "react";
import {
  getAllReservations,
  getReservationsByGuest,
  createReservation,
  updateReservation,
  checkIn,
  checkOut,
  cancelReservation,
  getAvailableRoomsForDates,
} from "../../services/reservationService";
import { getAllGuests, createGuest } from "../../services/guestService";
import { useAuth } from "../../AuthContext";
import { Reservation } from "../../models/reservation";
import { Guest } from "../../models/guest";
import { Room } from "../../models/room";
import { Plus, Search, Check, LogOut, Loader2, User, Key, Users, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import "./ReservationsPage.css";
import useFormValidation from "../../hooks/useFormValidation";

export const ReservationsPage: React.FC = () => {
  const { role, user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [currentGuestId, setCurrentGuestId] = useState<number | null>(null);
  const [currentGuestProfile, setCurrentGuestProfile] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [search, setSearch] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<number | null>(null);
  const { values: form, setValues: setForm, errors, touched, handleChange: handleInputChange, handleBlur, handleSubmit } = useFormValidation(
    { guestId: "", roomId: "", checkInDate: "", checkOutDate: "", numberOfGuests: "1" },
    (vals) => {
      const errs: any = {};
      if (!vals.guestId) errs.guestId = "Please select a guest profile.";
      if (!vals.roomId) errs.roomId = "Please select a room.";
      if (!vals.checkInDate) errs.checkInDate = "Please choose a check-in date.";
      if (!vals.checkOutDate) errs.checkOutDate = "Please choose a check-out date.";
      if (vals.checkInDate && vals.checkOutDate && new Date(vals.checkOutDate) <= new Date(vals.checkInDate)) errs.checkOutDate = "Check-out must be after check-in.";
      if (!vals.numberOfGuests) errs.numberOfGuests = "Please provide number of guests.";
      else if (isNaN(parseInt(vals.numberOfGuests)) || parseInt(vals.numberOfGuests) < 1) errs.numberOfGuests = "Number of guests must be >= 1.";
      return errs;
    }
  );
  const [submitting, setSubmitting] = useState(false);

  const email = user?.email || "";

  // Memoized fetch function to prevent unnecessary re-creations
  const fetchData = useCallback(async () => {
    if (!email) return;
    try {
      setLoading(true);
      let resList: Reservation[] = [];
      let guestList: Guest[] = [];

      if (role === "GUEST") {
        const allGuests: Guest[] = await getAllGuests();
        let matched = allGuests.find((g) => {
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
          setCurrentGuestId(matched.guestId);
          setCurrentGuestProfile(matched);
          resList = await getReservationsByGuest(matched.guestId);
          setForm((prev) => ({ ...prev, guestId: matched!.guestId.toString() }));
        } else {
          resList = [];
        }
      } else {
        resList = await getAllReservations();
        guestList = await getAllGuests().catch(() => []);
        setGuests(guestList);
      }

      setReservations(resList);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch reservations.");
    } finally {
      setLoading(false);
    }
  }, [role, email, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fixes Race Conditions using an ignore flag
  useEffect(() => {
    let active = true;

    const queryAvailableRooms = async () => {
      if (!form.checkInDate || !form.checkOutDate) {
        setAvailableRooms([]);
        return;
      }

      if (new Date(form.checkOutDate) <= new Date(form.checkInDate)) {
        toast.error("Check-out date must be after check-in date.");
        setAvailableRooms([]);
        return;
      }

      try {
        setLoadingRooms(true);
        const checkInIso = `${form.checkInDate}T14:00:00`;
        const checkOutIso = `${form.checkOutDate}T11:00:00`;
        
        const vacantRooms = await getAvailableRoomsForDates(checkInIso, checkOutIso);
        
        if (active) {
          setAvailableRooms(vacantRooms);
        }
      } catch (err: any) {
        if (active) {
          toast.error(err.message || "Failed to verify room availability.");
          setAvailableRooms([]);
        }
      } finally {
        if (active) {
          setLoadingRooms(false);
        }
      }
    };

    queryAvailableRooms();

    return () => {
      active = false; // Cancels state tracking if the user alters inputs before previous promise resolves
    };
  }, [form.checkInDate, form.checkOutDate]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingReservationId(null);
    setForm({
      guestId: role === "GUEST" && currentGuestId ? currentGuestId.toString() : "",
      roomId: "",
      checkInDate: "",
      checkOutDate: "",
      numberOfGuests: "1",
    });
    setAvailableRooms([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (res: Reservation) => {
    setIsEditMode(true);
    setEditingReservationId(res.resId);
    setForm({
      guestId: res.guestId.toString(),
      roomId: res.roomId.toString(),
      checkInDate: res.checkInDate ? res.checkInDate.split("T")[0] : "",
      checkOutDate: res.checkOutDate ? res.checkOutDate.split("T")[0] : "",
      numberOfGuests: res.numberOfGuests.toString(),
    });
    setAvailableRooms([]);
    setIsModalOpen(true);
  };

  const onValidSubmit = async (vals: any) => {
    setSubmitting(true);
    const payload = {
      guestId: parseInt(vals.guestId),
      roomId: parseInt(vals.roomId),
      checkInDate: `${vals.checkInDate}T14:00:00`,
      checkOutDate: `${vals.checkOutDate}T11:00:00`,
      numberOfGuests: parseInt(vals.numberOfGuests),
      status: "BOOKED",
    };

    try {
      if (isEditMode && editingReservationId) {
        await updateReservation(editingReservationId, payload);
        toast.success("Booking updated successfully! 🗓️");
      } else {
        await createReservation(payload);
        toast.success("Room booked successfully! 🗓️");
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingReservationId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await checkIn(id);
      toast.success("Guest checked in successfully. Active key generated 🔑");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Check-in failed.");
    }
  };

  const handleCheckOut = async (id: number) => {
    try {
      await checkOut(id);
      toast.success("Guest checked out successfully. Invoice generated. ✅");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Check-out failed.");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await cancelReservation(id);
      toast.success("Reservation cancelled.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Cancellation failed.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return "bg-[#16a34a] text-white border border-[#16a34a]/20";
      case "BOOKED":
        return "bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/60";
      case "CHECKED_OUT":
        return "bg-[#d97706] text-white border border-[#d97706]/20";
      case "CANCELLED":
        return "bg-[#dc2626] text-white border border-[#dc2626]/20";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const guest = r.guestName || `Guest #${r.guestId}`;
    const room = r.roomNumber || `Room #${r.roomId}`;
    return (
      guest.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5; // default page size

  // Date limits: prevent selecting past dates
  const today = new Date().toISOString().split("T")[0];
  const getMinCheckout = (checkIn?: string) => {
    if (!checkIn) return today;
    try {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    } catch {
      return today;
    }
  };

  useEffect(() => {
    // reset to first page when filter results change
    setCurrentPage(1);
  }, [search, reservations]);

  const totalReservations = filteredReservations.length;
  const totalPages = Math.max(1, Math.ceil(totalReservations / pageSize));
  const pagedReservations = filteredReservations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Bookings & Reservations</h3>
          <p className="text-xs text-slate-400">
            {role === "GUEST" ? "Review your stays and book a room" : "Manage check-in, check-out and active leases"}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>New Room Booking</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search bookings by guest name or room number..."
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
      ) : filteredReservations.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No bookings logged.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }} className="w-full text-left text-sm text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-slate-100 uppercase">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Lease Duration</th>
                  <th className="px-6 py-4">Occupants</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {pagedReservations.map((res) => (
                  <tr key={res.resId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-400">
                      #{res.resId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-400">
                      {res.guestName || `Guest #${res.guestId}`}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-400">Room {res.roomNumber || res.roomId}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col text-slate-400">
                        <span className="font-semibold text-slate-400">
                          Check-In: {new Date(res.checkInDate).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-slate-400">
                          Check-Out: {new Date(res.checkOutDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{res.numberOfGuests} guests</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex w-28 justify-center px-2.5 py-1.5 rounded text-xs font-bold tracking-wider uppercase ${getStatusColor(
                          res.status
                        )}`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {res.status === "BOOKED" && (
                        <div className="inline-flex items-center gap-3 whitespace-nowrap">
                          {role !== "GUEST" && (
                            <button
                              onClick={() => handleCheckIn(res.resId)}
                              className="inline-flex items-center justify-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 px-2 py-1 rounded-md text-[11px] font-semibold transition"
                            >
                              <Check size={12} />
                              <span>CHECK-IN</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(res)}
                            className="inline-flex items-center justify-center gap-1 bg-indigo-600 text-white border-2 border-indigo-600/80 hover:bg-indigo-700 px-2 py-1 rounded-md text-[11px] font-semibold transition"
                          >
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleCancel(res.resId)}
                            className="inline-flex items-center justify-center gap-1 bg-[#dc2626] text-white border-2 border-[#dc2626]/80 hover:bg-[#dc2626]/90 px-2 py-1 rounded-md text-[11px] font-semibold transition"
                          >
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                      {res.status === "CHECKED_IN" && role !== "GUEST" && (
                        <button
                          onClick={() => handleCheckOut(res.resId)}
                          className="inline-flex items-center justify-center gap-1 bg-[#fbbf24] text-white border border-[#fbbf24]/20 hover:bg-[#fbbf24]/90 px-2 py-1 rounded-md text-[11px] font-semibold transition"
                        >
                          <LogOut size={12} />
                          <span>CHECK-OUT</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={totalReservations} pageSize={pageSize} currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* Booking Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Room Booking" : "Create Room Booking"}>
        <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-4">
          {role !== "GUEST" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Guest Profile
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <select
                  name="guestId"
                  value={form.guestId}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">Choose guest...</option>
                  {guests.map((g) => (
                    <option key={g.guestId} value={g.guestId}>
                      {g.name} (Tier: {g.loyaltyTier})
                    </option>
                  ))}
                </select>
                {touched.guestId && errors.guestId && <p className="text-red-400 text-sm mt-1">{errors.guestId}</p>}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Booking for
              </label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-400 font-semibold">
                {currentGuestProfile?.name || user?.fullName} (Self)
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Check-in Date
              </label>
                <input
                type="date"
                name="checkInDate"
                min={today}
                value={form.checkInDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
              {touched.checkInDate && errors.checkInDate && <p className="text-red-400 text-sm mt-1">{errors.checkInDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Check-out Date
              </label>
                <input
                  type="date"
                  name="checkOutDate"
                  min={getMinCheckout(form.checkInDate)}
                  value={form.checkOutDate}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              {touched.checkOutDate && errors.checkOutDate && <p className="text-red-400 text-sm mt-1">{errors.checkOutDate}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Vacant Room
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                name="roomId"
                disabled={loadingRooms || !form.checkInDate || !form.checkOutDate}
                value={form.roomId}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition disabled:bg-slate-900 disabled:text-slate-500"
              >
                {loadingRooms ? (
                  <option>Querying room availability...</option>
                ) : !form.checkInDate || !form.checkOutDate ? (
                  <option>Please select check-in & check-out dates first...</option>
                ) : (availableRooms.length === 0 && (!isEditMode || !form.roomId)) ? (
                  <option>No available rooms for these dates</option>
                ) : (
                  <>
                    <option value="">Select a room...</option>
                    {isEditMode && form.roomId && !availableRooms.find(r => r.roomId === parseInt(form.roomId)) && (
                      <option value={form.roomId}>
                        Room {reservations.find(r => r.resId === editingReservationId)?.roomNumber || form.roomId} (Current Room)
                      </option>
                    )}
                    {availableRooms.map((r) => (
                      <option key={r.roomId} value={r.roomId}>
                        Room {r.roomNumber} ({r.roomType} - {r.ratePerNight} INR/night)
                      </option>
                    ))}
                  </>
                )}
              </select>
            {touched.roomId && errors.roomId && <p className="text-red-400 text-sm mt-1">{errors.roomId}</p>}
            </div>
            {!form.checkInDate && (
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] mt-1.5 font-medium pl-1">
                <Info size={12} />
                <span>Specify dates to fetch real-time room inventory availability.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Number of Guests
            </label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="number"
                name="numberOfGuests"
                min={1}
                value={form.numberOfGuests}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.roomId}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isEditMode ? "Updating booking record..." : "Creating booking record..."}</span>
              </>
            ) : (
              <span>{isEditMode ? "Update Booking Details" : "Book Room Unit"}</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ReservationsPage;