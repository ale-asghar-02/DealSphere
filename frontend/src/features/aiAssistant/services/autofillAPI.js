import { api } from '../../auth/services/authAPI'

export const autofillAd = async ({ description, condition }) => {
  const response = await api.post(`/ai/autofill/ad`, { description, condition });
  return response.data;
};

export const autofillProduct = async ({ description }) => {
  const response = await api.post(`/ai/autofill/product`, { description });
  return response.data;
};