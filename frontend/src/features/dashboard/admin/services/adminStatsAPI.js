import { api } from '../../../auth/services/authAPI';

export const getOverview = async () => {
  const response = await api.get('/admin/stats/overview');
  return response.data;
};

export const getUsersGrowth = async (range = '30d') => {
  const response = await api.get(`/admin/stats/users-growth?range=${range}`);
  return response.data;
};

export const getOrdersRevenue = async (range = '30d') => {
  const response = await api.get(`/admin/stats/orders-revenue?range=${range}`);
  return response.data;
};

export const getListingsGrowth = async (range = '30d') => {
  const response = await api.get(`/admin/stats/listings-growth?range=${range}`);
  return response.data;
};

export const getCategoryDistribution = async () => {
  const response = await api.get('/admin/stats/category-distribution');
  return response.data;
};

export const getSubscriptionDistribution = async () => {
  const response = await api.get('/admin/stats/subscription-distribution');
  return response.data;
};

export const getDesignOverview = async () => {
  const response = await api.get('/admin/stats/design-overview');
  return response.data;
};

export const getRevenueChart = async (period = 'monthly') => {
  const response = await api.get(`/admin/stats/revenue-chart?period=${period}`);
  return response.data;
};

export const getRecentActivity = async (type) => {
  const response = await api.get(`/admin/stats/recent-activity?type=${type}`);
  return response.data;
};