import React, { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { getAllRooms, getAvailableRooms, addRoom, updateRoom, deleteRoom } from "../../services/roomService";
import { Room, RoomStatus } from "../../models/room";
import { Plus, Search, Edit2, Trash2, Loader2, RefreshCw, DollarSign, Users, Sparkles, Wifi, Tv, Wind, Coffee, Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import useFormValidation from "../../hooks/useFormValidation";
import "./RoomsPage.css";

export const RoomsPage: React.FC = () => {
  const { role } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(role === "GUEST" ? "AVAILABLE_ONLY" : "ALL");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { values: form, setValues: setForm, errors, touched, handleChange: handleInputChange, handleBlur, handleSubmit } = useFormValidation(
    {
      roomNumber: "",
      roomType: "Single Bed",
      ratePerNight: "",
      capacity: "1",
      availabilityStatus: "AVAILABLE" as RoomStatus,
      wifi: true,
      tv: true,
      ac: false,
      mini_bar: false,
      jacuzzi: false,
    },
    (vals) => {
      const errs: any = {};
      if (!vals.roomNumber) errs.roomNumber = "Please enter the room number.";
      if (!vals.roomType) errs.roomType = "Please select a room type.";
      if (!vals.ratePerNight && vals.ratePerNight !== "0") errs.ratePerNight = "Please enter the nightly rate.";
      else if (isNaN(parseFloat(vals.ratePerNight))) errs.ratePerNight = "Please enter a valid numeric rate.";
      if (!vals.capacity) errs.capacity = "Please provide capacity.";
      else if (isNaN(parseInt(vals.capacity)) || parseInt(vals.capacity) < 1) errs.capacity = "Capacity must be a number >= 1.";
      return errs;
    }
  );
  const [submitting, setSubmitting] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let data = [];
      if (filterStatus === "AVAILABLE_ONLY") {
        data = await getAvailableRooms();
      } else {
        data = await getAllRooms();
      }
      setRooms(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load hotel room inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filterStatus]);

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setForm({
      roomNumber: "",
      roomType: "Single Bed",
      ratePerNight: "",
      capacity: "1",
      availabilityStatus: "AVAILABLE",
      wifi: true,
      tv: true,
      ac: false,
      mini_bar: false,
      jacuzzi: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    
    // Parse amenities
    let wifi = false;
    let tv = false;
    let ac = false;
    let mini_bar = false;
    let jacuzzi = false;

    try {
      const amenities = JSON.parse(room.amenitiesJson || "{}");
      wifi = !!amenities.wifi;
      tv = !!amenities.tv;
      ac = !!amenities.ac;
      mini_bar = !!amenities.mini_bar;
      jacuzzi = !!amenities.jacuzzi;
    } catch {}

    setForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      ratePerNight: room.ratePerNight.toString(),
      capacity: room.capacity.toString(),
      availabilityStatus: room.availabilityStatus,
      wifi,
      tv,
      ac,
      mini_bar,
      jacuzzi,
    });
    setIsModalOpen(true);
  };

  // onValidSubmit will be called when validation passes
  const onValidSubmit = async (vals: any) => {
    setSubmitting(true);
    const amenitiesJson = JSON.stringify({
      wifi: vals.wifi,
      tv: vals.tv,
      ac: vals.ac,
      mini_bar: vals.mini_bar,
      jacuzzi: vals.jacuzzi,
    });

    const payload = {
      roomNumber: vals.roomNumber,
      roomType: vals.roomType,
      ratePerNight: parseFloat(vals.ratePerNight),
      capacity: parseInt(vals.capacity),
      availabilityStatus: vals.availabilityStatus,
      amenitiesJson,
    };

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.roomId, payload);
        toast.success(`Room ${vals.roomNumber} updated successfully.`);
      } else {
        await addRoom(payload);
        toast.success(`Room ${vals.roomNumber} registered successfully.`);
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || "Failed to commit room record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, num: string) => {
    if (!confirm(`Are you sure you want to delete room ${num}?`)) return;
    try {
      await deleteRoom(id);
      toast.success(`Room ${num} deleted.`);
      fetchRooms();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove room.");
    }
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-[#16a34a] border border-[#15803d]";
      case "BOOKED":
        return "bg-[#4f46e5] border border-[#4338ca]";
      case "OCCUPIED":
        return "bg-[#7c3aed] border border-[#6d28d9]";
      case "NEEDS_CLEANING":
        return "bg-[#d97706] border border-[#b45309]";
      case "MAINTENANCE":
        return "bg-[#dc2626] border border-[#b91c1c]";
      default:
        return "bg-[#475569] border border-[#334155]";
    }
  };

  const getAmenitiesIcons = (jsonStr?: string) => {
    if (!jsonStr) return null;
    try {
      const parsed = JSON.parse(jsonStr);
      return (
        <div className="flex gap-1.5 text-slate-400 mt-1">
          {parsed.wifi && <span title="Free WiFi"><Wifi size={13} className="text-indigo-400" /></span>}
          {parsed.tv && <span title="Smart TV"><Tv size={13} /></span>}
          {parsed.ac && <span title="AC"><Wind size={13} /></span>}
          {parsed.mini_bar && <span title="Minibar"><Coffee size={13} /></span>}
          {parsed.jacuzzi && <span title="Jacuzzi"><Zap size={13} className="text-amber-400" /></span>}
        </div>
      );
    } catch {
      return null;
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.roomType.toLowerCase().includes(search.toLowerCase());
    const matchesStatusFilter =
      filterStatus === "ALL" ||
      filterStatus === "AVAILABLE_ONLY" ||
      r.availabilityStatus === filterStatus;
    return matchesSearch && matchesStatusFilter;
  });

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">Rooms Management</h3>
          <p className="text-xs text-slate-400">Inventory size: {rooms.length} registered units</p>
        </div>
        {role !== "GUEST" && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
          >
            <Plus size={16} />
            <span>Add New Room</span>
          </button>
        )}
      </div>

      {/* Filter Row - hidden for guests (guests see available rooms only) */}
      {role !== "GUEST" && (
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search by room number or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <div className="w-full md:w-56">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">Show All Statuses</option>
              <option value="AVAILABLE_ONLY">Show Available Only</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="BOOKED">BOOKED</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="NEEDS_CLEANING">NEEDS CLEANING</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No rooms match the selected criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.roomId}
              className="room-card bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between shadow hover:-translate-y-0.5 hover:shadow-lg transition duration-200 min-h-[220px]"
            >
              {/* Room ID and actions */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-mono"></span>
                  <div className="flex gap-2">
                    {role !== "GUEST" ? (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(room)}
                          className="p-1.5 rounded-lg bg-slate-800 border-2 border-slate-700 text-slate-400 hover:text-indigo-400 transition"
                          title="Edit room"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(room.roomId, room.roomNumber)}
                          className="p-1.5 rounded-lg bg-slate-800 border-2 border-slate-700 text-slate-400 hover:text-rose-400 transition"
                          title="Delete room"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : null}
                  </div>
              </div>

              {/* Room details */}
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-slate-200">Room {room.roomNumber}</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {room.roomType}
                </p>
                <div className="flex justify-between items-center flex-nowrap bg-slate-950/40 p-3 rounded-lg border border-slate-800/50 mt-1 gap-2">
                  <div className="flex flex-col items-start gap-1 flex-shrink-0 min-w-[84px]">
                    <span className="text-lg font-semibold text-blue-800">{room.ratePerNight}</span>
                    <span className="text-xs text-slate-400 font-medium">Rs /night</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Users size={14} className="text-indigo-600" />
                    <span className="capacity-badge inline-block max-w-[60px] box-border px-2 py-0.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border-2 border-indigo-700 rounded-md truncate text-center whitespace-nowrap">
                      {room.capacity}
                    </span>
                  </div>
                </div>
                {getAmenitiesIcons(room.amenitiesJson)}
              </div>

              {/* Status Badge */}
              <div className="pt-2 border-t border-slate-800/40">
                <span
                  className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider text-white ${getStatusColor(
                    room.availabilityStatus
                  )}`}
                >
                  {room.availabilityStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Modify Room ${form.roomNumber}` : "Register New Room Unit"}
      >
        <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Room Number
            </label>
            <input
              type="text"
              name="roomNumber"
              value={form.roomNumber}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="e.g. 101, 305B"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
            {touched.roomNumber && errors.roomNumber && <p className="text-red-400 text-sm mt-1">{errors.roomNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Room Type
              </label>
              <select
                name="roomType"
                value={form.roomType}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Single Bed">Single Bed</option>
                <option value="Double Bed">Double Bed</option>
                <option value="Deluxe Suite">Deluxe Suite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Rate Per Night (INR)
              </label>
              <input
                type="number"
                step="0.01"
                name="ratePerNight"
                value={form.ratePerNight}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g. 120.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              {touched.ratePerNight && errors.ratePerNight && <p className="text-red-400 text-sm mt-1">{errors.ratePerNight}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Capacity (People)
              </label>
              <input
                type="number"
                name="capacity"
                min={1}
                value={form.capacity}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
              {touched.capacity && errors.capacity && <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Availability Status
              </label>
              <select
                name="availabilityStatus"
                value={form.availabilityStatus}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="BOOKED">BOOKED</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="NEEDS_CLEANING">NEEDS CLEANING</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          {/* Amenities checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Room Amenities
            </label>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="wifi"
                  checked={form.wifi}
                  onChange={(e) => setForm({ ...form, wifi: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-950"
                />
                <span>Free WiFi</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="tv"
                  checked={form.tv}
                  onChange={(e) => setForm({ ...form, tv: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-950"
                />
                <span>Smart TV</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="ac"
                  checked={form.ac}
                  onChange={(e) => setForm({ ...form, ac: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-950"
                />
                <span>Air Conditioner (AC)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="mini_bar"
                  checked={form.mini_bar}
                  onChange={(e) => setForm({ ...form, mini_bar: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-950"
                />
                <span>Minibar</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer col-span-2">
                <input
                  type="checkbox"
                  name="jacuzzi"
                  checked={form.jacuzzi}
                  onChange={(e) => setForm({ ...form, jacuzzi: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 bg-slate-950"
                />
                <span>In-Room Jacuzzi</span>
              </label>
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
                <span>Saving room details...</span>
              </>
            ) : (
              <span>Confirm Room Record</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default RoomsPage;
