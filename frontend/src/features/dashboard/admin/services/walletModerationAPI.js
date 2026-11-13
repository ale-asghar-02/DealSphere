import { api } from '../../../auth/services/authAPI'

// ══════════════════════════════════════════════════════════
// ADMIN - WITHDRAWAL MODERATION
// ══════════════════════════════════════════════════════════

export const getAllWithdrawals = async (params) => {
  const response = await api.get(`/admin/withdrawals`, { params });
  return response.data;
};

export const completeWithdrawal = async (withdrawalId) => {
  const response = await api.post(`/admin/withdrawals/${withdrawalId}/complete`);
  return response.data;
};

export const rejectWithdrawal = async (withdrawalId, payload) => {
  const response = await api.post(`/admin/withdrawals/${withdrawalId}/reject`, payload);
  return response.data;
};

// ══════════════════════════════════════════════════════════
// ADMIN - TRANSACTIONS
// ══════════════════════════════════════════════════════════

export const getAllTransactions = async (params) => {
  const response = await api.get(`/admin/transactions`, { params });
  return response.data;
};