export const AD_STATUS_BADGE = {
  active: "text-bg-success",
  pending: "text-bg-warning",
  sold: "text-bg-secondary",
  expired: "text-bg-danger",
  rejected: "text-bg-dark",
  deleted: "text-bg-danger",
};

export const PRODUCT_STATUS_BADGE = {
  active: "text-bg-success",
  pending: "text-bg-warning",
  sold: "text-bg-secondary",
  soldout: "text-bg-secondary",
  expired: "text-bg-danger",
  rejected: "text-bg-dark",
  deleted: "text-bg-danger",
};

// Statuses jinke baad koi bhi action (edit/sold/renew/featured/delete)
// allowed nahi hai — item sirf read-only history ke tor par dikhta hai
export const LOCKED_STATUSES = ["deleted"];

// "27 Aug, 2026" format — toLocaleDateString comma khud nahi lagata
export const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const day = d.toLocaleDateString("en-GB", { day: "2-digit" });
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
};