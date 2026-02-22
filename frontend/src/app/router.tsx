import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "@/features/dashboard/Dashboard";
import Verification from "@/features/auth/Verification";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/verfication",
    element: (
      <ProtectedRoute>
        <Verification />
      </ProtectedRoute>
    ),
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
        <Dashboard />
      </ProtectedRoute>
    ),
  },
]);
