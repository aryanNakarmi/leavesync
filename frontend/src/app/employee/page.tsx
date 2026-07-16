"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface LeaveBalance {
  _id: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  carriedOver: number;
}

interface LeaveType {
  _id: string;
  name: string;
  isPaid: boolean;
  annualQuota: number;
}

interface LeaveRequest {
  _id: string;
  leaveTypeId: string;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: string;
}

export default function EmployeeDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchAllData();
  }, [session]);

  async function fetchAllData() {
    const token = (session as any)?.token;
    if (!token) return;

    try {
      const [balanceRes, leavesRes, typesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-balance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves/my`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types/active`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalances(Array.isArray(data) ? data : []);
      }
      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setRequests(Array.isArray(data) ? data : []);
      }
      if (typesRes.ok) {
        const data = await typesRes.json();
        setLeaveTypes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  // Stats computation
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedLeaves = requests.filter((r) => r.status === "APPROVED");
  const totalDaysUsed = approvedLeaves.reduce((sum, r) => sum + r.totalDays, 0);

  // Find next upcoming leave (nearest future approved leave)
  const now = new Date();
  const upcomingLeaves = approvedLeaves
    .filter((r) => new Date(r.startDate) >= now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const nextLeave = upcomingLeaves[0] || null;

  // Find the most recent PENDING leave
  const recentPending = [...requests]
    .filter((r) => r.status === "PENDING")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    APPROVED: "bg-green-50 text-green-700 border border-green-200",
    REJECTED: "bg-red-50 text-red-700 border border-red-200",
  };

  const quickActions = [
    { title: "Apply for Leave", desc: "Submit a new leave request", icon: "add_circle", href: "/employee/apply", color: "text-primary", bg: "bg-primary-fixed" },
    { title: "My Requests", desc: "View your leave history", icon: "pending_actions", href: "/employee/status", color: "text-secondary", bg: "bg-secondary-fixed" },
    { title: "Calendar", desc: "View your schedule", icon: "calendar_month", href: "/employee/calendar", color: "text-primary", bg: "bg-primary-fixed" },
    { title: "Settings", desc: "Update your profile", icon: "settings", href: "/employee/settings", color: "text-on-surface-variant", bg: "bg-surface-container-high" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      

      {/* ─── Quick Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-outline-variant p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-amber-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_empty</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Pending Requests</p>
              <p className="text-xl font-bold text-on-surface">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-outline-variant p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-green-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Approved Leaves</p>
              <p className="text-xl font-bold text-on-surface">{approvedLeaves.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-outline-variant p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Days Used This Year</p>
              <p className="text-xl font-bold text-on-surface">{totalDaysUsed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-outline-variant p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-purple-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">
                {nextLeave ? "Next Leave" : "Total Requests"}
              </p>
              <p className="text-xl font-bold text-on-surface">
                {nextLeave
                  ? `${format(new Date(nextLeave.startDate), "MMM d")}`
                  : requests.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Leave Balances ─── */}
      {balances.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              <h2 className="text-base font-semibold text-on-surface">Leave Balances</h2>
            </div>
            <button
              onClick={() => router.push("/employee/apply")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              Apply
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {balances.map((bal) => {
                const type = leaveTypes.find((t) => t._id === bal.leaveTypeId);
                if (!type) return null;
                const remaining = bal.allocated + bal.carriedOver - bal.used;
                const total = bal.allocated + bal.carriedOver;
                const percentage = total > 0 ? (bal.used / total) * 100 : 0;

                return (
                  <div key={bal._id} className="p-4 rounded-lg border border-outline-variant bg-surface-container-low/30 hover:border-primary-fixed-dim/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          percentage >= 80 ? "bg-red-50" : "bg-primary-fixed"
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            percentage >= 80 ? "text-red-500" : "text-primary"
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {type.isPaid ? "check_circle" : "pending"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{type.name}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {type.isPaid ? "Paid Leave" : "Unpaid Leave"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-on-surface">{remaining}</p>
                        <p className="text-[11px] text-on-surface-variant">remaining</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 80
                            ? "bg-red-500"
                            : percentage >= 50
                            ? "bg-amber-500"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between mt-1.5 text-[11px]">
                      <span className="text-on-surface-variant">
                        <strong className="text-on-surface">{bal.used}</strong> used
                      </span>
                      <span className="text-on-surface-variant">
                        of <strong className="text-on-surface">{total}</strong> total
                        {bal.carriedOver > 0 && (
                          <span className="ml-1">(+{bal.carriedOver} carry)</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="bg-white rounded-lg border border-outline-variant p-5 hover:border-primary-fixed-dim hover:shadow-sm transition-all text-left group"
          >
            <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
              <span className={`material-symbols-outlined text-lg ${action.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {action.icon}
              </span>
            </div>
            <h3 className="font-semibold text-sm text-on-surface">{action.title}</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* ─── Recent Requests ─── */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h2 className="text-base font-semibold text-on-surface">Recent Leave Requests</h2>
          </div>
          {requests.length > 0 && (
            <button
              onClick={() => router.push("/employee/status")}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              View All
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            <p className="text-on-surface-variant font-medium">No leave requests yet</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">Your leave history will appear here</p>
            <button
              onClick={() => router.push("/employee/apply")}
              className="mt-4 inline-flex items-center gap-2 bg-primary text-on-primary font-medium px-5 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Apply for Leave
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {requests.slice(0, 5).map((leave) => (
              <div key={leave._id} className="px-6 py-4 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Type icon */}
                    <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {leave.status === "APPROVED" ? "check_circle" : leave.status === "REJECTED" ? "cancel" : "pending"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {leave.leaveTypeName || "Leave"}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[leave.status] || "bg-gray-100 text-gray-800"}`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
                        {" · "}{leave.totalDays} day{leave.totalDays > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right side: reason tooltip or admin comment */}
                  <div className="hidden sm:flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
                    {leave.adminComment ? (
                      <span className="max-w-[180px] truncate" title={leave.adminComment}>
                        "{leave.adminComment}"
                      </span>
                    ) : leave.reason ? (
                      <span className="max-w-[180px] truncate text-on-surface-variant/60" title={leave.reason}>
                        {leave.reason}
                      </span>
                    ) : null}
                    <span className="text-on-surface-variant/30">{format(new Date(leave.createdAt), "MMM d")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Active Pending Reminder ─── */}
      {pendingCount > 0 && recentPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-800 font-medium">
              You have {pendingCount} pending request{pendingCount > 1 ? "s" : ""}
            </p>
            {recentPending && (
              <p className="text-xs text-amber-700 mt-0.5">
                {recentPending.leaveTypeName || "Leave"} · {format(new Date(recentPending.startDate), "MMM d")} - {format(new Date(recentPending.endDate), "MMM d")}
                {" · "}{recentPending.totalDays} day{recentPending.totalDays > 1 ? "s" : ""} · Submitted {format(new Date(recentPending.createdAt), "MMM d")}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/employee/status")}
            className="text-sm text-amber-700 font-medium hover:underline shrink-0"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}
