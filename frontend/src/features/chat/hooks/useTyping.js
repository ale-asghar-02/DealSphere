import { useCallback, useRef } from "react";
import { useSocket } from "../../../contexts/SocketContext";

export const useTyping = (chatId) => {
  const { socket } = useSocket();
  const timeoutRef = useRef(null);

  const emitTyping = useCallback(() => {
    if (!socket || !chatId) return;
    socket.emit("typing", { chatId });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { chatId });
    }, 1500);
  }, [socket, chatId]);

  return { emitTyping };
};