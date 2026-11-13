import { api } from '../../../auth/services/authAPI';

export const sellerCreateAds = async (adsData) => {
  const response = await api.post('/ads/seller/create', adsData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const sellerReadAds = async () => {
  const response = await api.get('/ads/seller/read');
  return response.data;
};

export const sellerUpdateAds = async (adsData, adId) => {
  const response = await api.post(`/ads/seller/update/${adId}`, adsData);
  return response.data;
};

export const sellerDeleteAds = async (adId) => {
  const response = await api.post(`/ads/seller/delete/${adId}`);
  return response.data;
};

export const sellerSoldAds = async (adId) => {
  const response = await api.post(`/ads/seller/sold/${adId}`);
  return response.data;
};

export const sellerRenewAds = async (adId) => {
  const response = await api.post(`/ads/seller/renew/${adId}`);
  return response.data;
};