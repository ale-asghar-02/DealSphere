import { api } from '../../../auth/services/authAPI';

export const adminCreateAnnouncement = async (payload) => {
  const response = await api.post('/admin/announcement/create', payload);
  return response.data;
};

export const adminReadAnnouncements = async () => {
  const response = await api.get('/admin/announcements');
  return response.data;
};

export const adminUpdateAnnouncement = async (id, payload) => {
  const response = await api.post(`/admin/announcement/update/${id}`, payload);
  return response.data;
};

export const adminDeleteAnnouncement = async (id) => {
  const response = await api.post(`/admin/announcement/delete/${id}`);
  return response.data;
};