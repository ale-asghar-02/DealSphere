import { api } from '../../../auth/services/authAPI';

export const adminReadAds = async () => {
  const response = await api.get('/admin/ad/read');
  return response.data;
};

export const adminReadAdById = async (adId) => {
  const response = await api.get(`/admin/ad/read/${adId}`);
  return response.data;
};

export const adminApproveAd = async (adId) => {
  const response = await api.post(`/admin/ad/approve/${adId}`);
  return response.data;
};

export const adminRejectAd = async (adId) => {
  const response = await api.post(`/admin/ad/reject/${adId}`);
  return response.data;
};

export const adminDeleteAd = async (adId) => {
  const response = await api.post(`/admin/ad/delete/${adId}`);
  return response.data;
};

export const adminBanAd = async (adId) => {
  const response = await api.post(`/admin/ad/ban/${adId}`);
  return response.data;
};

export const adminUnbanAd = async (adId) => {
  const response = await api.post(`/admin/ad/unban/${adId}`);
  return response.data;
};