import { api } from '../../auth/services/authAPI'

// ══════════════════════════════════════════════════════════
// BUYER APIs
// ══════════════════════════════════════════════════════════

export const buyNow = async (payload) => {
  const response = await api.post(`/order/buyer/buy-now`, payload);
  return response.data;
};

export const checkoutFromCart = async (payload) => {
  const response = await api.post(`/order/buyer/checkout`, payload);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get(`/order/buyer/my-orders`);
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await api.get(`/order/buyer/${orderId}`);
  return response.data;
};

export const cancelOrder = async (orderId, cancelReason) => {
  const response = await api.post(`/order/buyer/${orderId}/cancel`, { cancelReason });
  return response.data;
};

export const abandonOrder = async (orderId) => {
  const response = await api.post(`/order/buyer/${orderId}/abandon`);
  return response.data;
};

export const confirmReceipt = async (orderId) => {
  const response = await api.post(`/order/buyer/${orderId}/confirm-receipt`);
  return response.data;
};

export const verifyCodOrder = async (orderId) => {
  const response = await api.get(`/order/buyer/${orderId}/receipt`);
  return response.data;
};

export const deleteMyOrder = async (orderId) => {
  const response = await api.post(`/order/buyer/${orderId}/delete`);
  return response.data;
};

export const deleteAllMyOrders = async () => {
  const response = await api.post(`/order/buyer/delete/all`);
  return response.data;
};

// ══════════════════════════════════════════════════════════
// SELLER APIs
// ══════════════════════════════════════════════════════════

export const getSellerOrders = async () => {
  const response = await api.get(`/order/seller/my-orders`);
  return response.data;
};

export const getSellerOrderById = async (orderId) => {
  const response = await api.get(`/order/seller/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId, orderStatus) => {
  const response = await api.post(`/order/seller/${orderId}/status`, { orderStatus });
  return response.data;
};

export const deleteSellerOrder = async (orderId) => {
  const response = await api.post(`/order/seller/${orderId}/delete`);
  return response.data;
};

export const deleteAllSellerOrders = async () => {
  const response = await api.post(`/order/seller/delete/all`);
  return response.data;
};