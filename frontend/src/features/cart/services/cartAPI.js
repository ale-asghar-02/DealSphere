import { api } from '../../auth/services/authAPI'

export const addToCart = async ({ productId, quantity }) => {
  const response = await api.post(`/cart/add`, { productId, quantity });
  return response.data;
};

export const getCart = async () => {
  const response = await api.get(`/cart/get-cart`);
  return response.data;
};

export const updateCartItem = async ({ productId, quantity }) => {
  const response = await api.post(`/cart/update/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async ({ productId }) => {
  const response = await api.post(`/cart/remove/${productId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await api.post(`/cart/clear`);
  return response.data;
};