import { useEffect, useState } from "react";

import { useSocket } from "@/contexts/SocketContext";

// "typing..." indicator for the other side. This already fires for the AI too:
// the backend emits typing / stopTyping with userId = sellerId while it generates a reply.
export const useOtherTyping = (chatId, myId) => {
  const { socket } = useSocket();
  const [otherTyping, setOtherTyping] = useState(false);

  useEffect(() => {
    setOtherTyping(false);
    if (!socket || !chatId) return;

    const onTyping = ({ chatId: id, userId }) => {
      if (id === chatId && userId !== myId) setOtherTyping(true);
    };
    const onStopTyping = ({ chatId: id, userId }) => {
      if (id === chatId && userId !== myId) setOtherTyping(false);
    };

    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    return () => {
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
    };
  }, [socket, chatId, myId]);

  return otherTyping;
};
