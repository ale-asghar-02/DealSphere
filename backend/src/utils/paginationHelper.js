// ---------- Helpers ( Pagination ) ----------
const MAX_LIMIT = 50;
const MAX_PAGE = 1000; // bohat bara skip rokne ke liye

const getPagination = (query, defaultLimit = 16) => {
  const page = Math.min(Math.max(parseInt(query.page) || 1, 1), MAX_PAGE);
  const limit = Math.min(
    Math.max(parseInt(query.limit) || defaultLimit, 1),
    MAX_LIMIT
  );
  return { page, limit, skip: (page - 1) * limit };
};

// _id tiebreaker ke bagair pagination mein duplicates/skips aate hain
const getSort = (sort, featuredField = "featured.isFeatured") => {
  const featured = { [featuredField]: -1 };
  switch (sort) {
    case "low":
      return { ...featured, price: 1, _id: -1 };
    case "high":
      return { ...featured, price: -1, _id: -1 };
    case "new":
    case "relevant":
    default:
      return { ...featured, createdAt: -1, _id: -1 };
  }
};

// minPrice / maxPrice ko safely parse karta hai
// invalid (NaN, negative) ya min > max ho to null return karta hai (filter skip)
const parsePriceRange = (minPrice, maxPrice) => {
  const toNum = (v) =>
    v !== undefined && v !== null && String(v).trim() !== ""
      ? Number(v)
      : undefined;

  const min = toNum(minPrice);
  const max = toNum(maxPrice);

  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  if (min !== undefined && min < 0) return null;
  if (max !== undefined && max < 0) return null;
  if (min !== undefined && max !== undefined && min > max) return null;
  if (min === undefined && max === undefined) return null;

  return { min, max };
};

const buildPriceFilter = (filter, minPrice, maxPrice) => {
  const range = parsePriceRange(minPrice, maxPrice);
  if (!range) return;

  filter.price = {};
  if (range.min !== undefined) filter.price.$gte = range.min;
  if (range.max !== undefined) filter.price.$lte = range.max;
};

module.exports = { getPagination, getSort, buildPriceFilter, parsePriceRange };