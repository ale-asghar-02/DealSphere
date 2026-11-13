import { useMemo } from "react";

import { getId, getOtherParticipant, getChatTime, latestOf } from "../../../utils/chatHelpers";

// Groups chats by seller + itemType (several ads/products with the same seller
// = one row). Each group:
// { key, sellerId, itemType, chats, latest, isSeller, isBuyer, isImportant }, newest first.
//
// isSeller    -> I am the owner (item.seller) of at least one item in this group
// isBuyer     -> I am the buyer of at least one item in this group
// isImportant -> I marked this conversation as important
export const useChatGroups = (chats, currentUserId) =>
  useMemo(() => {
    const myId = getId(currentUserId);
    const groupsMap = new Map();

    chats.forEach((chat) => {
      const sellerId = getId(getOtherParticipant(chat, currentUserId));
      if (!sellerId) return;

      const key = `${sellerId}_${chat.itemType}`;
      if (!groupsMap.has(key)) groupsMap.set(key, { key, sellerId, itemType: chat.itemType, chats: [] });
      groupsMap.get(key).chats.push(chat);
    });

    return Array.from(groupsMap.values())
      .map((group) => {
        const isSeller = group.chats.some((c) => getId(c.item?.seller) === myId);
        const isBuyer = group.chats.some((c) => {
          const itemSellerId = getId(c.item?.seller);
          return !!itemSellerId && itemSellerId !== myId;
        });
        const isImportant = group.chats.some((c) => c.importantBy?.some((id) => getId(id) === myId));

        return { ...group, latest: latestOf(group.chats), isSeller, isBuyer, isImportant };
      })
      .sort((a, b) => new Date(getChatTime(b.latest) || 0) - new Date(getChatTime(a.latest) || 0));
  }, [chats, currentUserId]);