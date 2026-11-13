import { useState } from "react"
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { getUsersModerationList, banUser, suspendUser, unbanUser } from "../services/userModerationAPI"

const useUserModeration = () => {
    const [users, setUsers] = useState([]);
    const [moderationLoading, setModerationLoading] = useState(false);

    const handleGetUsers = async () => {
        setModerationLoading(true);
        try {
            const data = await getUsersModerationList();
            setUsers(data.data)
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot fetch users")
            return false
        } finally {
            setModerationLoading(false);
        }
    }

    const handleBanUser = async (userId, reason) => {
        setModerationLoading(true);
        try {
            await banUser(userId, reason);
            toast.success("User banned successfully")
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot ban user")
            return false
        } finally {
            setModerationLoading(false);
        }
    }

    const handleSuspendUser = async (userId, reason, duration) => {
        setModerationLoading(true);
        try {
            await suspendUser(userId, reason, duration);
            toast.success("User suspended successfully")
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot suspend user")
            return false
        } finally {
            setModerationLoading(false);
        }
    }

    const handleUnbanUser = async (userId) => {
        setModerationLoading(true);
        try {
            await unbanUser(userId);
            toast.success("User restored successfully")
            return true
        } catch (error) {
            getToastError(error, "Something went wrong! Cannot restore user")
            return false
        } finally {
            setModerationLoading(false);
        }
    }

    return {
        users,
        moderationLoading,
        handleGetUsers,
        handleBanUser,
        handleSuspendUser,
        handleUnbanUser,
    }
}

export default useUserModeration;