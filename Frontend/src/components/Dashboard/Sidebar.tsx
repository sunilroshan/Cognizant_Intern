import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext";
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
  User as UserIcon,
} from "lucide-react";
import "./Sidebar.css";

export const Sidebar: React.FC = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getMenuItems = (userRole: string | null) => {
    switch (userRole) {
      case "GUEST":
        return [
          { path: "/dashboard", name: "Dashboard", icon: LayoutDashboard },
          { path: "/profile", name: "My Profile", icon: UserIcon },
          { path: "/rooms", name: "Rooms", icon: Bed },
          { path: "/reservations", name: "My Stays", icon: Calendar },
          { path: "/orders", name: "Service Orders", icon: Coffee },
          { path: "/billing", name: "Billing & Finance", icon: CreditCard },
        ];
      case "FINANCE_OFFICER":
      case "AUDITOR":
        return [
          { path: "/dashboard", name: "Overview", icon: LayoutDashboard },
          { path: "/billing", name: "Billing & Invoices", icon: CreditCard },
          { path: "/reports", name: "Analytics Reports", icon: BarChart3 },
        ];
      case "HOUSEKEEPING_STAFF":
        return [
          { path: "/dashboard", name: "Overview", icon: LayoutDashboard },
          { path: "/housekeeping", name: "Housekeeping", icon: Sparkles },
        ];
      case "SERVICE_STAFF":
        return [
          { path: "/dashboard", name: "Overview", icon: LayoutDashboard },
          { path: "/orders", name: "Service Orders", icon: Coffee },
        ];
      case "FRONTDESK_STAFF":
        return [
          { path: "/dashboard", name: "Overview", icon: LayoutDashboard },
          { path: "/guests", name: "Guests Registry", icon: Users },
          { path: "/rooms", name: "Rooms Inventory", icon: Bed },
          { path: "/reservations", name: "Reservations", icon: Calendar },
          { path: "/billing", name: "Billing & Invoices", icon: CreditCard },
        ];
      case "MANAGER":
        return [
          { path: "/dashboard", name: "Overview", icon: LayoutDashboard },
          { path: "/guests", name: "Guests Registry", icon: Users },
          { path: "/rooms", name: "Rooms Inventory", icon: Bed },
          { path: "/reservations", name: "Reservations", icon: Calendar },
          { path: "/staff", name: "Staff Directory", icon: UserCheck },
          { path: "/schedules", name: "Schedules", icon: Clock },
          { path: "/reports", name: "Analytics Reports", icon: BarChart3 },
        ];
      case "ADMIN":
      default:
        return [
          { path: "/dashboard", name: "Overview", icon: LayoutDashboard },
          { path: "/guests", name: "Guests Registry", icon: Users },
          { path: "/rooms", name: "Rooms Inventory", icon: Bed },
          { path: "/reservations", name: "Reservations", icon: Calendar },
          { path: "/housekeeping", name: "Housekeeping", icon: Sparkles },
          { path: "/orders", name: "Service Orders", icon: Coffee },
          { path: "/billing", name: "Billing & Invoices", icon: CreditCard },
          { path: "/staff", name: "Staff Directory", icon: UserCheck },
          { path: "/schedules", name: "Schedules", icon: Clock },
          { path: "/reports", name: "Analytics Reports", icon: BarChart3 },
        ];
    }
  };

  const menuItems = getMenuItems(role);

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">H</div>
        <div>
          <h1 className="text-sm font-bold text-indigo-400 leading-none">HospEase</h1>
          <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Hotel Portal</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sidebar-item ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
