import { api } from '../../auth/services/authAPI';

export const accountUpdate = async ({ formData }) => {
  const response = await api.post('/user/account/update', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


export const sendDeleteOtp = async () => {
  const response = await api.post('/user/account/delete/send-otp');
  return response.data;
};

export const accountDelete = async ({ otp }) => {
  const response = await api.post('/user/account/delete/confirm', { otp });
  return response.data;
};