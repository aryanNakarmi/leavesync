"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchLeaves();
    }
  }, [session]);

  async function fetchLeaves() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves/my`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setRequests([]);
    }
    setLoading(false);
  }

  if (status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => router.push("/dashboard/apply")}>
          <h3 className="font-semibold text-gray-900">Apply for Leave</h3>
          <p className="text-sm text-gray-500 mt-1">Request new leave</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => router.push("/dashboard/history")}>
          <h3 className="font-semibold text-gray-900">My Requests</h3>
          <p className="text-sm text-gray-500 mt-1">View all your leave requests</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          onClick={() => router.push("/dashboard/notifications")}>
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <p className="text-sm text-gray-500 mt-1">Check updates</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No leave requests yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.slice(0, 5).map((leave: any) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {format(new Date(leave.startDate), "MMM d")} -{" "}
                      {format(new Date(leave.endDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {leave.totalDays}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[leave.status] || "bg-gray-100 text-gray-800"
                      }`}>
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