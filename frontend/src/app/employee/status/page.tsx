"use client";

export default function StatusPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-2">Leave Status</h1>
      <p className="text-on-surface-variant mb-8">View your leave request history</p>
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-12 text-center">
        <span className="material-symbols-outlined text-5xl text-outline mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
        <h2 className="text-lg font-semibold text-on-surface mb-1">Coming Soon</h2>
        <p className="text-on-surface-variant text-sm">This page is under development</p>
      </div>
    </div>
  );
}
