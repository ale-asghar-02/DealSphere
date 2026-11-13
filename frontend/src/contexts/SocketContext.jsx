import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getAccessToken } from "@/features/auth/services/tokenManager";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const socketRef = useRef(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setOnlineUsers(new Set());
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const newSocket = io(import.meta.env.VITE_SERVER_URL, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("onlineUsersList", (userIds) => {
      setOnlineUsers(new Set((userIds || []).map((id) => id.toString())));
    });

    newSocket.on("userOnline", (userId) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.add(userId.toString());
        return updated;
      });
    });

    newSocket.on("userOffline", (userId) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId.toString());
        return updated;
      });
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      newSocket.disconnect();
      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);