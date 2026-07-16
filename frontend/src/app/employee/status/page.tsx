"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";

interface LeaveRequest {
  _id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: string;
}

type FilterTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<string, { bg: string; text: string; border: string; dot: string; label: string; icon: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Pending", icon: "hourglass_empty" },
  APPROVED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500", label: "Approved", icon: "check_circle" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", label: "Rejected", icon: "cancel" },
};

const tabs: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
];

export default function StatusPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) fetchLeaves();
  }, [session]);

  async function fetchLeaves() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves/my`, {
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

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return leaves;
    return leaves.filter((l) => l.status === activeTab);
  }, [leaves, activeTab]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "PENDING").length,
    approved: leaves.filter((l) => l.status === "APPROVED").length,
    rejected: leaves.filter((l) => l.status === "REJECTED").length,
  }), [leaves]);

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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Leave Status</h1>
        <p className="text-on-surface-variant mt-1">Track all your leave requests and admin responses</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-on-surface", icon: "assignment" },
          { label: "Pending", value: stats.pending, color: "text-amber-600", icon: "hourglass_empty" },
          { label: "Approved", value: stats.approved, color: "text-green-600", icon: "check_circle" },
          { label: "Rejected", value: stats.rejected, color: "text-red-600", icon: "cancel" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-outline-variant p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              stat.label === "Total" ? "bg-primary-fixed" :
              stat.label === "Pending" ? "bg-amber-50" :
              stat.label === "Approved" ? "bg-green-50" : "bg-red-50"
            }`}>
              <span className={`material-symbols-outlined text-lg ${stat.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {stat.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-outline-variant mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const count = tab.key === "ALL" ? stats.total : stats[tab.key.toLowerCase() as keyof typeof stats] as number;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
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
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-on-surface-variant">Loading requests...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-outline-variant p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>
            {activeTab === "ALL" ? "event_busy" : activeTab === "PENDING" ? "hourglass_empty" : "check"}
          </span>
          <h3 className="text-lg font-semibold text-on-surface mb-1">
            {activeTab === "ALL" ? "No leave requests yet" : `No ${activeTab.toLowerCase()} requests`}
          </h3>
          <p className="text-sm text-on-surface-variant">
            {activeTab === "ALL"
              ? "Apply for leave to get started."
              : "No requests with this status."}
          </p>
          {activeTab === "ALL" && (
            <button
              onClick={() => router.push("/employee/apply")}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-[0.97]"
            >
              Apply for Leave
            </button>
          )}
        </div>
      ) : (
        /* Clean table view */
        <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Leave Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Dates</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Days</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Reason</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-on-surface-variant uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((leave) => {
                  const config = statusConfig[leave.status];
                  const isExpanded = expandedId === leave._id;
                  const hasAdminComment = !!leave.adminComment;

                  return (
                    <tr key={leave._id} className="transition-colors">
                      {/* Leave Type */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-on-surface">{leave.leaveTypeName || "Leave"}</span>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4">
                        <div className="text-sm text-on-surface">
                          <span className="font-medium">{format(new Date(leave.startDate), "MMM d")}</span>
                          <span className="text-on-surface-variant mx-1">→</span>
                          <span>{format(new Date(leave.endDate), "MMM d, yyyy")}</span>
                        </div>
                      </td>

                      {/* Days */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-semibold text-on-surface">{leave.totalDays}</span>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4 max-w-[220px]">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : leave._id)}
                          className="text-sm text-on-surface-variant truncate block w-full text-left hover:text-on-surface transition-colors"
                          title={leave.reason}
                        >
                          {leave.reason}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </td>

                      {/* Submitted */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs text-on-surface-variant whitespace-nowrap">
                          {format(new Date(leave.createdAt), "MMM d, yyyy")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded details section */}
          {expandedId && (
            <div className="border-t border-outline-variant bg-surface-container-low">
              {(() => {
                const leave = leaves.find(l => l._id === expandedId);
                if (!leave) return null;
                const config = statusConfig[leave.status];

                return (
                  <div className="p-5 space-y-4">
                    {/* Full reason */}
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Reason</p>
                      <p className="text-sm text-on-surface bg-white rounded-lg border border-outline-variant p-3">
                        {leave.reason}
                      </p>
                    </div>

                    {/* Admin comment */}
                    {leave.adminComment && (
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Admin Response</p>
                        <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.border} ${config.bg}`}>
                          <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${config.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {config.icon}
                          </span>
                          <div>
                            <p className={`text-xs font-semibold mb-0.5 ${config.text}`}>
                              {config.label} — Admin Note
                            </p>
                            <p className={`text-sm ${config.text}`}>
                              {leave.adminComment}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dates detail */}
                    <div className="flex items-center gap-6 text-sm text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">calendar_month</span>
                        <span>{format(new Date(leave.startDate), "MMM d, yyyy")} — {format(new Date(leave.endDate), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">event</span>
                        <span>{leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
