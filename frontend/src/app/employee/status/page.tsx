"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface LeaveRequest {
  _id: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "hourglass_empty", label: "Pending Review" },
  APPROVED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: "check_circle", label: "Approved" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "cancel", label: "Rejected" },
};

export default function StatusPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

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

  const filtered = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);

  const counts = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "PENDING").length,
    approved: leaves.filter((l) => l.status === "APPROVED").length,
    rejected: leaves.filter((l) => l.status === "REJECTED").length,
  };

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Leave Status</h1>
        <p className="text-on-surface-variant mt-1">Track all your leave requests and admin responses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: counts.total, color: "text-on-surface" },
          { label: "Pending", value: counts.pending, color: "text-amber-600" },
          { label: "Approved", value: counts.approved, color: "text-green-600" },
          { label: "Rejected", value: counts.rejected, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm">
            <p className="text-xs text-on-surface-variant font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              filter === tab
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container-low"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span className={`ml-1.5 text-xs ${
              filter === tab ? "text-on-primary/70" : "text-on-surface-variant/60"
            }`}>
              ({counts[tab.toLowerCase() as keyof typeof counts]})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-on-surface-variant">Loading requests...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>
            {filter === "ALL" ? "event_busy" : filter === "PENDING" ? "hourglass_empty" : "check"}
          </span>
          <h3 className="text-lg font-semibold text-on-surface mb-1">
            {filter === "ALL" ? "No leave requests yet" : `No ${filter.toLowerCase()} requests`}
          </h3>
          <p className="text-sm text-on-surface-variant">
            {filter === "ALL"
              ? "Apply for leave to get started."
              : "No requests with this status."}
          </p>
          {filter === "ALL" && (
            <button
              onClick={() => router.push("/employee/apply")}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-[0.97]"
            >
              Apply for Leave
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((leave) => {
            const config = statusConfig[leave.status];

            return (
              <div
                key={leave._id}
                className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header bar */}
                <div className={`px-5 py-3 flex items-center justify-between border-b border-outline-variant ${config.bg}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-lg ${config.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {config.icon}
                    </span>
                    <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    Submitted {format(new Date(leave.createdAt), "MMM d, yyyy")}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">Start Date</p>
                      <p className="text-sm font-semibold text-on-surface mt-0.5">
                        {format(new Date(leave.startDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">End Date</p>
                      <p className="text-sm font-semibold text-on-surface mt-0.5">
                        {format(new Date(leave.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant font-medium">Duration</p>
                      <p className="text-sm font-semibold text-on-surface mt-0.5">
                        {leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4">
                    <p className="text-xs text-on-surface-variant font-medium mb-1">Reason</p>
                    <p className="text-sm text-on-surface bg-surface-container-low rounded-lg p-3">
                      {leave.reason}
                    </p>
                  </div>

                  {/* Admin note */}
                  {leave.adminComment && (
                    <div className="border-t border-outline-variant pt-4">
                      <div className={`flex items-start gap-3 p-3 rounded-lg ${
                        leave.status === "APPROVED" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                          leave.status === "APPROVED" ? "text-green-600" : "text-red-600"
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {leave.status === "APPROVED" ? "sms" : "sms"}
                        </span>
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${
                            leave.status === "APPROVED" ? "text-green-700" : "text-red-700"
                          }`}>
                            Admin Response
                          </p>
                          <p className={`text-sm ${
                            leave.status === "APPROVED" ? "text-green-800" : "text-red-800"
                          }`}>
                            {leave.adminComment}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
