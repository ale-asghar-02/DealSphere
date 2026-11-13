const { z } = require("zod");

const CONDITIONS = ["New", "Used", "Open Box"];
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Gemini kuch bhi bheje (lowercase, null, "N/A", "refurbished"), usko normalize karo.
// null => condition lagti hi nahi (service, job, animal, bird, website wagaira)
const normalizeCondition = (value) => {
  if (value === null || value === undefined) return null;

  const v = String(value).toLowerCase().trim().replace(/[_-]/g, " ");

  if (v === "new") return "New";
  if (v === "used") return "Used";
  if (v === "open box" || v === "openbox") return "Open Box";
  if (v === "refurbished") return "Used"; // model mein refurbished nahi hai

  return null; // "", "n/a", "na", "not applicable" wagaira
};

// Gemini schema categoryId / subCategoryId bhejta hai, form category / subCategory use karta hai.
// Dono naam accept karte hain aur output mein category / subCategory hi milta hai.
const mapIds = (raw) => {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    category: raw.category ?? raw.categoryId,
    subCategory: raw.subCategory ?? raw.subCategoryId,
  };
};

const aiAutofillSchema = z.preprocess(
  mapIds,
  z.object({
    // Ad create validator ke saath same limits, warna autofill pass hoga aur submit par 400 aayega
    title: z.string().min(10).max(120),
    description: z.string().min(30).max(5000),
    category: z.string().regex(OBJECT_ID, "Invalid category id"),
    subCategory: z.string().regex(OBJECT_ID, "Invalid sub-category id"),
    condition: z.preprocess(normalizeCondition, z.enum(CONDITIONS).nullable()),
    price: z.number().positive().max(100000000),
  })
);

module.exports = { aiAutofillSchema };