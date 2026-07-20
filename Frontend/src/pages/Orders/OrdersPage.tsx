import React, { useEffect, useState } from "react";
import { createOrder, fulfillOrder, getOrdersByGuest, getServiceTypes, updateOrder, cancelOrder } from "../../services/serviceOrderService";
import { getAllGuests, createGuest } from "../../services/guestService";
import { getAllRooms, getAvailableRooms } from "../../services/roomService";
import { getReservationsByGuest } from "../../services/reservationService";
import { getAllStaff } from "../../services/staffService";
import { useAuth } from "../../AuthContext";
import { ServiceOrder } from "../../models/serviceOrder";
import { Guest } from "../../models/guest";
import { Room } from "../../models/room";
import { Staff } from "../../models/staff";
import { Plus, Search, Coffee, CheckCircle, Loader2, User, Key, UserCheck, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import AdminOrderPage from "./adminorderpage";
import "./OrdersPage.css";
import useFormValidation from "../../hooks/useFormValidation";

export const OrdersPage: React.FC = () => {
  const { role, user } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [serviceTypes, setServiceTypes] = useState<{serviceType: string; price: number}[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [currentGuestProfile, setCurrentGuestProfile] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
    const { values: form, setValues: setForm, errors, touched, handleChange: hookHandleChange, handleBlur, handleSubmit } = useFormValidation(
      { guestId: "", roomId: "", assignedStaffId: "", serviceType: "FNB", details: "", price: "500.00" },
      (vals) => {
        const errs: any = {};
        if (!vals.guestId) errs.guestId = "Please select a guest.";
        if (!vals.roomId) errs.roomId = "Please select a room.";
        if (!vals.serviceType) errs.serviceType = "Please select a service type.";
        if (vals.price === "" || vals.price == null) errs.price = "Please enter a price.";
        else if (isNaN(parseFloat(vals.price))) errs.price = "Enter a valid numeric price.";
        if (!vals.details) errs.details = "Please describe the service details.";
        return errs;
      }
    );
  const [submitting, setSubmitting] = useState(false);

  const email = user?.email || "";

  const fetchOrdersAndData = async () => {
    try {
      setLoading(true);
      const [guestData, roomData, staffData, svcTypes] = await Promise.all([
        getAllGuests().catch(() => []),
        getAllRooms().catch(() => []),
        getAllStaff().catch(() => []),
        getServiceTypes().catch(() => []),
      ]);

      setGuests(guestData);
      setRooms(roomData);
      setStaffList(staffData);
      // Only keep allowed service types
      const allowed = (svcTypes || []).filter((s: any) => {
        const name = (s.serviceType || "").toUpperCase();
        return name === "FNB" || name === "GYM" || name === "SPA";
      });
      setServiceTypes(allowed);

      if (role === "GUEST") {
        let matched = guestData.find((g: Guest) => {
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
            guestData.push(matched);
          } catch (e) {
            console.error("Auto-creating guest profile failed:", e);
          }
        }

        if (matched) {
          setCurrentGuestProfile(matched);
          setForm((prev) => ({ ...prev, guestId: matched.guestId.toString() }));
          const [guestOrders, reservations] = await Promise.all([
            getOrdersByGuest(matched.guestId).catch(() => []),
            getReservationsByGuest(matched.guestId).catch(() => []),
          ]);
          setOrders(guestOrders);

          // Prefer rooms that belong to the guest's active or upcoming reservations so guests only select their room(s)
          if (Array.isArray(reservations) && reservations.length > 0) {
            const resRoomIds = reservations.map((r) => r.roomId);
            const guestRooms = (roomData || []).filter((rm: Room) => resRoomIds.includes(rm.roomId));
            if (guestRooms.length > 0) setRooms(guestRooms);
            else setRooms(roomData);
          } else {
            // fallback to available rooms if no reservations present
            try {
              const avail = await getAvailableRooms();
              setRooms(Array.isArray(avail) && avail.length > 0 ? avail : roomData);
            } catch {
              setRooms(roomData);
            }
          }
        } else {
          setOrders([]);
          setRooms(roomData);
        }
      } else {
        // Admin fetches service orders for each guest recursively and merge them
        const orderPromises = guestData.map((g: Guest) =>
          getOrdersByGuest(g.guestId).catch(() => [] as ServiceOrder[])
        );
        const guestOrdersArrays = await Promise.all(orderPromises);
        const allOrders = guestOrdersArrays.flat();
        setOrders(allOrders);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load service orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchOrdersAndData();
    }
  }, [role, email]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingOrderId(null);
    setForm({
      guestId: role === "GUEST" && currentGuestProfile ? currentGuestProfile.guestId.toString() : "",
      roomId: "",
      assignedStaffId: "",
      serviceType: serviceTypes.length > 0 ? String(serviceTypes[0].serviceType) : "FNB",
      details: "",
      price: serviceTypes.length > 0 ? String(serviceTypes[0].price) : "500.00",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ord: ServiceOrder) => {
    // If existing order has an unsupported serviceType, map to FNB
    const svc = (ord.serviceType || "").toUpperCase();
    const supported = ["FNB", "GYM", "SPA"];
    const chosen = supported.includes(svc) ? svc : (serviceTypes.length > 0 ? String(serviceTypes[0].serviceType) : "FNB");
    const chosenPrice = serviceTypes.find((s) => s.serviceType === chosen)?.price || ord.price || 500.00;
    setForm({
      guestId: ord.guestId ? ord.guestId.toString() : (currentGuestProfile ? currentGuestProfile.guestId.toString() : ""),
      roomId: ord.roomId ? ord.roomId.toString() : "",
      assignedStaffId: ord.assignedStaffId ? ord.assignedStaffId.toString() : "",
      serviceType: chosen,
      details: getDetailsDisplay(ord.detailsJson),
      price: String(chosenPrice),
    });
    setEditingOrderId(ord.orderId);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this service order?")) return;
    try {
      await cancelOrder(orderId);
      toast.success("Service order cancelled.");
      fetchOrdersAndData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel service order.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLSelectElement & HTMLInputElement;
    if (name === "serviceType") {
      const found = serviceTypes.find((s) => s.serviceType === value);
      setForm((prev: any) => ({ ...prev, serviceType: value, price: found ? String(found.price) : prev.price }));
      return;
    }

    // delegate to hook change handler for standard fields
    hookHandleChange(e as any);
  };

  const onValidSubmit = async (vals: any) => {
    setSubmitting(true);
    const payload = {
      guestId: parseInt(vals.guestId),
      roomId: parseInt(vals.roomId),
      assignedStaffId: vals.assignedStaffId ? parseInt(vals.assignedStaffId) : undefined,
      serviceType: vals.serviceType,
      details: vals.details,
      detailsJson: JSON.stringify({ details: vals.details }),
      price: parseFloat(vals.price),
    };

    try {
      if (isEditMode && editingOrderId) {
        await updateOrder(editingOrderId, payload);
        toast.success("Service order updated successfully!");
      } else {
        await createOrder(payload);
        toast.success("Service order requested successfully!");
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingOrderId(null);
      fetchOrdersAndData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit service order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFulfill = async (orderId: number) => {
    try {
      await fulfillOrder(orderId);
      toast.success("Order fulfilled and updated in ledger!");
      fetchOrdersAndData();
    } catch (err: any) {
      toast.error(err.message || "Fulfillment failed.");
    }
  };

  const getDetailsDisplay = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return parsed.details || jsonStr;
    } catch {
      return jsonStr;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const guestNameDisplay = o.guestName || `Guest #${o.guestId}`;
    const room = o.roomNumber || `Room #${o.roomId}`;
    const desc = getDetailsDisplay(o.detailsJson);
    return (
      guestNameDisplay.toLowerCase().includes(search.toLowerCase()) ||
      room.toLowerCase().includes(search.toLowerCase()) ||
      desc.toLowerCase().includes(search.toLowerCase())
    );
  });

  const renderAdminSection = () => (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">Service Orders — Admin</h3>
          <p className="text-xs text-slate-400">Track, fulfill, and bill room services</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>New Service Order</span>
        </button>
      </div>

      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search orders by guest, room, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No service orders recorded.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-black uppercase">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Guest & Room</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Charge</th>
                  <th className="px-6 py-4">Attendant Staff</th>
                  <th className="px-6 py-4 text-right font-bold">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-400 font-semibold">#{ord.orderId}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-400 font-semibold">{ord.guestName || `Guest #${ord.guestId}`}</span>
                        <span className="text-xs text-slate-400 font-semibold">Room {ord.roomNumber || ord.roomId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{ord.serviceType}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold max-w-xs break-words">{getDetailsDisplay(ord.detailsJson)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{ord.price.toFixed(2)} INR</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{ord.assignedStaffName || `Staff ID #${ord.assignedStaffId || "Unassigned"}`}</td>
                    <td className="px-6 py-4 text-right">
                      {ord.fulfilled ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Fulfilled</span>
                      ) : (
                        <button
                          onClick={() => handleFulfill(ord.orderId)}
                          className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/70 hover:bg-indigo-500/25 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          style={{ boxShadow: '0 0 0 1px rgba(79,70,229,0.06) inset' }}
                        >
                          <CheckCircle size={12} />
                          <span>Mark Fulfill</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Service Order (Admin)">
        <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Guest</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select name="guestId" value={form.guestId} onChange={handleInputChange} onBlur={handleBlur} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition">
                <option value="">Select guest...</option>
                {guests.map((g) => (
                  <option key={g.guestId} value={g.guestId}>{g.name}</option>
                ))}
              </select>
              {touched && (touched as any).guestId && (errors as any).guestId && <p className="text-red-400 text-sm mt-1">{(errors as any).guestId}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Room</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select name="roomId" value={form.roomId} onChange={handleInputChange} onBlur={handleBlur} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition">
                <option value="">Select room...</option>
                {rooms.map((r) => (
                  <option key={r.roomId} value={r.roomId}>Room {r.roomNumber} ({r.roomType})</option>
                ))}
              </select>
              {touched && (touched as any).roomId && (errors as any).roomId && <p className="text-red-400 text-sm mt-1">{(errors as any).roomId}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Assign Staff Attendant</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select name="assignedStaffId" value={form.assignedStaffId} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition">
                <option value="">Select cleaner/service staff (optional)...</option>
                {staffList.map((s) => (
                  <option key={s.staffId} value={s.staffId}>{s.userName || `Staff #${s.staffId}`} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Service Type</label>
              <select name="serviceType" value={form.serviceType} onChange={handleInputChange} onBlur={handleBlur} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition">
                <option value="">Select service...</option>
                {serviceTypes.map((s) => (
                  <option key={s.serviceType} value={s.serviceType}>{`${s.serviceType} — ${s.price} INR`}</option>
                ))}
              </select>
              {touched && (touched as any).serviceType && (errors as any).serviceType && <p className="text-red-400 text-sm mt-1">{(errors as any).serviceType}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Order Details Description
            </label>
            <textarea
              name="details"
              rows={3}
              placeholder="Enter menu choices or maintenance instructions..."
              value={form.details}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
            {touched && (touched as any).details && (errors as any).details && <p className="text-red-400 text-sm mt-1">{(errors as any).details}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating service ticket...</span>
              </>
            ) : (
              <span>Confirm Order</span>
            )}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating service ticket...</span>
              </>
            ) : (
              <span>Confirm Order</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );

  const renderGuestSection = () => (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">My Service Orders</h3>
          <p className="text-xs text-slate-400">Order food, cleaning, or recreational amenities</p>
        </div>
        <button onClick={handleOpenAddModal} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200">
          <Plus size={16} />
          <span>New Service Order</span>
        </button>
      </div>

      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Search your orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
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
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-black uppercase">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Order Details</th>
                  <th className="px-6 py-4">Charge</th>
                  <th className="px-6 py-4">Attendant</th>
                  <th className="px-6 py-4 text-right font-bold">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredOrders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-400 font-semibold">#{ord.orderId}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">Room {ord.roomNumber || ord.roomId}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{ord.serviceType}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold max-w-xs break-words">{getDetailsDisplay(ord.detailsJson)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{ord.price.toFixed(2)} INR</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{ord.assignedStaffName || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-right">
                      {ord.status === 'CANCELLED' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>
                      ) : ord.fulfilled ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/70" style={{ boxShadow: '0 0 0 1px rgba(16,185,129,0.06) inset' }}>Fulfilled</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-700 text-white border border-amber-800">Requested</span>
                          <button
                            onClick={() => handleOpenEditModal(ord)}
                            className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 px-2 py-1 rounded text-xs font-semibold transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancelOrder(ord.orderId)}
                            className="bg-red-600 hover:bg-red-700 text-white border border-red-700 px-2 py-1 rounded text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Service Order" : "Create Service Order"}>
        <form onSubmit={(e) => handleSubmit(e, onValidSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Booking for</label>
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-400 font-semibold">{currentGuestProfile?.name} (Self)</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Select Room</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select name="roomId" value={form.roomId} onChange={handleInputChange} onBlur={handleBlur} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition">
                <option value="">Select room...</option>
                {rooms.map((r) => (
                  <option key={r.roomId} value={r.roomId}>Room {r.roomNumber} ({r.roomType})</option>
                ))}
              </select>
              {touched && (touched as any).roomId && (errors as any).roomId && <p className="text-red-400 text-sm mt-1">{(errors as any).roomId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Service Type</label>
              <select name="serviceType" value={form.serviceType} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition">
                <option value="">Select service...</option>
                {serviceTypes.map((s) => (
                  <option key={s.serviceType} value={s.serviceType}>{`${s.serviceType} — ${s.price} INR`}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Order Details Description</label>
            <textarea name="details" rows={3} placeholder="Enter menu choices or maintenance instructions..." value={form.details} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4">
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isEditMode ? "Updating order..." : "Creating service ticket..."}</span>
              </>
            ) : (
              <span>{isEditMode ? "Update Order" : "Confirm Order"}</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );

  return role === "GUEST" ? renderGuestSection() : <AdminOrderPage />;
};

export default OrdersPage;