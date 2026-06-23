"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import type { NavItem } from "@/components/Sidebar";

const navItems: NavItem[] = [
  { href: "/employee", label: "Dashboard", icon: "dashboard" },
  { href: "/employee/apply", label: "Apply Leave", icon: "add_circle" },
  { href: "/employee/status", label: "Status", icon: "pending_actions" },
  { href: "/employee/calendar", label: "Calendar", icon: "calendar_month" },
  { href: "/employee/settings", label: "Settings", icon: "settings" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
        role="EMPLOYEE"
        userName={session.user?.name}
        userInitials={initials}
      />

      <div className="ml-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
