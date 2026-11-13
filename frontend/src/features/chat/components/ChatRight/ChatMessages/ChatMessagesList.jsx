import { useEffect, useMemo, useRef } from "react";

import { useChatData } from "../../../ChatContext";
import { getId } from "../../../utils/chatHelpers";
import { useOtherTyping } from "../hooks/useOtherTyping";

import MessageItem from "./MessageItem";
import BlockedBanner from "./BlockedBanner";
import SoldOverlay from "./SoldOverlay";

const formatDateDivider = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && now.getDate() === d.getDate()) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" });
};

// messages -> [{ type: "divider", date }, { type: "message", msg }, ...]
const groupMessages = (messages) => {
  const items = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      items.push({ type: "divider", date: msg.createdAt });
      lastDate = msgDate;
    }
    items.push({ type: "message", msg });
  });
  return items;
};

// Middle section: loads the messages of the open chat, marks them read, scrolls,
// load-older, date dividers, delete (routes AI replies to the AI endpoint),
// typing indicator, blocked banner and the "ad sold" overlay.
const ChatMessagesList = ({ chatId, myId, other, isBlocked, onUnblock, isAdvertisement, isItemActive, itemStatusLabel, onStartEdit }) => {
  const {
    messages, chatLoading, hasMoreMessages, activeChatId,
    handleGetChatMessages, handleLoadMoreMessages, handleMarkAsRead,
    handleDeleteMessage, handleDeleteAIMessage,
  } = useChatData();

  const otherTyping = useOtherTyping(chatId, myId);
  const messagesEndRef = useRef(null);

  // load messages + mark as read on chat switch
  useEffect(() => {
    if (!chatId) return;
    handleGetChatMessages({ chatId });
    handleMarkAsRead({ chatId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // jab tak fetched messages current chat se match na karein, "not ready" treat karein
  const messagesReady = activeChatId === chatId;

  const items = useMemo(() => groupMessages(messages), [messages]);

  const handleDelete = async (msg, forEveryone) => {
    if (msg.isAIReply) {
      await handleDeleteAIMessage({ messageId: msg._id });
      return;
    }
    await handleDeleteMessage({ chatId, messageId: msg._id, forEveryone });
  };

  return (
    <div className="flex-grow-1 position-relative" style={{ overflow: "hidden" }}>
      <div className="h-100 overflow-auto px-3 py-2" style={{ background: "#f5f5f5" }}>
        {hasMoreMessages && messages.length > 0 && (
          <div className="text-center mb-2">
            <button className="btn btn-sm btn-light" style={{ fontSize: "12px" }} disabled={chatLoading} onClick={handleLoadMoreMessages}>
              {chatLoading ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {!messagesReady || (chatLoading && messages.length === 0) ? (
          <div className="d-flex justify-content-center py-4"><div className="spinner-border spinner-border-sm text-secondary" /></div>
        ) : (
          items.map((item, idx) =>
            item.type === "divider" ? (
              <div key={`d-${idx}`} className="text-center my-3">
                <span className="px-3 py-1 rounded-pill" style={{ background: "#e0e0e0", fontSize: "11px", color: "#666" }}>{formatDateDivider(item.date)}</span>
              </div>
            ) : (
              <MessageItem
                key={item.msg._id}
                msg={item.msg}
                isMine={getId(item.msg.sender) === myId}
                onStartEdit={onStartEdit}
                onDelete={handleDelete}
              />
            )
          )
        )}

        {isBlocked && <BlockedBanner other={other} onUnblock={onUnblock} />}

        {otherTyping && (
          <div className="d-flex justify-content-start mb-2">
            <div className="px-3 py-2 rounded-3 bg-white"><span style={{ fontSize: "12px", color: "#888" }}>typing...</span></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!isItemActive && <SoldOverlay isAdvertisement={isAdvertisement} status={itemStatusLabel} />}
    </div>
  );
};

export default ChatMessagesList;