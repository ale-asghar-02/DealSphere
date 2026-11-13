import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getToastError } from "@/utils/validationErrors";

import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { useAIChat } from "../../aiAssistant/hooks/useAIChat";

import {
  startChat, startSupportChat, getMyChats, getChatMessages, sendMessage, editMessage, deleteMessage,
  clearChatMessages, deleteChat, markAsRead, getBlockedUsers, blockUser, unblockUser, toggleImportantSeller,
} from "../services/chatAPI";
import { getId } from "../utils/chatHelpers";

const sameId = (a, b) => !!a && !!b && getId(a) === getId(b);

const sortByLastMessage = (list) =>
  [...list].sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0));

const DELETED_PATCH = { isDeleted: true, text: "", image: null };

// All chat state, handlers and socket listeners live in this hook.
// It must run ONCE: <ChatProvider> (ChatContext.jsx) calls it and shares the result.
// Components should read the data with useChatData(), not call useChat() themselves.
export const useChat = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const myId = getId(user);

  const {
    handleResumeAI: resumeAI,
    handleToggleAIForChat: toggleAIForChat,
    handleEditAIMessage: editAIMessageAPI,
    handleDeleteAIMessage: deleteAIMessageAPI,
  } = useAIChat();

  // ── State ─────────────────────────────────────────────────────

  const [chatLoading, setChatLoading] = useState(false);
  const [chat, setChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesPage, setMessagesPage] = useState(1);
  // AI replies that need the seller's attention (couldn't confirm price,
  // buyer message blocked by moderation, quota ran out, ...).
  const [aiEscalations, setAiEscalations] = useState([]);

  // Refs so socket listeners always read the latest values without re-subscribing
  // (re-subscribing on every change can drop events in the gap).
  const activeChatIdRef = useRef(null);
  const chatsRef = useRef([]);
  const messagesRequestRef = useRef(0);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

  // ── Small state helpers ───────────────────────────────────────

  const upsertChat = useCallback((incoming) => {
    if (!incoming?._id) return;
    setChats((prev) => {
      const exists = prev.some((c) => sameId(c._id, incoming._id));
      if (exists) return prev.map((c) => (sameId(c._id, incoming._id) ? { ...c, ...incoming } : c));
      return [incoming, ...prev];
    });
  }, []);

  const bumpChatInList = useCallback((chatId, lastMessage) => {
    if (!lastMessage) return;
    setChats((prev) =>
      sortByLastMessage(prev.map((c) => (sameId(c._id, chatId) ? { ...c, lastMessage, lastMessageAt: lastMessage.createdAt } : c)))
    );
  }, []);

  // keep the left-list preview in sync when the LAST message is edited / deleted
  const patchLastMessage = useCallback((chatId, messageId, patch) => {
    setChats((prev) =>
      prev.map((c) => {
        if (!sameId(c._id, chatId) || !sameId(c.lastMessage?._id, messageId)) return c;
        return { ...c, lastMessage: typeof patch === "function" ? patch(c.lastMessage) : { ...c.lastMessage, ...patch } };
      })
    );
  }, []);

  const addMessageIfNotExists = useCallback((message) => {
    if (!message?._id) return;
    setMessages((prev) => (prev.some((m) => sameId(m._id, message._id)) ? prev : [...prev, message]));
  }, []);

  const replaceMessage = useCallback((message) => {
    if (!message?._id) return;
    setMessages((prev) => prev.map((m) => (sameId(m._id, message._id) ? message : m)));
  }, []);

  const markMessageDeleted = useCallback((messageId) => {
    setMessages((prev) => prev.map((m) => (sameId(m._id, messageId) ? { ...m, ...DELETED_PATCH } : m)));
  }, []);

  const resetUnread = useCallback((chatId) => {
    if (!myId) return;
    setChats((prev) =>
      prev.map((c) => {
        if (!sameId(c._id, chatId)) return c;
        if (!(Number(c.unreadCount?.[myId]) > 0)) return c;
        return { ...c, unreadCount: { ...(c.unreadCount || {}), [myId]: 0 } };
      })
    );
  }, [myId]);

  // ── Chats ─────────────────────────────────────────────────────

  const handleStartChat = useCallback(async ({ itemId, itemType }) => {
    setChatLoading(true);
    try {
      const data = await startChat({ itemId, itemType });
      setChat(data.chat);
      upsertChat(data.chat);
      return data.chat;
    } catch (error) {
      toast.error(getToastError(error, "Failed to start chat"));
    } finally {
      setChatLoading(false);
    }
  }, [upsertChat]);

  const handleStartSupportChat = useCallback(async () => {
    setChatLoading(true);
    try {
      const data = await startSupportChat();
      setChat(data.chat);
      upsertChat(data.chat);
      return data.chat;
    } catch (error) {
      toast.error(getToastError(error, "Failed to start support chat"));
    } finally {
      setChatLoading(false);
    }
  }, [upsertChat]);

  // silent = background refresh (no spinner, no error toast)
  const handleGetMyChats = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setChatLoading(true);
    try {
      const data = await getMyChats();
      setChats(data.chats || []);
      return true;
    } catch (error) {
      if (!silent) toast.error(getToastError(error, "Failed to load chats"));
      return false;
    } finally {
      if (!silent) setChatLoading(false);
    }
  }, []);

  const handleDeleteChat = useCallback(async ({ chatId }) => {
    try {
      await deleteChat({ chatId });
      setChats((prev) => prev.filter((c) => !sameId(c._id, chatId)));
      if (sameId(activeChatIdRef.current, chatId)) {
        setMessages([]);
        setActiveChatId(null);
        setChat(null);
      }
      toast.success("Chat deleted successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to delete chat"));
      return false;
    }
  }, []);

  const handleClearChatMessages = useCallback(async ({ chatId }) => {
    try {
      await clearChatMessages({ chatId });
      if (sameId(activeChatIdRef.current, chatId)) setMessages([]);
      setChats((prev) => prev.map((c) => (sameId(c._id, chatId) ? { ...c, lastMessage: null } : c)));
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to clear chat"));
      return false;
    }
  }, []);

  const handleMarkAsRead = useCallback(async ({ chatId }) => {
    if (!chatId || !myId) return false;
    resetUnread(chatId); // update UI instantly (navbar dot + left badge), server call after
    try {
      await markAsRead({ chatId });
      return true;
    } catch (error) {
      console.error("markAsRead failed", error);
      return false;
    }
  }, [myId, resetUnread]);

  // ── Messages ──────────────────────────────────────────────────

  const handleGetChatMessages = useCallback(async ({ chatId, page = 1, limit = 30 }) => {
    const requestId = ++messagesRequestRef.current;
    setChatLoading(true);

    if (page === 1) {
      // switching chat: show the new chat immediately (old messages must not flash)
      if (!sameId(activeChatIdRef.current, chatId)) setMessages([]);
      activeChatIdRef.current = chatId;
      setActiveChatId(chatId);
    }

    try {
      const data = await getChatMessages({ chatId, page, limit });
      // user already switched to another chat -> drop this stale response
      if (requestId !== messagesRequestRef.current) return false;

      const fetched = data.messages || [];
      setMessages((prev) => {
        if (page === 1) {
          // keep any realtime message newer than the fetched page (arrived while the request was in flight)
          const fetchedIds = new Set(fetched.map((m) => getId(m._id)));
          const lastFetchedAt = fetched.length ? new Date(fetched[fetched.length - 1].createdAt) : new Date(0);
          const arrivedMeanwhile = prev.filter((m) => !fetchedIds.has(getId(m._id)) && new Date(m.createdAt) > lastFetchedAt);
          return [...fetched, ...arrivedMeanwhile];
        }
        const existingIds = new Set(prev.map((m) => getId(m._id)));
        return [...fetched.filter((m) => !existingIds.has(getId(m._id))), ...prev];
      });
      setHasMoreMessages(fetched.length === limit);
      setMessagesPage(page);
      return true;
    } catch (error) {
      if (requestId === messagesRequestRef.current) toast.error(getToastError(error, "Failed to load messages"));
      return false;
    } finally {
      if (requestId === messagesRequestRef.current) setChatLoading(false);
    }
  }, []);

  const handleLoadMoreMessages = useCallback(async () => {
    if (!activeChatId || !hasMoreMessages || chatLoading) return;
    await handleGetChatMessages({ chatId: activeChatId, page: messagesPage + 1 });
  }, [activeChatId, hasMoreMessages, chatLoading, messagesPage, handleGetChatMessages]);

  const handleSendMessage = useCallback(async ({ chatId, text, image }) => {
    try {
      const data = await sendMessage({ chatId, text, image });
      const message = data.message || data.data;
      // sender sees his own message instantly (socket echo is de-duplicated by _id)
      if (sameId(activeChatIdRef.current, chatId)) addMessageIfNotExists(message);
      bumpChatInList(chatId, message);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Failed to send message"));
    }
  }, [addMessageIfNotExists, bumpChatInList]);

  const handleEditMessage = useCallback(async ({ chatId, messageId, text }) => {
    try {
      const data = await editMessage({ chatId, messageId, text });
      const message = data.message || data.data;
      replaceMessage(message);
      patchLastMessage(chatId, messageId, () => message);
      return data;
    } catch (error) {
      toast.error(getToastError(error, "Failed to edit message"));
    }
  }, [replaceMessage, patchLastMessage]);

  const handleDeleteMessage = useCallback(async ({ chatId, messageId, forEveryone = false }) => {
    try {
      await deleteMessage({ chatId, messageId, forEveryone });
      if (forEveryone) {
        markMessageDeleted(messageId);
        patchLastMessage(chatId, messageId, DELETED_PATCH);
      } else {
        setMessages((prev) => prev.filter((m) => !sameId(m._id, messageId)));
      }
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to delete message"));
      return false;
    }
  }, [markMessageDeleted, patchLastMessage]);

  // ── Block ─────────────────────────────────────────────────────

  const handleGetBlockedUsers = useCallback(async () => {
    try {
      const data = await getBlockedUsers();
      setBlockedUsers(data.blockedUsers || []);
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to load blocked users"));
      return false;
    }
  }, []);

  const handleBlockUser = useCallback(async ({ userId }) => {
    try {
      await blockUser({ userId });
      toast.success("User blocked successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to block user"));
      return false;
    }
  }, []);

  const handleUnblockUser = useCallback(async ({ userId }) => {
    try {
      await unblockUser({ userId });
      setBlockedUsers((prev) => prev.filter((u) => !sameId(u, userId)));
      toast.success("User unblocked successfully");
      return true;
    } catch (error) {
      toast.error(getToastError(error, "Failed to unblock user"));
      return false;
    }
  }, []);

  // ── Important seller ──────────────────────────────────────────

  const handleToggleImportantSeller = useCallback(async ({ sellerId }) => {
    if (!myId || !sellerId) return false;
    try {
      const data = await toggleImportantSeller({ sellerId });
      const important = !!data.important;

      setChats((prev) =>
        prev.map((c) => {
          const other = c.participants?.find((p) => getId(p) !== myId);
          if (getId(other) !== getId(sellerId)) return c;

          const current = c.importantBy || [];
          const already = current.some((id) => getId(id) === myId);
          let importantBy = current;
          if (important && !already) importantBy = [...current, myId];
          if (!important && already) importantBy = current.filter((id) => getId(id) !== myId);
          return { ...c, importantBy };
        })
      );

      toast.success(important ? "Marked as important" : "Removed from important");
      return important;
    } catch (error) {
      toast.error(getToastError(error, "Failed to update important status"));
      return false;
    }
  }, [myId]);

  // ── AI assistant ──────────────────────────────────────────────

  // Resume AI (undo manual takeover) for a specific chat
  const handleResumeAIForChat = useCallback(async ({ chatId }) => {
    const data = await resumeAI({ chatId });
    if (!data?.success) return false;
    setChats((prev) => prev.map((c) => (sameId(c._id, chatId) ? { ...c, aiPaused: false } : c)));
    setChat((prev) => (prev && sameId(prev._id, chatId) ? { ...prev, aiPaused: false } : prev));
    return true;
  }, [resumeAI]);

  // Explicitly enable / disable AI for one chat
  const handleToggleAIForChat = useCallback(async ({ chatId, disabled }) => {
    const data = await toggleAIForChat({ chatId, disabled });
    if (!data?.success) return false;
    setChats((prev) => prev.map((c) => (sameId(c._id, chatId) ? { ...c, aiDisabledByUser: disabled } : c)));
    setChat((prev) => (prev && sameId(prev._id, chatId) ? { ...prev, aiDisabledByUser: disabled } : prev));
    toast.success(disabled ? "AI disabled for this chat" : "AI enabled for this chat");
    return true;
  }, [toggleAIForChat]);

  const handleEditAIMessage = useCallback(async ({ messageId, text }) => {
    const data = await editAIMessageAPI({ messageId, text });
    if (!data?.success) return false;
    replaceMessage(data.data);
    toast.success("AI message updated");
    return true;
  }, [editAIMessageAPI, replaceMessage]);

  // soft delete an AI-generated message
  const handleDeleteAIMessage = useCallback(async ({ messageId }) => {
    const data = await deleteAIMessageAPI({ messageId });
    if (!data?.success) return false;
    markMessageDeleted(messageId);
    return true;
  }, [deleteAIMessageAPI, markMessageDeleted]);

  // dismiss an escalation alert (local only)
  const dismissAIEscalation = useCallback((index) => {
    setAiEscalations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Realtime (socket) ─────────────────────────────────────────

  useEffect(() => {
    if (!socket || !myId) return;

    const handleNewMessage = ({ chatId, message }) => {
      if (!message?._id) return;

      const isActiveChat = sameId(chatId, activeChatIdRef.current);
      const isOwnMessage = getId(message.sender) === myId;

      if (isActiveChat) addMessageIfNotExists(message);

      const known = chatsRef.current.some((c) => sameId(c._id, chatId));
      if (!known) {
        // brand new conversation (or one I had deleted) -> pull the fresh list
        handleGetMyChats({ silent: true });
        return;
      }

      setChats((prev) =>
        sortByLastMessage(
          prev.map((c) => {
            if (!sameId(c._id, chatId)) return c;
            const unread = Number(c.unreadCount?.[myId]) || 0;
            return {
              ...c,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount: { ...(c.unreadCount || {}), [myId]: isActiveChat || isOwnMessage ? unread : unread + 1 },
            };
          })
        )
      );

      if (isActiveChat && !isOwnMessage) markAsRead({ chatId }).catch(() => {});
    };

    const handleMessageEdited = ({ chatId, message }) => {
      if (!message?._id) return;
      if (sameId(chatId, activeChatIdRef.current)) replaceMessage(message);
      patchLastMessage(chatId, message._id, () => message);
    };

    const handleMessageDeleted = ({ chatId, messageId }) => {
      if (sameId(chatId, activeChatIdRef.current)) markMessageDeleted(messageId);
      patchLastMessage(chatId, messageId, DELETED_PATCH);
    };

    // The other person read my messages -> blue ticks on MY messages only.
    // If the reader is me (another tab / device) just clear the unread badge.
    const handleMessagesRead = (payload = {}) => {
      const { chatId } = payload;
      const readerId = getId(payload.userId || payload.readBy || payload.readerId);
      if (readerId && readerId === myId) {
        resetUnread(chatId);
        return;
      }
      if (!sameId(chatId, activeChatIdRef.current)) return;
      setMessages((prev) => prev.map((m) => (getId(m.sender) === myId && m.status !== "read" ? { ...m, status: "read" } : m)));
    };

    const handleAIEscalation = (payload) => {
      setAiEscalations((prev) => [...prev, { ...payload, receivedAt: Date.now() }]);
      toast.info("Your AI assistant flagged something that needs your attention", { autoClose: 5000 });
    };

    // after a reconnect we may have missed events -> resync silently
    const handleReconnect = () => {
      handleGetMyChats({ silent: true });
      const active = activeChatIdRef.current;
      if (active) {
        socket.emit("joinChat", active);
        getChatMessages({ chatId: active, page: 1, limit: 30 })
          .then((data) => {
            if (!sameId(activeChatIdRef.current, active)) return;
            const fetched = data.messages || [];
            setMessages((prev) => {
              // latest page from server + older messages already loaded (de-duplicated)
              const ids = new Set(fetched.map((m) => getId(m._id)));
              const firstFetchedAt = fetched.length ? new Date(fetched[0].createdAt) : new Date(8.64e15);
              const older = prev.filter((m) => !ids.has(getId(m._id)) && new Date(m.createdAt) < firstFetchedAt);
              return [...older, ...fetched];
            });
          })
          .catch(() => {});
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("aiEscalation", handleAIEscalation);
    socket.io?.on?.("reconnect", handleReconnect);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("aiEscalation", handleAIEscalation);
      socket.io?.off?.("reconnect", handleReconnect);
    };
  }, [socket, myId, addMessageIfNotExists, replaceMessage, markMessageDeleted, patchLastMessage, resetUnread, handleGetMyChats]);

  // join / leave the socket room of the open chat
  useEffect(() => {
    if (!socket || !activeChatId) return;
    socket.emit("joinChat", activeChatId);
    return () => socket.emit("leaveChat", activeChatId);
  }, [socket, activeChatId]);

  // load the chat list once the user is known; clear everything on logout
  useEffect(() => {
    if (myId) {
      handleGetMyChats();
    } else {
      setChats([]);
      setMessages([]);
      setChat(null);
      setActiveChatId(null);
      setBlockedUsers([]);
      setAiEscalations([]);
    }
  }, [myId, handleGetMyChats]);

  // ── Derived ───────────────────────────────────────────────────

  const totalUnreadCount = useMemo(() => {
    if (!myId) return 0;
    return chats.reduce((sum, c) => sum + (Number(c.unreadCount?.[myId]) || 0), 0);
  }, [chats, myId]);

  const value = useMemo(() => ({
    // state
    chatLoading, chat, chats, totalUnreadCount, messages, activeChatId, setActiveChatId, blockedUsers, hasMoreMessages,
    aiEscalations, dismissAIEscalation,
    // chats
    handleStartChat, handleStartSupportChat, handleGetMyChats, handleDeleteChat, handleClearChatMessages, handleMarkAsRead,
    // messages
    handleGetChatMessages, handleLoadMoreMessages, handleSendMessage, handleEditMessage, handleDeleteMessage,
    // block + important
    handleGetBlockedUsers, handleBlockUser, handleUnblockUser, handleToggleImportantSeller,
    // AI
    handleResumeAIForChat, handleToggleAIForChat, handleEditAIMessage, handleDeleteAIMessage,
  }), [
    chatLoading, chat, chats, totalUnreadCount, messages, activeChatId, blockedUsers, hasMoreMessages,
    aiEscalations, dismissAIEscalation,
    handleStartChat, handleStartSupportChat, handleGetMyChats, handleDeleteChat, handleClearChatMessages, handleMarkAsRead,
    handleGetChatMessages, handleLoadMoreMessages, handleSendMessage, handleEditMessage, handleDeleteMessage,
    handleGetBlockedUsers, handleBlockUser, handleUnblockUser, handleToggleImportantSeller,
    handleResumeAIForChat, handleToggleAIForChat, handleEditAIMessage, handleDeleteAIMessage,
  ]);

  return value;
};
