import { api } from '../../../auth/services/authAPI'

export const adminReadPlans = async () => {
  const response = await api.get('/admin/subscription/read');
  return response.data;
};

export const adminReadPlanById = async (id) => {
  const response = await api.get(`/admin/subscription/read/${id}`);
  return response.data;
};

export const adminUpdatePlan = async (id, payload) => {
  const response = await api.post(`/admin/subscription/update/${id}`, payload);
  return response.data;
};

export const adminToggleActive = async (id) => {
  const response = await api.post(`/admin/subscription/toggle-active/${id}`);
  return response.data;
};

export const adminApplyDiscount = async (id, payload) => {
  const response = await api.post(`/admin/subscription/discount/apply/${id}`, payload);
  return response.data;
};

export const adminRemoveDiscount = async (id) => {
  const response = await api.post(`/admin/subscription/discount/remove/${id}`);
  return response.data;
};

export const adminReadSellerSubscriptions = async (params) => {
  const response = await api.get('/admin/subscription/sellers', { params });
  return response.data;
};