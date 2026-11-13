import { api } from '../../auth/services/authAPI'

export const getSearchResults = async (query, type, filters = {}) => {
  const params = { type, q: query };
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sort) params.sort = filters.sort;
  if (filters.country) params.country = filters.country;
  if (filters.city) params.city = filters.city;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await api.get(`/search`, { params });
  return response.data;
};

export const getSearchSuggestions = async (query, type) => {
  const response = await api.get(
    `/search/suggestions?type=${type}&q=${encodeURIComponent(query)}`
  );
  return response.data;
};