import { api } from '../../../auth/services/authAPI'

export const createArticle = async (articleData) => {
  const response = await api.post(`/admin/article/create`, articleData);
  return response.data;
};

export const updateArticle = async (id, articleData) => {
  const response = await api.post(`/admin/article/update/${id}`, articleData);
  return response.data;
};

export const deleteArticle = async (id) => {
  const response = await api.post(`/admin/article/delete/${id}`);
  return response.data;
};