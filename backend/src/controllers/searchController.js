const advertisementModel = require("../models/advertisementModel");
const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const { getPagination, getSort, buildPriceFilter, parsePriceRange } = require("../utils/paginationHelper");

// ---------- Config ----------
const getModelConfig = (type) => {
  const populate = [
    { path: "category", select: "name slug" },
    { path: "subCategory", select: "name slug" },
    { path: "seller", select: "username" },
  ];

  if (type === "ads") {
    return {
      model: advertisementModel,
      index: "ads_search",
      bannedField: "isBannedAdvertisement",
      featuredField: "isFeatured",
      populate,
    };
  }
  if (type === "products") {
    return {
      model: productModel,
      index: "products_search",
      bannedField: "isBannedProduct",
      featuredField: "featured.isFeatured",
      populate,
    };
  }
  return null;
};

// ---------- Helpers ----------
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Title search ke liye stable sorting (har sort mein _id tiebreaker)
const getSearchSort = (sort) => {
  switch (sort) {
    case "low":
      return { price: 1, _id: -1 };
    case "high":
      return { price: -1, _id: -1 };
    case "new":
      return { createdAt: -1, _id: -1 };
    case "relevant":
    default:
      return { score: -1, _id: -1 };
  }
};

// Banned / hidden nikalne ke liye ($ne: true taake missing field wale docs bhi aayein)
const visibilityMatch = (bannedField) => ({
  $match: {
    [bannedField]: { $ne: true },
    moderationHidden: { $ne: true },
  },
});

const emptyResponse = {
  success: true,
  data: [],
  count: 0,
  total: 0,
  page: 1,
  pages: 0,
  hasMore: false,
  matchedBy: null,
  matchedCategory: null,
};

const buildResponse = ({
  data,
  total,
  page,
  limit,
  matchedBy,
  matchedCategory = null,
}) => ({
  success: true,
  data,
  count: data.length,
  total,
  page,
  pages: Math.ceil(total / limit),
  hasMore: page * limit < total,
  matchedBy,
  matchedCategory,
});

// Query ko category / sub-category se exact match karta hai (name ya slug)
// Return: { categoryIds, subCategoryIds, matchedCategory }
const findMatchingCategories = async (q) => {
  const cleaned = q.trim().replace(/\s+/g, " ");
  const slug = toSlug(cleaned);

  const or = [{ name: new RegExp(`^${escapeRegex(cleaned)}$`, "i") }];
  if (slug) or.push({ slug });

  const matches = await categoryModel
    .find({ isActive: true, $or: or })
    .select("_id name slug parent")
    .lean();

  const categoryIds = [];
  const subParentIds = [];

  for (const c of matches) {
    if (!c.parent) categoryIds.push(c._id);
    else subParentIds.push(c.parent);
  }

  // sub-category tabhi valid jab uska parent bhi active ho
  let activeSet = new Set();
  if (subParentIds.length) {
    const activeParents = await categoryModel
      .find({ _id: { $in: subParentIds }, isActive: true })
      .select("_id")
      .lean();
    activeSet = new Set(activeParents.map((p) => String(p._id)));
  }

  const validSubs = matches.filter(
    (c) => c.parent && activeSet.has(String(c.parent)),
  );
  const subCategoryIds = validSubs.map((c) => c._id);

  const first = matches.find((c) => !c.parent) || validSubs[0] || null;

  return {
    categoryIds,
    subCategoryIds,
    matchedCategory: first ? { name: first.name, slug: first.slug } : null,
  };
};

