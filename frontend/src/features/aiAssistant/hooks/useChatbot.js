import { useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";
import { startChatSession, sendChatMessage } from "../services/chatbotAPI";

const useChatbot = () => {
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleStartSession = async (existingSessionId = null) => {
    setChatbotLoading(true);
    try {
      const data = await startChatSession(existingSessionId);
      setSessionId(data.sessionId);
      setMessages(data.messages);
      return data;
    } catch (error) {
      const newSessionId = error?.response?.data?.sessionId;
      if (newSessionId && newSessionId !== sessionId) setSessionId(newSessionId);
      toast.error(getToastError(error, "Something went wrong! Cannot send message"));
      return null;
    } finally {
      setChatbotLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText || !messageText.trim()) return null;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: messageText, timestamp: new Date() },
    ]);
    setChatbotLoading(true);

    try {
      const data = await sendChatMessage(sessionId, messageText);
      if (data.sessionId !== sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.reply, timestamp: data.timestamp || new Date() },
      ]);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Something went wrong! Cannot send message"));
      return null;
    } finally {
      setChatbotLoading(false);
    }
  };

  return {
    sessionId,
    messages,
    chatbotLoading,
    handleStartSession,
    handleSendMessage,
  };
};

export default useChatbot;