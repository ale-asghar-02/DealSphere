import { api } from '../../../auth/services/authAPI'

// ══════════════════════════════════════════════════════════
// WALLET APIs
// ══════════════════════════════════════════════════════════

export const getMyWallet = async () => {
  const response = await api.get(`/wallet/balance`);
  return response.data;
};

export const getMyTransactions = async (params) => {
  const response = await api.get(`/wallet/transactions`, { params });
  return response.data;
};