"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  jobTitle: string;
  profilePicture: string;
  isActive: boolean;
  createdAt: string;
}

interface LeaveType {
  _id: string;
  name: string;
  annualQuota: number;
}

interface AddForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profilePicture: string;
  department: string;
  jobTitle: string;
  leaveBalances: { leaveTypeId: string; allocated: number }[];
}

const emptyForm: AddForm = {
  name: "", email: "", password: "", phone: "", address: "",
  profilePicture: "", department: "", jobTitle: "",
  leaveBalances: []
};

export default function EmployeesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddForm>(emptyForm);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) {
      fetchEmployees();
      fetchLeaveTypes();
    }
  }, [session]);

  async function fetchEmployees() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function fetchLeaveTypes() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveTypes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  function openAddModal() {
    setForm({
      ...emptyForm,
      leaveBalances: leaveTypes.map(lt => ({
        leaveTypeId: lt._id,
        allocated: lt.annualQuota || 0
      }))
    });
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setForm(emptyForm);
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  }

  function updateFormField(field: keyof AddForm, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function updateLeaveBalance(leaveTypeId: string, allocated: number) {
    setForm(f => ({
      ...f,
      leaveBalances: f.leaveBalances.map(lb =>
        lb.leaveTypeId === leaveTypeId ? { ...lb, allocated } : lb
      )
    }));
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Failed to create employee");
        setActionLoading(false);
        return;
      }

      showToast("success", `${form.name} has been added as an employee.`);
      closeAddModal();
      await fetchEmployees();
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setActionLoading(false);
  }

  const activeCount = employees.filter((e) => e.isActive).length;
  const totalCount = employees.length;

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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Employees</h1>
        <p className="text-on-surface-variant mt-1">Manage your team members</p>
      </div>

      {/* Toast */}
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

      {/* Stats + Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl border border-outline-variant px-4 py-2.5 shadow-sm">
            <p className="text-xs text-on-surface-variant font-medium">Total</p>
            <p className="text-lg font-bold text-on-surface">{totalCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant px-4 py-2.5 shadow-sm">
            <p className="text-xs text-on-surface-variant font-medium">Active</p>
            <p className="text-lg font-bold text-green-600">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-on-primary font-medium px-4 py-2.5 rounded-lg text-sm hover:brightness-110 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Add Employee
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-on-surface-variant">Loading employees...</span>
            </div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl text-outline mb-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {search ? "search_off" : "group_off"}
            </span>
            <h3 className="text-lg font-semibold text-on-surface mb-1">
              {search ? "No employees match your search" : "No employees yet"}
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              {search
                ? "Try a different name or email address."
                : "Add your first team member to get started."}
            </p>
            {!search && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                Add an employee
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredEmployees.map((emp) => {
                  const initials = emp.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={emp._id} className="hover:bg-surface-container-low transition-colors">
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {emp.profilePicture ? (
                            <img
                              src={emp.profilePicture}
                              alt={emp.name}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-sm font-bold shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-on-surface">{emp.name}</span>
                            {emp.jobTitle && (
                              <p className="text-xs text-on-surface-variant">{emp.jobTitle}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-on-surface-variant">{emp.email}</span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        {emp.department ? (
                          <span className="text-sm text-on-surface">{emp.department}</span>
                        ) : (
                          <span className="text-sm text-on-surface-variant italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          emp.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? "bg-green-500" : "bg-outline"}`} />
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/employees/${emp._id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-fixed text-primary border border-primary-fixed-dim text-xs font-medium hover:bg-primary-fixed-dim transition-all active:scale-[0.95]"
                          >
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Add Employee</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Create a new employee account</p>
                </div>
              </div>
              <button onClick={closeAddModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddEmployee}>
              <div className="px-6 py-4 space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {form.profilePicture ? (
                      <img src={form.profilePicture} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center border border-dashed border-outline-variant">
                        <span className="material-symbols-outlined text-on-surface-variant text-2xl">person</span>
                      </div>
                    )}
                    <input
                      type="text"
                      value={form.profilePicture}
                      onChange={(e) => updateFormField("profilePicture", e.target.value)}
                      placeholder="Paste image URL..."
                      className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1.5">Enter a URL for the employee&apos;s profile photo</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateFormField("name", e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateFormField("email", e.target.value)}
                      placeholder="jane@company.com"
                      required
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateFormField("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Password *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => updateFormField("password", e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Residential Address</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => updateFormField("address", e.target.value)}
                    placeholder="Street, City, State, ZIP Code"
                    rows={2}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => updateFormField("department", e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    >
                      <option value="">Select department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Product Management">Product Management</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Job Title</label>
                    <input
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) => updateFormField("jobTitle", e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm"
                    />
                  </div>
                </div>

                {/* Leave Balances */}
                <div className="bg-surface-container-low rounded-lg p-4 border border-outline-variant">
                  <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                    Initial Leave Balances
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {leaveTypes.map((lt) => {
                      const lb = form.leaveBalances.find(b => b.leaveTypeId === lt._id);
                      return (
                        <div key={lt._id} className="bg-white rounded-lg border border-outline-variant p-3">
                          <label className="block text-xs font-medium text-on-surface-variant mb-1">{lt.name}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={lb?.allocated ?? 0}
                              onChange={(e) => updateLeaveBalance(lt._id, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 border border-outline-variant rounded-lg text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <span className="text-xs text-on-surface-variant">days</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
                <button type="button" onClick={closeAddModal} disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading || !form.name || !form.email || !form.password}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Add Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
