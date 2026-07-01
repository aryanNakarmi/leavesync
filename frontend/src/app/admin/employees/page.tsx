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
  isActive: boolean;
  createdAt: string;
}

type ModalMode = "add" | "edit" | "delete" | null;

interface ModalState {
  mode: ModalMode;
  employee: Employee | null;
  form: {
    name: string;
    email: string;
    password: string;
  };
}

const emptyForm = { name: "", email: "", password: "" };

export default function EmployeesPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ mode: null, employee: null, form: emptyForm });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) fetchEmployees();
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

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  }, [employees, search]);

  function openAddModal() {
    setModal({ mode: "add", employee: null, form: emptyForm });
  }

  function openEditModal(emp: Employee) {
    setModal({ mode: "edit", employee: emp, form: { name: emp.name, email: emp.email, password: "" } });
  }

  function openDeleteModal(emp: Employee) {
    setModal({ mode: "delete", employee: emp, form: emptyForm });
  }

  function closeModal() {
    setModal({ mode: null, employee: null, form: emptyForm });
  }

  function showToast(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
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
        body: JSON.stringify(modal.form)
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Failed to create employee");
        setActionLoading(false);
        return;
      }

      showToast("success", `${modal.form.name} has been added as an employee.`);
      closeModal();
      await fetchEmployees();
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setActionLoading(false);
  }

  async function handleEditEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!modal.employee) return;
    setActionLoading(true);

    const body: any = {};
    if (modal.form.name !== modal.employee.name) body.name = modal.form.name;
    if (modal.form.email !== modal.employee.email) body.email = modal.form.email;
    if (modal.form.password) body.password = modal.form.password;

    if (Object.keys(body).length === 0) {
      showToast("error", "No changes made.");
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${modal.employee._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", data.error || "Failed to update employee");
        setActionLoading(false);
        return;
      }

      showToast("success", `Employee updated successfully.`);
      closeModal();
      await fetchEmployees();
    } catch {
      showToast("error", "Failed to connect. Please try again.");
    }
    setActionLoading(false);
  }

  async function handleDeleteEmployee() {
    if (!modal.employee) return;
    setActionLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${modal.employee._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Failed to delete employee");
        setActionLoading(false);
        return;
      }

      showToast("success", `${modal.employee.name} has been removed.`);
      closeModal();
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
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Joined</th>
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
                          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-sm font-bold shrink-0">
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-on-surface">{emp.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-on-surface-variant">{emp.email}</span>
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

                      {/* Joined */}
                      <td className="px-5 py-4">
                        <span className="text-sm text-on-surface-variant">
                          {emp.createdAt ? format(new Date(emp.createdAt), "MMM d, yyyy") : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {emp.isActive ? (
                            <>
                              <button
                                onClick={() => openEditModal(emp)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-fixed text-primary border border-primary-fixed-dim text-xs font-medium hover:bg-primary-fixed-dim transition-all active:scale-[0.95]"
                              >
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(emp)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container border border-error/20 text-xs font-medium hover:bg-error/10 transition-all active:scale-[0.95]"
                              >
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
                                Deactivate
                              </button>
                            </>
                          ) : (
                            <div className="flex justify-end">
                              <span className="text-xs text-on-surface-variant italic">Deactivated</span>
                            </div>
                          )}
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
      {modal.mode === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-md">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Add Employee</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Create a new employee account</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddEmployee}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="empName" className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
                  <input
                    id="empName"
                    type="text"
                    value={modal.form.name}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="empEmail" className="block text-sm font-medium text-on-surface mb-1.5">Email Address</label>
                  <input
                    id="empEmail"
                    type="email"
                    value={modal.form.email}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })}
                    placeholder="jane@company.com"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="empPassword" className="block text-sm font-medium text-on-surface mb-1.5">Password</label>
                  <input
                    id="empPassword"
                    type="password"
                    value={modal.form.password}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
                <button type="button" onClick={closeModal} disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading || !modal.form.name || !modal.form.email || !modal.form.password}
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

      {/* Edit Employee Modal */}
      {modal.mode === "edit" && modal.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-md">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Edit Employee</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Update {modal.employee.name}&apos;s details</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleEditEmployee}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
                  <input
                    id="editName"
                    type="text"
                    value={modal.form.name}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })}
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="editEmail" className="block text-sm font-medium text-on-surface mb-1.5">Email Address</label>
                  <input
                    id="editEmail"
                    type="email"
                    value={modal.form.email}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })}
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="editPassword" className="block text-sm font-medium text-on-surface mb-1.5">
                    New Password <span className="text-on-surface-variant font-normal">(leave blank to keep current)</span>
                  </label>
                  <input
                    id="editPassword"
                    type="password"
                    value={modal.form.password}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, password: e.target.value } })}
                    placeholder="Leave blank to keep current"
                    minLength={6}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-on-surface placeholder:text-on-surface-variant/50 text-sm"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
                <button type="button" onClick={closeModal} disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading || !modal.form.name || !modal.form.email}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {modal.mode === "delete" && modal.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-sm">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">Deactivate Employee</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">They won&apos;t be able to sign in</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-on-surface">
                Are you sure you want to deactivate <span className="font-semibold">{modal.employee.name}</span>?
              </p>
              <p className="text-xs text-on-surface-variant mt-2">
                Their account will be disabled, but their leave history will be preserved. They won&apos;t be able to sign in until reactivated.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
              <button onClick={closeModal} disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button onClick={handleDeleteEmployee} disabled={actionLoading}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-error hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.97] flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
                    Deactivate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
