const { runAutofill } = require("../../services/autofillService");
const { getCategoryTree, validateCategorySelection } = require("../../utils/categoryHelper");

const VALID_CONDITIONS = ["New", "Used", "Open Box"];

// FormData / JSON se khali ya junk value aaye ("", null, "null", "undefined", "N/A") to usay "" maano.
// "" ka matlab: condition is listing par lagti hi nahi (service, job, animal, bird, website...)
const NO_CONDITION = ["", "null", "undefined", "n/a", "na", "not applicable", "none"];

const cleanInputCondition = (value) => {
  if (value === null || value === undefined) return "";
  const v = String(value).trim();
  return NO_CONDITION.includes(v.toLowerCase()) ? "" : v;
};

// Gemini ka jawab ("New", "used", "N/A", "refurbished"...) -> "New" | "Used" | "Open Box" | ""
const cleanOutputCondition = (value) => {
  if (value === null || value === undefined) return "";
  const v = String(value).toLowerCase().trim().replace(/[_-]/g, " ");
  if (v === "refurbished") return "Used";
  const match = VALID_CONDITIONS.find((c) => c.toLowerCase() === v);
  return match || "";
};

/**
 * POST /ai/autofill/ad
 * Body: application/json -> { description, condition? }
 * condition optional hai
 */
async function autofillAd(req, res) {
  try {
    const { description } = req.body;
    const condition = cleanInputCondition(req.body.condition);

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Description is required (min 10 chars)" });
    }

    // Condition dena zaroori nahi, lekin agar di hai to valid honi chahiye
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Condition must be one of: ${VALID_CONDITIONS.join(", ")}`,
      });
    }

    const categoryTree = await getCategoryTree();

    const result = await runAutofill({
      type: "ad",
      description,
      condition,
      categoryTree,
    });

    const validation = validateCategorySelection(categoryTree, result.categoryId, result.subCategoryId);
    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        message: "AI could not confidently match a category. Please select manually.",
        partialData: { ...result, condition: cleanOutputCondition(result.condition) },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        title: result.title,
        description: result.description,
        category: result.categoryId,
        subCategory: result.subCategoryId,
        // Gemini "N/A" de to frontend ko "" milega (condition field khali)
        condition: cleanOutputCondition(result.condition),
        price: result.price, // PKR
      },
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Autofill Ad Error:", error);
    return res.status(500).json({ success: false, message: "AI autofill failed. Please try again." });
  }
}

/**
 * POST /ai/autofill/product
 * Body: application/json -> { description }
 */
async function autofillProduct(req, res) {
  try {
    const { description } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Description is required (min 10 chars)" });
    }

    const categoryTree = await getCategoryTree();

    const result = await runAutofill({
      type: "product",
      description,
      categoryTree,
    });

    const validation = validateCategorySelection(categoryTree, result.categoryId, result.subCategoryId);
    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        message: "AI could not confidently match a category. Please select manually.",
        partialData: result,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        title: result.title,
        description: result.description,
        category: result.categoryId,
        subCategory: result.subCategoryId,
        price: result.price, // PKR
        attributes: result.attributes,
      },
      confidence: result.confidence,
    });
  } catch (error) {
    console.error("Autofill Product Error:", error);
    return res.status(500).json({ success: false, message: "AI autofill failed. Please try again." });
  }
}

module.exports = { autofillAd, autofillProduct };