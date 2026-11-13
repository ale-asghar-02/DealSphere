// Ad aur Product dono ke liye ek hi status logic.
// Ad status:      active | pending | sold | rejected | expired | deleted
// Product status: active | pending | sold | soldout | rejected | expired | deleted
// Chat sirf "active" item par allowed hai, baqi har status par band.
const ACTIVE_STATUS = "active";
const SOLD_STATUSES = ["sold", "soldout"];

export const getItemStatus = (item) => String(item?.status ?? "").trim().toLowerCase();

export const isItemActiveStatus = (item) => {
  if (!item) return false;
  const status = getItemStatus(item);
  // status response mein aaya hi na ho to active maanein (warna har chat block ho jayegi)
  if (!status) return true;
  return status === ACTIVE_STATUS;
};

// sold/soldout -> "sold", baqi (pending, rejected, expired, deleted) jaisa hai waisa
export const getItemStatusLabel = (item) => {
  const status = getItemStatus(item);
  if (SOLD_STATUSES.includes(status)) return "sold";
  return status || "unavailable";
};