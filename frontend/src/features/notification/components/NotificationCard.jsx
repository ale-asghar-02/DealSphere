import React from "react";
import { IconTrash } from "@tabler/icons-react";

const NotificationCard = ({ notifications, notificationLoading, selectedIds, onSelectOne, onCardClick, onDelete }) => {
  if (notificationLoading) {
    return (
      <tbody>
        <tr>
          <td colSpan="5" className="text-center py-4">Loading notifications...</td>
        </tr>
      </tbody>
    );
  }

  if (!notifications?.length) {
    return (
      <tbody>
        <tr>
          <td colSpan="5" className="text-center py-4">No notifications found.</td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {notifications.map((notification) => (
        <tr
          key={notification._id}
          style={{ cursor: "pointer" }}
          className={!notification.isRead ? "bg-light-primary" : ""}
          onClick={() => onCardClick(notification)}
        >
          <td className="text-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedIds.includes(notification._id)}
              onChange={() => onSelectOne(notification._id)}
            />
          </td>
          <td className="text-start">
            <div className="fw-medium">{notification.title}</div>
            <div className="small text-muted text-truncate" style={{ maxWidth: "480px" }}>
              {notification.message}
            </div>
          </td>
          <td>
            <span className={`badge fw-normal p-2 ${!notification.isRead ? "bg-primary" : "bg-secondary"}`}>
              {!notification.isRead ? "Unread" : "Read"}
            </span>
          </td>
          <td>{notification.createdAt && formatDate(notification.createdAt)}</td>
          <td onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-center">
              <button type="button" title="Delete" className="btn btn-sm btn-outline-danger p-0" onClick={() => onDelete(notification._id)}>
               <IconTrash stroke={1.5} size={20} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default NotificationCard;