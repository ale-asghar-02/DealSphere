import { createContext, useState, useEffect } from "react";
import { refreshAccessToken } from "./services/authAPI.js";
import { getMe } from "../../services/userAPI.js";
import Loading from "@/components/Loading.jsx";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await refreshAccessToken();
        const response = await getMe();
        setUser(response.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrapAuth();
  }, []);

  const value = { loading, setLoading, user, setUser };

  if (loading) { return <Loading fullScreen /> }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};