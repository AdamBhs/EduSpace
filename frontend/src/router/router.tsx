import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import ProtectedRoute from "./ProtectedRoute";
import Home from "@/features/dashboard/Home";
import VerificationRoute from "./VerificationRoute";
import DashboardLayout from "@/layout/DashboardLayout";
import AlreadyLoginRoute from "./AlreadyLogin";
import { AuthProvider } from "@/context/AuthContext";
import Calendar from "@/features/calendar/Calendar";
import Class from "@/features/classes/Class";
import People from "@/features/classes/subPages/People";
import Todo from "@/features/todo/Todo";
import Settings from "@/features/settings/Settings";
import Stream from "@/features/classes/subPages/Stream";
import Grades from "@/features/classes/subPages/Grades";
import Chat from "@/features/classes/subPages/Chat";
import PostDetail from "@/features/classes/subPages/PostDetail";
import Assignments from "@/features/classes/subPages/Assignments";
import ForgotPassword from "@/features/auth/ForgotPassword";
import ResetPassword from "@/features/auth/ResetPassword";
import ClassSettings from "@/features/classes/subPages/ClassSettings";
import Landing from "@/features/landing/Landing";

export const router = createBrowserRouter([
  {
    path: "/welcome",
    element: (
      <AlreadyLoginRoute>
        <Landing />
      </AlreadyLoginRoute>
    ),
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
    path: "/forgot-password",
    element: (
      <AlreadyLoginRoute>
        <ForgotPassword />
      </AlreadyLoginRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <AlreadyLoginRoute>
        <ResetPassword />
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
      { path: "calendar", element: <Calendar /> },
      { path: "todo", element: <Todo /> },
      {
        path: "c/:classId",
        children: [
          { index: true, element: <Class /> },
          { path: "people", element: <People /> },
          { path: "stream", element: <Stream /> },
          { path: "assignments", element: <Assignments /> },
          { path: "grades", element: <Grades /> },
          { path: "chat", element: <Chat /> },
          { path: "post/:postId", element: <PostDetail /> },
          { path: "settings", element: <ClassSettings /> },
        ],
      },
      {
        path: "settings",
        children: [
          { index: true, element: <Settings /> },
          { path: "notifications", element: <Settings /> },
          { path: "security", element: <Settings /> },
        ],
      },
    ],
  },
]);
