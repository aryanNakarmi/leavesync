"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachMonthOfInterval,
  subMonths, startOfYear,
} from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveRequest {
  _id: string;
  userId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: string;
  user: { name: string; email: string; profilePicture?: string };
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  isActive: boolean;
}

interface LeaveType {
  _id: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  status: string;
}

interface MonthlyTrend {
  month: string;
  monthLabel: string;
  approved: number;
  rejected: number;
  pending: number;
  total: number;
}

interface DeptBreakdown {
  department: string;
  employeeCount: number;
  totalLeaves: number;
  approvedDays: number;
  percentage: number;
}

interface LeaveTypeDistribution {
  name: string;
  count: number;
  days: number;
  color: string;
  percentage: number;
}

interface EmployeeUsage {
  name: string;
  email: string;
  department: string;
  totalLeaves: number;
  totalDays: number;
  approvedDays: number;
  pendingCount: number;
}

// ─── Color helpers ──────────────────────────────────────────────────────────

const CHART_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
];

const DATE_PRESETS = [
  { value: "last6months", label: "Last 6 Months" },
  { value: "lastQuarter", label: "Last Quarter" },
  { value: "thisYear", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
] as const;

// ─── CSV Export ─────────────────────────────────────────────────────────────

function downloadCSV(data: EmployeeUsage[]) {
  const headers = ["Employee Name", "Email", "Department", "Total Leaves", "Total Days", "Approved Days", "Pending Leaves"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = data.map(e => [
    escape(e.name), escape(e.email), escape(e.department),
    e.totalLeaves, e.totalDays, e.approvedDays, e.pendingCount,
  ]);
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leave-usage-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"overview" | "employees">("overview");
  const [sortBy, setSortBy] = useState<"days" | "count">("days");

  // ── Filter state ────────────────────────────────────────────────────────
  const [datePreset, setDatePreset] = useState<string>("last6months");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) fetchAllData();
  }, [session]);

  async function fetchAllData() {
    try {
      const [leavesRes, usersRes, typesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves`, {
          headers: { Authorization: `Bearer ${(session as any)?.token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: { Authorization: `Bearer ${(session as any)?.token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types`, {
          headers: { Authorization: `Bearer ${(session as any)?.token}` }
        }),
      ]);

      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setEmployees(Array.isArray(data) ? data : []);
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

  // ─── Date range ─────────────────────────────────────────────────────────

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (datePreset) {
      case "last6months":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "lastQuarter":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfMonth(now);
        break;
      case "custom":
        start = customStart ? startOfMonth(new Date(customStart)) : null;
        end = customEnd ? endOfMonth(new Date(customEnd)) : null;
        break;
      case "all":
      default:
        start = null;
        end = null;
        break;
    }
    return { start, end };
  }, [datePreset, customStart, customEnd]);

  // ─── Filtered leaves ────────────────────────────────────────────────────

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const d = new Date(l.createdAt);
      // Date range
      if (dateRange.start && d < dateRange.start) return false;
      if (dateRange.end && d > dateRange.end) return false;
      // Leave type
      if (leaveTypeFilter !== "all" && l.leaveTypeId !== leaveTypeFilter) return false;
      return true;
    });
  }, [leaves, dateRange, leaveTypeFilter]);

  // ─── Derived Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalLeaves = filteredLeaves.length;
    const pending = filteredLeaves.filter(l => l.status === "PENDING").length;
    const approved = filteredLeaves.filter(l => l.status === "APPROVED").length;
    const rejected = filteredLeaves.filter(l => l.status === "REJECTED").length;
    const totalApprovedDays = filteredLeaves
      .filter(l => l.status === "APPROVED")
      .reduce((sum, l) => sum + l.totalDays, 0);
    const approvalRate = totalLeaves > 0 ? Math.round((approved / totalLeaves) * 100) : 0;

    // Department distribution from employees
    const deptCount = new Map<string, number>();
    employees.forEach(e => {
      const dept = e.department || "Unassigned";
      deptCount.set(dept, (deptCount.get(dept) || 0) + 1);
    });

    return {
      totalLeaves,
      pending,
      approved,
      rejected,
      totalApprovedDays,
      approvalRate,
      totalEmployees: employees.length,
      departmentCount: deptCount.size,
    };
  }, [filteredLeaves, employees]);

  // ─── Monthly Trends ─────────────────────────────────────────────────────

  const monthlyTrends = useMemo(() => {
    const { start, end } = dateRange;
    const today = new Date();

    // Determine the interval to show
    const intervalStart = start ?? startOfMonth(subMonths(today, 5));
    const intervalEnd = end ?? endOfMonth(today);

    const months = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthLeaves = filteredLeaves.filter(l => {
        const d = new Date(l.createdAt);
        return d >= monthStart && d <= monthEnd;
      });

      return {
        month: format(month, "yyyy-MM"),
        monthLabel: format(month, "MMM yy"),
        approved: monthLeaves.filter(l => l.status === "APPROVED").length,
        rejected: monthLeaves.filter(l => l.status === "REJECTED").length,
        pending: monthLeaves.filter(l => l.status === "PENDING").length,
        total: monthLeaves.length,
      } as MonthlyTrend;
    });
  }, [filteredLeaves, dateRange]);

  const maxMonthlyTotal = useMemo(
    () => Math.max(...monthlyTrends.map(m => m.total), 1),
    [monthlyTrends]
  );

  // ─── Leave Type Distribution ────────────────────────────────────────────

  const typeDistribution = useMemo(() => {
    const map = new Map<string, { count: number; days: number }>();
    filteredLeaves.filter(l => l.status === "APPROVED").forEach(l => {
      const existing = map.get(l.leaveTypeName) || { count: 0, days: 0 };
      existing.count += 1;
      existing.days += l.totalDays;
      map.set(l.leaveTypeName, existing);
    });

    const maxDays = Math.max(...Array.from(map.values()).map(v => v.days), 1);

    return Array.from(map.entries()).map(([name, data], i) => ({
      name,
      count: data.count,
      days: data.days,
      color: CHART_COLORS[i % CHART_COLORS.length],
      percentage: Math.round((data.days / maxDays) * 100),
    } as LeaveTypeDistribution));
  }, [filteredLeaves]);

  // ─── Department Breakdown ───────────────────────────────────────────────

  const deptBreakdown = useMemo(() => {
    const deptMap = new Map<string, { employeeCount: number; totalLeaves: number; approvedDays: number }>();

    employees.forEach(e => {
      const dept = e.department || "Unassigned";
      const existing = deptMap.get(dept) || { employeeCount: 0, totalLeaves: 0, approvedDays: 0 };
      existing.employeeCount += 1;
      deptMap.set(dept, existing);
    });

    filteredLeaves.forEach(l => {
      const emp = employees.find(e => e._id === l.userId);
      const dept = emp?.department || "Unassigned";
      const existing = deptMap.get(dept);
      if (existing) {
        existing.totalLeaves += 1;
        if (l.status === "APPROVED") existing.approvedDays += l.totalDays;
      }
    });

    const maxDays = Math.max(...Array.from(deptMap.values()).map(v => v.approvedDays), 1);

    return Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      ...data,
      percentage: Math.round((data.approvedDays / maxDays) * 100),
    })).sort((a, b) => b.approvedDays - a.approvedDays);
  }, [employees, filteredLeaves]);

  // ─── Employee Usage ─────────────────────────────────────────────────────

  const employeeUsage = useMemo(() => {
    const map = new Map<string, EmployeeUsage>();

    employees.forEach(e => {
      map.set(e._id, {
        name: e.name,
        email: e.email,
        department: e.department || "Unassigned",
        totalLeaves: 0,
        totalDays: 0,
        approvedDays: 0,
        pendingCount: 0,
      });
    });

    filteredLeaves.forEach(l => {
      const emp = map.get(l.userId);
      if (!emp) return;
      emp.totalLeaves += 1;
      emp.totalDays += l.totalDays;
      if (l.status === "APPROVED") emp.approvedDays += l.totalDays;
      if (l.status === "PENDING") emp.pendingCount += 1;
    });

    return Array.from(map.values())
      .filter(e => e.totalLeaves > 0)
      .sort((a, b) =>
        sortBy === "days" ? b.approvedDays - a.approvedDays : b.totalLeaves - a.totalLeaves
      );
  }, [employees, filteredLeaves, sortBy]);

  const maxEmployeeDays = useMemo(
    () => Math.max(...employeeUsage.map(e => e.approvedDays), 1),
    [employeeUsage]
  );

  // ─── Loading ────────────────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Reports</h1>
        <p className="text-on-surface-variant mt-1">Analytics and insights for your organization</p>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-lg border border-outline-variant p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date presets */}
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-on-surface-variant text-base">calendar_month</span>
            {DATE_PRESETS.map(p => (
              <button
                key={p.value}
                onClick={() => setDatePreset(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  datePreset === p.value
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-outline-variant bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="text-on-surface-variant text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-outline-variant bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-outline-variant/50 mx-1 hidden sm:block" />

          {/* Leave type filter */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-base">filter_list</span>
            <select
              value={leaveTypeFilter}
              onChange={e => setLeaveTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-outline-variant bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer pr-7"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 6px center",
              }}
            >
              <option value="all">All Leave Types</option>
              {leaveTypes
                .filter(lt => lt.status !== "inactive")
                .map(lt => (
                  <option key={lt._id} value={lt._id}>{lt.name}</option>
                ))}
            </select>
          </div>

          {/* Active filter badge */}
          {datePreset !== "all" || leaveTypeFilter !== "all" ? (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full border border-outline-variant/50">
                {filteredLeaves.length} of {leaves.length} requests shown
              </span>
              {(datePreset !== "last6months" || leaveTypeFilter !== "all") && (
                <button
                  onClick={() => {
                    setDatePreset("last6months");
                    setCustomStart("");
                    setCustomEnd("");
                    setLeaveTypeFilter("all");
                  }}
                  className="text-[10px] text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-full hover:bg-primary/5 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-on-surface-variant">Loading reports data...</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Overview Stats Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Employees" value={stats.totalEmployees} icon="group" color="text-primary" />
            <StatCard label="Total Requests" value={stats.totalLeaves} icon="assignment" color="text-on-surface" />
            <StatCard label="Approved" value={stats.approved} icon="check_circle" color="text-green-600" />
            <StatCard label="Pending" value={stats.pending} icon="hourglass_empty" color="text-amber-600" />
            <StatCard label="Approval Rate" value={`${stats.approvalRate}%`} icon="trending_up" color="text-primary" />
            <StatCard label="Days Approved" value={stats.totalApprovedDays} icon="calendar_month" color="text-violet-600" />
          </div>

          {/* ── Tab bar ── */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-base align-text-bottom mr-1">bar_chart</span>
              Overview
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "employees"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-base align-text-bottom mr-1">group</span>
              Employee Usage
            </button>
          </div>

          {activeTab === "overview" ? (
            <>
              {/* ── Two-column layout ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Monthly Trends */}
                <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                  <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                    <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                      Monthly Leave Trends
                    </h2>
                  </div>
                  <div className="p-6">
                    {monthlyTrends.length === 0 ? (
                      <p className="text-center text-on-surface-variant text-sm py-8">No data available for the selected period</p>
                    ) : (
                      <div className="space-y-3">
                        {monthlyTrends.map((m) => (
                          <div key={m.month} className="flex items-center gap-3">
                            <span className="text-xs text-on-surface-variant font-medium w-14 shrink-0">{m.monthLabel}</span>
                            <div className="flex-1 h-7 bg-surface-container-low rounded-lg overflow-hidden flex">
                              {m.total > 0 && (
                                <>
                                  <div
                                    className="h-full bg-green-400 rounded-l-lg transition-all"
                                    style={{ width: `${(m.approved / (maxMonthlyTotal || 1)) * 100}%` }}
                                    title={`Approved: ${m.approved}`}
                                  />
                                  <div
                                    className="h-full bg-amber-400 transition-all"
                                    style={{ width: `${(m.pending / (maxMonthlyTotal || 1)) * 100}%` }}
                                    title={`Pending: ${m.pending}`}
                                  />
                                  <div
                                    className="h-full bg-red-400 rounded-r-lg transition-all"
                                    style={{ width: `${(m.rejected / (maxMonthlyTotal || 1)) * 100}%` }}
                                    title={`Rejected: ${m.rejected}`}
                                  />
                                </>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-on-surface w-6 text-right">{m.total}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-outline-variant/30 text-xs text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-400" />
                        <span>Approved</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-400" />
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-400" />
                        <span>Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Type Distribution */}
                <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                  <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                    <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>donut_small</span>
                      Leave Type Distribution
                    </h2>
                  </div>
                  <div className="p-6">
                    {typeDistribution.length === 0 ? (
                      <p className="text-center text-on-surface-variant text-sm py-8">No approved leaves in this period</p>
                    ) : (
                      <div className="space-y-4">
                        {typeDistribution.map((type, i) => (
                          <div key={type.name}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded ${type.color}`} />
                                <span className="font-medium text-on-surface">{type.name}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                                <span>{type.count} requests</span>
                                <span className="font-semibold text-on-surface">{type.days} days</span>
                              </div>
                            </div>
                            <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${type.color}`}
                                style={{ width: `${type.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="bg-white rounded-lg border border-outline-variant overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                  <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
                    Department Breakdown
                  </h2>
                </div>
                <div className="p-6">
                  {deptBreakdown.length === 0 ? (
                    <p className="text-center text-on-surface-variant text-sm py-8">No departments configured</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-surface-container-low rounded-lg">
                            <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Department</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Employees</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Leaves</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Approved Days</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Usage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {deptBreakdown.map((dept) => (
                            <tr key={dept.department} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-4 py-3.5 text-sm font-medium text-on-surface">{dept.department}</td>
                              <td className="px-4 py-3.5 text-sm text-center text-on-surface">{dept.employeeCount}</td>
                              <td className="px-4 py-3.5 text-sm text-center text-on-surface">{dept.totalLeaves}</td>
                              <td className="px-4 py-3.5 text-sm text-center font-semibold text-on-surface">{dept.approvedDays}</td>
                              <td className="px-4 py-3.5">
                                <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${dept.percentage}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Status distribution */}
              <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
                  <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pie_chart</span>
                    Request Status Summary
                  </h2>
                </div>
                <div className="p-6">
                  {stats.totalLeaves === 0 ? (
                    <p className="text-center text-on-surface-variant text-sm py-8">No requests in this period</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      {/* Horizontal stacked bar */}
                      <div className="w-full sm:w-2/3">
                        <div className="w-full h-10 rounded-xl overflow-hidden flex shadow-sm">
                          {stats.approved > 0 && (
                            <div
                              className="h-full bg-green-400 flex items-center justify-center text-xs font-bold text-white transition-all"
                              style={{ width: `${(stats.approved / stats.totalLeaves) * 100}%` }}
                            >
                              {stats.approved}
                            </div>
                          )}
                          {stats.pending > 0 && (
                            <div
                              className="h-full bg-amber-400 flex items-center justify-center text-xs font-bold text-white transition-all"
                              style={{ width: `${(stats.pending / stats.totalLeaves) * 100}%` }}
                            >
                              {stats.pending}
                            </div>
                          )}
                          {stats.rejected > 0 && (
                            <div
                              className="h-full bg-red-400 flex items-center justify-center text-xs font-bold text-white transition-all"
                              style={{ width: `${(stats.rejected / stats.totalLeaves) * 100}%` }}
                            >
                              {stats.rejected}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-4 sm:gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-green-400" />
                          <span className="text-on-surface-variant">Approved <strong className="text-on-surface">{stats.approved}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-amber-400" />
                          <span className="text-on-surface-variant">Pending <strong className="text-on-surface">{stats.pending}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-red-400" />
                          <span className="text-on-surface-variant">Rejected <strong className="text-on-surface">{stats.rejected}</strong></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ── Employee Usage Tab ── */}
              <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                    Employee Leave Usage
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Sort toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-on-surface-variant">Sort:</span>
                      <button
                        onClick={() => setSortBy("days")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          sortBy === "days"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        Days
                      </button>
                      <button
                        onClick={() => setSortBy("count")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          sortBy === "count"
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        Count
                      </button>
                    </div>
                    {/* CSV Export */}
                    {employeeUsage.length > 0 && (
                      <button
                        onClick={() => downloadCSV(employeeUsage)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export CSV
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {employeeUsage.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>group_off</span>
                      <p className="text-sm text-on-surface-variant">No leave activity for the selected period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-surface-container-low rounded-lg">
                            <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Employee</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Department</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Total Requests</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Approved Days</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Usage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {employeeUsage.map((emp) => (
                            <tr key={emp.email} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-4 py-3.5">
                                <div>
                                  <p className="text-sm font-medium text-on-surface">{emp.name}</p>
                                  <p className="text-xs text-on-surface-variant">{emp.email}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-sm text-on-surface">{emp.department}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-sm font-semibold text-on-surface">{emp.totalLeaves}</span>
                                  {emp.pendingCount > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                                      {emp.pendingCount} pending
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="text-sm font-semibold text-on-surface">{emp.approvedDays}</span>
                              </td>
                              <td className="px-4 py-3.5 w-48">
                                <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${(emp.approvedDays / maxEmployeeDays) * 100}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Footer info ── */}
      <div className="mt-6 p-4 bg-surface-container-low rounded-lg border border-outline-variant flex items-start gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-base shrink-0 mt-0.5">info</span>
        <p className="text-xs text-on-surface-variant">
          Data is updated in real-time. Use the filters above to narrow down by date range or leave type.
          {employeeUsage.length > 0 && " Export the employee usage table as CSV using the button in the Employee Usage tab."}
        </p>
      </div>
    </div>
  );
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-outline-variant p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`material-symbols-outlined text-lg ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <p className={`text-xl font-bold ${color} leading-tight`}>{value}</p>
      <p className="text-xs text-on-surface-variant mt-0.5 font-medium">{label}</p>
    </div>
  );
}
