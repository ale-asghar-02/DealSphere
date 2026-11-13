import "../chat.scss";

import Navbar from "@/components/Navbar/Navbar";
import ChatLeft from "../components/ChatLeft/ChatLeft";
import ChatRight from "../components/ChatRight/ChatRight";
import { useActiveChat } from "../hooks/useActiveChat";

// Page layout only: which chat is open comes from useActiveChat,
// everything else lives inside ChatLeft / ChatRight.
const Chat = () => {
  const {
    itemChats, activeChat, activeSellerId, activeItemType, sellerChats,
    starting, isMobileChatOpen,
    selectSeller, selectChat, handleChatDeleted, closeMobileChat,
  } = useActiveChat();

  return (
    <div>
      <Navbar />
      <div className="container-fluid mt-1">
        <div className="px-lg-2">
          <div className="col-12 chat-page d-flex border rounded-3">
            <ChatLeft
              chats={itemChats}
              activeSellerId={activeSellerId}
              activeItemType={activeItemType}
              onSelectSeller={selectSeller}
              onChatDeleted={handleChatDeleted}
              isMobileChatOpen={isMobileChatOpen}
            />

            {starting ? (
              <div className="chat-right flex-grow-1 d-flex align-items-center justify-content-center bg-white mobile-visible">
                <div className="spinner-border text-secondary" />
              </div>
            ) : (
              <ChatRight
                activeChat={activeChat}
                sellerChats={sellerChats}
                onSelectChat={selectChat}
                onChatDeleted={handleChatDeleted}
                isMobileChatOpen={isMobileChatOpen}
                onBack={closeMobileChat}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;