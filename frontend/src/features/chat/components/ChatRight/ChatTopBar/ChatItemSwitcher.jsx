import { useCallback, useRef, useState } from "react";
import { IconShoppingBag, IconPackage, IconChevronDown, IconCheck } from "@tabler/icons-react";

import FloatingMenu from "../../common/FloatingMenu";
import { useAuth } from "../../../../auth/hooks/useAuth";
import { getId, getUnreadCount, getChatItemImage, getChatItemTitle, getChatItemPrice, getChatItem } from "../../../utils/chatHelpers";
import { isItemActiveStatus, getItemStatusLabel } from "../hooks/chatItemStatus";

// Ad aur Product dono ke liye: item active nahi ho to unavailable
const isChatItemUnavailable = (chat) => !isItemActiveStatus(getChatItem(chat));
// "Sold" sirf sold item par, baqi status (pending etc.) jaisa hai waisa
const unavailableLabel = (chat) => {
  const s = getItemStatusLabel(getChatItem(chat));
  return s === "sold" ? "Sold" : s.charAt(0).toUpperCase() + s.slice(1);
};

const typeLabel = (chat) => (chat?.itemType === "advertisement" ? "Advertisement" : "Product");

// Image of the item, or an icon when it has none
const ItemThumb = ({ chat, size }) => {
  const image = getChatItemImage(chat);
  const style = { width: size, height: size, objectFit: "cover", borderRadius: "6px", flexShrink: 0, background: "#f0f0f0" };
  if (image) return <img src={image} alt={getChatItemTitle(chat)} style={style} />;

  const Icon = chat?.itemType === "advertisement" ? IconShoppingBag : IconPackage;
  return (
    <span className="d-flex align-items-center justify-content-center" style={style}>
      <Icon size={Math.round(size * 0.55)} color="#777" />
    </span>
  );
};

// The seller can have many items (ads / products) with this user.
//  - one item   -> just the item card (no dropdown)
//  - many items -> [count] [active item ▾]; clicking opens a scrollable list with every item card
// Selecting a card switches the open chat to that item.
const ChatItemSwitcher = ({ sellerChats, activeChatId, onSelect }) => {
  const { user } = useAuth();
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const activeChat = sellerChats.find((c) => getId(c._id) === activeChatId) || sellerChats[0];
  if (!activeChat) return null;

  const count = sellerChats.length;
  const multiple = count > 1;

  // unread messages sitting in the OTHER items (so they are not missed while the list is closed)
  const otherUnread = sellerChats.reduce((sum, c) => (getId(c._id) === getId(activeChat._id) ? sum : sum + getUnreadCount(c, user?._id)), 0);

  const price = getChatItemPrice(activeChat);
  const unavailable = isChatItemUnavailable(activeChat);

  const pick = (chat) => {
    close();
    if (getId(chat._id) !== getId(activeChat._id)) onSelect?.(chat);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="chat-item-chip d-flex align-items-center gap-2 text-start"
        onClick={multiple ? () => setOpen((p) => !p) : undefined}
        aria-haspopup={multiple ? "menu" : undefined}
        aria-expanded={multiple ? open : undefined}
        style={{ cursor: multiple ? "pointer" : "default" }}
      >
        {multiple && (
          <span className="chat-item-count position-relative flex-shrink-0" title={`${count} items`}>
            {count}
            {otherUnread > 0 && <span className="chat-item-unread-dot" />}
          </span>
        )}

        <ItemThumb chat={activeChat} size={32} />

        <span className="chat-item-chip-text" style={{ minWidth: 0 }}>
          <span className="d-block text-truncate fw-semibold" style={{ fontSize: "12px", color: "#002f34", lineHeight: 1.25 }}>{getChatItemTitle(activeChat)}</span>
          <span className="d-block text-truncate" style={{ fontSize: "11px", color: unavailable ? "#d32f2f" : "#777", lineHeight: 1.25 }}>
            {unavailable ? unavailableLabel(activeChat) : typeLabel(activeChat)}{price && !unavailable ? ` · ${price}` : ""}
          </span>
        </span>

        {multiple && <IconChevronDown size={16} color="#555" className="flex-shrink-0" style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }} />}
      </button>

      {multiple && (
        <FloatingMenu open={open} anchorRef={buttonRef} onClose={close} align="start" width={320}>
          <div className="px-3 py-2 border-bottom fw-semibold" style={{ fontSize: "12px", color: "#666", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
            {count} items with this seller
          </div>

          {sellerChats.map((chat) => {
            const isActive = getId(chat._id) === getId(activeChat._id);
            const itemPrice = getChatItemPrice(chat);
            const itemUnavailable = isChatItemUnavailable(chat);
            const unread = getUnreadCount(chat, user?._id);

            return (
              <button
                key={chat._id}
                type="button"
                role="menuitem"
                className="d-flex align-items-center gap-2 w-100 px-3 py-2 border-0 text-start"
                style={{ background: isActive ? "#e8f4f4" : "#fff", cursor: "pointer", borderBottom: "1px solid #f1f1f1" }}
                onClick={() => pick(chat)}
              >
                <ItemThumb chat={chat} size={44} />

                <span className="flex-grow-1" style={{ minWidth: 0 }}>
                  <span className="d-block text-truncate fw-semibold" style={{ fontSize: "13px", color: "#002f34" }}>{getChatItemTitle(chat)}</span>
                  <span className="d-flex align-items-center gap-1" style={{ fontSize: "11px", color: "#777" }}>
                    {chat.itemType === "advertisement" ? <IconShoppingBag size={12} /> : <IconPackage size={12} />}
                    {typeLabel(chat)}
                    {itemPrice && <span>· {itemPrice}</span>}
                    {itemUnavailable && <span className="px-1 rounded" style={{ background: "#fdecea", color: "#d32f2f", fontSize: "10px" }}>{unavailableLabel(chat)}</span>}
                  </span>
                </span>

                {unread > 0 && (
                  <span className="rounded-pill flex-shrink-0 px-2" style={{ background: "#002f34", color: "#fff", fontSize: "10px", fontWeight: 600 }}>
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
                {isActive && <IconCheck size={16} color="#002f34" className="flex-shrink-0" />}
              </button>
            );
          })}
        </FloatingMenu>
      )}
    </>
  );
};

export default ChatItemSwitcher;