import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { getActiveAnnouncements } from "../services/userAPI";
import { getToastError } from "@/utils/validationErrors";

const DISMISSED_KEY = "dismissedAnnouncements";

const getDismissedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || [];
  } catch {
    return [];
  }
};

const useAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementLoading(true);
    try {
      const data = await getActiveAnnouncements();
      const dismissedIds = getDismissedIds();
      const visible = data.announcements.filter((a) => !dismissedIds.includes(a._id));
      setAnnouncements(visible);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setAnnouncementLoading(false);
    }
  }, []);

  const dismissAnnouncement = (id) => {
    const dismissedIds = getDismissedIds();
    if (!dismissedIds.includes(id)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissedIds, id]));
    }
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return {
    announcements,
    announcementLoading,
    dismissAnnouncement,
  };
};

export default useAnnouncement;