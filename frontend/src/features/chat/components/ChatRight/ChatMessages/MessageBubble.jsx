import { IconCheck, IconChecks, IconSparkles, IconAlertTriangle } from "@tabler/icons-react";

const formatMsgTime = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

// The bubble itself: AI label / escalation flag, image, text, edited + time + read ticks.
const MessageBubble = ({ msg, isMine }) => {
  const isAIReply = !!msg.isAIReply;
  // escalation flag only matters to the seller — a buyer never sees it
  const showAttentionFlag = isAIReply && msg.needsSellerAttention && isMine;

  return (
    <div className="chat-bubble-wrap" style={{ minWidth: 0 }}>
      {showAttentionFlag && (
        <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: "10px", color: "#e65100", justifyContent: "flex-end" }}>
          <IconAlertTriangle size={12} /> AI flagged this — may need your input
        </div>
      )}

      <div
        className="px-3 py-2"
        style={{
          overflow: "hidden",
          background: isMine ? "#002f34" : "#fff",
          color: isMine ? "#fff" : "#333",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        }}
      >
        {isAIReply && (
          <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: "10px", opacity: 0.75 }}>
            <IconSparkles size={12} /> AI Assistant
          </div>
        )}

        {msg.image?.url && <img src={msg.image.url} className="rounded mb-1" style={{ maxWidth: "100%", width: "auto", height: "auto", maxHeight: "200px", objectFit: "cover", display: "block" }} alt="attachment" />}
        {msg.text && <div style={{ fontSize: "14px", wordBreak: "break-word", overflowWrap: "anywhere" }}>{msg.text}</div>}

        <div className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: "10px", opacity: 0.7, justifyContent: isMine ? "flex-end" : "flex-start" }}>
          {msg.isEdited && <span>edited</span>}
          <span>{formatMsgTime(msg.createdAt)}</span>
          {isMine && (msg.status === "read" ? <IconChecks size={13} color="#4fc3f7" /> : <IconCheck size={13} />)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
