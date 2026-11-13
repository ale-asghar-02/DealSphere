import { api } from '../../auth/services/authAPI'

/* ───────────── Public ───────────── */
export const getDesignConfig = async () => {
  const response = await api.get('/design/config');
  return response.data;
};

export const getDesignPlans = async () => {
  const response = await api.get('/design/plans');
  return response.data;
};

/* ───────────── Subscription / usage ───────────── */
export const getMyDesignSubscription = async () => {
  const response = await api.get('/design/subscription');
  return response.data;
};

// Stripe checkout ka URL deta hai: { success, checkoutUrl }
export const purchaseDesignPlan = async (planName) => {
  const response = await api.post('/design/subscription/purchase', { planName });
  return response.data;
};

export const getDesignUsage = async () => {
  const response = await api.get('/design/usage');
  return response.data;
};

/* ───────────── Sessions ───────────── */
export const getDesignSessions = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get('/design/sessions', { params: { page, limit } });
  return response.data;
};

export const getDesignSession = async (id) => {
  const response = await api.get(`/design/sessions/${id}`);
  return response.data;
};

// image optional hai; field ka naam backend mein "image" hai
export const createDesignSession = async ({ prompt, image }) => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  if (image) formData.append('image', image);

  const response = await api.post('/design/sessions', formData);
  return response.data;
};

export const deleteDesignSession = async (id) => {
  const response = await api.post(`/design/sessions/delete/${id}`);
  return response.data;
};

// body: { step: "purpose", purpose } | { step: "color", colors } | { step: "content", title, ... }
export const submitDesignAnswer = async (id, body) => {
  const response = await api.post(`/design/sessions/${id}/answers`, body);
  return response.data;
};

export const generateDesign = async (id) => {
  const response = await api.post(`/design/sessions/${id}/generate`);
  return response.data;
};

export const editDesign = async (id, { instruction, versionId }) => {
  const response = await api.post(`/design/sessions/${id}/edit`, { instruction, versionId });
  return response.data;
};

export const getDesignDownloadUrl = async (id, versionId) => {
  const response = await api.get(`/design/sessions/${id}/versions/${versionId}/download`);
  return response.data;
};