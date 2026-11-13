// Converts "How to place an order!" -> "how-to-place-an-order"
const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove non-word chars
    .replace(/[\s_-]+/g, "-") // collapse spaces/underscores into a single dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes

module.exports = slugify;