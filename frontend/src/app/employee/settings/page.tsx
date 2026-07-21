"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

export default function EmployeeSettingsPage() {
  const { data: session, status: authStatus, update } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  // Fetch current profile data
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
          setName(data.name || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setProfilePicture(data.profilePicture || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }

  function handleProfileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfilePicture(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body: any = {};
    if (name.trim()) body.name = name.trim();
    body.phone = phone;
    body.address = address;
    body.profilePicture = profilePicture;

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
        showToast("error", err.error || "Failed to update profile");
        setSaving(false);
        return;
      }

      showToast("success", "Profile updated successfully");
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (newPassword.length < 6) {
      showToast("error", "Password must be at least 6 characters");
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords do not match");
      setSaving(false);
      return;
    }

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
        showToast("error", err.error || "Failed to change password");
        setSaving(false);
        return;
      }

      showToast("success", "Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setSaving(false);
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant">Loading settings...</span>
        </div>
      </div>
    );
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage your profile and account settings</p>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
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

      {/* ─── Profile Section ─── */}
      <div className="bg-white rounded-lg border border-outline-variant overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <h2 className="text-lg font-semibold text-on-surface">Profile Information</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-3">Profile Photo</label>
            <div className="flex items-center gap-5">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-outline-variant"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-2xl font-bold border-2 border-outline-variant">
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 border border-outline-variant rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>upload</span>
                  Upload Photo
                </button>
                {profilePicture && (
                  <button
                    type="button"
                    onClick={() => setProfilePicture("")}
                    className="ml-2 text-xs text-error hover:underline"
                  >
                    Remove
                  </button>
                )}
                <p className="text-xs text-on-surface-variant mt-1.5">JPG or PNG, max 2MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Email Address</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              readOnly
              className="w-full px-4 py-2.5 bg-surface-container-low/50 border border-outline-variant rounded-lg text-sm text-on-surface-variant cursor-not-allowed"
            />
            <p className="text-xs text-on-surface-variant mt-1">Email address cannot be changed</p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-on-surface mb-1.5">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-on-surface mb-1.5">Address</label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your residential address"
              rows={2}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-on-primary font-medium px-6 py-2.5 rounded-lg text-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Password Section ─── */}
      <div className="bg-white rounded-lg border border-outline-variant overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
          <h2 className="text-lg font-semibold text-on-surface">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-on-surface mb-1.5">New Password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-0.5"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg select-none">
                    {showNewPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-on-surface mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full px-4 py-2.5 pr-11 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-0.5"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-lg select-none">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-outline-variant/30">
            <button
              type="submit"
              disabled={saving || !newPassword || !confirmPassword}
              className="flex items-center gap-2 bg-primary text-on-primary font-medium px-6 py-2.5 rounded-lg text-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">lock_reset</span>
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Account Info Section ─── */}
      <div className="bg-white rounded-lg border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <h2 className="text-lg font-semibold text-on-surface">Account Information</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant">
              <p className="text-xs text-on-surface-variant font-medium mb-1">Role</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                <span className="text-sm font-semibold text-on-surface">Employee</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant">
              <p className="text-xs text-on-surface-variant font-medium mb-1">Account Status</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant">
              <p className="text-xs text-on-surface-variant font-medium mb-1">Session</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                <span className="text-sm font-semibold text-on-surface">Signed In</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
