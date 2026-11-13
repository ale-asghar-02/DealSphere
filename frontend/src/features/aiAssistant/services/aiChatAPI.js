import { api } from '../../auth/services/authAPI'

// ── AI Assistant Settings (global, seller-level) ──────
export const getAIAssistantSettings = async () => {
    const response = await api.get('/ai/ai-assistant/settings');
    return response.data
}

export const updateAIAssistant = async ({ enabled, instructions, dailyLimit, cooldownSeconds }) => {
    const payload = {};
    if (enabled !== undefined) payload.enabled = enabled;
    if (instructions !== undefined) payload.instructions = instructions;
    if (dailyLimit !== undefined) payload.dailyLimit = dailyLimit;
    if (cooldownSeconds !== undefined) payload.cooldownSeconds = cooldownSeconds;

    const response = await api.post('/ai/ai-assistant/settings', payload);
    return response.data
}

// ── Per-chat controls ──────────────────────────────────
export const resumeAIForChat = async ({ chatId }) => {
    const response = await api.post(`/ai/${chatId}/ai-resume`);
    return response.data
}

export const toggleAIForChat = async ({ chatId, disabled }) => {
    const response = await api.post(`/ai/${chatId}/ai-toggle`, { disabled });
    return response.data
}

// ── Test / preview (no chat/message is created) ───────
export const testAIAssistant = async ({ itemId, itemType, testMessage }) => {
    const response = await api.post('/ai/ai-assistant/test', { itemId, itemType, testMessage });
    return response.data
}

// ── Usage stats ────────────────────────────────────────
export const getAIStats = async () => {
    const response = await api.get('/ai/ai-assistant/stats');
    return response.data
}

// ── Edit / delete a specific AI-generated message ─────
export const editAIMessage = async ({ messageId, text }) => {
    const response = await api.post(`/ai/messages/${messageId}/ai-edit`, { text });
    return response.data
}

export const deleteAIMessage = async ({ messageId }) => {
    const response = await api.post(`/ai/messages/${messageId}/ai-delete`);
    return response.data
}