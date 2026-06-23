"use client";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
  role: string;
  userName?: string | null;
  userInitials: string;
}

export default function Sidebar({ navItems, role, userName, userInitials }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-outline-variant flex flex-col py-6 px-4 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <img src="/logo.png" alt="LeaveSync" className="h-9 w-auto" />
        <div>
          <h1 className="text-lg font-bold text-primary leading-tight">LeaveSync</h1>
          <p className="text-[10px] text-on-surface-variant">{role} Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${role.toLowerCase()}` && pathname.startsWith(item.href));
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
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{userName}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{role}</p>
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
  );
}
