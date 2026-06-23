"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "#contact", label: "Contact" },
];

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* TopNavBar */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-50">
        <nav className="flex justify-between items-center h-20 px-6 max-w-7xl mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="LeaveSync" className="h-10 w-auto" />
            <span className="text-xl font-bold text-primary">LeaveSync</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-secondary font-medium text-sm hover:text-primary transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push("/login")}
              className="text-secondary font-medium text-sm hover:text-primary px-4 py-2 transition-all"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="bg-primary text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-on-surface-variant"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-outline-variant/30 bg-surface">
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-secondary font-medium text-sm hover:text-primary transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-outline-variant/30 space-y-3">
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push("/login"); }}
                  className="w-full text-secondary font-medium text-sm hover:text-primary px-4 py-2.5 transition-all border border-outline-variant rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); router.push("/signup"); }}
                  className="w-full bg-primary text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-semibold w-fit">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Trusted by 500+ Nepalese Enterprises
              </span>

              <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface leading-tight text-balance">
                Modern Leave Management for Smarter Teams
              </h1>

              <p className="text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                Streamline employee leave tracking and automation across your entire organization. Custom-built for the Nepalese fiscal year and local labor laws, ensuring compliance and operational excellence.
              </p>

              <div className="flex flex-wrap gap-4 mt-4">
                <button
                  onClick={() => router.push("/signup")}
                  className="bg-primary text-on-primary font-semibold text-sm px-8 py-4 rounded-xl flex items-center gap-2 hover:opacity-95 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  Start Free Trial
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                <button className="bg-secondary-container text-on-secondary-container font-semibold text-sm px-8 py-4 rounded-xl border border-outline-variant hover:bg-surface-container transition-all active:scale-[0.98]">
                  Book a Demo
                </button>
              </div>

              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-3">
                  {["#004ac6", "#2563eb", "#dbe1ff"].map((color, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-on-surface-variant">
                  Join 2,000+ HR managers simplifying their work.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl border border-outline-variant p-4 soft-shadow">
                <div className="rounded-lg w-full aspect-[4/3] bg-gradient-to-br from-primary-fixed to-surface-container-highest flex items-center justify-center overflow-hidden">
                  <div className="text-center p-8">
                    <img src="/logo.png" alt="LeaveSync" className="h-16 w-auto mx-auto mb-4 opacity-50" />
                    <div className="grid grid-cols-3 gap-3 mt-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-12 rounded-lg bg-white/60 border border-outline-variant/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary/40 text-lg">
                            {["calendar_month", "assignment", "group", "bar_chart", "check_circle", "pending_actions"][i - 1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-6 -left-6 bg-primary p-4 rounded-xl text-white flex items-center gap-4 soft-shadow">
                <div className="bg-white/20 p-2 rounded-lg">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    trending_up
                  </span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold opacity-80 uppercase tracking-wider">Efficiency Increase</div>
                  <div className="text-2xl font-bold">42%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-surface-container-lowest" id="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-on-surface mb-4">Enterprise Features, Built for Clarity</h2>
              <p className="text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto">
                Powerful tools to manage time-off requests, balances, and reporting without the administrative headache.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: "track_changes", title: "Real-time Tracking", desc: "Instant visibility into team availability with live sync across calendars and department views." },
                { icon: "autorenew", title: "Carryover Logic", desc: "Automated year-end calculations for leave carryovers, expires, and payout adjustments." },
                { icon: "person_outline", title: "Employee Portal", desc: "Self-service dashboard for employees to view balances and submit requests in seconds." },
                { icon: "verified_user", title: "Approval Workflows", desc: "Multi-tier approval chains with customizable rules for different departments and roles." },
                { icon: "calendar_month", title: "Fiscal Year Support", desc: "Full support for the Bikram Sambat calendar and customized Nepali fiscal year settings." },
                { icon: "analytics", title: "Advanced Reports", desc: "Generate audit-ready reports on absenteeism, accruals, and policy compliance with one click." },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-xl border border-outline-variant hover:border-primary transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <span className="material-symbols-outlined">{feature.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface mb-3">{feature.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto" id="how-it-works">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-on-surface">Implementation in 3 Simple Steps</h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-outline-variant/30 -z-10" />

            {[
              { num: "1", title: "Setup Policies", desc: "Configure your leave types, quotas, and accrual rules based on your specific HR policy." },
              { num: "2", title: "Import Directory", desc: "Sync your employee list via CSV or API. Set up reporting hierarchies and teams effortlessly." },
              { num: "3", title: "Go Live", desc: "Invite your team. Employees can start requesting leave while admins gain instant oversight." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-2xl mb-6 border-4 border-surface shadow-lg">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Stats Section */}
        <section className="py-24 bg-surface-container-low border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-on-surface mb-6">Built for Reliability, Designed for Humans</h2>
                <div className="space-y-6">
                  {[
                    { icon: "security", title: "Bank-Grade Security", desc: "Data encryption at rest and in transit. SOC2 compliant infrastructure for peace of mind." },
                    { icon: "support_agent", title: "Localized Support", desc: "Dedicated account managers who understand the specific needs of businesses in Nepal." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-outline-variant">
                      <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.icon}
                      </span>
                      <div>
                        <h4 className="font-semibold text-sm">{item.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary p-8 rounded-xl text-on-primary">
                  <div className="text-4xl font-bold mb-1">99.9%</div>
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Uptime</div>
                </div>
                <div className="bg-white p-8 rounded-xl border border-outline-variant">
                  <div className="text-4xl font-bold text-primary mb-1">15k+</div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Users Managed</div>
                </div>
                <div className="bg-white p-8 rounded-xl border border-outline-variant">
                  <div className="text-4xl font-bold text-primary mb-1">12hr</div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Avg. Implementation</div>
                </div>
                <div className="bg-primary-container p-8 rounded-xl text-on-primary-container">
                  <div className="text-4xl font-bold mb-1">0%</div>
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Manual Errors</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 max-w-7xl mx-auto" id="contact">
          <div className="bg-primary rounded-2xl p-12 lg:p-20 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-on-primary mb-6">
                Start managing leave smarter today
              </h2>
              <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed">
                Join hundreds of teams who have reclaimed their time and replaced messy spreadsheets with LeaveSync. No credit card required to start.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => router.push("/signup")}
                  className="bg-white text-primary font-semibold text-sm px-10 py-4 rounded-xl hover:bg-surface-bright transition-all shadow-xl active:scale-[0.98]"
                >
                  Get Started for Free
                </button>
                <button className="bg-primary border border-white/30 text-white font-semibold text-sm px-10 py-4 rounded-xl hover:bg-white/10 transition-all active:scale-[0.98]">
                  Schedule a Walkthrough
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center py-10 px-6 max-w-7xl mx-auto w-full gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="LeaveSync" className="h-8 w-auto" />
              <span className="text-lg font-bold text-on-surface">LeaveSync</span>
            </Link>
            <p className="text-xs text-on-surface-variant">© 2024 LeaveSync. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 justify-center">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-on-surface-variant hover:text-primary transition-all underline underline-offset-2"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex gap-4">
            <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface transition-all">
              <span className="material-symbols-outlined text-lg">public</span>
            </button>
            <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface transition-all">
              <span className="material-symbols-outlined text-lg">share</span>
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
