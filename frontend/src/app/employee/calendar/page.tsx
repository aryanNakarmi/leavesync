"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MyLeaveRequest {
  _id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  adminComment?: string;
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
  myLeaves: MyLeaveRequest[];
  holidays: Holiday[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  APPROVED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: "check_circle", label: "Approved" },
  PENDING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "hourglass_empty", label: "Pending" },
  REJECTED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "cancel", label: "Rejected" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function EmployeeCalendarPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [myLeaves, setMyLeaves] = useState<MyLeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) {
      Promise.all([fetchMyLeaves(), fetchHolidays()]).finally(() => setLoading(false));
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchHolidays();
  }, [currentDate, session]);

  async function fetchMyLeaves() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves/my`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyLeaves(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
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

  // ─── Calendar grid ──────────────────────────────────────────────────────

  const daysInGrid = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  const dayInfoMap = useMemo(() => {
    const map = new Map<string, DayInfo>();

    // Holidays by date
    const holidaysByDate = new Map<string, Holiday[]>();
    for (const h of holidays) {
      const list = holidaysByDate.get(h.date) || [];
      list.push(h);
      holidaysByDate.set(h.date, list);
    }

    // My leaves by date — all leaves for popover, but grid only shows APPROVED
    const leavesByDate = new Map<string, MyLeaveRequest[]>();
    for (const l of myLeaves) {
      // Store all leaves for popover visibility
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const dates = eachDayOfInterval({ start, end });
      for (const d of dates) {
        const key = format(d, "yyyy-MM-dd");
        const list = leavesByDate.get(key) || [];
        list.push(l);
        leavesByDate.set(key, list);
      }
    }

    for (const day of daysInGrid) {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, {
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
        myLeaves: leavesByDate.get(key) || [],
        holidays: holidaysByDate.get(key) || [],
      });
    }

    return map;
  }, [daysInGrid, myLeaves, holidays]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function goToPrevMonth() { setCurrentDate(d => subMonths(d, 1)); }
  function goToNextMonth() { setCurrentDate(d => addMonths(d, 1)); }
  function goToToday() { setCurrentDate(new Date()); }

  // Stats for current month
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    let leaveDaysInMonth = 0;
    let leaveCountInMonth = 0;
    for (const l of myLeaves) {
      if (l.status !== "APPROVED") continue;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      if (start <= monthEnd && end >= monthStart) {
        leaveCountInMonth++;
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        leaveDaysInMonth += days;
      }
    }
    return {
      leaveDaysInMonth,
      leaveCountInMonth,
      totalHolidays: holidays.length,
    };
  }, [myLeaves, holidays, currentDate]);

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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">My Calendar</h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          View your approved leave days and company holidays
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>beach_access</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">My Leave Days This Month</p>
            <p className="text-xl font-bold text-on-surface mt-0.5">{monthStats.leaveDaysInMonth}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-green-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant font-medium">Approved Leaves</p>
            <p className="text-xl font-bold text-on-surface mt-0.5">{monthStats.leaveCountInMonth}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-outline-variant p-4 shadow-sm flex items-center gap-4">
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
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
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

            const dayLeaves = info.myLeaves;
            const dayHolidays = info.holidays;

            // Determine cell styling based on content
            const hasLeave = dayLeaves.length > 0;
            const hasHoliday = dayHolidays.length > 0;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(day)}
                className={`min-h-[90px] p-2 border-b border-r border-outline-variant/50 text-left transition-colors relative
                  ${!info.isCurrentMonth ? "bg-surface-container-low/30" : "hover:bg-surface-container-low"}
                  ${info.isToday ? "bg-primary-fixed/20" : ""}
                  ${hasLeave && !info.isToday ? "bg-blue-50/40" : ""}
                  ${hasHoliday && !info.isToday ? "bg-purple-50/30" : ""}
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

                {/* Holiday badge */}
                {dayHolidays.slice(0, 1).map((h) => (
                  <div
                    key={h._id}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 mb-0.5 truncate font-medium"
                    title={h.name}
                  >
                    🎉 {h.name}
                  </div>
                ))}

                {/* My leave badge — only show APPROVED on the grid */}
                {dayLeaves.filter(l => l.status === "APPROVED").slice(0, dayHolidays.length > 0 ? 0 : 1).map((l, i) => {
                  return (
                    <div
                      key={`${l._id}-${i}`}
                      className="text-[10px] leading-tight px-1 py-0.5 rounded mb-0.5 truncate font-medium bg-blue-100 text-blue-700 border border-blue-200"
                      title={`${l.leaveTypeName}`}
                    >
                      🏖 {l.leaveTypeName}
                    </div>
                  );
                })}

                {/* More indicator */}
                {(dayLeaves.length + dayHolidays.length > 1) && (
                  <div className="text-[10px] text-on-surface-variant font-medium">
                    +{dayLeaves.length + dayHolidays.length - 1} more
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day popover */}
      {selectedDay && (
        <EmployeeDayPopover
          date={selectedDay}
          dayInfo={dayInfoMap.get(format(selectedDay, "yyyy-MM-dd"))!}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300" />
          <span>My Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// ─── Day Popover ───────────────────────────────────────────────────────────

function EmployeeDayPopover({
  date,
  dayInfo,
  onClose,
}: {
  date: Date;
  dayInfo: DayInfo | undefined;
  onClose: () => void;
}) {
  if (!dayInfo) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-sm"
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
                Company Holidays
              </h4>
              {dayInfo.holidays.map((h) => (
                <div key={h._id} className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                  <p className="text-sm font-semibold text-purple-800">🎉 {h.name}</p>
                  {h.description && <p className="text-xs text-purple-600 mt-0.5">{h.description}</p>}
                  {h.isRecurringYearly && (
                    <span className="text-[10px] text-purple-500 mt-1 inline-block">🔄 Recurring yearly</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* My leaves */}
          {dayInfo.myLeaves.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>beach_access</span>
                My Leave
              </h4>
              <div className="space-y-2">
                {dayInfo.myLeaves.map((l, i) => {
                  const cfg = statusConfig[l.status] || statusConfig.APPROVED;
                  return (
                    <div key={`${l._id}-${i}`} className={`rounded-lg p-3 border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-on-surface">{l.leaveTypeName}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {format(new Date(l.startDate), "MMM d")} → {format(new Date(l.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1.5 italic">"{l.reason}"</p>
                      {l.adminComment && (
                        <div className={`mt-2 pt-2 border-t ${cfg.border} text-xs`}>
                          <span className={`font-semibold ${cfg.text}`}>Admin: </span>
                          <span className="text-on-surface-variant">{l.adminComment}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {dayInfo.holidays.length === 0 && dayInfo.myLeaves.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
              <p className="text-sm text-on-surface-variant">Nothing on this day</p>
              <p className="text-xs text-on-surface-variant mt-1">No leave or holidays scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
