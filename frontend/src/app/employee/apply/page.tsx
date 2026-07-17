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
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "submitting" | "success"; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Escape key to close confirmation dialog
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowConfirm(false);
    }
    if (showConfirm) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showConfirm]);

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

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedTypeId || !startDate || !endDate || !reason.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (exceedsBalance) {
      setError("You don't have enough leave balance for this request");
      return;
    }

    setShowConfirm(true);
  }

  async function handleSubmit() {
    setShowConfirm(false);
    setSubmitting(true);
    setError("");

    try {
      setToast({ type: "submitting", message: "Submitting your leave request..." });

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
        setToast(null);
        setError(data.error || "Failed to submit leave request");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setToast({ type: "success", message: `Leave request submitted! ${totalDays} day${totalDays > 1 ? "s" : ""} of ${selectedType?.name || "leave"} sent for approval.` });

      // Refresh balances to reflect any changes
      await fetchData();

      // Dismiss toast and reset form after 4 seconds
      setTimeout(() => {
        setToast(null);
        setStartDate("");
        setEndDate("");
        setReason("");
      }, 4000);
    } catch {
      setToast(null);
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

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 animate-[slideIn_0.3s_ease-out] ${
          toast.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          {toast.type === "submitting" ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <span
              className="material-symbols-outlined text-xl shrink-0 text-green-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          )}
          <p className={`text-sm ${
            toast.type === "success" ? "text-green-800" : "text-blue-800"
          }`}>
            {toast.message}
          </p>
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
            <h2 className="text-lg font-semibold text-on-surface">Leave Details</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Leave Type Selection - Dropdown */}
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Leave Type
              </label>
              <div className="relative">
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface appearance-none cursor-pointer pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                >
                  {leaveTypes.map((type) => {
                    const bal = balances.find((b) => b.leaveTypeId === type._id);
                    const remaining = bal
                      ? bal.allocated + bal.carriedOver - bal.used
                      : 0;
                    return (
                      <option key={type._id} value={type._id}>
                        {type.name} — {remaining} days remaining
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected type info */}
              {selectedType && selectedBalance && (
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>local_parking</span>
                    <span><strong className="text-on-surface">{remainingBalance}</strong> remaining</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                    <span><strong className="text-on-surface">{selectedBalance.used}</strong> used</span>
                  </div>
                  {selectedType.isPaid && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                      Paid
                    </span>
                  )}
                  {selectedType.maxCarryover > 0 && (
                    <span className="text-[11px] text-on-surface-variant">
                      Up to {selectedType.maxCarryover} days carryover
                    </span>
                  )}
                </div>
              )}
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

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-lg border border-outline-variant w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">Confirm Leave Request</h3>
                <p className="text-sm text-on-surface-variant">Please review the details before submitting.</p>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4 space-y-2 mb-5 border border-outline-variant">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Leave Type</span>
                <span className="font-medium text-on-surface">{selectedType?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Start Date</span>
                <span className="font-medium text-on-surface">{startDate ? format(new Date(startDate), "MMM d, yyyy") : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">End Date</span>
                <span className="font-medium text-on-surface">{endDate ? format(new Date(endDate), "MMM d, yyyy") : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Total Days</span>
                <span className="font-medium text-primary">{totalDays} day{totalDays > 1 ? "s" : ""}</span>
              </div>
              {reason.trim() && (
                <div className="pt-2 border-t border-outline-variant">
                  <span className="text-xs text-on-surface-variant block mb-1">Reason</span>
                  <p className="text-sm text-on-surface">{reason.trim()}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg text-sm font-medium text-on-primary bg-primary hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-[0.97]"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span> Confirm & Submit</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave balance summary */}
      <div className="mt-6 bg-white rounded-lg border border-outline-variant overflow-hidden">
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
