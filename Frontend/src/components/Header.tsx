import React from "react";
import { User as UserIcon, Shield, Server } from "lucide-react";
import { getUserInfo, getRole } from "../utils/auth";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const role = getRole();
  const userInfo = getUserInfo();

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "MANAGER":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "FRONTDESK_STAFF":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "HOUSEKEEPING_STAFF":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-slate-900 border-b border-slate-800">
      {/* Title / Section */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight capitalize">
          {title.replace("-", " ")}
        </h2>
        <p className="text-xs text-slate-400">Manage hospitality operations & data</p>
      </div>

      {/* User Status / Profile */}
      <div className="flex items-center gap-6">
        {/* API connection indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <Server size={14} className="text-emerald-400 animate-pulse" />
          <span>Core API Connected</span>
        </div>

        {/* User Info Details */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <h4 className="text-sm font-semibold text-slate-100 leading-tight">
              {userInfo?.fullName || (role === "ADMIN" ? "Administrator" : "HospEase User")}
            </h4>
            <span className="text-[10px] text-slate-400">{userInfo?.email || "user@hospease.com"}</span>
          </div>

          {/* Role badge and Profile Icon */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(
                role
              )}`}
            >
              {role}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
              <UserIcon size={18} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
