import React, { useEffect, useState } from "react";
import { createReport, getAllReports, getReport } from "../../services/reportService";
import { Report, ReportScope } from "../../models/report";
import { Plus, Search, FileText, Loader2, Eye, Calendar, User, Settings, TrendingUp, DollarSign, Award, Users, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../../components/Modal";
import { getUserInfo } from "../../utils/auth";
import "./ReportsPage.css";

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    scope: "OCCUPANCY" as ReportScope,
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getAllReports();
      setReports(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load reports directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenGenerateModal = () => {
    setGenerateForm({
      scope: "OCCUPANCY",
      startDate: "",
      endDate: "",
      notes: "",
    });
    setIsGenerateModalOpen(true);
  };

  const handleOpenViewModal = async (id: number) => {
    try {
      const data = await getReport(id);
      setViewingReport(data);
      setIsViewModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load report data.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setGenerateForm({ ...generateForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateForm.startDate || !generateForm.endDate) {
      toast.error("Please select start and end dates.");
      return;
    }

    const startDate = new Date(generateForm.startDate);
    const endDate = new Date(generateForm.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Please select valid report dates.");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date cannot be earlier than start date.");
      return;
    }

    if (generateForm.notes && generateForm.notes.trim().length > 300) {
      toast.error("Notes cannot exceed 300 characters.");
      return;
    }

    setSubmitting(true);
    const userInfo = getUserInfo();

    const payload = {
      scope: generateForm.scope,
      parametersJson: JSON.stringify({
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
        notes: generateForm.notes,
      }),
      generatedBy: userInfo?.fullName || "Hotel Admin System",
    };

    try {
      await createReport(payload);
      toast.success("Analytical report compiled by backend successfully! 📊");
      setIsGenerateModalOpen(false);
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Report compiling failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const getParamsDisplay = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      return `Span: ${new Date(parsed.startDate).toLocaleDateString()} - ${new Date(
        parsed.endDate
      ).toLocaleDateString()}`;
    } catch {
      return jsonStr;
    }
  };

  const getFilteredReports = () => {
    return reports.filter((r) => {
      const params = getParamsDisplay(r.parametersJson);
      return (
        r.scope.toLowerCase().includes(search.toLowerCase()) ||
        r.generatedBy.toLowerCase().includes(search.toLowerCase()) ||
        params.toLowerCase().includes(search.toLowerCase())
      );
    });
  };

  // Parse metricsJson and display actual figures returned from backend
  const getDynamicReportSummary = (report: Report) => {
    let metrics: any = {};
    try {
      metrics = JSON.parse(report.metricsJson);
    } catch {
      return (
        <div className="flex items-center gap-2 text-black text-xs">
          <ShieldAlert size={14} />
          <span>Error parsing metrics payload.</span>
        </div>
      );
    }

    let params: any = {};
    try {
      params = JSON.parse(report.parametersJson);
    } catch {}

    const span = params.startDate ? `${new Date(params.startDate).toLocaleDateString()} to ${new Date(params.endDate).toLocaleDateString()}` : "selected duration";

    if (report.scope === "OCCUPANCY") {
      return (
        <div className="space-y-4">
          <p className="text-xs text-black">
            This document outlines room availability statistics, booking aggregates, and stays logged between {span}.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Total Rooms</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.totalRooms || 0} units</div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Occupied Units</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.occupiedRooms || 0} rooms</div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Booked Units</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.bookedRooms || 0} rooms</div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Average Stay Duration</span>
              <div className="text-xl font-extrabold text-black mt-1">{(metrics.avgStayDays || 0).toFixed(1)} nights</div>
            </div>
          </div>
          <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-xs text-black font-semibold uppercase">Total Occupancy Rate</span>
            </div>
            <span className="text-lg font-black text-black">{metrics.occupancyRate || 0}%</span>
          </div>
        </div>
      );
    }

    if (report.scope === "FINANCE") {
      const revenue = metrics.totalRevenue || 0;
      const currency = metrics.currency || "INR";
      return (
        <div className="space-y-4">
          <p className="text-xs text-black">
            This document outlines total transactions and balances captured between {span}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-black font-semibold uppercase">Total Gross Receipts</span>
                <div className="text-xl font-black text-black mt-1">{revenue.toFixed(2)} {currency}</div>
              </div>
              <DollarSign className="text-emerald-500 opacity-60" size={32} />
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-black font-semibold uppercase">Completed Payments</span>
                <div className="text-xl font-extrabold text-black mt-1">{metrics.completedPaymentsCount || 0} captures</div>
              </div>
              <FileText className="text-slate-400 opacity-60" size={32} />
            </div>
          </div>
        </div>
      );
    }

    if (report.scope === "STAFF") {
      return (
        <div className="space-y-4">
          <p className="text-xs text-black">
            This document outlines staffing availability, shift rosters, and housekeeping productivities between {span}.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Staff Headcount</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.totalStaffCount || 0} attendants</div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Scheduled Shifts Today</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.shiftsScheduledToday || 0} shifts</div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Completed Cleanings</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.completedCleaningTasks || 0} rooms</div>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-black font-semibold uppercase">Fulfilled Orders</span>
              <div className="text-xl font-extrabold text-black mt-1">{metrics.fulfilledServiceOrders || 0} requests</div>
            </div>
          </div>
          <div className="bg-violet-950/20 border border-violet-900/40 p-4 rounded-xl flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-violet-400" />
              <span className="text-xs text-black font-semibold uppercase">Productivity Score</span>
            </div>
            <span className="text-lg font-black text-black">{metrics.productivityScore || 0}%</span>
          </div>
        </div>
      );
    }

    return null;
  };

  const getScopeLabel = (scope: ReportScope) => {
    switch (scope) {
      case "OCCUPANCY":
        return "Occupancy Summary";
      case "FINANCE":
        return "Financial Ledger";
      default:
        return "Staff Productivity Logs";
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-black">System Reports</h3>
          <p className="text-xs text-slate-400">Generate occupancy, financial and shift registry summaries</p>
        </div>
        <button
          onClick={handleOpenGenerateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus size={16} />
          <span>Compile New Report</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search report logs by compiler name or parameter values..."
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
      ) : getFilteredReports().length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No reports generated yet.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-sm font-bold text-black uppercase">
                  <th className="px-6 py-4">Report ID</th>
                  <th className="px-6 py-4">Scope Category</th>
                  <th className="px-6 py-4">Parameters</th>
                  <th className="px-6 py-4">Generated By</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">View Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {getFilteredReports().map((rep) => (
                  <tr key={rep.reportId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-400 font-semibold">
                      #{rep.reportId}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold flex items-center gap-2">
                      <FileText size={16} className="text-indigo-400" />
                      <span>{getScopeLabel(rep.scope)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">
                      {getParamsDisplay(rep.parametersJson)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">{rep.generatedBy}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-semibold">
                      {new Date(rep.generatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenViewModal(rep.reportId)}
                        className="inline-flex items-center gap-1 bg-[#4f46e5] text-white border border-[#4338ca] hover:bg-[#4338ca] px-2 py-1 rounded-lg text-xs font-semibold transition"
                      >
                        <Eye size={12} />
                        <span>Display Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Compile Analytics Report">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Report Category
            </label>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <select
                name="scope"
                value={generateForm.scope}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="OCCUPANCY">Occupancy Rates & Booking Logs</option>
                <option value="FINANCE">Financial Receipts & Settled Ledgers</option>
                <option value="STAFF">Attendant Shifts & Roster Details</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={generateForm.startDate}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={generateForm.endDate}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Compilation Parameters Notes
            </label>
            <input
              type="text"
              name="notes"
              value={generateForm.notes}
              onChange={handleInputChange}
              placeholder="e.g. Q2 audit, lobby cleanup report..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition duration-200 flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Compiling report files...</span>
              </>
            ) : (
              <span>Compile & Save</span>
            )}
          </button>
        </form>
      </Modal>

      {/* View Detail Report Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={viewingReport ? `Display Report #${viewingReport.reportId}` : "Report detail"}
      >
        {viewingReport && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs space-y-1">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-500" />
                  <span className="text-black">Generated By:</span>
                  <span className="font-semibold text-black">{viewingReport.generatedBy}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={13} className="text-slate-500" />
                  <span className="text-black">Timestamp:</span>
                  <span className="font-semibold text-black">
                    {new Date(viewingReport.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 bg-indigo-500/10 text-black border border-indigo-500/20 rounded-lg font-bold text-xs uppercase">
                {viewingReport.scope}
              </span>
            </div>

            {/* Generated summaries */}
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-sm font-bold text-black mb-3 uppercase tracking-wider">
                Document Content Overview
              </h4>
              {getDynamicReportSummary(viewingReport)}
            </div>

            <button
              onClick={() => setIsViewModalOpen(false)}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Close Document
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportsPage;
