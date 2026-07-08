"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveRequest {
  _id: string;
  userId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user: { name: string; email: string };
}

interface Holiday {
  _id: string;
  name: string;
  date: string;
  description: string;
  isRecurringYearly: boolean;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaves: LeaveRequest[];
  holidays: Holiday[];
}

interface AddHolidayForm {
  name: string;
  date: string;
  description: string;
  isRecurringYearly: boolean;
}

const emptyHolidayForm: AddHolidayForm = {
  name: "", date: "", description: "", isRecurringYearly: false
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateColor(name: string): string {
  const colors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-sky-100 text-sky-700 border-sky-200",
    "bg-violet-100 text-violet-700 border-violet-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminCalendarPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayForm, setHolidayForm] = useState<AddHolidayForm>(emptyHolidayForm);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );

  // Auth guard
  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  // Fetch data when session is ready
  useEffect(() => {
    if (session) {
      fetchLeaves();
      fetchHolidays();
    }
  }, [session]);

  // Re-fetch holidays when month changes
  useEffect(() => {
    if (session) fetchHolidays();
  }, [currentDate, session]);

  // ─── API calls ─────────────────────────────────────────────────────────

  function showToast(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }

  async function fetchLeaves() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data.filter((l: LeaveRequest) => l.status === "APPROVED") : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function fetchHolidays() {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/holidays/${y}/${m}`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHolidays(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }

  // ─── Calendar grid computation ─────────────────────────────────────────

  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const dayInfoMap = useMemo(() => {
    const map = new Map<string, DayInfo>();

    // Build a map of date -> holidays
    const holidaysByDate = new Map<string, Holiday[]>();
    for (const h of holidays) {
      const existing = holidaysByDate.get(h.date) || [];
      existing.push(h);
      holidaysByDate.set(h.date, existing);
    }

    // Build a map of date -> leaves
    const leavesByDate = new Map<string, LeaveRequest[]>();
    for (const l of leaves) {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const dates = eachDayOfInterval({ start, end });
      for (const d of dates) {
        const key = format(d, "yyyy-MM-dd");
        const existing = leavesByDate.get(key) || [];
        existing.push(l);
        leavesByDate.set(key, existing);
      }
    }

    for (const day of daysInGrid) {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, {
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
        leaves: leavesByDate.get(key) || [],
        holidays: holidaysByDate.get(key) || [],
      });
    }

    return map;
  }, [daysInGrid, leaves, holidays]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ─── Navigation ─────────────────────────────────────────────────────────

  function goToPrevMonth() { setCurrentDate(d => subMonths(d, 1)); }
  function goToNextMonth() { setCurrentDate(d => addMonths(d, 1)); }
  function goToToday() { setCurrentDate(new Date()); }

  // ─── Holiday management ─────────────────────────────────────────────────

  async function openManageHolidays() {
    setShowHolidayModal(true);
  }

  function openAddHoliday() {
    setEditingHoliday(null);
    setHolidayForm({
      name: "",
      date: format(currentDate, "yyyy-MM-01"),
      description: "",
      isRecurringYearly: false,
    });
    setShowAddHolidayModal(true);
  }

  function openEditHoliday(holiday: Holiday) {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      date: holiday.date,
      description: holiday.description,
      isRecurringYearly: holiday.isRecurringYearly,
    });
    setShowAddHolidayModal(true);
  }

  async function handleSaveHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.date) return;
    setActionLoading(true);

    try {
      const isEdit = !!editingHoliday;
      const body = {
        name: holidayForm.name.trim(),
        date: holidayForm.date,
        description: holidayForm.description.trim(),
        isRecurringYearly: holidayForm.isRecurringYearly,
      };

      const res = await fetch(
        isEdit
          ? `${process.env.NEXT_PUBLIC_API_URL}/holidays/${editingHoliday!._id}`
          : `${process.env.NEXT_PUBLIC_API_URL}/holidays`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.token}`
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        showToast("error", err.error || "Failed to save holiday");
        setActionLoading(false);
        return;
      }

      showToast("success", isEdit ? `"${holidayForm.name}" updated` : `"${holidayForm.name}" added`);
      setShowAddHolidayModal(false);
      setEditingHoliday(null);
      setHolidayForm(emptyHolidayForm);
      await fetchHolidays();
    } catch {
      showToast("error", "Failed to connect");
    }
    setActionLoading(false);
  }

  async function handleDeleteHoliday(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/holidays/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        showToast("success", `"${name}" deleted`);
        await fetchHolidays();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Failed to delete");
      }
    } catch {
      showToast("error", "Failed to connect");
    }
  }

  // Stats for current month
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    let totalLeaveDays = 0;
    const uniqueEmployees = new Set<string>();
    for (const l of leaves) {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      if (start <= monthEnd && end >= monthStart) {
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        totalLeaveDays += days;
        uniqueEmployees.add(l.user.name);
      }
    }
    return {
      totalLeaveDays,
      employeesOnLeave: uniqueEmployees.size,
      totalHolidays: holidays.length,
    };
  }, [leaves, holidays, currentDate]);

  // ─── Loading state ─────────────────────────────────────────────────────

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
      {/* Toast */}
      {toast.show && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Calendar</h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            View employee leave schedules and manage holidays
          </p>
        </div>
        <button
          onClick={openManageHolidays}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-[0.97] shrink-0"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          Manage Holidays
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>beach_access</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Leave Days This Month</p>
            <p className="text-xl font-bold text-on-surface mt-0.5">{monthStats.totalLeaveDays}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-green-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Employees on Leave</p>
            <p className="text-xl font-bold text-on-surface mt-0.5">{monthStats.employeesOnLeave}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-purple-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Holidays This Month</p>
            <p className="text-xl font-bold text-on-surface mt-0.5">{monthStats.totalHolidays}</p>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              aria-label="Previous month"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <h2 className="text-lg font-semibold text-on-surface min-w-[180px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-all"
              aria-label="Next month"
            >
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-1.5 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-low transition-all active:scale-[0.97]"
          >
            Today
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-outline-variant">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-3 py-2.5 text-center text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {daysInGrid.map((day, idx) => {
            const key = format(day, "yyyy-MM-dd");
            const info = dayInfoMap.get(key);
            if (!info) return null;

            const dayLeaves = info.leaves;
            const dayHolidays = info.holidays;
            const maxVisible = 2;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[100px] p-2 border-b border-r border-outline-variant/50 text-left transition-colors relative
                  ${!info.isCurrentMonth ? "bg-surface-container-low/30" : "hover:bg-surface-container-low"}
                  ${info.isToday ? "bg-primary-fixed/20" : ""}
                `}
              >
                {/* Day number */}
                <div className={`text-sm font-semibold mb-1 ${
                  info.isToday
                    ? "bg-primary text-on-primary w-7 h-7 rounded-full flex items-center justify-center"
                    : !info.isCurrentMonth
                    ? "text-on-surface-variant/40"
                    : "text-on-surface"
                }`}>
                  {format(day, "d")}
                </div>

                {/* Holiday badges */}
                {dayHolidays.slice(0, 1).map((h) => (
                  <div
                    key={h._id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 mb-0.5 truncate font-medium"
                    title={h.name}
                  >
                    🎉 {h.name}
                  </div>
                ))}

                {/* Leave badges */}
                {dayLeaves.slice(0, dayHolidays.length > 0 ? maxVisible - 1 : maxVisible).map((l, i) => (
                  <div
                    key={`${l._id}-${i}`}
                    className={`text-[10px] leading-tight px-1 py-0.5 rounded mb-0.5 truncate font-medium ${generateColor(l.user.name)}`}
                    title={`${l.user.name} - ${l.leaveTypeName}`}
                  >
                    {getInitials(l.user.name)} {l.leaveTypeName?.includes("Annual") ? "🏖" : ""}
                  </div>
                ))}

                {/* More indicator */}
                {dayLeaves.length + dayHolidays.length > maxVisible && (
                  <div className="text-[10px] text-on-surface-variant font-medium">
                    +{dayLeaves.length + dayHolidays.length - maxVisible} more
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail popover (rendered outside grid for clean positioning) */}
      {selectedDay && (
        <DayDetailPopover
          date={selectedDay}
          dayInfo={dayInfoMap.get(format(selectedDay, "yyyy-MM-dd"))!}
          onClose={() => setSelectedDay(null)}
          generateColor={generateColor}
          getInitials={getInitials}
        />
      )}

      {/* ─── MANAGE HOLIDAYS MODAL ──────────────────────────────────────── */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowHolidayModal(false)} />
          <div className="relative bg-white rounded-lg border border-outline-variant w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Manage Holidays</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Holidays for {currentDate.getFullYear()}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHolidayModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <HolidayList
                year={currentDate.getFullYear()}
                onEdit={openEditHoliday}
                onDelete={handleDeleteHoliday}
                onAdd={openAddHoliday}
                session={session}
                month={currentDate.getMonth() + 1}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT HOLIDAY MODAL ───────────────────────────────────── */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => {
            setShowAddHolidayModal(false);
            setEditingHoliday(null);
            setHolidayForm(emptyHolidayForm);
          }} />
          <div className="relative bg-white rounded-lg border border-outline-variant w-full max-w-md">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {editingHoliday ? "edit" : "add"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">
                    {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {editingHoliday ? "Update holiday details" : "Create a new company holiday"}
                  </p>
                </div>
              </div>
              <button onClick={() => {
                setShowAddHolidayModal(false);
                setEditingHoliday(null);
                setHolidayForm(emptyHolidayForm);
              }} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveHoliday}>
              <div className="px-6 py-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Holiday Name *</label>
                  <input
                    type="text"
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Dashain, Tihar, Christmas"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Description (optional)</label>
                  <textarea
                    value={holidayForm.description}
                    onChange={(e) => setHolidayForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the holiday"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isRecurringYearly"
                    checked={holidayForm.isRecurringYearly}
                    onChange={(e) => setHolidayForm(f => ({ ...f, isRecurringYearly: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <label htmlFor="isRecurringYearly" className="text-sm text-on-surface cursor-pointer">
                    Recurring yearly (auto-appears every year)
                  </label>
                </div>
                <p className="text-xs text-on-surface-variant flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
                  Use <strong>Recurring yearly</strong> for fixed-date holidays like Christmas (Dec 25). Uncheck for date-variable holidays like Dashain where the date changes each year.
                </p>
              </div>

              <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddHolidayModal(false);
                    setEditingHoliday(null);
                    setHolidayForm(emptyHolidayForm);
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !holidayForm.name.trim() || !holidayForm.date}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {actionLoading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <>{editingHoliday ? "Save Changes" : "Add Holiday"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
          <span>Employee on Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// ─── Day Detail Popover ────────────────────────────────────────────────────

function DayDetailPopover({
  date,
  dayInfo,
  onClose,
  generateColor,
  getInitials,
}: {
  date: Date;
  dayInfo: DayInfo;
  onClose: () => void;
  generateColor: (name: string) => string;
  getInitials: (name: string) => string;
}) {
  if (!dayInfo) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-lg border border-outline-variant w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
            <h3 className="text-base font-semibold text-on-surface">
              {format(date, "EEEE, MMMM d, yyyy")}
            </h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-3">
          {/* Holidays */}
          {dayInfo.holidays.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
                Holidays
              </h4>
              {dayInfo.holidays.map((h) => (
                <div key={h._id} className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                  <p className="text-sm font-semibold text-purple-800">🎉 {h.name}</p>
                  {h.description && (
                    <p className="text-xs text-purple-600 mt-0.5">{h.description}</p>
                  )}
                  {h.isRecurringYearly && (
                    <span className="text-[10px] text-purple-500 mt-1 inline-block">🔄 Recurring yearly</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Employees on leave */}
          {dayInfo.leaves.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>beach_access</span>
                On Leave
              </h4>
              <div className="space-y-2">
                {dayInfo.leaves.map((l, i) => (
                  <div key={`${l._id}-${i}`} className={`rounded-lg p-3 border ${generateColor(l.user.name)}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{l.user.name}</p>
                      <span className="text-[10px] opacity-70">{l.leaveTypeName}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-0.5">
                      {format(new Date(l.startDate), "MMM d")} → {format(new Date(l.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {dayInfo.holidays.length === 0 && dayInfo.leaves.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
              <p className="text-sm text-on-surface-variant">No events on this day</p>
              <p className="text-xs text-on-surface-variant mt-1">No holidays or employees on leave.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Holiday List (inside Manage Holidays modal) ──────────────────────────

function HolidayList({
  year,
  onEdit,
  onDelete,
  onAdd,
  session,
  month,
}: {
  year: number;
  onEdit: (h: Holiday) => void;
  onDelete: (id: string, name: string) => void;
  onAdd: () => void;
  session: any;
  month: number;
}) {
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number | "ALL">(month);

  useEffect(() => {
    fetchAll();
  }, [year]);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/holidays?year=${year}`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllHolidays(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  const filtered = filterMonth === "ALL"
    ? allHolidays
    : allHolidays.filter(h => {
        const m = parseInt(h.date.split("-")[1]);
        return m === filterMonth;
      });

  const grouped = useMemo(() => {
    const groups: Record<string, Holiday[]> = {};
    for (const h of filtered) {
      const monthName = format(new Date(h.date + "T12:00:00"), "MMMM yyyy");
      if (!groups[monthName]) groups[monthName] = [];
      groups[monthName].push(h);
    }
    return groups;
  }, [filtered]);

  const months = [
    "All", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return (
    <div>
      {/* Month filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {months.map((m, i) => {
          const val = i === 0 ? "ALL" : i;
          const isActive = filterMonth === val;
          return (
            <button
              key={m}
              onClick={() => setFilterMonth(val as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className="w-full mb-4 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-outline-variant text-sm font-medium text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary-fixed/20 transition-all"
      >
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        Add Holiday
      </button>

      {/* Holiday list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-10">
          <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          <p className="text-sm text-on-surface-variant">No holidays</p>
          <p className="text-xs text-on-surface-variant mt-1">Add your first holiday to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([monthName, holidays]) => (
            <div key={monthName}>
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 px-1">
                {monthName}
              </h4>
              <div className="space-y-2">
                {holidays.map((h) => (
                  <div
                    key={h._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant hover:border-purple-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-purple-600 text-sm">celebration</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{h.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {format(new Date(h.date + "T12:00:00"), "MMM d, yyyy")}
                          {h.isRecurringYearly && " • 🔄 Yearly"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={() => onEdit(h)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-all"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => onDelete(h._id, h.name)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-all"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
