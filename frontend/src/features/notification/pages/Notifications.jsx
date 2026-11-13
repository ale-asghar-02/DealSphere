import React, { useEffect, useState } from "react";
import { useNotificationContext } from "../NotificationContext";
import Modal from "@/components/Model";
import NotificationCard from "../components/NotificationCard";
import "../../dashboard/dashboard.scss";

const Notifications = () => {
  const {
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
  } = useNotificationContext();

  const [selectedIds, setSelectedIds] = useState([]);
  const [detailModal, setDetailModal] = useState({ show: false, data: null });
  const [confirmModal, setConfirmModal] = useState({ show: false, type: null }); // "deleteAll" | "deleteSelected" | "markAllRead"
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    handleGetAllNotification();
    handleUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allSelected = notifications?.length > 0 && selectedIds.length === notifications.length;

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? notifications.map((n) => n._id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCardClick = (notification) => {
    setDetailModal({ show: true, data: notification });
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
  };

  const openConfirm = (type) => setConfirmModal({ show: true, type });
  const closeConfirm = () => setConfirmModal({ show: false, type: null });

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      if (confirmModal.type === "deleteAll") {
        await handleDeleteAllNotification();
      } else if (confirmModal.type === "deleteSelected") {
        // ✅ pehle: handleDeleteNotification(selectedIds) — galat, single-id API ko array bhej raha tha
        await handleDeleteSelected(selectedIds);
        setSelectedIds([]);
      } else if (confirmModal.type === "markAllRead") {
        await handleMarkAllAsRead();
      }
      closeConfirm();
    } finally {
      setActionLoading(false);
    }
  };

  const confirmText = {
    deleteAll: {
      title: "Delete All Notifications",
      body: "Are you sure you want to delete all notifications? This action cannot be undone.",
      confirmLabel: "Delete All",
      confirmClass: "btn-danger",
    },
    deleteSelected: {
      title: "Delete Selected Notifications",
      body: `Are you sure you want to delete ${selectedIds.length} selected notification(s)?`,
      confirmLabel: "Delete",
      confirmClass: "btn-danger",
    },
    markAllRead: {
      title: "Mark All as Read",
      body: "Mark all notifications as read?",
      confirmLabel: "Mark All Read",
      confirmClass: "btn-primary",
    },
  }[confirmModal.type] || {};

  return (
    <div>
      <div className="mb-3">
        <h1 className="fs-5 me-3">Notifications</h1>
        <div className="d-flex flex-wrap align-items-center justify-content-between">
          <div className="col-12 col-lg-9 col-xl-7 mb-2 mb-lg-0">
            <p className="small mb-0">
              You have <span className="fw-medium">{unreadCount}</span> unread notification{unreadCount === 1 ? "" : "s"}.
            </p>
          </div>
          <div className="col-12 col-lg-3 col-xl-5 d-flex justify-content-lg-end gap-2 flex-wrap">
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => openConfirm("deleteSelected")}
              >
                Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => openConfirm("markAllRead")}
              disabled={!notifications?.length}
            >
              Mark All as Read
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => openConfirm("deleteAll")}
              disabled={!notifications?.length}
            >
              Delete All
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive border rounded-2">
        <table className="table table-hover rounded-2 align-middle mb-0">
          <thead>
            <tr>
              <th className="border-0 fw-medium py-3 rounded-start text-center" style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="text-start" style={{ width: "500px" }}>Activity</th>
              <th>Status</th>
              <th>Date</th>
              <th className="rounded-end">Action</th>
            </tr>
          </thead>

          <NotificationCard
            notifications={notifications}
            notificationLoading={notificationLoading}
            selectedIds={selectedIds}
            onSelectOne={handleSelectOne}
            onCardClick={handleCardClick}
            onDelete={(id) => handleDeleteNotification(id)}
          />
        </table>
      </div>

      {/* Confirm modal: delete all / delete selected / mark all read */}
      <Modal
        show={confirmModal.show}
        onClose={closeConfirm}
        title={confirmText.title}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeConfirm} disabled={actionLoading}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn ${confirmText.confirmClass}`}
              onClick={handleConfirmAction}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : confirmText.confirmLabel}
            </button>
          </>
        }
      >
        <p className="mb-0">{confirmText.body}</p>
      </Modal>

      {/* Detail modal */}
      <Modal
        show={detailModal.show}
        onClose={() => setDetailModal({ show: false, data: null })}
        title="Notification Detail"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setDetailModal({ show: false, data: null })}
          >
            Close
          </button>
        }
      >
        {detailModal.data && (
          <div>
            {detailModal.data.metadata?.image && (
              <div className="col-12 border rounded-3 overflow-hidden mb-3" style={{ height: '250px' }}>
                <img
                  src={detailModal.data.metadata.image}
                  alt=""
                  className="col-12 h-100 object-fit-cover"
                />
              </div>
            )}
            <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <h6 className="mb-0">{detailModal.data.title}</h6>
              {detailModal.data.metadata?.code && (
                <span className="badge bg-light text-dark fw-medium border">
                  {detailModal.data.metadata.code}
                </span>
              )}
            </div>
            <p className="mb-2">{detailModal.data.message}</p>
            <small className="text-muted">
              {detailModal.data.createdAt && new Date(detailModal.data.createdAt).toLocaleString()}
            </small>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Notifications;