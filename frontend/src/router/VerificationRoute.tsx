import Verification from "@/features/auth/Verification";
import { Navigate, useLocation } from "react-router-dom";

const VerificationRoute = () => {
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  return <Verification />;
};

export default VerificationRoute;
