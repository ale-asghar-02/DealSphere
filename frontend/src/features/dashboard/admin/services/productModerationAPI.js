import { api } from '../../../auth/services/authAPI';

export const adminReadProducts = async () => {
  const response = await api.get('/admin/product/read');
  return response.data;
};

export const adminReadProductById = async (productId) => {
  const response = await api.get(`/admin/product/read/${productId}`);
  return response.data;
};

export const adminApproveProduct = async (productId) => {
  const response = await api.post(`/admin/product/approve/${productId}`);
  return response.data;
};

export const adminRejectProduct = async (productId) => {
  const response = await api.post(`/admin/product/reject/${productId}`);
  return response.data;
};

export const adminDeleteProduct = async (productId) => {
  const response = await api.post(`/admin/product/delete/${productId}`);
  return response.data;
};

export const adminBanProduct = async (productId) => {
  const response = await api.post(`/admin/product/ban/${productId}`);
  return response.data;
};

export const adminUnbanProduct = async (productId) => {
  const response = await api.post(`/admin/product/unban/${productId}`);
  return response.data;
};