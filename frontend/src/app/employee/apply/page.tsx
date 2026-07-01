"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format, differenceInCalendarDays } from "date-fns";

interface LeaveType {
  _id: string;
  name: string;
  isPaid: boolean;
  annualQuota: number;
  accrualMethod: string;
  maxCarryover: number;
  status: string;
}

interface LeaveBalance {
  _id: string;
  userId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  carriedOver: number;
}

export default function ApplyLeavePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  async function fetchData() {
    try {
      const [typesRes, balanceRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types/active`, {
          headers: { Authorization: `Bearer ${(session as any)?.token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-balance`, {
          headers: { Authorization: `Bearer ${(session as any)?.token}` }
        })
      ]);

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setLeaveTypes(Array.isArray(typesData) ? typesData : []);
        if (Array.isArray(typesData) && typesData.length > 0) {
          setSelectedTypeId(typesData[0]._id);
        }
      }

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalances(Array.isArray(balanceData) ? balanceData : []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  // Calculate total days from date range
  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    return differenceInCalendarDays(end, start) + 1;
  }, [startDate, endDate]);

  // Get the selected leave type
  const selectedType = useMemo(
    () => leaveTypes.find((t) => t._id === selectedTypeId),
    [leaveTypes, selectedTypeId]
  );

  // Get the balance for the selected type
  const selectedBalance = useMemo(
    () => balances.find((b) => b.leaveTypeId === selectedTypeId),
    [balances, selectedTypeId]
  );

  const remainingBalance = selectedBalance
    ? selectedBalance.allocated + selectedBalance.carriedOver - selectedBalance.used
    : 0;

  const exceedsBalance = totalDays > remainingBalance;

  const minEndDate = startDate || undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!selectedTypeId || !startDate || !endDate || !reason.trim()) {
      setError("Please fill in all fields");
      setSubmitting(false);
      return;
    }

    if (exceedsBalance) {
      setError("You don't have enough leave balance for this request");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify({
          leaveTypeId: selectedTypeId,
          startDate,
          endDate,
          reason: reason.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit leave request");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setStartDate("");
        setEndDate("");
        setReason("");
      }, 3000);
    } catch {
      setError("Unable to connect. Please try again.");
      setSubmitting(false);
    }
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Apply for Leave</h1>
        <p className="text-on-surface-variant mt-1">Submit a new leave request</p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <span
            className="material-symbols-outlined text-green-600 text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div>
            <p className="font-semibold text-green-800">Leave request submitted!</p>
            <p className="text-sm text-green-700">
              Your {selectedType?.name.toLowerCase()} request for {totalDays} day{totalDays > 1 ? "s" : ""} has been sent for approval.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
            <h2 className="text-lg font-semibold text-on-surface">Leave Details</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-3">
                Leave Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {leaveTypes.map((type) => {
                  const bal = balances.find((b) => b.leaveTypeId === type._id);
                  const remaining = bal
                    ? bal.allocated + bal.carriedOver - bal.used
                    : 0;
                  const isSelected = selectedTypeId === type._id;

                  return (
                    <button
                      key={type._id}
                      type="button"
                      onClick={() => setSelectedTypeId(type._id)}
                      className={`relative p-4 rounded-lg border-2 text-left transition-all active:scale-[0.98] ${
                        isSelected
                          ? "border-primary bg-primary-fixed/30 shadow-sm"
                          : "border-outline-variant hover:border-primary-fixed-dim hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`text-sm font-semibold ${
                            isSelected ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {type.name}
                        </span>
                        {type.isPaid && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">local_parking</span>
                          {remaining} left
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">event</span>
                          {bal ? bal.used : 0} used
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-on-surface mb-1.5">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value > endDate) setEndDate("");
                  }}
                  min={format(new Date(), "yyyy-MM-dd")}
                  required
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-on-surface mb-1.5">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={minEndDate}
                  required
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface"
                />
              </div>
            </div>

            {/* Summary card (visible when dates are selected) */}
            {(startDate || endDate) && (
              <div className="bg-primary-fixed/20 border border-primary-fixed-dim/50 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">From</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">
                      {startDate ? format(new Date(startDate), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">To</p>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">
                      {endDate ? format(new Date(endDate), "MMM d, yyyy") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">Total Days</p>
                    <p className={`text-sm font-semibold mt-0.5 ${totalDays > 0 ? "text-primary" : "text-on-surface-variant"}`}>
                      {totalDays > 0 ? `${totalDays} day${totalDays > 1 ? "s" : ""}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant font-medium">Balance After</p>
                    <p className={`text-sm font-semibold mt-0.5 ${
                      exceedsBalance ? "text-error" : "text-green-600"
                    }`}>
                      {totalDays > 0
                        ? `${Math.max(0, remainingBalance - totalDays)} remaining`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-on-surface mb-1.5">
                Reason
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your leave request..."
                required
                rows={3}
                className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-error-container border border-error/20 rounded-lg flex items-start gap-2">
                <span
                  className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  error
                </span>
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-xs align-text-bottom">info</span>{" "}
              All requests require admin approval
            </p>
            <button
              type="submit"
              disabled={submitting || !selectedTypeId || !startDate || !endDate || !reason.trim() || exceedsBalance}
              className="bg-primary text-on-primary font-medium px-6 py-2.5 rounded-lg text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Leave balance summary */}
      <div className="mt-6 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h2 className="text-lg font-semibold text-on-surface">Your Leave Balances</h2>
        </div>
        <div className="p-6">
          {balances.length === 0 ? (
            <p className="text-center text-on-surface-variant text-sm py-4">No leave balances yet</p>
          ) : (
            <div className="space-y-4">
              {balances.map((bal) => {
                const type = leaveTypes.find((t) => t._id === bal.leaveTypeId);
                if (!type) return null;
                const remaining = bal.allocated + bal.carriedOver - bal.used;
                const percentage = bal.allocated > 0 ? (bal.used / (bal.allocated + bal.carriedOver)) * 100 : 0;

                return (
                  <div key={bal._id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">
                        {type.isPaid ? "check_circle" : "pending"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-on-surface">{type.name}</p>
                        <p className="text-sm text-on-surface-variant">
                          <span className="font-semibold text-on-surface">{remaining}</span> / {bal.allocated + bal.carriedOver}
                          {bal.carriedOver > 0 && (
                            <span className="text-xs text-on-surface-variant ml-1">
                              (+{bal.carriedOver} carry)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentage >= 80
                              ? "bg-error"
                              : percentage >= 50
                              ? "bg-amber-500"
                              : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
