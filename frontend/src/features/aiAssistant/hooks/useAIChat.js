import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";

import { getAIAssistantSettings, updateAIAssistant, resumeAIForChat, toggleAIForChat, testAIAssistant, getAIStats, editAIMessage, deleteAIMessage } from "../services/aiChatAPI";

export const useAIChat = () => {
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiAssistant, setAiAssistant] = useState({
    enabled: false,
    instructions: "",
    dailyLimit: 100,
    dailyCount: 0,
    cooldownSeconds: 5,
  });
  const [aiStats, setAiStats] = useState(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestReply, setAiTestReply] = useState(null);

  // ── Fetch current global settings ───────────────────
  const handleGetAISettings = useCallback(async () => {
    setAiChatLoading(true);
    try {
      const data = await getAIAssistantSettings();
      setAiAssistant(data.data || { enabled: false, instructions: "" });
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to load AI assistant settings"));
      return false;
    } finally {
      setAiChatLoading(false);
    }
  }, []);

  // ── Update global settings (toggle / instructions / limits) ─
  const handleUpdateAISettings = useCallback(async ({ enabled, instructions, dailyLimit, cooldownSeconds }) => {
    setAiChatLoading(true);
    try {
      const data = await updateAIAssistant({ enabled, instructions, dailyLimit, cooldownSeconds });
      setAiAssistant(data.data);
      toast.success("AI assistant settings updated");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to update AI assistant"));
      return false;
    } finally {
      setAiChatLoading(false);
    }
  }, []);

  // ── Resume AI for a specific paused chat ────────────
  // Yahan sirf API call + result return karta hai.
  // Chat-list/active-chat ka local state update ChatContext karega.
  const handleResumeAI = useCallback(async ({ chatId }) => {
    try {
      const data = await resumeAIForChat({ chatId });
      return data; // { success, message }
    } catch (error) {
      toast.error(getToastError(error, "Failed to resume AI assistant"));
      return null;
    }
  }, []);

  // ── Enable/disable AI for ONE specific chat only ─────
  const handleToggleAIForChat = useCallback(async ({ chatId, disabled }) => {
    try {
      const data = await toggleAIForChat({ chatId, disabled });
      return data; // { success, message }
    } catch (error) {
      toast.error(getToastError(error, "Failed to update AI for this chat"));
      return null;
    }
  }, []);

  // ── Preview: test the AI reply without touching a real chat ─
  const handleTestAI = useCallback(async ({ itemId, itemType, testMessage }) => {
    setAiTestLoading(true);
    try {
      const data = await testAIAssistant({ itemId, itemType, testMessage });
      const reply = data.data?.reply || "";
      setAiTestReply(reply);
      return reply;
    } catch (error) {
      toast.error(getToastError(error, "AI test failed"));
      return null;
    } finally {
      setAiTestLoading(false);
    }
  }, []);

  // ── Usage stats ──────────────────────────────────────
  const handleGetAIStats = useCallback(async () => {
    setAiChatLoading(true);
    try {
      const data = await getAIStats();
      setAiStats(data.data);
      return data.data;
    } catch (error) {
      toast.error(getToastError(error, "Failed to load AI stats"));
      return null;
    } finally {
      setAiChatLoading(false);
    }
  }, []);

  // ── Edit / delete a specific AI-generated message ────
  // Local `messages` state update ChatContext karega (jaisa baaki edit/delete
  // messages ke liye already ho raha hai).
  const handleEditAIMessage = useCallback(async ({ messageId, text }) => {
    try {
      const data = await editAIMessage({ messageId, text });
      return data; // { success, message, data: updatedMessage }
    } catch (error) {
      toast.error(getToastError(error, "Failed to edit AI message"));
      return null;
    }
  }, []);

  const handleDeleteAIMessage = useCallback(async ({ messageId }) => {
    try {
      const data = await deleteAIMessage({ messageId });
      return data; // { success, message }
    } catch (error) {
      toast.error(getToastError(error, "Failed to delete AI message"));
      return null;
    }
  }, []);

  return {
    aiChatLoading,
    aiAssistant,
    aiStats,
    aiTestLoading,
    aiTestReply,
    handleGetAISettings,
    handleUpdateAISettings,
    handleResumeAI,
    handleToggleAIForChat,
    handleTestAI,
    handleGetAIStats,
    handleEditAIMessage,
    handleDeleteAIMessage,
  };
};