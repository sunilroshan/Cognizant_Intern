import React from "react";
import { useAuth } from "../../AuthContext";
import { User as UserIcon, Server } from "lucide-react";
import "./Header.css";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { role, user } = useAuth();

  const getRoleBadgeClass = (userRole: string | null) => {
    if (!userRole) return "badge-staff";
    switch (userRole) {
      case "ADMIN":
        return "badge-admin";
      case "MANAGER":
        return "badge-manager";
      case "GUEST":
        return "badge-guest";
      default:
        return "badge-staff";
    }
  };

  return (
    <header className="header">
      <div className="header-title-container">
        <h2 className="text-lg font-bold text-white tracking-tight capitalize">
          {title.replace("-", " ")}
        </h2>
        <span className="text-[10px] text-slate-400 font-medium">HospEase Hospitality System</span>
      </div>

      <div className="header-profile">
        <div className="flex items-center gap-3">
          <div className="header-profile-text">
            <h4>{user?.fullName || "Administrator"}</h4>
            <span>{user?.email || "admin@hospease.com"}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`header-badge ${getRoleBadgeClass(role)}`}>
              {role || "STAFF"}
            </span>
            <div className="header-avatar">
              <UserIcon size={18} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
