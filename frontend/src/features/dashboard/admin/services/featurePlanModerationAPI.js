import { api } from '../../../auth/services/authAPI'

export const adminReadFeaturePlans = async () => {
  const response = await api.get('/admin/feature-plan/read');
  return response.data;
};

export const adminReadFeaturePlanById = async (id) => {
  const response = await api.get(`/admin/feature-plan/read/${id}`);
  return response.data;
};

export const adminUpdateFeaturePlan = async (id, payload) => {
  const response = await api.post(`/admin/feature-plan/update/${id}`, payload);
  return response.data;
};

export const adminToggleFeaturePlanActive = async (id) => {
  const response = await api.post(`/admin/feature-plan/toggle-active/${id}`);
  return response.data;
};

export const adminApplyFeatureDiscount = async (id, payload) => {
  const response = await api.post(`/admin/feature-plan/discount/apply/${id}`, payload);
  return response.data;
};

export const adminRemoveFeatureDiscount = async (id) => {
  const response = await api.post(`/admin/feature-plan/discount/remove/${id}`);
  return response.data;
};