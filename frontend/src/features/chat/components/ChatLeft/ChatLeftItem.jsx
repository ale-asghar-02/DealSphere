import { useRef, useState } from "react";
import { IconPackage, IconShoppingBag, IconDotsVertical, IconBookmark, IconBookmarkFilled, IconTrash } from "@tabler/icons-react";

import FloatingMenu from "../common/FloatingMenu";
import { getId, getOtherParticipant, getChatTime, getUnreadCount } from "../../utils/chatHelpers";

import defaultUser from "@/assets/images/default_user.avif";

// Preview text shown under the seller name
const getLastMessageText = (chat, currentUserId) => {
  const lastMessage = chat?.lastMessage;
  if (!lastMessage) return "Start a conversation";

  const isOwnMessage = getId(lastMessage.sender) === getId(currentUserId);
  const prefix = isOwnMessage ? "You: " : "";

  if (lastMessage.isDeleted) return prefix + "Message deleted";
  if (lastMessage.image) return prefix + (lastMessage.text || "📷 Photo");
  return prefix + (lastMessage.text || "Message");
};

// Today -> time, older -> "12 Oct"
const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
};

// One seller row in the left list: avatar, last message, unread badge and the 3-dots menu.
const ChatLeftItem = ({ group, currentUserId, isActive, menuOpen, onSelect, onToggleMenu, onCloseMenu, onToggleImportant, onRequestDelete }) => {
  const [hovered, setHovered] = useState(false);
  const dotsRef = useRef(null);

  const { itemType, chats, latest } = group;
  const seller = getOtherParticipant(latest, currentUserId);
  const sellerName = seller?.username || seller?.name || "User";
  const sellerImage = seller?.userImage || seller?.profileImage || seller?.avatar || defaultUser;

  const isImportant = chats.some((c) => c.importantBy?.some((id) => getId(id) === getId(currentUserId)));
  const unreadCount = chats.reduce((total, chat) => total + getUnreadCount(chat, currentUserId), 0);
  const showDots = hovered || menuOpen;

  // bold the preview only if the last message is from the other person and unread
  const isOwnLastMessage = getId(latest?.lastMessage?.sender) === getId(currentUserId);
  const isUnreadFromOther = !isOwnLastMessage && unreadCount > 0;

  return (
    <div className="position-relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* row click = open this seller's chat */}
      <div
        className="d-flex align-items-center gap-2 px-3 py-2"
        onClick={onSelect}
        style={{ cursor: "pointer", background: isActive ? "#e8f4f4" : "#fff", borderBottom: "1px solid #eee", transition: "background 0.15s" }}
      >
        <img src={sellerImage} alt={sellerName} className="rounded-circle flex-shrink-0" style={{ width: "48px", height: "48px", objectFit: "cover", border: "1px solid #eee" }} />

        <div className="flex-grow-1 overflow-hidden">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <div className="fw-semibold text-truncate" style={{ fontSize: "13px", color: "#002f34" }}>{sellerName}</div>
            <span className="flex-shrink-0" style={{ fontSize: "10px", color: "#999" }}>{formatTime(getChatTime(latest))}</span>
          </div>

          <div className="d-flex align-items-center gap-1 mt-1">
            {itemType === "advertisement" ? <IconShoppingBag size={13} color="#777" /> : <IconPackage size={13} color="#777" />}
            <span style={{ fontSize: "11px", color: "#666" }}>{itemType === "advertisement" ? "Advertisement" : "Product"}</span>
            {chats.length > 1 && (
              <span className="px-1 rounded" style={{ fontSize: "9px", background: "#eee", color: "#666" }}>{chats.length} items</span>
            )}
            {isImportant && <IconBookmarkFilled size={12} color="#f0ad4e" />}
          </div>

          <div className="text-truncate mt-1" style={{ fontSize: "11px", color: "#999", fontWeight: isUnreadFromOther ? 700 : 400 }}>
            {getLastMessageText(latest, currentUserId)}
          </div>
        </div>

        {unreadCount > 0 && (
          <span className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "20px", height: "20px", background: "#002f34", color: "#fff", fontSize: "9px", fontWeight: 600 }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* 3 dots (stopPropagation so the row click doesn't fire) */}
        <div
          ref={dotsRef}
          className="three-dots-btn flex-shrink-0"
          style={{ opacity: showDots ? 1 : 0, transition: "opacity 0.15s", cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
        >
          <IconDotsVertical size={16} color="#666" />
        </div>
      </div>

      <FloatingMenu open={menuOpen} anchorRef={dotsRef} onClose={onCloseMenu} align="end" minWidth={180}>
        <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2 px-3" style={{ fontSize: "13px" }} onClick={onToggleImportant}>
          {isImportant ? <IconBookmarkFilled size={15} color="#f0ad4e" /> : <IconBookmark size={15} />}
          {isImportant ? "Remove important" : "Mark as important"}
        </button>
        <div className="dropdown-divider my-0" />
        <button type="button" className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger" style={{ fontSize: "13px" }} onClick={onRequestDelete}>
          <IconTrash size={15} /> Delete
        </button>
      </FloatingMenu>
    </div>
  );
};

export default ChatLeftItem;
