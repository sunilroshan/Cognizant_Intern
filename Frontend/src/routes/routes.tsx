import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/LoginPage/LoginPage";
import RegisterPage from "../pages/RegisterPage/RegisterPage";
import DashboardLayout from "../components/Dashboard/DashboardLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import GuestsPage from "../pages/Guests/GuestsPage";
import RoomsPage from "../pages/Rooms/RoomsPage";
import ReservationsPage from "../pages/Reservations/ReservationsPage";
import HousekeepingPage from "../pages/Housekeeping/HousekeepingPage";
import OrdersPage from "../pages/Orders/OrdersPage";
import BillingPage from "../pages/Billing/BillingPage";
import StaffPage from "../pages/Staff/StaffPage";
import SchedulesPage from "../pages/Schedules/SchedulesPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import ProfilePage from "../pages/Profile/ProfilePage";

export const router = createBrowserRouter([
  // Public Routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // Protected Routes under DashboardLayout
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "",
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "guests",
            element: <GuestsPage />,
          },
          {
            path: "rooms",
            element: <RoomsPage />,
          },
          {
            path: "reservations",
            element: <ReservationsPage />,
          },
          {
            path: "housekeeping",
            element: <HousekeepingPage />,
          },
          {
            path: "orders",
            element: <OrdersPage />,
          },
          {
            path: "billing",
            element: <BillingPage />,
          },
          {
            path: "staff",
            element: <StaffPage />,
          },
          {
            path: "schedules",
            element: <SchedulesPage />,
          },
          {
            path: "reports",
            element: <ReportsPage />,
          },
        ],
      },
    ],
  },
  
  // Catch-all route redirecting to dashboard
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
