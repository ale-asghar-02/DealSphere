import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "@/features/auth/AuthContext";

// Sirf logged-out users ke liye (login, register, verify-otp, reset-password).
// Agar user pehle se login hai to unhe wahan home page pe bhej do.
const GuestRoute = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;