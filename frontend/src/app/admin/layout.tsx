"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Toast from "@/components/Toast";
import type { NavItem } from "@/components/Sidebar";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/leave-requests", label: "Leave Requests", icon: "assignment" },
  { href: "/admin/employees", label: "Employees", icon: "group" },
  { href: "/admin/calendar", label: "Calendar", icon: "calendar_month" },
  { href: "/admin/reports", label: "Reports", icon: "bar_chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPicture, setUploadedPicture] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data for modal
  useEffect(() => {
    if (!session) return;
    const token = (session as any)?.token;
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setProfilePicture(data?.profilePicture || null);
          setName(data.name || "");
        }
      })
      .catch(() => {});
  }, [session]);

  function showToastMsg(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }

  function openProfileModal() {
    setUploadedPicture("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowProfileModal(true);
  }

  function handleProfileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToastMsg("error", "Image must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPicture(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const body: any = {};
    if (name.trim()) body.name = name.trim();
    if (uploadedPicture) body.profilePicture = uploadedPicture;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        showToastMsg("error", err.error || "Failed to update profile");
        setSaving(false);
        return;
      }
      showToastMsg("success", "Profile updated");
      if (uploadedPicture) setProfilePicture(uploadedPicture);
    } catch {
      showToastMsg("error", "Failed to connect");
    }
    setSaving(false);
  }

  async function handleSavePassword() {
    if (newPassword.length < 6) {
      showToastMsg("error", "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToastMsg("error", "Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        showToastMsg("error", err.error || "Failed to change password");
        setSaving(false);
        return;
      }
      showToastMsg("success", "Password changed");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToastMsg("error", "Failed to connect");
    }
    setSaving(false);
  }

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
        onEditProfile={openProfileModal}
      />

      <div className="ml-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>

      <Toast show={toast.show} type={toast.type} message={toast.message} />

      {/* ─── Profile Modal ─── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowProfileModal(false)} />
          <div className="relative bg-white rounded-lg border border-outline-variant w-full max-w-md animate-scale-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Edit Profile</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Update your name and password</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                {(uploadedPicture || profilePicture) ? (
                  <img
                    src={uploadedPicture || profilePicture || ""}
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover border-2 border-outline-variant shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-lg font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>upload</span>
                    Upload Photo
                  </button>
                  <p className="text-[10px] text-on-surface-variant mt-1">JPG or PNG, max 2MB</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
                />
              </div>

              {/* Save name button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !name.trim()}
                  className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-lg text-sm font-medium hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">save</span> Save</>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-outline-variant/50 pt-5">
                <h4 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                  Change Password
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters" minLength={6}
                        className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-0.5" tabIndex={-1}
                      >
                        <span className="material-symbols-outlined text-lg select-none">
                          {showNewPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your new password"
                        className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-0.5" tabIndex={-1}
                      >
                        <span className="material-symbols-outlined text-lg select-none">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSavePassword}
                      disabled={saving || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2 rounded-lg text-sm font-medium hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {saving ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
                      ) : (
                        <><span className="material-symbols-outlined text-base">lock_reset</span> Update Password</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
