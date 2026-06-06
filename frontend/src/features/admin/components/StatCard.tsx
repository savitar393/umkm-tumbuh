import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: "blue" | "green" | "yellow" | "purple" | "orange";
};

const colorMap = {
  blue:   { border: "#1f45b6", iconBg: "#eef3ff", iconColor: "#1f45b6" },
  green:  { border: "#16a34a", iconBg: "#f0fdf4", iconColor: "#16a34a" },
  yellow: { border: "#d97706", iconBg: "#fffbeb", iconColor: "#d97706" },
  purple: { border: "#7c3aed", iconBg: "#f5f3ff", iconColor: "#7c3aed" },
  orange: { border: "#ea580c", iconBg: "#fff7ed", iconColor: "#ea580c" },
};

export default function StatCard({ icon: Icon, label, value, sub, color = "blue" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="stat-card" style={{ borderTopColor: c.border }}>
      <div className="stat-card__icon-wrap" style={{ background: c.iconBg }}>
        <Icon size={22} color={c.iconColor} />
      </div>
      <div className="stat-card__body">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">{value}</div>
        {sub && <div className="stat-card__sub">{sub}</div>}
      </div>
    </div>
  );
}
