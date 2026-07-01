"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  profilePicture: string;
  department: string;
  jobTitle: string;
  dateOfBirth: string;
  gender: string;
  employmentType: string;
  joinDate: string;
  isActive: boolean;
  createdAt: string;
}

interface LeaveType {
  _id: string;
  name: string;
  annualQuota: number;
}

interface LeaveRequest {
  _id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  createdAt: string;
}

interface LeaveBalance {
  _id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocated: number;
  used: number;
  carriedOver: number;
}

interface EmployeeDetailData {
  employee: Employee;
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  leaveTypes: LeaveType[];
}

const DEPARTMENTS = [
  "Engineering", "Product Management", "Human Resources",
  "Finance", "Marketing", "Sales", "Operations", "Design"
];

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Intern"];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function EmployeeDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<EmployeeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBalances, setSavingBalances] = useState(false);
  const [editing, setEditing] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    profilePicture: "",
    department: "",
    jobTitle: "",
    dateOfBirth: "",
    gender: "",
    employmentType: "",
    joinDate: ""
  });

  // Leave balance form state
  const [balanceForm, setBalanceForm] = useState<{ leaveTypeId: string; allocated: number }[]>([]);

  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session && id) fetchEmployeeDetail();
  }, [session, id]);

  async function fetchEmployeeDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const result: EmployeeDetailData = await res.json();
        setData(result);
        const emp = result.employee;
        setForm({
          name: emp.name,
          phone: emp.phone || "",
          address: emp.address || "",
          profilePicture: emp.profilePicture || "",
          department: emp.department || "",
          jobTitle: emp.jobTitle || "",
          dateOfBirth: emp.dateOfBirth || "",
          gender: emp.gender || "",
          employmentType: emp.employmentType || "Full-Time",
          joinDate: emp.joinDate || ""
        });
        setBalanceForm(
          result.leaveTypes.map(lt => {
            const existing = result.leaveBalances.find(b => b.leaveTypeId === lt._id);
            return {
              leaveTypeId: lt._id,
              allocated: existing?.allocated ?? lt.annualQuota ?? 0
            };
          })
        );
      } else {
        showToast("error", "Failed to load employee details");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to connect. Please try again.");
    }
    setLoading(false);
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast("error", errData.error || "Failed to update employee");
        setSaving(false);
        return;
      }

      showToast("success", "Employee profile updated successfully");
      setEditing(false);
      await fetchEmployeeDetail();
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setSaving(false);
  }

  async function handleSaveLeaveBalances() {
    setSavingBalances(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/leave-balances`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify({ leaveBalances: balanceForm })
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast("error", errData.error || "Failed to update leave balances");
        setSavingBalances(false);
        return;
      }

      showToast("success", "Leave balances updated successfully");
      await fetchEmployeeDetail();
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setSavingBalances(false);
  }

  async function handleToggleActive() {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify({ isActive: !data?.employee.isActive })
      });

      if (res.ok) {
        showToast("success", `Employee ${data?.employee.isActive ? "deactivated" : "activated"} successfully`);
        await fetchEmployeeDetail();
      } else {
        const errData = await res.json();
        showToast("error", errData.error || "Failed to update status");
      }
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
          <span className="text-on-surface-variant">Loading employee details...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        <h2 className="text-lg font-semibold text-on-surface mb-1">Employee not found</h2>
        <p className="text-sm text-on-surface-variant mb-4">This employee may have been removed or doesn&apos;t exist.</p>
        <button onClick={() => router.push("/admin/employees")}
          className="text-sm text-primary font-medium hover:underline">
          Back to Employees
        </button>
      </div>
    );
  }

  const { employee, leaveRequests, leaveBalances, leaveTypes } = data;
  const initials = employee.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };

  const usedAllocatedMap = new Map(leaveBalances.map(b => [b.leaveTypeId, { used: b.used, allocated: b.allocated, carriedOver: b.carriedOver }]));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast */}
      {toast.show && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
          toast.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-error-container border-error/20"
        }`}>
          <span className={`material-symbols-outlined text-xl shrink-0 ${toast.type === "success" ? "text-green-600" : "text-error"}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p className={`text-sm ${toast.type === "success" ? "text-green-800" : "text-on-error-container"}`}>{toast.message}</p>
        </div>
      )}

      {/* Breadcrumb + Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <button onClick={() => router.push("/admin/employees")} className="hover:text-primary transition-colors">Employees</button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-medium">{employee.name}</span>
        </nav>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-on-surface">{employee.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              employee.isActive
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-surface-container-high text-on-surface-variant border-outline-variant"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${employee.isActive ? "bg-green-500" : "bg-outline"}`} />
              {employee.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:brightness-110 transition-all active:scale-[0.97]">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <section className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <h2 className="text-lg font-semibold text-on-surface">Personal Information</h2>
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="space-y-4">
                {/* Profile Picture */}
                <div className="flex items-center gap-4">
                  {form.profilePicture ? (
                    <img src={form.profilePicture} alt="Profile" className="w-20 h-20 rounded-xl object-cover border border-outline-variant" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-surface-container-high flex items-center justify-center border border-dashed border-outline-variant">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">person</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Profile Photo URL</label>
                    <input
                      type="text"
                      value={form.profilePicture}
                      onChange={(e) => setForm(f => ({ ...f, profilePicture: e.target.value }))}
                      placeholder="Image URL"
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Full Name</label>
                    <input type="text" value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Email</label>
                    <input type="email" value={employee.email} readOnly
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface-variant cursor-not-allowed" />
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Phone Number</label>
                    <input type="tel" value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth}
                      onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Gender</label>
                    <select value={form.gender}
                      onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                      <option value="">Select</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-on-surface-variant mb-1">Address</label>
                    <input type="text" value={form.address}
                      onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Residential address"
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setEditing(false); setForm({
                    name: employee.name, phone: employee.phone, address: employee.address,
                    profilePicture: employee.profilePicture, department: employee.department,
                    jobTitle: employee.jobTitle, dateOfBirth: employee.dateOfBirth,
                    gender: employee.gender, employmentType: employee.employmentType,
                    joinDate: employee.joinDate
                  }); }}
                    className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !form.name}
                    className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2">
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">save</span> Save Changes</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {employee.profilePicture ? (
                  <img src={employee.profilePicture} alt={employee.name} className="w-20 h-20 rounded-xl object-cover border border-outline-variant" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-primary-fixed flex items-center justify-center text-primary text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-on-surface">{employee.name}</p>
                  <p className="text-sm text-on-surface-variant">{employee.jobTitle || "No title set"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-on-surface-variant">Email</p>
                  <p className="text-on-surface">{employee.email}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Phone</p>
                  <p className="text-on-surface">{employee.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Date of Birth</p>
                  <p className="text-on-surface">{employee.dateOfBirth ? format(new Date(employee.dateOfBirth), "MMM d, yyyy") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Gender</p>
                  <p className="text-on-surface">{employee.gender || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-on-surface-variant">Address</p>
                  <p className="text-on-surface">{employee.address || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Job Information */}
        <section className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
            <h2 className="text-lg font-semibold text-on-surface">Job Information</h2>
            {editing && <span className="ml-auto text-xs text-primary bg-primary-fixed px-2 py-0.5 rounded-full">Editable</span>}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Department</label>
                  <select value={form.department}
                    onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Job Title</label>
                  <input type="text" value={form.jobTitle}
                    onChange={(e) => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="Senior Software Engineer"
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Employment Type</label>
                  <select value={form.employmentType}
                    onChange={(e) => setForm(f => ({ ...f, employmentType: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Join Date</label>
                  <input type="date" value={form.joinDate}
                    onChange={(e) => setForm(f => ({ ...f, joinDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-on-surface-variant">Department</p>
                <p className="text-on-surface">{employee.department || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Job Title</p>
                <p className="text-on-surface">{employee.jobTitle || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Employment Type</p>
                <p className="text-on-surface capitalize">{employee.employmentType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Join Date</p>
                <p className="text-on-surface">{employee.joinDate ? format(new Date(employee.joinDate), "MMM d, yyyy") : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Employee ID</p>
                <p className="text-on-surface font-mono text-xs">{employee._id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Member Since</p>
                <p className="text-on-surface">{employee.createdAt ? format(new Date(employee.createdAt), "MMM d, yyyy") : "—"}</p>
              </div>
            </div>
          )}
        </section>

        {/* Leave Settings */}
        <section className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
            <h2 className="text-lg font-semibold text-on-surface">Leave Settings</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {leaveTypes.map((lt) => {
              const bf = balanceForm.find(b => b.leaveTypeId === lt._id);
              const usage = usedAllocatedMap.get(lt._id);
              return (
                <div key={lt._id} className="bg-surface-container-low rounded-lg border border-outline-variant p-3">
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">{lt.name}</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min={0}
                      value={bf?.allocated ?? 0}
                      onChange={(e) => setBalanceForm(prev =>
                        prev.map(b => b.leaveTypeId === lt._id ? { ...b, allocated: parseInt(e.target.value) || 0 } : b)
                      )}
                      className="w-full px-3 py-1.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                    <span className="text-xs text-on-surface-variant">days</span>
                  </div>
                  {usage && (
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                      <span>Used: {usage.used}</span>
                      <span>Remaining: {(bf?.allocated ?? 0) + (usage.carriedOver || 0) - usage.used}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleSaveLeaveBalances} disabled={savingBalances}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {savingBalances ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><span className="material-symbols-outlined text-sm">save</span> Save Leave Balances</>
            )}
          </button>
        </section>

        {/* Account Status */}
        <section className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
            <h2 className="text-lg font-semibold text-on-surface">Account Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
              <div>
                <p className="font-medium text-on-surface text-sm">Account Status</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {employee.isActive ? "Employee can sign in to the portal" : "Employee access has been suspended"}
                </p>
              </div>
              <button
                onClick={handleToggleActive}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  employee.isActive ? "bg-primary" : "bg-secondary-fixed-dim"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  employee.isActive ? "translate-x-[22px]" : "translate-x-[2px]"
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 border border-outline-variant bg-white p-3 rounded-lg hover:bg-surface-container-low transition-all text-on-surface text-sm font-medium">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                Reset Password
              </button>
              <button className="flex items-center justify-center gap-2 border border-outline-variant bg-white p-3 rounded-lg hover:bg-surface-container-low transition-all text-on-surface text-sm font-medium">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
                Force Logout
              </button>
            </div>

            <div className="border-t border-outline-variant/30 pt-4">
              <p className="text-xs text-on-surface-variant mb-3 uppercase tracking-wider font-medium">Danger Zone</p>
              <button
                onClick={handleToggleActive}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 border rounded-lg p-3 text-sm font-medium transition-all ${
                  employee.isActive
                    ? "border-error/30 text-error bg-error/5 hover:bg-error/10"
                    : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {employee.isActive ? "block" : "check_circle"}
                </span>
                {employee.isActive ? "Deactivate Employee Account" : "Reactivate Employee Account"}
              </button>
              <p className="text-[10px] text-on-surface-variant mt-2 text-center">
                {employee.isActive
                  ? "Deactivating will revoke system access immediately. Historical data is preserved."
                  : "Reactivating will restore full system access for this employee."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Leave History */}
      <section className="mt-6 bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <h2 className="text-lg font-semibold text-on-surface">Leave History</h2>
          </div>
          <span className="text-xs text-on-surface-variant">{leaveRequests.length} record{leaveRequests.length !== 1 ? "s" : ""}</span>
        </div>

        {leaveRequests.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            <p className="text-sm text-on-surface-variant">No leave requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-on-surface-variant uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {leaveRequests.map((lr) => (
                  <tr key={lr._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-sm text-on-surface">{lr.leaveTypeName}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">
                      {format(new Date(lr.startDate), "MMM d")} - {format(new Date(lr.endDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-medium">{lr.totalDays}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant max-w-[200px] truncate">{lr.reason}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[lr.status] || "bg-gray-100 text-gray-800"}`}>
                        {lr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant text-right">
                      {format(new Date(lr.createdAt), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Back Button */}
      <div className="mt-6 pb-8">
        <Link href="/admin/employees"
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Employees
        </Link>
      </div>
    </div>
  );
}
