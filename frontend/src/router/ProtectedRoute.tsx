import type { PropsChildrenReact } from "@/shared/types";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: PropsChildrenReact) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}
