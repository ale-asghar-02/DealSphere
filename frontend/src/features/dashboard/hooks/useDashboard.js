import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { AuthContext } from "../../auth/AuthContext";
import { accountUpdate, sendDeleteOtp, accountDelete } from "../services/dashboardAPI";

const useDashboard = () => {
  const { setUser } = useContext(AuthContext);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const handleAccountUpdate = async (formData) => {
    setDashboardLoading(true);
    try {
      const data = await accountUpdate({ formData });
      setUser(data.user);
      toast.success("Account updated successfully");
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot update account"),
      );
      return false;
    } finally {
      setDashboardLoading(false);
    }
  };

  // Step 1: OTP bhejo. true = bhej diya gaya, false = error (blocker/cooldown etc.)
  const handleSendDeleteOtp = async () => {
    setDashboardLoading(true);
    try {
      await sendDeleteOtp();
      toast.success("Confirmation OTP sent to your email");
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot send OTP"),
      );
      return false;
    } finally {
      setDashboardLoading(false);
    }
  };

  // Step 2: OTP verify karke delete. true = account delete ho gaya
  const handleAccountDelete = async (otp) => {
    setDashboardLoading(true);
    try {
      await accountDelete({ otp });
      setUser(null);
      toast.success("Account deleted successfully");
      return true;
    } catch (error) {
      toast.error(
        getToastError(error, "Something went wrong! Cannot delete account"),
      );
      return false;
    } finally {
      setDashboardLoading(false);
    }
  };

  return {
    dashboardLoading,
    handleAccountUpdate,
    handleSendDeleteOtp,
    handleAccountDelete,
  };
};

export default useDashboard;