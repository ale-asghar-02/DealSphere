import { useSocket } from "@/contexts/SocketContext";
import { getId, getOtherParticipant, getChatItem } from "../../../utils/chatHelpers";
import { isItemActiveStatus, getItemStatusLabel } from "./chatItemStatus";

// Facts about the open chat, derived once and shared by the three sections:
// the other user, online status, item state and whether I am the seller.
export const useChatDetails = (activeChat, myId) => {
  const { onlineUsers } = useSocket();

  const other = getOtherParticipant(activeChat, myId);
  const otherId = getId(other);

  const isAdvertisement = activeChat?.itemType === "advertisement";
  const currentItem = getChatItem(activeChat);

  // backend (getMyChats) ye flag bhejta hai jab dusra user banned / suspended ho
  const isOtherUnavailable = activeChat?.otherUserUnavailable === true;

  return {
    other,
    otherId,
    // unavailable user ko online dikhana nahi chahiye
    otherOnline: !isOtherUnavailable && !!onlineUsers?.has?.(otherId),
    isOtherUnavailable,
    isAdvertisement,
    // ad ho ya product — dono ke liye same check
    isItemActive: isItemActiveStatus(currentItem),
    itemStatusLabel: getItemStatusLabel(currentItem),
    // only the seller gets the per-chat AI toggle — a buyer has no say over the seller's AI
    isSellerViewing: activeChat?.type === "buyer-seller" && getId(currentItem?.seller) === myId,
  };
};