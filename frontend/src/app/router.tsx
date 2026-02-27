import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "@/features/dashboard/Dashboard";
import VerificationRoute from "./VerificationRoute";
import DashboardLayout from "@/layout/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/verification",
    element: <VerificationRoute />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      // { path: "users", element: <Users /> },
      // { path: "settings", element: <Settings /> },
    ],
  },
]);
