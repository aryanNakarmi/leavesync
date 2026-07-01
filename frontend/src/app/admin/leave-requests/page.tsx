"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
type FilterTab = "ALL" | LeaveStatus;

interface LeaveRequest {
  _id: string;
  userId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  adminComment?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface ModalState {
  open: boolean;
  status: "APPROVED" | "REJECTED";
  request: LeaveRequest | null;
  comment: string;
}

const tabs: { key: FilterTab; label: string; countKey?: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

const statusConfig: Record<LeaveStatus, { bg: string; text: string; border: string; icon: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "hourglass_empty" },
  APPROVED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: "check_circle" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "cancel" },
};

export default function LeaveRequestsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [modal, setModal] = useState<ModalState>({ open: false, status: "APPROVED", request: null, comment: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>({ show: false, type: "success", message: "" });

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) fetchLeaves();
  }, [session]);

  async function fetchLeaves() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const filteredLeaves = useMemo(() => {
    if (activeTab === "ALL") return leaves;
    return leaves.filter((l) => l.status === activeTab);
  }, [leaves, activeTab]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "PENDING").length,
    approved: leaves.filter((l) => l.status === "APPROVED").length,
    rejected: leaves.filter((l) => l.status === "REJECTED").length,
  }), [leaves]);

  function openModal(request: LeaveRequest) {
    setModal({ open: true, status: "APPROVED", request, comment: "" });
  }

  function closeModal() {
    setModal({ open: false, status: "APPROVED", request: null, comment: "" });
  }

  async function handleAction() {
    if (!modal.request) return;
    setActionLoading(true);

    const endpoint = modal.status === "APPROVED"
      ? `${process.env.NEXT_PUBLIC_API_URL}/leaves/${modal.request._id}/approve`
      : `${process.env.NEXT_PUBLIC_API_URL}/leaves/${modal.request._id}/reject`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify({ adminComment: modal.comment || undefined })
      });

      if (res.ok) {
        const actionLabel = modal.status === "APPROVED" ? "approved" : "rejected";
        setToast({ show: true, type: "success", message: `Leave request ${actionLabel} successfully!` });
        closeModal();
        await fetchLeaves();
      } else {
        const data = await res.json();
        setToast({ show: true, type: "error", message: data.error || "Action failed" });
      }
    } catch {
      setToast({ show: true, type: "error", message: "Failed to connect. Please try again." });
    }
    setActionLoading(false);
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  }

  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Leave Requests</h1>
        <p className="text-on-surface-variant mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
          toast.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-error-container border-error/20"
        }`}>
          <span
            className={`material-symbols-outlined text-xl shrink-0 ${toast.type === "success" ? "text-green-600" : "text-error"}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p className={`text-sm ${toast.type === "success" ? "text-green-800" : "text-on-error-container"}`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Total</p>
          <p className="text-2xl font-bold text-on-surface mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm">
          <p className="text-xs text-on-surface-variant font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-outline-variant overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tab.key === "ALL" ? stats.total : stats[tab.key.toLowerCase() as keyof typeof stats] as number;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-primary-fixed text-primary" : "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-on-surface-variant">Loading requests...</span>
            </div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl text-outline mb-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {activeTab === "ALL" ? "event_busy" : "check"}
            </span>
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              {activeTab === "ALL"
                ? "No leave requests yet"
                : `No ${activeTab.toLowerCase()} requests`}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {activeTab === "ALL"
                ? "When employees submit requests, they will appear here."
                : `No ${activeTab.toLowerCase()} requests at this time.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Leave Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Dates</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Days</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredLeaves.map((leave) => {
                  const config = statusConfig[leave.status];
                  const isPending = leave.status === "PENDING";

                  return (
                    <tr key={leave._id} className="hover:bg-surface-container-low transition-colors">
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {leave.user.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{leave.user.name}</p>
                            <p className="text-xs text-on-surface-variant">{leave.user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-on-surface">{leave.leaveTypeName}</span>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4">
                        <div className="text-sm text-on-surface">
                          <span className="font-medium">{format(new Date(leave.startDate), "MMM d")}</span>
                          <span className="text-on-surface-variant mx-1">→</span>
                          <span className="font-medium">{format(new Date(leave.endDate), "MMM d, yyyy")}</span>
                        </div>
                      </td>

                      {/* Days */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-on-surface">{leave.totalDays}</span>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="text-sm text-on-surface truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                        {leave.adminComment && (
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate" title={`Admin: ${leave.adminComment}`}>
                            <span className="font-medium">Admin:</span> {leave.adminComment}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {config.icon}
                          </span>
                          {leave.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {isPending ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => openModal(leave)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-fixed text-primary border border-primary-fixed-dim text-xs font-medium hover:bg-primary-fixed-dim transition-all active:scale-[0.95]"
                            >
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rate_review</span>
                              Review
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <span className="text-xs text-on-surface-variant italic flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                {leave.status === "APPROVED" ? "check_circle" : "cancel"}
                              </span>
                              {leave.status === "APPROVED" ? "Approved" : "Rejected"}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {modal.open && modal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-md">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rate_review
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Review Leave Request</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{modal.request.user.name}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Request summary */}
              <div className="bg-surface-container-low rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Leave Type</span>
                  <span className="text-on-surface font-medium">{modal.request.leaveTypeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Dates</span>
                  <span className="text-on-surface font-medium">
                    {format(new Date(modal.request.startDate), "MMM d")} — {format(new Date(modal.request.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Days</span>
                  <span className="text-on-surface font-medium">{modal.request.totalDays} day{modal.request.totalDays > 1 ? "s" : ""}</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/50">
                  <p className="text-xs text-on-surface-variant mb-1">Reason</p>
                  <p className="text-sm text-on-surface">{modal.request.reason}</p>
                </div>
              </div>

              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModal({ ...modal, status: "APPROVED" })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all active:scale-[0.98] ${
                      modal.status === "APPROVED"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-outline-variant text-on-surface-variant hover:border-green-300 hover:bg-green-50/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ ...modal, status: "REJECTED" })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all active:scale-[0.98] ${
                      modal.status === "REJECTED"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-outline-variant text-on-surface-variant hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    Reject
                  </button>
                </div>
              </div>

              {/* Admin note */}
              <div>
                <label htmlFor="adminComment" className="block text-sm font-medium text-on-surface mb-1.5">
                  Note to Employee
                </label>
                <textarea
                  id="adminComment"
                  value={modal.comment}
                  onChange={(e) => setModal({ ...modal, comment: e.target.value })}
                  placeholder={"Write a note that the employee will see on their status page..."}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50 resize-none text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-all active:scale-[0.97] flex items-center gap-2 ${
                  modal.status === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {modal.status === "APPROVED" ? "check" : "close"}
                    </span>
                    {modal.status === "APPROVED" ? "Confirm Approval" : "Confirm Rejection"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
