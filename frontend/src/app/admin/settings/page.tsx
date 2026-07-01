"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LeaveType {
  _id: string;
  name: string;
  isPaid: boolean;
  annualQuota: number;
  accrualMethod: "ANNUAL" | "MONTHLY" | "QUARTERLY" | "EVENT_BASED";
  maxCarryover: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string;
}

const ACCRUAL_OPTIONS = [
  { value: "ANNUAL", label: "Annual" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "EVENT_BASED", label: "Event Based" },
];

const emptyForm = {
  name: "", isPaid: true, annualQuota: 0,
  accrualMethod: "ANNUAL" as "ANNUAL" | "MONTHLY" | "QUARTERLY" | "EVENT_BASED",
  maxCarryover: 0, status: "ACTIVE" as "ACTIVE" | "INACTIVE",
};

export default function SettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: "success" | "error"; message: string }>(
    { show: false, type: "success", message: "" }
  );

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (session) fetchLeaveTypes();
  }, [session]);

  function showToast(type: "success" | "error", message: string) {
    setToast({ show: true, type, message });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  }

  async function fetchLeaveTypes() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types`, {
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) setLeaveTypes(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }

  function openAdd() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(lt: LeaveType) {
    setForm({
      name: lt.name, isPaid: lt.isPaid, annualQuota: lt.annualQuota,
      accrualMethod: lt.accrualMethod, maxCarryover: lt.maxCarryover, status: lt.status,
    });
    setEditingId(lt._id);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      const isEdit = !!editingId;
      const res = await fetch(
        isEdit
          ? `${process.env.NEXT_PUBLIC_API_URL}/leave-types/${editingId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/leave-types`,
        {
          method: isEdit ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any)?.token}`
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        showToast("error", err.error || "Failed to save");
        setSaving(false);
        return;
      }

      showToast("success", isEdit ? "Leave type updated" : "Leave type created");
      setShowModal(false);
      await fetchLeaveTypes();
    } catch {
      showToast("error", "Failed to connect");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any)?.token}` }
      });
      if (res.ok) {
        showToast("success", `"${name}" deleted`);
        await fetchLeaveTypes();
      } else {
        const err = await res.json();
        showToast("error", err.error || "Failed to delete");
      }
    } catch {
      showToast("error", "Failed to connect");
    }
  }

  async function handleToggleStatus(lt: LeaveType) {
    const newStatus = lt.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave-types/${lt._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });
      showToast("success", `${lt.name} ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
      await fetchLeaveTypes();
    } catch {
      showToast("error", "Failed to update status");
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  // ── Render ──
  if (authStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Settings</h1>
            <p className="text-on-surface-variant mt-1 text-sm">Manage leave types available in the system</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-lg text-sm font-medium hover:brightness-110 transition-all active:scale-[0.97] shrink-0">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Add Leave Type
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
          toast.type === "success" ? "bg-green-50 border-green-200" : "bg-error-container border-error/20"
        }`}>
          <span className={`material-symbols-outlined text-xl shrink-0 ${toast.type === "success" ? "text-green-600" : "text-error"}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <p className={`text-sm ${toast.type === "success" ? "text-green-800" : "text-on-error-container"}`}>{toast.message}</p>
        </div>
      )}

      {/* Leave Types List */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-on-surface-variant">Loading leave types...</span>
            </div>
          </div>
        ) : leaveTypes.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
            <h3 className="text-lg font-semibold text-on-surface mb-1">No leave types yet</h3>
            <p className="text-sm text-on-surface-variant mb-4">Create your first leave type to start accepting leave requests.</p>
            <button onClick={openAdd}
              className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base">add_circle</span>
              Add Leave Type
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Annual Quota</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Paid</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Accrual</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Max Carryover</th>
                  <th className="px-5 py-3.5 text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-on-surface-variant uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {leaveTypes.map((lt) => (
                  <tr key={lt._id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-on-surface">{lt.name}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-on-surface">{lt.annualQuota} days</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {lt.isPaid ? (
                        <span className="material-symbols-outlined text-base text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-base text-on-surface-variant">cancel</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs bg-surface-container-low px-2 py-1 rounded-full text-on-surface-variant font-medium">
                        {ACCRUAL_OPTIONS.find(o => o.value === lt.accrualMethod)?.label || lt.accrualMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-on-surface">{lt.maxCarryover > 0 ? `${lt.maxCarryover} days` : "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(lt)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          lt.status === "ACTIVE"
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${lt.status === "ACTIVE" ? "bg-green-500" : "bg-gray-400"}`} />
                        {lt.status}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(lt)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-all"
                          title="Edit">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => handleDelete(lt._id, lt.name)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-all"
                          title="Delete">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="mt-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant flex items-start gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-base shrink-0 mt-0.5">info</span>
        <div className="text-xs text-on-surface-variant">
          <p className="font-medium text-on-surface mb-1">How leave types work</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Active</strong> leave types are available for employees to request when applying for leave.</li>
            <li><strong>Inactive</strong> leave types are hidden from the leave application form but are preserved in the system.</li>
            <li>The <strong>annual quota</strong> is the default number of days allocated to each employee for this leave type per year.</li>
            <li><strong>Max carryover</strong> is the number of unused days an employee can bring into the next year.</li>
          </ul>
        </div>
      </div>

      {/* ─── ADD/EDIT MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl border border-outline-variant w-full max-w-lg">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">{editingId ? "Edit Leave Type" : "Add Leave Type"}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {editingId ? "Update leave type configuration" : "Create a new leave type for employees"}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="px-6 py-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Leave Type Name *</label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Annual Leave, Sick Leave"
                    required
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Annual Quota (days)</label>
                    <input type="number" min={0} value={form.annualQuota}
                      onChange={(e) => setForm(f => ({ ...f, annualQuota: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Max Carryover (days)</label>
                    <input type="number" min={0} value={form.maxCarryover}
                      onChange={(e) => setForm(f => ({ ...f, maxCarryover: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Accrual Method</label>
                    <select value={form.accrualMethod}
                      onChange={(e) => setForm(f => ({ ...f, accrualMethod: e.target.value as any }))}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm">
                      {ACCRUAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">Paid Leave</label>
                    <div className="flex items-center gap-4 h-[42px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="isPaid" checked={form.isPaid === true}
                          onChange={() => setForm(f => ({ ...f, isPaid: true }))} className="accent-primary" />
                        <span className="text-sm text-on-surface">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="isPaid" checked={form.isPaid === false}
                          onChange={() => setForm(f => ({ ...f, isPaid: false }))} className="accent-primary" />
                        <span className="text-sm text-on-surface">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low rounded-b-xl">
                <button type="button" onClick={closeModal} disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.name.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2">
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <>{editingId ? "Save Changes" : "Create Leave Type"}</>
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
