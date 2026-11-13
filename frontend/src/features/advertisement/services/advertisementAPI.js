import { api } from '../../auth/services/authAPI';

export const getAllAds = async (filters = {}) => {
  const params = {};
  if (filters.country) params.country = filters.country;
  if (filters.city) params.city = filters.city;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await api.get('/ads/read', { params });
  return response.data;
};

export const getAllAdsWithCategorySlug = async ({ categorySlug, subCategory, country, city, minPrice, maxPrice, sort, page, limit }) => {
    const params = {};
    if (subCategory) params.subCategory = subCategory;
    if (country) params.country = country;
    if (city) params.city = city;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sort) params.sort = sort;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await api.get(`/ads/read/category/${categorySlug}`, { params });
    return response.data;
}

export const getSingleAds = async ({ id }) => {
    const response = await api.get(`/ads/read/id/${id}`)
    return response.data;
}

export const getRelativeAds = async ({ categoryId, currentId }) => {
    const response = await api.get(`/ads/related/${categoryId}/${currentId}`)
    return response.data;
}