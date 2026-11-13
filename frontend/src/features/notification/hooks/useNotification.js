import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "../../../utils/validationErrors";
import { getAllNotification, notificationUnreadCount, markNotificationAsRead, markAllNotificationAsRead, deleteNotification, deleteSelectedNotifications, deleteAllNotification } from "../services/notificationAPI"

const useNotification = () => {
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [notificationLoading, setNotificationLoading] = useState(false)

    const handleGetAllNotification = async () => {
        setNotificationLoading(true)
        try {
            const data = await getAllNotification();
            setNotifications(data.notifications)
            return true
        } catch (error) {
            toast.error(getToastError(error, "Failed to fetch all notification"));
            return false
        } finally {
            setNotificationLoading(false)
        }
    }

    const handleUnreadCount = async () => {
        try {
            const data = await notificationUnreadCount();
            setUnreadCount(data.unreadCount)
            return true
        } catch (error) {
            return false
        }
    }

    const handleMarkAsRead = async (id) => {
        try {
            await markNotificationAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            )
            setUnreadCount((prev) => Math.max(prev - 1, 0))
            return true
        } catch (error) {
            toast.error(getToastError(error, "Failed to mark notification as read"));
            return false
        }
    }

    const handleMarkAllAsRead = async () => {
        setNotificationLoading(true)
        try {
            await markAllNotificationAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            setUnreadCount(0)
            return true
        } catch (error) {
            toast.error(getToastError(error, "Failed to mark all notifications as read"));
            return false
        } finally {
            setNotificationLoading(false)
        }
    }

    const handleDeleteNotification = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n._id !== id))
            return true
        } catch (error) {
            toast.error(getToastError(error, "Failed to delete notification"));
            return false
        }
    }

    const handleDeleteSelected = async (ids) => {
        setNotificationLoading(true)
        try {
            await deleteSelectedNotifications(ids);
            setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)))
            return true
        } catch (error) {
            toast.error(getToastError(error, "Failed to delete selected notifications"));
            return false
        } finally {
            setNotificationLoading(false)
        }
    }

    const handleDeleteAllNotification = async () => {
        setNotificationLoading(true)
        try {
            await deleteAllNotification();
            setNotifications([])
            setUnreadCount(0)
            return true
        } catch (error) {
            toast.error(getToastError(error, "Failed to delete all notifications"));
            return false
        } finally {
            setNotificationLoading(false)
        }
    }

    const addNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
    }

    const syncRemoteRead = (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(prev - 1, 0))
    }

    const syncRemoteReadAll = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
    }

    const syncRemoteDelete = (id) => {
        setNotifications((prev) => prev.filter((n) => n._id !== id))
    }

    const syncRemoteBulkDelete = (ids) => {
        setNotifications((prev) => prev.filter((n) => !ids.includes(n._id)))
    }

    const syncRemoteDeleteAll = () => {
        setNotifications([])
        setUnreadCount(0)
    }

    return {
        notifications,
        unreadCount,
        notificationLoading,
        handleGetAllNotification,
        handleUnreadCount,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handleDeleteSelected,
        handleDeleteAllNotification,
        addNotification,
        syncRemoteRead,
        syncRemoteReadAll,
        syncRemoteDelete,
        syncRemoteBulkDelete,
        syncRemoteDeleteAll,
    }
}

export default useNotification;