import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { requestWithdrawal, getMyWithdrawals } from "../services/withdrawalAPI";

const useWithdrawal = () => {
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);

  const handleRequestWithdrawal = async (payload) => {
    setWithdrawalLoading(true);
    try {
      const data = await requestWithdrawal(payload);
      toast.success("Withdrawal request submitted");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot submit withdrawal request");
      return false;
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleGetMyWithdrawals = async () => {
    setWithdrawalLoading(true);
    try {
      const data = await getMyWithdrawals();
      setWithdrawals(data.data);
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot load withdrawal requests");
      return false;
    } finally {
      setWithdrawalLoading(false);
    }
  };

  return {
    withdrawalLoading,
    withdrawals,
    handleRequestWithdrawal,
    handleGetMyWithdrawals,
  };
};

export default useWithdrawal;