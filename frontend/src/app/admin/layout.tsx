"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import type { NavItem } from "@/components/Sidebar";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/leave-requests", label: "Leave Requests", icon: "assignment" },
  { href: "/admin/employees", label: "Employees", icon: "group" },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar_month" },
  { href: "/admin/reports", label: "Reports", icon: "bar_chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
  { href: "/employee/help", label: "Help", icon: "help" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile picture from backend (not stored in JWT cookie to avoid size limits)
  useEffect(() => {
    if (!session) return;
    const token = (session as any)?.token;
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setProfilePicture(data?.profilePicture || null);
      })
      .catch(() => {});
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const initials = session.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        navItems={navItems}
        role="ADMIN"
        userName={session.user?.name}
        userInitials={initials}
        profilePicture={profilePicture}
      />

      <div className="ml-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
