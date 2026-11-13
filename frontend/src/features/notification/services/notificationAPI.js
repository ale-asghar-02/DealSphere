import { api } from '../../auth/services/authAPI'

export const getAllNotification = async () => {
    const response = await api.get('/notification/get/all');
    return response.data
}

export const notificationUnreadCount = async () => {
    const response = await api.get('/notification/unread-count');
    return response.data
}

export const markNotificationAsRead = async (id) => {
    const response = await api.post(`/notification/read/${id}`);
    return response.data
}

export const markAllNotificationAsRead = async () => {
    const response = await api.post('/notification/read/all');
    return response.data
}

export const deleteNotification = async (id) => {
    const response = await api.post(`/notification/delete/${id}`);
    return response.data
}

export const deleteSelectedNotifications = async (ids) => {
    const response = await api.post('/notification/delete/selected', { ids });
    return response.data
}

export const deleteAllNotification = async () => {
    const response = await api.post('/notification/delete/all');
    return response.data
}