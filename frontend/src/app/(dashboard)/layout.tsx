"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const employeeNavItems = [
  { href: "/employee", label: "Dashboard", icon: "dashboard" },
  { href: "/employee/apply", label: "Apply Leave", icon: "add_circle" },
  { href: "/employee/status", label: "Status", icon: "pending_actions" },
  { href: "/employee/calendar", label: "Calendar", icon: "calendar_month" },
  { href: "/employee/settings", label: "Settings", icon: "settings" },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/leave-requests", label: "Leave Requests", icon: "assignment" },
  { href: "/admin/employees", label: "Employees", icon: "group" },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar_month" },
  { href: "/admin/reports", label: "Reports", icon: "bar_chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const userRole = (session?.user as any)?.role;
  const navItems = userRole === "ADMIN" ? adminNavItems : employeeNavItems;

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
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-outline-variant flex flex-col py-6 px-4 z-50">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              calendar_month
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary leading-tight">LeaveSync</h1>
            <p className="text-[10px] text-on-surface-variant">
              {userRole === "ADMIN" ? "Admin Portal" : "Employee Portal"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all active:scale-[0.98] ${
                  isActive
                    ? "bg-primary-fixed text-primary font-semibold border-r-4 border-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-sm font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{session.user?.name}</p>
              <p className="text-[10px] text-on-surface-variant truncate">{userRole}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-on-surface-variant hover:text-error transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-sm border-b border-outline-variant flex items-center justify-between px-6 py-3">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-sm outline-none transition-all placeholder:text-on-surface-variant/50"
                placeholder="Search..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-1.5 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full">
              <span className="material-symbols-outlined text-lg">notifications</span>
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />
            </button>
            <div className="h-6 w-px bg-outline-variant" />
            <span className="text-sm font-semibold text-primary">LeaveSync</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