// ---------- Full Search ----------
// GET /api/search?type=products&q=mobile&page=1&limit=16
const search = async (req, res) => {
  try {
    const { type, q, minPrice, maxPrice, sort, country, city } = req.query;

    if (!type || !["ads", "products"].includes(type)) {
      return res
        .status(400)
        .json({ message: "type must be 'ads' or 'products'" });
    }

    if (!q || q.trim() === "") {
      return res.json(emptyResponse);
    }

    const { page, limit, skip } = getPagination(req.query, 16);
    const query = q.trim();
    const config = getModelConfig(type);

    // ===== STEP 1: Category / Sub-category match =====
    const { categoryIds, subCategoryIds, matchedCategory } =
      await findMatchingCategories(query);

    if (categoryIds.length || subCategoryIds.length) {
      const filter = {
        status: "active",
        [config.bannedField]: false,
        moderationHidden: { $ne: true },
      };

      const orConditions = [];
      if (categoryIds.length)
        orConditions.push({ category: { $in: categoryIds } });
      if (subCategoryIds.length)
        orConditions.push({ subCategory: { $in: subCategoryIds } });
      filter.$or = orConditions;

      if (country) filter.country = country;
      if (city) filter.city = city;
      buildPriceFilter(filter, minPrice, maxPrice);

      const [total, data] = await Promise.all([
        config.model.countDocuments(filter),
        config.model
          .find(filter)
          .sort(getSort(sort, config.featuredField))
          .skip(skip)
          .limit(limit)
          .populate(config.populate)
          .lean(),
      ]);

      // category mili aur us mein items hain => wahi dikhao
      // total 0 ho to neeche title search par fallback hoga
      if (total > 0) {
        return res.json(
          buildResponse({
            data,
            total,
            page,
            limit,
            matchedBy: "category",
            matchedCategory,
          }),
        );
      }
    }

    // ===== STEP 2: Title search (Atlas) =====
    const filterConditions = [{ equals: { path: "status", value: "active" } }];

    if (country) {
      filterConditions.push({ equals: { path: "country", value: country } });
    }
    if (city) {
      filterConditions.push({ equals: { path: "city", value: city } });
    }

    const range = parsePriceRange(minPrice, maxPrice);
    if (range) {
      const rangeFilter = { range: { path: "price" } };
      if (range.min !== undefined) rangeFilter.range.gte = range.min;
      if (range.max !== undefined) rangeFilter.range.lte = range.max;
      filterConditions.push(rangeFilter);
    }

    // query ki lambai ke hisab se fuzzy:
    // 1-4 harf: fuzzy nahi, 5-7 harf: 1 edit, 8+ harf: 2 edits
    const len = query.length;
    const maxEdits = len <= 4 ? 0 : len <= 7 ? 1 : 2;

    const should = [
      // poora lafz title mein (sab se zyada weight)
      {
        text: {
          query,
          path: "title",
          score: { boost: { value: 5 } },
        },
      },
    ];

    // "phone" => "iPhone", "Smartphone" (lafz ke beech se match)
    if (query.length >= 3) {
      should.push({
        text: {
          query,
          path: { value: "title", multi: "ngram" },
          score: { boost: { value: 1.5 } },
        },
      });
    }

    // fuzzy sirf title par aur sirf jab query itni lambi ho
    if (maxEdits > 0) {
      should.push({
        text: {
          query,
          path: "title",
          fuzzy: { maxEdits, prefixLength: 3 },
        },
      });
    }

    const pipeline = [
      {
        $search: {
          index: config.index,
          compound: {
            should,
            filter: filterConditions,
            minimumShouldMatch: 1,
          },
        },
      },
      { $addFields: { score: { $meta: "searchScore" } } },
      visibilityMatch(config.bannedField),
      {
        $facet: {
          data: [
            { $sort: getSearchSort(sort) },
            { $skip: skip },
            { $limit: limit },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ];

    const [out] = await config.model.aggregate(pipeline);
    const total = out?.meta?.[0]?.total || 0;

    // aggregate ke results plain objects hote hain, populate alag se
    const data = await config.model.populate(out?.data || [], config.populate);

    res.json(
      buildResponse({
        data,
        total,
        page,
        limit,
        matchedBy: "title",
        matchedCategory: null,
      }),
    );
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

// ---------- Autocomplete Suggestions ----------
// GET /api/search/suggestions?type=ads&q=mo
// Return: [{ _id, title, kind, slug?, parentName?, parentSlug?, price? }]
const suggestions = async (req, res) => {
  try {
    const { type, q } = req.query;

    if (!type || !["ads", "products"].includes(type)) {
      return res
        .status(400)
        .json({ message: "type must be 'ads' or 'products'" });
    }

    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const config = getModelConfig(type);
    const cleaned = q.trim().replace(/\s+/g, " ");

    // naam ke shuru mein ya kisi lafz ke shuru mein match ("mo" => "Mobiles", "Used Mobiles")
    const nameRegex = new RegExp(`(^|\\s)${escapeRegex(cleaned)}`, "i");

    const [categoryMatches, titleResults] = await Promise.all([
      categoryModel
        .find({ isActive: true, name: nameRegex })
        .select("_id name slug parent")
        .populate("parent", "name slug isActive")
        .limit(8)
        .lean(),

      config.model.aggregate([
        {
          $search: {
            index: config.index,
            compound: {
              must: [{ autocomplete: { query: cleaned, path: "title" } }],
              filter: [{ equals: { path: "status", value: "active" } }],
            },
          },
        },
        visibilityMatch(config.bannedField),
        { $limit: 6 },
        { $project: { title: 1, price: 1 } },
      ]),
    ]);

    const categories = categoryMatches
      .filter((c) => !c.parent)
      .slice(0, 3)
      .map((c) => ({
        _id: c._id,
        title: c.name,
        slug: c.slug,
        kind: "category",
      }));

    // sub-category tabhi jab uska parent active ho
    const subCategories = categoryMatches
      .filter((c) => c.parent && c.parent.isActive)
      .slice(0, 3)
      .map((c) => ({
        _id: c._id,
        title: c.name,
        slug: c.slug,
        kind: "subcategory",
        parentName: c.parent.name,
        parentSlug: c.parent.slug,
      }));

    const titles = titleResults.map((t) => ({ ...t, kind: "title" }));

    // pehle category, phir sub-category, phir titles
    res.json([...categories, ...subCategories, ...titles]);
  } catch (err) {
    console.error("Suggestion error:", err);
    res.status(500).json({ message: "Failed", error: err.message });
  }
};

module.exports = { search, suggestions };