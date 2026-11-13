const Category = require("../models/categoryModel"); // apna actual path/model name daalein

/**
 * Fetches all categories and builds a nested tree: [{ id, name, subCategories: [{id, name}] }]
 * so AI ko exact valid ObjectId choose karne ke liye milen (hallucination avoid karne ke liye).
 *
 * Category schema field: `parent` (ObjectId, null for top-level categories).
 */
async function getCategoryTree() {
  const allCategories = await Category.find({ isActive: true }, "_id name parent").lean();

  const topLevel = allCategories.filter((c) => !c.parent);
  const subLevel = allCategories.filter((c) => c.parent);

  const tree = topLevel.map((cat) => ({
    id: cat._id.toString(),
    name: cat.name,
    subCategories: subLevel
      .filter((sub) => sub.parent?.toString() === cat._id.toString())
      .map((sub) => ({ id: sub._id.toString(), name: sub.name })),
  }));

  return tree;
}

/**
 * Validates ke AI ne jo categoryId/subCategoryId bheja hai wo actually
 * DB mein exist karta hai aur relationship bhi sahi hai (subCategory usi category ke under hai).
 */
function validateCategorySelection(tree, categoryId, subCategoryId) {
  const category = tree.find((c) => c.id === categoryId);
  if (!category) return { valid: false, reason: "Invalid categoryId returned by AI" };

  const subCategory = category.subCategories.find((s) => s.id === subCategoryId);
  if (!subCategory) return { valid: false, reason: "Invalid subCategoryId returned by AI" };

  return { valid: true };
}

module.exports = { getCategoryTree, validateCategorySelection };