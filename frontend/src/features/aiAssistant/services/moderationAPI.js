import { api } from '../../auth/services/authAPI'

export const recheckModeration = async (type, id) => {
  const response = await api.post(`/ai/${type}/${id}/recheck`);
  return response.data;
};