import React from "react";
import {
  LayoutDashboard,
  Users,
  Bed,
  Calendar,
  Sparkles,
  Coffee,
  CreditCard,
  UserCheck,
  Clock,
  BarChart3,
  LogOut,
} from "lucide-react";
import { getRole, clearAuth } from "../utils/auth";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const role = getRole();

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, roles: ["ALL"] },
    { id: "guests", name: "Guests", icon: Users, roles: ["ALL"] },
    { id: "rooms", name: "Rooms", icon: Bed, roles: ["ALL"] },
    { id: "reservations", name: "Reservations", icon: Calendar, roles: ["ALL"] },
    { id: "housekeeping", name: "Housekeeping", icon: Sparkles, roles: ["ALL"] },
    { id: "orders", name: "Service Orders", icon: Coffee, roles: ["ALL"] },
    { id: "billing", name: "Billing & Invoices", icon: CreditCard, roles: ["ALL"] },
    { id: "staff", name: "Staff Directory", icon: UserCheck, roles: ["ADMIN", "MANAGER"] },
    { id: "schedules", name: "Shift Schedules", icon: Clock, roles: ["ALL"] },
    { id: "reports", name: "Analytics Reports", icon: BarChart3, roles: ["ADMIN", "MANAGER", "AUDITOR"] },
  ];

  const filteredItems = menuItems.filter(
    (item) => item.roles.includes("ALL") || item.roles.includes(role)
  );

  return (
    <div className="flex flex-col w-64 bg-gradient-to-b from-indigo-900 to-purple-900 border-r border-indigo-800 h-screen text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
          <span className="text-xl font-bold">H</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-none">HospEase</h1>
          <span className="text-lg text-indigo-400 font-medium">Hotel Suite</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20 translate-x-1"
                  : "hover:bg-indigo-800/50 hover:text-slate-100"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-indigo-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
