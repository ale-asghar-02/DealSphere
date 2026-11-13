import { api } from '../../../auth/services/authAPI'

// ══════════════════════════════════════════════════════════
// WITHDRAWAL APIs
// ══════════════════════════════════════════════════════════

export const requestWithdrawal = async (payload) => {
  const response = await api.post(`/withdrawal/request`, payload);
  return response.data;
};

export const getMyWithdrawals = async () => {
  const response = await api.get(`/withdrawal/my-requests`);
  return response.data;
};