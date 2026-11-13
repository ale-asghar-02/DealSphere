import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "@/features/auth/AuthContext";

// Sirf logged-in users ke liye. Agar user nahi hai to login pe bhej do,
// aur "from" state mein current location save kar do taake login ke baad
// wapas isi page pe redirect ho sake.
const ProtectedRoute = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;