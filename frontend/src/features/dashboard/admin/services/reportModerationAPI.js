import { api } from '../../../auth/services/authAPI'

export const getAllReports = async () => {
  const response = await api.get("/admin/reports");
  return response.data;
};

export const getReportDetails = async (reportId) => {
  const response = await api.get(`/admin/report/${reportId}`);
  return response.data;
};

export const reviewReport = async (reportId, payload) => {
  const response = await api.post(`/admin/report/review/${reportId}`, payload);
  return response.data;
};