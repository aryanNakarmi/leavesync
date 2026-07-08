"use client";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-outline-variant flex items-center justify-end px-6 py-3">
      <div className="flex items-center gap-4">
        <button className="relative p-1.5 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full">
          <span className="material-symbols-outlined text-lg">notifications</span>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />
        </button>
      </div>
    </header>
  );
}
