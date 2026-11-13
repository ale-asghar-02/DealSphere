export const VALID_ITEM_TYPES = ["advertisement", "product"];

// Works for both populated objects and plain id strings
export const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value?._id?.toString() || value?.id?.toString() || null;
  return value?.toString();
};

// A chat has 2 participants; return the one who is not the logged-in user
export const getOtherParticipant = (chat, userId) =>
  chat?.participants?.find((p) => getId(p) !== getId(userId));

// The advertisement / product this chat is about
export const getChatItem = (chat) => {
  if (!chat) return null;
  if (chat.itemType === "advertisement") return chat.ad || chat.item || null;
  if (chat.itemType === "product") return chat.product || chat.item || null;
  return null;
};

export const getChatItemId = (chat) => {
  const item = getChatItem(chat);
  return getId(item) || getId(chat?.item?._id) || getId(chat?.itemId) || null;
};

// Latest activity time of a chat (sorting + time label)
export const getChatTime = (chat) => chat?.lastMessageAt || chat?.updatedAt || chat?.createdAt;

// Most recently active chat in a list
export const latestOf = (list) =>
  [...list].sort((a, b) => new Date(getChatTime(b)) - new Date(getChatTime(a)))[0];

// chat.unreadCount is an object: { [userId]: count }
export const getUnreadCount = (chat, userId) => Number(chat?.unreadCount?.[getId(userId)]) || 0;

// Only valid 1-to-1 ad/product chats between two different users
const isItemChat = (chat) =>
  VALID_ITEM_TYPES.includes(chat?.itemType) &&
  Array.isArray(chat?.participants) &&
  chat.participants.length === 2 &&
  chat.participants.every(Boolean) &&
  chat.participants[0]?._id?.toString() !== chat.participants[1]?._id?.toString();

export const filterItemChats = (chats) => (Array.isArray(chats) ? chats.filter(isItemChat) : []);
// ── Item card info (top bar item switcher) ───────────────────────

export const getChatItemImage = (chat) => {
  const item = getChatItem(chat);
  if (!item) return null;
  if (chat.itemType === "advertisement") return item.adsImages?.[0]?.url || item.images?.[0]?.url || null;
  return item.productImages?.[0]?.url || item.images?.[0]?.url || null;
};

export const getChatItemTitle = (chat) =>
  getChatItem(chat)?.title || getChatItem(chat)?.name || (chat?.itemType === "advertisement" ? "Advertisement" : "Product");

// Price text for the item card. Returns "" when the item has no price.
// Add your currency here if you want it shown, e.g. `Rs ${...}`.
export const getChatItemPrice = (chat) => {
  const price = getChatItem(chat)?.price;
  if (price === undefined || price === null || price === "") return "";
  const n = Number(price);
  return Number.isFinite(n) ? n.toLocaleString() : String(price);
};

// An advertisement that is no longer active (sold / removed). Products are always "available".
export const isChatItemUnavailable = (chat) =>
  chat?.itemType === "advertisement" && !!getChatItem(chat) && getChatItem(chat).status !== "active";
