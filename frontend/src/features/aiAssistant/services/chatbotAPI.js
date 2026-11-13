import { api } from '../../auth/services/authAPI'

export const startChatSession = async (sessionId) => {
  const response = await api.post(`/ai/chatbot/session`, { sessionId });
  return response.data;
};

export const sendChatMessage = async (sessionId, message) => {
  const response = await api.post(`/ai/chatbot/message`, { sessionId, message });
  return response.data;
};