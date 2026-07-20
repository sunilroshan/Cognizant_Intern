import React, { useEffect, useState } from "react";
import { generateInvoice, getByGuest } from "../../services/invoiceService";
import { recordManualPayment } from "../../services/paymentService";
import { getAllGuests } from "../../services/guestService";
import { getReservationsByGuest, getAllReservations } from "../../services/reservationService";
import { getOrdersByGuest } from "../../services/serviceOrderService";
import { useAuth } from "../../AuthContext";
import { Guest } from "../../models/guest";
import { Invoice } from "../../models/invoice";
import { Reservation } from "../../models/reservation";
import { Plus, Search, FileText, CreditCard, Loader2, Calendar, Eye, Download, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import "./BillingPage.css";

export const BillingPage: React.FC = () => {
  const { role, user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [currentGuestProfile, setCurrentGuestProfile] = useState<Guest | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Invoice Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    reservationID: "",
    currency: "INR",
    dueDate: "",
  });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Payment Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CARD",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Print Invoice View Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const email = user?.email || "";
  const isFinanceUser = role === "FINANCE" || (email || "").toLowerCase().includes("finance");

  const fetchBaseData = async () => {
    try {
      setLoadingData(true);
      if (role === "GUEST") {
        // Resolve guest profile
        const gList: Guest[] = await getAllGuests();
        const matched = gList.find((g) => {
          try {
            const contact = JSON.parse(g.contactInfoJSON);
            return contact.email?.toLowerCase() === email.toLowerCase();
          } catch {
            return false;
          }
        });

        if (matched) {
          setCurrentGuestProfile(matched);
          setSelectedGuestId(matched.guestId.toString());
          const resList = await getReservationsByGuest(matched.guestId).catch(() => []);
          setReservations(resList);
        }
      } else {
        // Admin fetches all guest registries and all reservation logs
        const [gData, resData] = await Promise.all([
          getAllGuests().catch(() => []),
          getAllReservations().catch(() => []),
        ]);
        setGuests(gData);
        setReservations(resData);
        if (gData.length > 0) {
          setSelectedGuestId(gData[0].guestId.toString());
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load billing directory information.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchBaseData();
    }
  }, [role, email]);

  const fetchGuestInvoices = async (guestId: number) => {
    try {
      setLoadingInvoices(true);
      const data = await getByGuest(guestId);

      // Augment each invoice with service-order items and totals (room + services)
      const augmented = await Promise.all(
        data.map(async (inv: Invoice) => {
          try {
            // Find reservation for this invoice to scope service orders by stay dates
            const reservation = reservations.find((r) => r.resId === inv.reservationID);
            // If we don't have reservation context, skip augmentation
            if (!reservation) return inv;

            const orders = await getOrdersByGuest(inv.guestID).catch(() => []);

            // Determine order timestamp field and filter by reservation window & fulfilled
            const relevant = (orders || []).filter((o: any) => {
              if (!o.fulfilled) return false;
              const ts = o.fulfillmentDate || o.createdAt;
              if (!ts) return true;
              const t = new Date(ts).getTime();
              const start = new Date(reservation.checkInDate).getTime();
              const end = reservation.checkOutDate ? new Date(reservation.checkOutDate).getTime() : Date.now();
              return t >= start && t <= end;
            });

            if (!relevant || relevant.length === 0) return inv;

            const serviceItems = relevant.map((o: any) => ({
              description: `${o.serviceType}${o.detailsJson ? ' - ' + (() => {
                try {
                  const d = JSON.parse(o.detailsJson);
                  return d.name || d.item || d.description || "";
                } catch {
                  return "";
                }
              })() : ""}`,
              amount: Number(o.price) || 0,
            }));

            const serviceTotal = serviceItems.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);

            // Preserve original room amount before adding service totals
            const originalRoomAmount = Number(inv.totalAmount || 0);

            // Merge with existing line items (if any) and update invoice totals for display/printing
            const existing = getLineItemsList(inv.lineItemsJSON || "");
            const merged = existing.concat(serviceItems);
            inv.lineItemsJSON = JSON.stringify(merged);
            inv.totalAmount = originalRoomAmount + serviceTotal;

            // Attach helper fields for display (not persisted)
            (inv as any).roomAmount = originalRoomAmount;
            (inv as any).serviceTotal = serviceTotal;
            return inv;
          } catch (e) {
            return inv;
          }
        })
      );

      setInvoices(augmented);
    } catch (err: any) {
      setInvoices([]);
      toast.error(err.message || "Failed to fetch invoices.");
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (selectedGuestId) {
      fetchGuestInvoices(parseInt(selectedGuestId));
    } else {
      setInvoices([]);
    }
  }, [selectedGuestId]);

  const handleOpenInvoiceModal = () => {
    setInvoiceForm({
      reservationID: "",
      currency: "INR",
      dueDate: "",
    });
    setIsInvoiceModalOpen(true);
  };

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.totalAmount.toString(),
      method: "CARD",
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenPrintModal = (invoice: Invoice) => {
    setPrintInvoice(invoice);
    setIsPrintModalOpen(true);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.reservationID || !invoiceForm.dueDate) {
      toast.error("Please fill in reservation reference and due date.");
      return;
    }

    const reservationID = Number(invoiceForm.reservationID);
    if (!Number.isInteger(reservationID) || reservationID <= 0) {
      toast.error("Please select a valid reservation.");
      return;
    }

    const dueDateObj = new Date(invoiceForm.dueDate);
    if (Number.isNaN(dueDateObj.getTime())) {
      toast.error("Please select a valid due date.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDateObj < today) {
      toast.error("Due date cannot be in the past.");
      return;
    }

    setInvoiceSubmitting(true);
    const payload = {
      reservationID,
      currency: invoiceForm.currency,
      dueDate: `${invoiceForm.dueDate}T12:00:00`,
      invoiceURI: `/exports/invoice_${Date.now()}_${invoiceForm.reservationID}.pdf`,
    };

    try {
      await generateInvoice(payload);
      toast.success("Invoice generated dynamically by backend! 🧾");
      setIsInvoiceModalOpen(false);
      if (selectedGuestId) {
        fetchGuestInvoices(parseInt(selectedGuestId));
      }
    } catch (err: any) {
      toast.error(err.message || "Invoice generation failed.");
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentForm.amount) {
      toast.error("Missing invoice or payment amount.");
      return;
    }

    const amount = Number(paymentForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    if (amount > Number(selectedInvoice.totalAmount)) {
      toast.error("Payment amount cannot exceed invoice total.");
      return;
    }

    setPaymentSubmitting(true);
    const payload = {
      invoiceID: selectedInvoice.invoiceID,
      guestID: selectedInvoice.guestID,
      amount,
      method: paymentForm.method,
    };

    try {
      await recordManualPayment(payload);
      toast.success("Payment successful! Balance settled ✅");
      setIsPaymentModalOpen(false);
      if (selectedGuestId) {
        fetchGuestInvoices(parseInt(selectedGuestId));
      }
    } catch (err: any) {
      toast.error(err.message || "Payment processing failed.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const getLineItemsList = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);

      const normalizeItem = (item: any) => {
        if (typeof item === "string") return { description: item, amount: undefined };
        if (typeof item === "number") return { description: "Line Item", amount: item };
        return item;
      };

      if (Array.isArray(parsed)) {
        return parsed.map(normalizeItem);
      }
      if (Array.isArray(parsed.items)) {
        return parsed.items.map(normalizeItem);
      }
      if (Array.isArray(parsed.lineItems)) {
        return parsed.lineItems.map(normalizeItem);
      }
      if (parsed && typeof parsed === "object") {
        if (
          parsed.description ||
          parsed.name ||
          parsed.title ||
          parsed.amount !== undefined ||
          parsed.price !== undefined ||
          parsed.value !== undefined
        ) {
          return [normalizeItem(parsed)];
        }

        const asEntries = Object.entries(parsed)
          .filter(([, value]) => value !== null && value !== undefined)
          .map(([key, value]) => {
            if (typeof value === "number") return { description: key, amount: value };
            if (typeof value === "string") return { description: key, amount: Number(value) };
            return { description: key, amount: undefined };
          });
        if (asEntries.length > 0) return asEntries;
      }
      return [];
    } catch {
      return [];
    }
  };

  const getLineItemsDisplay = (jsonStr: string) => {
    const list = getLineItemsList(jsonStr);
    if (list.length === 0) return "General Stay and room charges";
    return list.map((item: any) => item.description || item).join(", ");
  };

  const getGuestNameForInvoice = (invoice: Invoice) => {
    if ((invoice as any).guestName) return (invoice as any).guestName;
    if (currentGuestProfile?.name) return currentGuestProfile.name;
    const guestId = (invoice as any).guestID ?? (invoice as any).guestId;
    const matched = guests.find((g) => g.guestId === guestId);
    return matched?.name || `Guest Profile ID #${invoice.guestID}`;
  };

  const getPrintableLineItems = (invoice: Invoice) => {
    const parsedItems = getLineItemsList(invoice.lineItemsJSON);
    if (parsedItems.length > 0) return parsedItems;
    return [{ description: "General Stay and room charges", amount: invoice.totalAmount }];
  };

  const getLineItemName = (item: any) => {
    if (typeof item === "string") return item;
    return item?.description || item?.name || item?.title || "Line Item";
  };

  const getLineItemAmount = (item: any, currency: string) => {
    const raw =
      typeof item === "number"
        ? item
        : item?.amount ?? item?.price ?? item?.value ?? item?.total ?? item?.lineTotal;
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && !Number.isNaN(numeric)) {
      return `${numeric.toFixed(2)} ${currency}`;
    }
    return "Included";
  };

  const getFilteredReservationsForGuest = () => {
    if (!selectedGuestId) return [];
    return reservations.filter((r) => r.guestId === parseInt(selectedGuestId));
  };

  const triggerBrowserPrint = () => {
    if (!printInvoice) return;

    const guestName = getGuestNameForInvoice(printInvoice);
    const printableItems = getPrintableLineItems(printInvoice);

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const rowsHtml = printableItems
      .map((item: any) => {
        const name = escapeHtml(String(getLineItemName(item)));
        const amount = escapeHtml(String(getLineItemAmount(item, printInvoice.currency)));
        return `<tr><td>${name}</td><td style="text-align:right;">${amount}</td></tr>`;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${printInvoice.invoiceID}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #000; padding: 24px; }
            h1 { margin: 0 0 8px 0; font-size: 20px; }
            .meta { margin-bottom: 16px; font-size: 13px; }
            .summary { margin: 12px 0; padding: 10px; border: 1px solid #ddd; }
            .summary-row { display: flex; justify-content: space-between; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
            th { background: #f3f4f6; text-align: left; }
            .total { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>HospEase Hotel Group - Invoice</h1>
          <div class="meta">Invoice: #${printInvoice.invoiceID} | Reservation: #${printInvoice.reservationID}</div>
          <div class="summary">
            <div class="summary-row"><span>Guest Name</span><span>${escapeHtml(String(guestName))}</span></div>
            <div class="summary-row"><span>Invoice Amount</span><span>${escapeHtml(`${printInvoice.totalAmount.toFixed(2)} ${printInvoice.currency}`)}</span></div>
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th style="text-align:right;">Amount</th></tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total"><td style="text-align:right;">Total balance due</td><td style="text-align:right;">${escapeHtml(`${printInvoice.totalAmount.toFixed(2)} ${printInvoice.currency}`)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Top action controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">Guest Billing & Invoices</h3>
          <p className="text-xs text-black">
            {role === "GUEST" ? "View and pay your hotel invoices" : "Generate bills and process payments"}
          </p>
        </div>
        {role !== "GUEST" && (
          <button
            onClick={handleOpenInvoiceModal}
            disabled={!selectedGuestId}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-black text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all duration-200"
          >
            <Plus size={16} />
            <span>Generate Invoice</span>
          </button>
        )}
      </div>

      {/* Selector and filters - Hide for Guest role */}
      {role !== "GUEST" && (
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="w-full md:w-80">
            <label className="block text-[10px] font-semibold text-black uppercase tracking-wider mb-1.5">
              Select Active Guest Profile
            </label>
            <select
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-black focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">Select guest...</option>
              {guests.map((g) => (
                <option key={g.guestId} value={g.guestId}>
                  {g.name} (Tier: {g.loyaltyTier})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Table area */}
      {loadingData ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : !selectedGuestId ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-black text-sm">
          Please select a guest profile to load invoices.
        </div>
      ) : loadingInvoices ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-black text-sm">
          No invoices registered.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base text-black">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-black uppercase">
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">Reservation Ref</th>
                  <th className="px-6 py-4">Billing Description</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceID} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-400 font-semibold">#{inv.invoiceID}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-400 font-semibold">Res #{inv.reservationID}</td>
                    <td className="px-6 py-4 text-sm max-w-xs break-words text-slate-400 font-semibold">{getLineItemsDisplay(inv.lineItemsJSON)}</td>
                    <td className={isFinanceUser ? 'px-6 py-4 text-sm text-slate-400 font-semibold' : 'px-6 py-4 text-indigo-400 text-sm font-semibold'}>
                      {inv.totalAmount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${isFinanceUser ? 'font-semibold text-slate-400' : 'font-semibold ' + (inv.status === 'PAID' ? 'text-[#16a34a]' : 'text-[#dc2626]')}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex flex-col gap-2">
                      <button
                        onClick={() => handleOpenPrintModal(inv)}
                        className="inline-flex items-center justify-center gap-1 bg-[#16a34a] text-white border border-[#15803d] hover:bg-[#15803d] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition w-28"
                        title="Display full receipt details"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>

                      {inv.status === "UNPAID" && (
                        <button
                          onClick={() => handleOpenPaymentModal(inv)}
                          className="inline-flex items-center justify-center gap-1 bg-[#16a34a] text-white border border-[#15803d] hover:bg-[#15803d] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition w-28"
                        >
                          <CreditCard size={12} />
                          <span>Pay</span>
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

      {/* Generate Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Generate Invoice Ledger">
        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-2">
              Select Booking Reservation
            </label>
            <select
              name="reservationID"
              value={invoiceForm.reservationID}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, reservationID: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-black focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">Choose reservation...</option>
              {getFilteredReservationsForGuest().map((r) => (
                <option key={r.resId} value={r.resId}>
                  Res #{r.resId} (Room: {r.roomNumber || r.roomId} - {r.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={invoiceForm.currency}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-black focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="INR">INR (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-black placeholder-black focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={invoiceSubmitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {invoiceSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating invoice dynamically...</span>
              </>
            ) : (
              <span>Generate Invoice</span>
            )}
          </button>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Process Checkout Payment">
        {selectedInvoice && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-black">Invoice Reference:</span>
                <span className="font-semibold text-black">#{selectedInvoice.invoiceID}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Invoice Total:</span>
                <span className="font-bold text-indigo-400">
                  {selectedInvoice.totalAmount.toFixed(2)} {selectedInvoice.currency}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-2">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm font-semibold">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  disabled
                  value={paymentForm.amount}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-sm text-black focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <select
                name="method"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value } as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-black focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="CARD">CREDIT/DEBIT CARD</option>
                <option value="UPI">UPI</option>
                <option value="NET_BANKING">NET BANKING</option>
                {role !== "GUEST" && <option value="CASH">CASH (Desk clerk manual collection)</option>}
              </select>
            </div>

            <button
              type="submit"
              disabled={paymentSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
            >
              {paymentSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authorizing payment transaction...</span>
                </>
              ) : (
                <span>Confirm & Pay</span>
              )}
            </button>
          </form>
        )}
      </Modal>

      {/* View/Print Invoice Receipt Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Invoice Receipt Details">
        {printInvoice && (
          <div className="space-y-6 printable-invoice-area">
            {/* Logo and header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold mb-2">H</div>
                <h4 className="text-sm font-bold text-black ">HospEase Hotel Group</h4>
                <span className="text-[9px] text-black">Official Guest Bill receipt</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-black block">Invoice: #{printInvoice.invoiceID}</span>
                <span className="text-[10px] text-black block">Issued: {printInvoice.issuedAt ? new Date(printInvoice.issuedAt).toLocaleDateString() : "N/A"}</span>
                <span className="text-[10px] text-black block">Due: {new Date(printInvoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Guest details */}
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="text-black font-bold uppercase tracking-wider text-[9px] mb-1">Billing To</div>
              <div className="text-black font-semibold">{getGuestNameForInvoice(printInvoice)}</div>
              <div className="text-black">Reservation Reference: Res #{printInvoice.reservationID}</div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-black font-semibold uppercase tracking-wider">Guest Name</span>
                <span className="text-black font-bold">{getGuestNameForInvoice(printInvoice)}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-black">Room Charges</span>
                    <div className="text-black font-bold">{((printInvoice as any).roomAmount ?? printInvoice.totalAmount).toFixed(2)} {printInvoice.currency}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-black">Service Charges</span>
                    <div className="text-black font-bold">{((printInvoice as any).serviceTotal ?? 0).toFixed(2)} {printInvoice.currency}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-black">Total</span>
                    <div className="text-black font-bold">{printInvoice.totalAmount.toFixed(2)} {printInvoice.currency}</div>
                  </div>
                </div>
            </div>

            {/* Line items list */}
            <div>
              <div className="text-sm uppercase font-bold text-black tracking-wider mb-2">Itemized Ledger</div>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-black font-semibold uppercase tracking-wider text-sm border-b border-slate-800">
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 text-sm">
                    {getPrintableLineItems(printInvoice).map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2.5 text-black">{getLineItemName(item)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-black">
                          {getLineItemAmount(item, printInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-900 font-bold text-white">
                      <td className="px-4 py-3 text-right uppercase tracking-wider text-sm">Total balance due</td>
                      <td className="px-4 py-3 text-right font-mono text-indigo-400 text-base">
                        {printInvoice.totalAmount.toFixed(2)} {printInvoice.currency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Receipt actions */}
            <div className="flex gap-3 border-t border-slate-800 pt-4 print-hide">
              <button
                onClick={triggerBrowserPrint}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-black py-2.5 rounded-xl text-xs font-semibold transition border border-slate-300"
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-semibold transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingPage;
