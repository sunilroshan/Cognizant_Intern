import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DashboardLayout.css";

export const DashboardLayout: React.FC = () => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return "Control Panel Overview";
      case "/profile":
        return "My Guest Profile";
      case "/guests":
        return "Guests Registry";
      case "/rooms":
        return "Rooms Inventory";
      case "/reservations":
        return "Lease Reservations";
      case "/housekeeping":
        return "Housekeeping Operations";
      case "/orders":
        return "Guest Service Orders";
      case "/billing":
        return "Billing & Invoices";
      case "/staff":
        return "Staff Directory";
      case "/schedules":
        return "Shift Schedules";
      case "/reports":
        return "Analytics Reports";
      default:
        return "Operations Control Center";
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main pane */}
      <div className="dashboard-main">
        {/* Top Header */}
        <Header title={getPageTitle(location.pathname)} />

        {/* Scrollable subpage view */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
