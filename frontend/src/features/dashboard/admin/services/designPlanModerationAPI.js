import { api } from '../../../auth/services/authAPI'

export const adminReadDesignPlans = async () => {
  const response = await api.get('/admin/design-subscription/read');
  return response.data;
};

export const adminReadDesignPlanById = async (id) => {
  const response = await api.get(`/admin/design-subscription/read/${id}`);
  return response.data;
};

export const adminUpdateDesignPlan = async (id, payload) => {
  const response = await api.post(`/admin/design-subscription/update/${id}`, payload);
  return response.data;
};

export const adminToggleDesignPlanActive = async (id) => {
  const response = await api.post(`/admin/design-subscription/toggle-active/${id}`);
  return response.data;
};

export const adminApplyDesignDiscount = async (id, payload) => {
  const response = await api.post(`/admin/design-subscription/discount/apply/${id}`, payload);
  return response.data;
};

export const adminRemoveDesignDiscount = async (id) => {
  const response = await api.post(`/admin/design-subscription/discount/remove/${id}`);
  return response.data;
};

export const adminReadDesignSubscribers = async (params) => {
  const response = await api.get('/admin/design-subscription/users', { params });
  return response.data;
};