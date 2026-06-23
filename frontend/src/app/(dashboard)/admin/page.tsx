"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  async function fetchData() {
    try {
      const leavesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setAllLeaves(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setAllLeaves([]);
    }
    setLoading(false);
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  const pendingCount = allLeaves.filter((r: any) => r.status === "PENDING").length;
  const approvedCount = allLeaves.filter((r: any) => r.status === "APPROVED").length;
  const rejectedCount = allLeaves.filter((r: any) => r.status === "REJECTED").length;

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    APPROVED: "bg-green-50 text-green-700 border border-green-200",
    REJECTED: "bg-red-50 text-red-700 border border-red-200",
  };

  const quickActions = [
    {
      title: "Leave Requests",
      desc: "Review and manage requests",
      icon: "assignment",
      href: "/admin/leave-requests",
      color: "bg-primary-fixed text-primary"
    },
    {
      title: "Employees",
      desc: "Manage your team",
      icon: "group",
      href: "/admin/employees",
      color: "bg-secondary-fixed text-secondary"
    },
    {
      title: "Reports",
      desc: "View analytics and data",
      icon: "bar_chart",
      href: "/admin/reports",
      color: "bg-primary-fixed text-primary"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Admin Dashboard</h1>
        <p className="text-on-surface-variant mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant font-medium">Total Requests</p>
              <p className="text-3xl font-bold text-on-surface mt-1">{allLeaves.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant font-medium">Pending</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_empty</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant font-medium">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant font-medium">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{rejectedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md hover:border-primary-fixed-dim transition-all text-left active:scale-[0.98]"
          >
            <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
            </div>
            <h3 className="font-semibold text-on-surface">{action.title}</h3>
            <p className="text-sm text-on-surface-variant mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-lg font-semibold text-on-surface">All Leave Requests</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Loading...</div>
        ) : allLeaves.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            <p className="text-on-surface-variant">No leave requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-on-surface-variant">User</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-on-surface-variant">Dates</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-on-surface-variant">Days</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {allLeaves.slice(0, 5).map((leave: any) => (
                  <tr key={leave._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-sm text-on-surface font-medium">{leave.userId?.slice(-6) || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">
                      {leave.startDate ? format(new Date(leave.startDate), "MMM d") : "..."} -{" "}
                      {leave.endDate ? format(new Date(leave.endDate), "MMM d, yyyy") : "..."}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{leave.totalDays || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[leave.status] || "bg-gray-100 text-gray-800"}`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
