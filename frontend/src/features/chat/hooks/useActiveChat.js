import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../auth/hooks/useAuth";
import { useChatData } from "../ChatContext";
import { VALID_ITEM_TYPES, getId, getOtherParticipant, getChatItemId, latestOf, filterItemChats } from "../utils/chatHelpers";

// Decides which chat is open: URL -> active chat, selecting a seller / chat,
// and what to open next after a delete. Used only by the Chat page.
export const useActiveChat = () => {
  const { itemId: itemParam } = useParams();
  const [searchParams] = useSearchParams();
  const sellerIdParam = searchParams.get("seller");
  const itemTypeParam = searchParams.get("type");

  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, chatLoading, handleGetMyChats, handleStartChat } = useChatData();

  // sirf ID store karein, object nahi — taake hamesha fresh data se derive ho
  const [activeChatDbId, setActiveChatDbId] = useState(null);
  const [activeSellerId, setActiveSellerId] = useState(null);
  const [activeItemType, setActiveItemType] = useState(null);
  const [starting, setStarting] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const itemChats = useMemo(() => filterItemChats(chats), [chats]);

  // activeChat hamesha fresh chats array se derive hota hai — kabhi stale nahi hoga
  const activeChat = useMemo(() => {
    if (!activeChatDbId) return null;
    return itemChats.find((c) => getId(c._id) === activeChatDbId) || null;
  }, [itemChats, activeChatDbId]);

  // all chats with the same seller + item type as the open chat
  const sellerChats = useMemo(() => {
    if (!activeSellerId || !activeItemType) return [];
    return itemChats.filter((chat) => {
      const other = getOtherParticipant(chat, user?._id);
      return getId(other) === getId(activeSellerId) && chat?.itemType === activeItemType;
    });
  }, [itemChats, activeSellerId, activeItemType, user?._id]);

  const applyChat = (chat, fallbackType) => {
    setActiveSellerId(getId(getOtherParticipant(chat, user?._id)));
    setActiveItemType(chat.itemType || fallbackType);
    setActiveChatDbId(getId(chat._id));
  };

  const goToChat = (chat) => {
    const sellerId = getId(getOtherParticipant(chat, user?._id));
    navigate(`/chat/${getChatItemId(chat)}?seller=${sellerId}&type=${chat.itemType}`, { replace: true });
  };

  // refresh the list whenever the chat page opens (new chats started by others)
  useEffect(() => {
    if (!user) return;
    handleGetMyChats();
  }, [user, handleGetMyChats]);

  // resolve URL -> active chat
  useEffect(() => {
    const init = async () => {
      if (!user || chatLoading || starting) return;

      if (itemParam) {
        if (!VALID_ITEM_TYPES.includes(itemTypeParam)) {
          navigate("/chat", { replace: true });
          return;
        }

        const found = itemChats.find((chat) => {
          const itemMatch = getChatItemId(chat)?.toString() === itemParam?.toString();
          const typeMatch = chat?.itemType === itemTypeParam;
          const other = getOtherParticipant(chat, user?._id);
          const sellerMatch = !sellerIdParam || getId(other) === sellerIdParam?.toString();
          return itemMatch && typeMatch && sellerMatch;
        });

        if (found) {
          if (activeChatDbId !== getId(found._id)) {
            applyChat(found);
            setIsMobileChatOpen(true); // opened from a link (e.g. "Message seller") -> show the chat on phones
          }
          return;
        }

        if (sellerIdParam && !activeChatDbId) {
          setStarting(true);
          try {
            const newChat = await handleStartChat({ itemId: itemParam, itemType: itemTypeParam });
            if (newChat) {
              applyChat(newChat, itemTypeParam);
              setIsMobileChatOpen(true);
            }
            else navigate("/chat", { replace: true });
          } finally {
            setStarting(false);
          }
          return;
        }

        if (!sellerIdParam) navigate("/chat", { replace: true });
        return;
      }

      // /chat -> open the latest conversation
      if (itemChats.length > 0 && !activeChatDbId) applyChat(latestOf(itemChats));
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemParam, sellerIdParam, itemTypeParam, itemChats, chatLoading, user]);

  // left side: a seller row was clicked -> open that seller's latest chat
  const selectSeller = (groupChats) => {
    if (!groupChats?.length) return;
    const latest = latestOf(groupChats);
    applyChat(latest);
    goToChat(latest);
    setIsMobileChatOpen(true);
  };

  // right side: another item tab of the same seller was clicked
  const selectChat = (chat) => {
    if (!chat || getId(chat._id) === activeChatDbId) return;
    applyChat(chat);
    goToChat(chat);
    setIsMobileChatOpen(true);
  };

  // after delete: open the seller's next chat, else any other chat, else /chat
  const handleChatDeleted = (deletedChatIds) => {
    const ids = (Array.isArray(deletedChatIds) ? deletedChatIds : [deletedChatIds]).map((id) => id?.toString());
    if (!ids.includes(activeChatDbId)) return;

    const isDeleted = (chat) => ids.includes(getId(chat._id));
    const remaining = sellerChats.filter((chat) => !isDeleted(chat));
    const next = remaining.length > 0 ? latestOf(remaining) : itemChats.find((chat) => !isDeleted(chat));

    if (next) {
      applyChat(next);
      goToChat(next);
      return;
    }

    setActiveChatDbId(null);
    setActiveSellerId(null);
    setActiveItemType(null);
    navigate("/chat", { replace: true });
  };

  return {
    itemChats, activeChat, activeSellerId, activeItemType, sellerChats,
    starting, isMobileChatOpen,
    selectSeller, selectChat, handleChatDeleted,
    closeMobileChat: () => setIsMobileChatOpen(false),
  };
};