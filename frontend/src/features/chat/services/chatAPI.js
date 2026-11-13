import { api } from '../../auth/services/authAPI'

// ── Chat ─────────────────────────────────────────────
export const startChat = async ({ itemId, itemType }) => {
    const response = await api.post('/chat/start', { itemId, itemType });
    return response.data
}

export const startSupportChat = async ({ adminId } = {}) => {
  const response = await api.post('/chat/start/support', { adminId });
  return response.data;
};

export const getMyChats = async () => {
    const response = await api.get('/chat/read');
    return response.data
}

export const getChatMessages = async ({ chatId, page = 1, limit = 30 }) => {
    const response = await api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data
}

// ── Messages ─────────────────────────────────────────
export const sendMessage = async ({ chatId, text, image }) => {
    const formData = new FormData();
    if (text) formData.append('text', text);
    if (image) formData.append('image', image);

    const response = await api.post(`/chat/${chatId}/message/send`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data
}

export const editMessage = async ({ chatId, messageId, text }) => {
    const response = await api.post(`/chat/${chatId}/message/${messageId}/edit`, { text });
    return response.data
}

export const deleteMessage = async ({ chatId, messageId, forEveryone = false }) => {
    const response = await api.post(`/chat/${chatId}/message/${messageId}/delete`, { forEveryone });
    return response.data
}

export const clearChatMessages = async ({ chatId }) => {
    const response = await api.post(`/chat/${chatId}/messages/clear`);
    return response.data
}

export const deleteChat = async ({ chatId }) => {
    const response = await api.post(`/chat/${chatId}/delete`);
    return response.data
}

export const markAsRead = async ({ chatId }) => {
    const response = await api.post(`/chat/${chatId}/mark`);
    return response.data
}

// ── Block ────────────────────────────────────────────
export const getBlockedUsers = async () => {
    const response = await api.get('/chat/block/list');
    return response.data
}

export const blockUser = async ({ userId }) => {
    const response = await api.post(`/chat/block/${userId}`);
    return response.data
}

export const unblockUser = async ({ userId }) => {
    const response = await api.post(`/chat/unblock/${userId}`);
    return response.data
}

// ── Important Seller ─────────────────────────────────────────
export const toggleImportantSeller = async ({ sellerId }) => {
    const response = await api.post(`/chat/important/${sellerId}`);
    return response.data
}