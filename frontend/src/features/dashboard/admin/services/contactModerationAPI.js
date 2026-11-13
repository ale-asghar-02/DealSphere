import { api } from '../../../auth/services/authAPI'

export const getAllContacts = async () => {
  const response = await api.get("/admin/contact");
  return response.data;
};

export const getContactById = async (id) => {
  const response = await api.get(`/admin/contact/${id}`);
  return response.data;
};

export const replyToContact = async (id, payload) => {
  const response = await api.post(`/admin/contact/reply/${id}`, payload);
  return response.data;
};

export const deleteContact = async (id) => {
  const response = await api.post(`/admin/contact/${id}`);
  return response.data;
};