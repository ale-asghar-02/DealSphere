import { api } from '../../auth/services/authAPI'

export const getArticles = async (categorySlug) => {
  const response = await api.get(`/article/help/articles`, {
    params: categorySlug ? { category: categorySlug } : {},
  });
  return response.data;
};

export const searchArticles = async (query) => {
  const response = await api.get(`/article/help/search`, {
    params: { q: query },
  });
  return response.data;
};

export const getArticleBySlug = async (slug) => {
  const response = await api.get(`/article/help/articles/${slug}`);
  return response.data;
};

export const voteArticleHelpful = async (slug, vote) => {
  const response = await api.post(`/article/help/articles/${slug}/helpful`, { vote });
  return response.data;
};