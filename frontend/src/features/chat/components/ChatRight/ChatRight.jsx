import { IconMessageCircle2 } from "@tabler/icons-react";

import { useAuth } from "../../../auth/hooks/useAuth";
import { getId } from "../../utils/chatHelpers";

import { useChatDetails } from "./hooks/useChatDetails";
import { useBlockUser } from "./hooks/useBlockUser";
import { useMessageComposer } from "./hooks/useMessageComposer";

import ChatTopBar from "./ChatTopBar/ChatTopBar";
import ChatMessagesList from "./ChatMessages/ChatMessagesList";
import ChatInputBar from "./ChatInput/ChatInputBar";

// Right side: only wires the three sections together. Each section owns its own
// state; what is shared (chat facts, block state, composer) is created here once.
const ChatRight = ({ activeChat, sellerChats = [], onSelectChat, onChatDeleted, isMobileChatOpen, onBack }) => {
  const { user } = useAuth();
  const myId = getId(user);
  const chatId = activeChat?._id;

  const details = useChatDetails(activeChat, myId);
  const { isBlocked, block, unblock } = useBlockUser(details.otherId);
  const composer = useMessageComposer(chatId);

  if (!activeChat) {
    return (
      <div className={`chat-right flex-grow-1 d-flex flex-column align-items-center justify-content-center ${isMobileChatOpen ? "mobile-visible" : ""}`}>
        <IconMessageCircle2 size={64} stroke={1.2} color="#ccc" />
        <h5 className="mb-1 fw-semibold mt-2">Start a Conversation</h5>
        <p className="mb-0 text-body-secondary">Start messaging or begin a new conversation.</p>
      </div>
    );
  }

  return (
    <div className={`chat-right flex-grow-1 d-flex flex-column bg-white ${isMobileChatOpen ? "mobile-visible" : ""}`} style={{ height: "100%", overflow: "hidden" }}>
      <ChatTopBar
        activeChat={activeChat}
        sellerChats={sellerChats}
        onSelectChat={onSelectChat}
        onBack={onBack}
        onChatDeleted={onChatDeleted}
        other={details.other}
        otherId={details.otherId}
        otherOnline={details.otherOnline}
        isOtherUnavailable={details.isOtherUnavailable}
        isSellerViewing={details.isSellerViewing}
        isAdvertisement={details.isAdvertisement}
        isBlocked={isBlocked}
        onBlock={block}
        onUnblock={unblock}
      />

      <ChatMessagesList
        chatId={chatId}
        myId={myId}
        other={details.other}
        isBlocked={isBlocked}
        onUnblock={unblock}
        isAdvertisement={details.isAdvertisement}
        isItemActive={details.isItemActive}
        itemStatusLabel={details.itemStatusLabel}
        onStartEdit={composer.startEdit}
      />

      <ChatInputBar
        composer={composer}
        isAdvertisement={details.isAdvertisement}
        isItemActive={details.isItemActive}
        itemStatusLabel={details.itemStatusLabel}
        isOtherUnavailable={details.isOtherUnavailable}
      />
    </div>
  );
};

export default ChatRight;