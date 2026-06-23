"use client";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
}

export default function StatsCard({
  label,
  value,
  icon,
  iconBg = "bg-primary-fixed",
  iconColor = "text-primary",
  valueColor = "text-on-surface",
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-on-surface-variant font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
          <span
            className={`material-symbols-outlined ${iconColor} text-2xl`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}
