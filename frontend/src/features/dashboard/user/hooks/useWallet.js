import { useState } from "react"
import { getToastError } from "@/utils/validationErrors";
import { getMyWallet, getMyTransactions } from "../services/walletAPI";

const useWallet = () => {
  const [walletLoading, setWalletLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const handleGetMyWallet = async () => {
    setWalletLoading(true);
    try {
      const data = await getMyWallet();
      setWallet(data.data);
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot load wallet");
      return false;
    } finally {
      setWalletLoading(false);
    }
  };

  const handleGetMyTransactions = async (params) => {
    setWalletLoading(true);
    try {
      const data = await getMyTransactions(params);
      setTransactions(data.data);
      return data;
    } catch (error) {
      getToastError(error, "Something went wrong! Cannot load transactions");
      return false;
    } finally {
      setWalletLoading(false);
    }
  };

  return {
    walletLoading,
    wallet,
    transactions,
    handleGetMyWallet,
    handleGetMyTransactions,
  };
};

export default useWallet;