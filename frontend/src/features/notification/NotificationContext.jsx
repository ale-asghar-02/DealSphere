import { createContext, useContext, useEffect, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { AuthContext } from "../auth/AuthContext";
import useNotification from "./hooks/useNotification";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useContext(AuthContext);
  const notificationState = useNotification();

  // hamesha latest functions rakhta hai, bina effect dobara chalaye
  const stateRef = useRef(notificationState);
  stateRef.current = notificationState;

  useEffect(() => {
    if (!socket || !user) return;

    const s = () => stateRef.current;

    s().handleUnreadCount();

    const handleNewNotification = (notification) => {
      s().addNotification(notification);
    };
    const handleRead = ({ id }) => s().syncRemoteRead(id);
    const handleReadAll = () => s().syncRemoteReadAll();
    const handleDeleted = ({ id }) => s().syncRemoteDelete(id);
    const handleBulkDeleted = ({ ids }) => s().syncRemoteBulkDelete(ids);
    const handleDeletedAll = () => s().syncRemoteDeleteAll();

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationRead", handleRead);
    socket.on("allNotificationsRead", handleReadAll);
    socket.on("notificationDeleted", handleDeleted);
    socket.on("notificationsBulkDeleted", handleBulkDeleted);
    socket.on("allNotificationsDeleted", handleDeletedAll);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationRead", handleRead);
      socket.off("allNotificationsRead", handleReadAll);
      socket.off("notificationDeleted", handleDeleted);
      socket.off("notificationsBulkDeleted", handleBulkDeleted);
      socket.off("allNotificationsDeleted", handleDeletedAll);
    };
  }, [socket, user]);

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);