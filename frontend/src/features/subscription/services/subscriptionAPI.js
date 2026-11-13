import { api } from '../../auth/services/authAPI'

export const readAllPlans = async () => {
  const response = await api.get(`/subscription/read`);
  return response.data;
};

export const readSubscription = async () => {
  const response = await api.get(`/subscription/seller/read`);
  return response.data;
};

export const purchaseSubscription = async (planName) => {
  const response = await api.post(`/subscription/seller/purchase`, { planName });
  return response.data;
};