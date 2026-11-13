import { api } from '../../../auth/services/authAPI';

export const sellerCreateProduct = async (productData) => {
  const response = await api.post('/product/seller/create', productData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const sellerReadProducts = async () => {
  const response = await api.get('/product/seller/read');
  return response.data;
};

export const sellerUpdateProduct = async (productData, productId) => {
  const response = await api.post(`/product/seller/update/${productId}`, productData);
  return response.data;
};

export const sellerDeleteProduct = async (productId) => {
  const response = await api.post(`/product/seller/delete/${productId}`);
  return response.data;
};

export const sellerMarkAsSold = async (productId) => {
  const response = await api.post(`/product/seller/sold/${productId}`);
  return response.data;
};

export const sellerUpdateStock = async (productId, stockData) => {
  const response = await api.post(`/product/seller/stock/${productId}`, stockData);
  return response.data;
};

export const sellerRenewProduct = async (productId) => {
  const response = await api.post(`/product/seller/renew/${productId}`);
  return response.data;
};