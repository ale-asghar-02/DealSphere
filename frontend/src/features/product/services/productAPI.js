import { api } from '../../auth/services/authAPI'

export const getAllProduct = async (filters = {}) => {
  const params = {};
  if (filters.country) params.country = filters.country;
  if (filters.city) params.city = filters.city;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sort) params.sort = filters.sort;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await api.get('/product/read', { params });
  return response.data;
};

export const getProductsByCategory = async ({ categorySlug, subCategory, country, city, minPrice, maxPrice, sort, page, limit }) => {
    const params = {};
    if (subCategory) params.subCategory = subCategory;
    if (country) params.country = country;
    if (city) params.city = city;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sort) params.sort = sort;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await api.get(`/product/read/category/${categorySlug}`, { params });
    return response.data;
}

export const getSingleProduct = async (id) => {
  const response = await api.get(`/product/read/id/${id}`);
  return response.data;
};

export const getRelatedProducts = async ({ categoryId, currentId }) => {
  const response = await api.get(`/product/related/${categoryId}/${currentId}`);
  return response.data;
};