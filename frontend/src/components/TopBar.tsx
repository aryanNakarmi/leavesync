"use client";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-sm border-b border-outline-variant flex items-center justify-between px-6 py-3">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-sm outline-none transition-all placeholder:text-on-surface-variant/50"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-1.5 text-on-surface-variant hover:bg-surface-container-low transition-all rounded-full">
          <span className="material-symbols-outlined text-lg">notifications</span>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-error rounded-full" />
        </button>
      </div>
    </header>
  );
}
