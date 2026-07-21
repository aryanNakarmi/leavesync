"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: "LEAVE_SUBMITTED" | "LEAVE_APPROVED" | "LEAVE_REJECTED" | "LEAVE_CANCELLED";
  title: string;
  message: string;
  link: string;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  LEAVE_SUBMITTED: "add_circle",
  LEAVE_APPROVED: "check_circle",
  LEAVE_REJECTED: "cancel",
  LEAVE_CANCELLED: "undo",
};

const typeColors: Record<string, string> = {
  LEAVE_SUBMITTED: "text-blue-600 bg-blue-50",
  LEAVE_APPROVED: "text-green-600 bg-green-50",
  LEAVE_REJECTED: "text-red-600 bg-red-50",
  LEAVE_CANCELLED: "text-gray-600 bg-gray-50",
};

export default function TopBar() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const token = (session as any)?.token;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=15`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
  }, [token]);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch { /* ignore */ }
  }, [token]);

  // Fetch on mount + poll every 30 seconds
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [token, fetchNotifications, fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  async function handleToggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }

  async function handleMarkAllRead() {
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  }

  function timeAgo(dateStr: string) {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-outline-variant flex items-center justify-end px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            className="relative p-1.5 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          >
            <span className="material-symbols-outlined text-lg">
              {unreadCount > 0 ? "notifications" : "notifications_none"}
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-error text-on-primary text-[10px] font-bold rounded-full px-1 shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-[400px] max-w-[90vw] bg-white rounded-xl border border-outline-variant shadow-xl overflow-hidden animate-scale-in origin-top-right">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    notifications
                  </span>
                  <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-fixed text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-primary hover:text-primary-fixed-dim transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                    notifications_off
                  </span>
                  <p className="text-sm text-on-surface-variant">No notifications yet</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    Updates about leave requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.map((n) => {
                    const icon = typeIcons[n.type] || "notifications";
                    const colorClass = typeColors[n.type] || "text-gray-600 bg-gray-50";

                    return (
                      <a
                        key={n._id}
                        href={n.link}
                        onClick={(e) => {
                          if (!n.isRead) handleMarkRead(n._id);
                          setOpen(false);
                        }}
                        className={`flex items-start gap-3 px-5 py-3.5 border-b border-outline-variant/50 transition-colors hover:bg-surface-container-low ${
                          !n.isRead ? "bg-primary-fixed/10" : ""
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm ${!n.isRead ? "font-semibold text-on-surface" : "font-medium text-on-surface"}`}>
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-on-surface-variant/50 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
