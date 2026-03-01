import type { PropsChildrenReact } from "@/shared/types";
import { Navigate } from "react-router-dom";

export default function AlreadyLoginRoute({ children }: PropsChildrenReact) {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
