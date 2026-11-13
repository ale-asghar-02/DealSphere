import { api } from '../../auth/services/authAPI'

export const featuredPlans = async () => {
  const response = await api.get('/feature/plans');
  return response.data;
};

export const featuredStatus = async ({ itemType, itemId }) => {
  const response = await api.get(`/feature/status/${itemType}/${itemId}`);
  return response.data;
};

export const featuredCheckout = async ({ itemType, itemId, plan }) => {
  const response = await api.post(`/feature/checkout/${itemType}/${itemId}`, { plan });
  return response.data;
};

export const featureWithSubscription = async ({ itemType, itemId }) => {
  const response = await api.post(`/feature/feature-with-subscription/${itemType}/${itemId}`);
  return response.data;
};