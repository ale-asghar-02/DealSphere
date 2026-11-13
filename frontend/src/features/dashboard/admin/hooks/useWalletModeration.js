import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getAllWithdrawals, completeWithdrawal, rejectWithdrawal, getAllTransactions } from "../services/walletModerationAPI";

const useWalletModeration = () => {
  const [adminWalletLoading, setAdminWalletLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // ─────────────── WITHDRAWALS ───────────────

  const handleGetAllWithdrawals = async (params) => {
    setAdminWalletLoading(true);
    try {
      const data = await getAllWithdrawals(params);
      setWithdrawals(data.data);
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot load withdrawal requests");
      return false;
    } finally {
      setAdminWalletLoading(false);
    }
  };

  const handleCompleteWithdrawal = async (withdrawalId) => {
    setAdminWalletLoading(true);
    try {
      const data = await completeWithdrawal(withdrawalId);
      toast.success("Withdrawal marked as completed");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot complete withdrawal");
      return false;
    } finally {
      setAdminWalletLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId, payload) => {
    setAdminWalletLoading(true);
    try {
      const data = await rejectWithdrawal(withdrawalId, payload);
      toast.success("Withdrawal rejected");
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot reject withdrawal");
      return false;
    } finally {
      setAdminWalletLoading(false);
    }
  };

  // ─────────────── TRANSACTIONS ───────────────

  const handleGetAllTransactions = async (params) => {
    setAdminWalletLoading(true);
    try {
      const data = await getAllTransactions(params);
      setTransactions(data.data);
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot load transactions");
      return false;
    } finally {
      setAdminWalletLoading(false);
    }
  };

  return {
    adminWalletLoading,
    withdrawals,
    transactions,
    handleGetAllWithdrawals,
    handleCompleteWithdrawal,
    handleRejectWithdrawal,
    handleGetAllTransactions,
  };
};

export default useWalletModeration;