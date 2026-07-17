"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const faqs = [
  {
    q: "How do I apply for leave?",
    a: "Navigate to the Apply page from the sidebar. Select a leave type, choose your dates, provide a reason, and submit. Your manager will review and respond to your request.",
    icon: "add_circle",
  },
  {
    q: "What does 'Carryover' mean?",
    a: "Carryover refers to unused leave days from the previous year that you can use in the current year. Not all leave types allow carryover — check your leave balance card for details.",
    icon: "autorenew",
  },
  {
    q: "How are leave balances calculated?",
    a: "Your balance shows: Allocated days (given for the year) + Carried-over days (from last year) — Used days (approved leaves taken). The remaining number is what you have available.",
    icon: "account_balance",
  },
  {
    q: "Can I cancel a leave request?",
    a: "Yes! Open the Leave Status page and click 'Withdraw' on any PENDING request. Once approved or rejected, the request cannot be cancelled — please contact an administrator.",
    icon: "undo",
  },
  {
    q: "How long does approval take?",
    a: "Approval time depends on your organization's process. You will receive an admin comment when your request is reviewed. Check the Leave Status page for updates.",
    icon: "hourglass_empty",
  },
  {
    q: "What is the difference between Paid and Unpaid leave?",
    a: "Paid leave (e.g., Annual Leave) is compensated at your regular salary. Unpaid leave (e.g., Leave Without Pay) does not include compensation. The leave type card will indicate which is which.",
    icon: "payments",
  },
  {
    q: "Can I see my leave history?",
    a: "Yes! The Leave Status page shows all your past and pending requests. Use the tabs to filter by status (All, Pending, Approved, Rejected). Click on any reason to see full details.",
    icon: "history",
  },
  {
    q: "What happens if I exceed my leave balance?",
    a: "The system prevents you from submitting a request that exceeds your remaining balance. The Apply page will show 'Insufficient balance' and disable the submit button.",
    icon: "error",
  },
  {
    q: "How do holidays affect my leave?",
    a: "Public holidays are shown on the Calendar page and do not count against your leave balance. Only working days within your requested range are counted as leave days.",
    icon: "celebration",
  },
  {
    q: "Who can I contact for help?",
    a: "For questions about leave policies, balances, or technical issues, please contact your HR department or system administrator through the Settings page.",
    icon: "support_agent",
  },
];

export default function HelpPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

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

  const filtered = faqs.filter((faq) =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Help & FAQ</h1>
        <p className="text-on-surface-variant mt-1">Find answers to common questions about LeaveSync</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setExpandedIndex(null); }}
          placeholder="Search frequently asked questions..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm text-on-surface placeholder:text-on-surface-variant/50 shadow-sm"
        />
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant p-12 text-center">
            <span
              className="material-symbols-outlined text-5xl text-outline mb-3"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              search_off
            </span>
            <h3 className="text-lg font-semibold text-on-surface mb-1">No results found</h3>
            <p className="text-sm text-on-surface-variant">
              Try a different search term or browse the categories below.
            </p>
          </div>
        ) : (
          filtered.map((faq, i) => {
            const isOpen = expandedIndex === i;
            const actualIndex = faqs.indexOf(faq);

            return (
              <div
                key={i}
                className={`bg-white rounded-xl border transition-all duration-200 ${
                  isOpen
                    ? "border-primary shadow-md"
                    : "border-outline-variant hover:border-outline hover:shadow-sm"
                }`}
              >
                <button
                  onClick={() => setExpandedIndex(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? "bg-primary text-on-primary" : "bg-primary-fixed text-primary"
                  }`}>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {faq.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold transition-colors ${
                      isOpen ? "text-primary" : "text-on-surface"
                    }`}>
                      {faq.q}
                    </p>
                  </div>
                  <span className={`material-symbols-outlined text-lg text-on-surface-variant transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}>
                    expand_more
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 border-t border-outline-variant mt-0">
                    <div className="flex items-start gap-3 pt-4">
                      <div className="w-1 h-full min-h-[3rem] rounded-full bg-primary shrink-0" />
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact section */}
      <div className="mt-10 bg-primary-fixed/40 rounded-xl border border-primary-fixed-dim/50 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            support_agent
          </span>
        </div>
        <h3 className="text-lg font-semibold text-on-surface mb-2">Still need help?</h3>
        <p className="text-sm text-on-surface-variant mb-4 max-w-md mx-auto">
          Contact your HR department or system administrator for questions about your specific leave policies, balances, or account issues.
        </p>
        <button
          onClick={() => router.push("/employee/settings")}
          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          Go to Settings
        </button>
      </div>

      {/* Quick tips */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "keyboard", title: "Keyboard Tip", desc: "Press Escape to close any open modal or dialog." },
          { icon: "lightbulb", title: "Pro Tip", desc: "Use the calendar view to see your leave days and company holidays at a glance." },
          { icon: "refresh", title: "Stay Updated", desc: "Refresh the Leave Status page to see the latest updates on your requests." },
        ].map((tip, i) => (
          <div key={i} className="bg-white rounded-xl border border-outline-variant p-5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-amber-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                {tip.icon}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-on-surface mb-1">{tip.title}</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
