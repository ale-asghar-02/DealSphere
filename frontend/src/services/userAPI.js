import { api } from '../features/auth/services/authAPI'

export const getMe= async () => {
  const response = await api.get("/user/get-me");
  return response.data;
};

export const getSellerProfile = async (usernameSlug) => {
  const response = await api.get(`/user/profile/${usernameSlug}`);
  return response.data;
};

export const getActiveAnnouncements = async () => {
  const response = await api.get('/user/announcements/active');
  return response.data;
};

export const createReport = async (payload) => {
  const response = await api.post("/user/report", payload);
  return response.data;
};

export const submitContact = async (payload) => {
  const response = await api.post("/user/submit/contact", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const verifyCheckoutSession = async (sessionId) => {
  const response = await api.get("/user/payments/verify-session", {
    params: { session_id: sessionId },
  });
  return response.data;
};