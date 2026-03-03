import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import Home from "@/features/dashboard/Home";
import VerificationRoute from "./VerificationRoute";
import DashboardLayout from "@/layout/DashboardLayout";
import AlreadyLoginRoute from "./AlreadyLogin";
import { AuthProvider } from "@/context/AuthContext";
import User from "@/features/dashboard/User";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/verification",
    element: (
      <AlreadyLoginRoute>
        <VerificationRoute />
      </AlreadyLoginRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <AlreadyLoginRoute>
        <Login />
      </AlreadyLoginRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <AlreadyLoginRoute>
        <Register />
      </AlreadyLoginRoute>
    ),
  },
  {
    path: "/",
    element: (
      <AuthProvider>
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "users", element: <User /> },
      // { path: "settings", element: <Settings /> },
    ],
  },
]);
