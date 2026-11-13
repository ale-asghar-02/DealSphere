import { useState } from "react";
import { IconArrowLeft } from "@tabler/icons-react";

import Modal from "@/components/Model";
import { AIChatToggle } from "../../../../aiAssistant/components/AIAssistant";
import { useChatData } from "../../../ChatContext";
import { getId } from "../../../utils/chatHelpers";

import ChatItemSwitcher from "./ChatItemSwitcher";
import TopBarMenu from "./TopBarMenu";
import SafetyTipsModal from "./SafetyTipsModal";

import defaultUser from "@/assets/images/default_user.avif";

// Top bar: back button, other user's info, seller's item tabs, per-chat AI toggle,
// the "..." menu and its two modals (safety tips / delete conversation).
const ChatTopBar = ({
  activeChat, sellerChats, onSelectChat, onBack, onChatDeleted,
  other, otherId, otherOnline, isOtherUnavailable = false, isSellerViewing, isAdvertisement,
  isBlocked, onBlock, onUnblock,
}) => {
  const { handleClearChatMessages } = useChatData();

  const [safetyOpen, setSafetyOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmDeleteConversation = async () => {
    setShowDeleteConfirm(false);
    await handleClearChatMessages({ chatId: activeChat._id });
    onChatDeleted?.(activeChat._id);
  };

  // status text + color: Unavailable > Online > Offline
  const statusText = isOtherUnavailable ? "Unavailable" : otherOnline ? "Online" : "Offline";
  const statusColor = isOtherUnavailable ? "#d32f2f" : otherOnline ? "#44b700" : "#888";

  return (
    <>
      <div className="chat-topbar position-relative d-flex align-items-center justify-content-between px-2 px-sm-3 py-2 border-bottom" style={{ background: "#fff", minHeight: "64px", zIndex: 100 }}>
        <button
          className="btn btn-sm btn-light rounded-circle d-flex d-md-none align-items-center justify-content-center me-2 flex-shrink-0"
          style={{ width: "34px", height: "34px", border: "1px solid #ddd" }}
          onClick={() => onBack?.()}
        >
          <IconArrowLeft size={16} color="#002f34" />
        </button>

        <div className="d-flex align-items-center gap-2 gap-sm-3 flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flexShrink: 1 }}>
            <div className="position-relative flex-shrink-0">
              <img src={other?.userImage || other?.profileImage || defaultUser} alt={other?.username || "User"} className="rounded-circle" style={{ width: "42px", height: "42px", objectFit: "cover", opacity: isOtherUnavailable ? 0.6 : 1 }} />
              {otherOnline && !isOtherUnavailable && <span className="position-absolute" style={{ width: "10px", height: "10px", background: "#44b700", border: "2px solid #fff", borderRadius: "50%", bottom: "1px", right: "1px" }} />}
            </div>
            <div className="chat-topbar-user" style={{ minWidth: 0 }}>
              <div className="fw-semibold text-truncate" style={{ fontSize: "14px", color: "#002f34" }}>{other?.username || other?.name || "User"}</div>
              <div style={{ fontSize: "11px", color: statusColor }}>{statusText}</div>
            </div>
          </div>

          {sellerChats.length > 0 && (
            <div style={{ minWidth: 0, flexShrink: 1 }}>
              <ChatItemSwitcher sellerChats={sellerChats} activeChatId={getId(activeChat._id)} onSelect={onSelectChat} />
            </div>
          )}
        </div>

        {/* per-chat AI toggle — only visible to the seller of this item */}
        {isSellerViewing && (
          <div className="flex-shrink-0 me-2">
            <AIChatToggle chat={activeChat} />
          </div>
        )}

        <TopBarMenu
          chatId={activeChat._id}
          otherId={otherId}
          isAdvertisement={isAdvertisement}
          isBlocked={isBlocked}
          onBlock={onBlock}
          onUnblock={onUnblock}
          onDeleteConversation={() => setShowDeleteConfirm(true)}
          onShowSafetyTips={() => setSafetyOpen(true)}
        />
      </div>

      <SafetyTipsModal show={safetyOpen} onClose={() => setSafetyOpen(false)} />

      <Modal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Conversation"
        footer={
          <>
            <button className="btn btn-sm btn-light px-3" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="btn btn-sm px-3" style={{ background: "#d32f2f", color: "#fff" }} onClick={confirmDeleteConversation}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: "13px", color: "#555" }} className="mb-0">Are you sure? This conversation will be permanently deleted.</p>
      </Modal>
    </>
  );
};

export default ChatTopBar;