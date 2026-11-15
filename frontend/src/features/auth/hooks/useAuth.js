import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { getFieldErrors, getToastError } from "../../../utils/validationErrors";
import { AuthContext } from "../AuthContext";
import { useCartContext } from "../../cart/CartContext";
import { resetSubscriptionStore } from "../../subscription/store/SubscriptionStore";
import { register, login, logout, logoutAllDevices, sendOtpVerify, verifyAccount, resetOtp, verifyResetOtp, forgotPassword, getGoogleAuthUrl } from "../services/authAPI";

export const useAuth = () => {
  const { user, setUser } = useContext(AuthContext);
  const [authLoading, setAuthLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { handleGetCart, resetCartState } = useCartContext()

  const handleRegister = async ({ username, email, password, accountType }) => {
    setAuthLoading(true);
    try {
      const data = await register({ username, email, password, accountType });
      setUser(data.user);
      toast.success("Account created! Please check your email for the OTP to verify your account.");
      return true;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Registration failed. Please try again."));
      }
      return false; 
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async ({ email, password }) => {
    setAuthLoading(true);
    try {
      const data = await login({ email, password });
      setUser(data.user);
      await handleGetCart();
      return true; 
    } catch (error) {
      const status = error?.response?.status;
      const resData = error?.response?.data;

      // account exists but not verified
      if (status === 403 && resData?.isAccountVerified === false) {
        return { success: false, notVerified: true, email: resData.email };
      }

      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Login failed. Please try again."));
      }
      return false; 
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await logout();
      setUser(null);
      resetCartState();
      resetSubscriptionStore();
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Logout failed. Please try again."));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setAuthLoading(true);
    try {
      await logoutAllDevices();
      setUser(null);
      resetCartState();
      resetSubscriptionStore();
      toast.success("Logged out from all devices successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to logout from all devices."));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtpVerify = async ({ email }) => {
    setAuthLoading(true);
    try {
      await sendOtpVerify({ email });
      toast.success("OTP sent to your email");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to send OTP. Please try again."));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyAccount = async ({ email, otp }) => {
    setAuthLoading(true);
    try {
      const data = await verifyAccount({ email, otp });
      setUser(data.user);
      toast.success("Account verified successfully!");
      return true;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Invalid or expired OTP."));
      }
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetOtp = async ({ email }) => {
    setAuthLoading(true);
    try {
      await resetOtp({ email });
      toast.success("A new OTP has been sent to your email");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to resend OTP. Please try again."));
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyResetOtp = async ({ email, otp }) => {
    setAuthLoading(true);
    try {
      const data = await verifyResetOtp({ email, otp });
      setUser(data.user);
      toast.success("Reset OTP verified successfully!");
      return true;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Invalid or expired OTP."));
      }
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async ({ newPassword, confirmPassword }) => {
    setAuthLoading(true);
    try {
      await forgotPassword({ newPassword, confirmPassword });
      setUser(null)
      toast.success("Password reset successfully! Please login with your new password.");
      return true;
    } catch (error) {
      const fieldErrs = getFieldErrors(error);
      if (Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
      } else {
        toast.error(getToastError(error, "Failed to reset password. Check your OTP and try again."));
      }
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return {
    user,
    authLoading,
    fieldErrors,
    setFieldErrors,
    handleRegister,
    handleLogin,
    handleLogout,
    handleLogoutAllDevices,
    handleSendOtpVerify,
    handleVerifyAccount,
    handleResetOtp,
    handleVerifyResetOtp,
    handleForgotPassword,
    handleGoogleAuth,
  };
};
