import { api } from '../../../auth/services/authAPI'

export const getUsersModerationList = async () => {
  const response = await api.get('/admin/users/moderation');
  return response.data;
};

export const banUser = async (userId, reason) => {
  const response = await api.post(`/admin/user/ban/${userId}`, { reason });
  return response.data;
};

export const suspendUser = async (userId, reason, duration) => {
  const response = await api.post(`/admin/user/suspend/${userId}`, { reason, duration });
  return response.data;
};

export const unbanUser = async (userId) => {
  const response = await api.post(`/admin/user/unban/${userId}`);
  return response.data;
};