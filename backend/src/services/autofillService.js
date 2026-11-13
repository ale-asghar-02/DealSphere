const { Type } = require("@google/genai");
const config = require("../configs/config");
const { generate } = require("../configs/aiClient");

/* ------------------------------------------------------------------ */
/* AI AUTOFILL (Ad / Product) - Gemini                                */
/* ------------------------------------------------------------------ */

const adSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "10-120 characters, catchy and descriptive" },
    description: {
      type: Type.STRING,
      description: "30-5000 characters, rewritten clean & professional based on seller's input",
    },
    categoryId: { type: Type.STRING, description: "Must be one of the provided category ids" },
    subCategoryId: { type: Type.STRING, description: "Must be one of the provided subCategory ids" },
    // Schema mein null allowed nahi hota, is liye "N/A" option rakha hai.
    // Services, jobs, animals, birds, websites, digital work => "N/A"
    condition: {
      type: Type.STRING,
      enum: ["New", "Used", "Open Box", "N/A"],
      description:
        'Use "N/A" when condition does not apply (services, jobs, animals, birds, websites, digital work).',
    },
    price: {
      type: Type.NUMBER,
      description: "Estimated fair current resale market price in PAKISTANI RUPEES (PKR) based on the SPECIFIC item/model mentioned and its condition. Always a real numeric estimate in PKR, never 0, never in USD.",
    },
    confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
  },
  required: [
    "title",
    "description",
    "categoryId",
    "subCategoryId",
    "condition",
    "price",
    "confidence",
  ],
};

const productSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    categoryId: { type: Type.STRING },
    subCategoryId: { type: Type.STRING },
    price: {
      type: Type.NUMBER,
      description: "Estimated fair current resale market price in PAKISTANI RUPEES (PKR) based on the SPECIFIC item/model mentioned. Always a real numeric estimate in PKR, never 0, never in USD.",
    },
    attributes: {
      type: Type.ARRAY,
      description: "Relevant spec key-value pairs based on category, e.g. RAM, Color, Material",
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ["key", "value"],
      },
    },
    confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
  },
  required: [
    "title",
    "description",
    "categoryId",
    "subCategoryId",
    "price",
    "attributes",
    "confidence",
  ],
};

function buildSystemPrompt(type) {
  return `You are an assistant that helps auto-fill an online marketplace ${type} listing form for a
Pakistan-based marketplace. You will receive: the seller's raw description text${
    type === "ad" ? ", the item's condition (it may be missing)" : ""
  }, and a list of valid
categories with their subCategories (with ids).
${
  type === "ad"
    ? `
CONDITION: For services, jobs, animals, birds, websites, digital work or anything where condition does not
apply, return "condition": "N/A". Only return New / Used / Open Box when the item is a physical product
whose condition really makes sense. If the seller did not specify a condition and the item is a physical
product, infer the most likely one from the description.
`
    : ""
}
Rules:
- You MUST choose categoryId and subCategoryId ONLY from the provided list. Never invent an id.
- Rewrite the description to be clean, clear, and professional, but keep all facts the seller mentioned.
- The title must be at least 10 characters and the description at least 30 characters.
- PRICE: The price MUST be in PAKISTANI RUPEES (PKR), NOT USD or any other currency. Identify the SPECIFIC
  product/model from the description (e.g. "iPhone 13 Pro Max" is a different, more expensive item than a
  plain "iPhone 13" - do not confuse similarly named models). Estimate based on the current realistic resale
  value of that exact model in the Pakistani market (e.g. a used iPhone 13 Pro Max in Pakistan typically
  resells in the hundreds of thousands of PKR, not tens of thousands - think in terms of local market pricing,
  not a naive USD-to-PKR conversion of a global average).${
    type === "ad" ? " Adjust down for Used/Open Box vs New." : ""
  } Never return
  a generic/low placeholder number - it must reflect the actual item named and be a realistic PKR figure.
- If you are not confident about the category match, set confidence to "low" and pick the closest match anyway.
- Respond ONLY with the JSON object. Do not add any extra commentary.`;
}

function buildUserText({ description, condition, categoryTree, type }) {
  const conditionText = condition
    ? `"${condition}"`
    : "not specified (condition may not apply to this listing)";

  return `Seller description: """${description}"""
${type === "ad" ? `\nItem condition: ${conditionText}\n` : ""}
Available categories (choose id strictly from here):
${JSON.stringify(categoryTree, null, 2)}

Listing type: ${type}`;
}

async function runAutofill({ type, description, condition, categoryTree }) {
  const schema = type === "product" ? productSchema : adSchema;

  const textPrompt = buildUserText({
    description,
    condition,
    categoryTree,
    type,
  });

  const response = await generate({
    model: config.GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: textPrompt }] }],
    config: {
      systemInstruction: buildSystemPrompt(type),
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.4,
      maxOutputTokens: 2048,
      // gemini-2.5-flash has "thinking" ON by default, and thinking tokens are deducted
      // from maxOutputTokens - this can silently truncate the JSON output. This task is
      // simple extraction, no deep reasoning needed, so we disable thinking entirely.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason;
  const raw = response.text;

  if (!raw) {
    throw new Error(`Gemini returned no text. finishReason: ${finishReason}`);
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Gemini response was not valid JSON (finishReason: ${finishReason}). Raw (first 300 chars): ${raw.slice(0, 300)}`
    );
  }
}

module.exports = { runAutofill };