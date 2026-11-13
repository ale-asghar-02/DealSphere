import { api } from '../../auth/services/authAPI'

export const likeAdvertisement = async (adId) => {
  const response = await api.post(`/wishlist/like/${adId}`);
  return response.data;
};

export const unlikeAdvertisement = async (adId) => {
  const response = await api.post(`/wishlist/unlike/${adId}`);
  return response.data;
};

export const getWishlist = async () => {
  const response = await api.get(`/wishlist/read`);
  return response.data;
};

export const clearWishlist = async () => {
  const response = await api.post(`/wishlist/clear`);
  return response.data;
};