import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  color: "indigo" | "emerald" | "violet" | "amber" | "rose";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon: Icon, color }) => {
  const getTheme = () => {
    switch (color) {
      case "emerald":
        return {
          bg: "from-emerald-600 to-teal-600 border-transparent text-white",
          iconBg: "bg-white/20 text-white",
        };
      case "violet":
        return {
          bg: "from-violet-600 to-indigo-600 border-transparent text-white",
          iconBg: "bg-white/20 text-white",
        };
      case "amber":
        return {
          bg: "from-amber-500 to-orange-500 border-transparent text-white",
          iconBg: "bg-white/20 text-white",
        };
      case "rose":
        return {
          bg: "from-rose-600 to-pink-600 border-transparent text-white",
          iconBg: "bg-white/20 text-white",
        };
      default: // indigo
        return {
          bg: "from-indigo-600 to-blue-600 border-transparent text-white",
          iconBg: "bg-white/20 text-white",
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${theme.bg} p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
            {title}
          </span>
          <div className="text-2xl font-extrabold text-white">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.iconBg}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-3 text-xs text-white/80">{subtext}</p>
    </div>
  );
};

export default StatCard;
