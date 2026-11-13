import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { adminCreateAnnouncement, adminReadAnnouncements, adminUpdateAnnouncement, adminDeleteAnnouncement } from "../services/adminAnnouncementAPI";

const useAnnouncementModeration = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setAnnouncementLoading(true);
    try {
      const data = await adminReadAnnouncements();
      setAnnouncements(data.announcements);
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setAnnouncementLoading(false);
    }
  }, []);

  const handleCreate = async (payload) => {
    setAnnouncementLoading(true);
    try {
      const data = await adminCreateAnnouncement(payload);
      setAnnouncements((prev) => [data.announcement, ...prev]);
      toast.success("Announcement created");
      return true;
    } catch (error) {
      toast.error(getToastError(error));
      return false;
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    setAnnouncementLoading(true);
    try {
      const data = await adminUpdateAnnouncement(id, payload);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? data.announcement : a))
      );
      toast.success("Announcement updated");
      return true;
    } catch (error) {
      toast.error(getToastError(error));
      return false;
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    return handleUpdate(id, { isActive });
  };

  const handleDelete = async (id) => {
    setAnnouncementLoading(true);
    try {
      await adminDeleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success("Announcement deleted");
    } catch (error) {
      toast.error(getToastError(error));
    } finally {
      setAnnouncementLoading(false);
    }
  };

  return {
    announcements,
    announcementLoading,
    fetchAnnouncements,
    handleCreate,
    handleUpdate,
    handleToggleActive,
    handleDelete,
  };
};

export default useAnnouncementModeration;