const { z } = require("zod");
const AppError = require("../utils/AppError");
const { PURPOSES, PRESET_COLORS, LIMITS } = require("../configs/designConfig");

const FIELD = LIMITS.FIELD_MAX;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

// "" ya null ko "diya hi nahi" samajhte hain
const blankToUndefined = (v) => {
  if (v === null) return undefined;
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
};

const optionalText = (max) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, `Maximum ${max} characters`).optional());

const optionalPrice = z.preprocess(
  (v) => {
    v = blankToUndefined(v);
    return typeof v === "string" ? Number(v.replace(/,/g, "")) : v;
  },
  z.number().min(0, "Price can't be negative").max(100000000, "Price is too large").optional()
);

const optionalFeatures = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return undefined;
    return Array.isArray(v) ? v.map((f) => (typeof f === "string" ? f.trim() : f)).filter((f) => f !== "") : v;
  },
  z
    .array(z.string().max(FIELD.feature, `Each feature can be at most ${FIELD.feature} characters`))
    .max(LIMITS.MAX_FEATURES, `Maximum ${LIMITS.MAX_FEATURES} features`)
    .optional()
);

const toHex = (v) => {
  const m = v.match(/^#?([0-9a-f]{6})$/i);
  if (m) return `#${m[1].toUpperCase()}`;
  return PRESET_COLORS.find((c) => c.key === v.toLowerCase())?.hex || null;
};

// "#c8102e" ya preset naam ("red") dono chalte hain; hamesha HEX bana kar milta hai
const color = z
  .string()
  .trim()
  .refine((v) => toHex(v) !== null, "Invalid color")
  .transform((v) => toHex(v));

/* ------------------------------------------------------------------ */
/* Schemas                                                            */
/* ------------------------------------------------------------------ */
const idParams = z.object({ id: objectId });
const versionParams = z.object({ id: objectId, versionId: objectId });

const createSessionBody = z.object({
  prompt: z
    .string({ error: "Prompt is required" })
    .trim()
    .min(LIMITS.MIN_PROMPT_LENGTH, `Prompt must be at least ${LIMITS.MIN_PROMPT_LENGTH} characters`)
    .max(LIMITS.MAX_PROMPT_LENGTH, `Prompt can be at most ${LIMITS.MAX_PROMPT_LENGTH} characters`),
});

const answerBody = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("purpose"),
    purpose: z.enum(Object.keys(PURPOSES), { error: "Invalid purpose" }),
  }),
  z.object({
    step: z.literal("color"),
    // Pehle duplicates hatate hain ("red" aur "#C8102E" ek hi rang hain), phir ginti ki hadd dekhte hain
    colors: z
      .array(color)
      .transform((arr) => [...new Set(arr)])
      .refine((arr) => arr.length >= 1, "Choose at least one color")
      .refine((arr) => arr.length <= LIMITS.MAX_COLORS, `Choose at most ${LIMITS.MAX_COLORS} colors`),
  }),
  z.object({
    step: z.literal("content"),
    title: z
      .string({ error: "Title is required" })
      .trim()
      .min(1, "Title is required")
      .max(FIELD.title, `Title can be at most ${FIELD.title} characters`),
    tagline: optionalText(FIELD.tagline),
    price: optionalPrice,
    discount: optionalText(FIELD.discount),
    description: optionalText(FIELD.description),
    features: optionalFeatures,
    cta: optionalText(FIELD.cta),
    contact: optionalText(FIELD.contact),
  }),
]);

const editBody = z.object({
  instruction: z
    .string({ error: "Please describe the change you want" })
    .trim()
    .min(3, "Please describe the change you want")
    .max(LIMITS.MAX_EDIT_INSTRUCTION_LENGTH, `Maximum ${LIMITS.MAX_EDIT_INSTRUCTION_LENGTH} characters`),
  versionId: objectId.optional(),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const purchaseBody = z.object({
  planName: z.enum(["monthly", "yearly"], { error: "Invalid plan selected" }),
});

/* ------------------------------------------------------------------ */
/* Middleware                                                         */
/* ------------------------------------------------------------------ */
/**
 * validate({ params, query, body })
 * Express 5 mein req.query sirf parhne ke liye hai, isliye saaf kiya hua data req.validated mein milta hai:
 * req.validated.params / .query / .body
 */
const validate = (schemas) => (req, res, next) => {
  const out = {};

  for (const key of ["params", "query", "body"]) {
    if (!schemas[key]) continue;

    const result = schemas[key].safeParse(req[key] ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue.path.join(".");
      return next(new AppError(field && field !== "step" ? `${field}: ${issue.message}` : issue.message, 400));
    }
    out[key] = result.data;
  }

  req.validated = out;
  next();
};

module.exports = {
  validate,
  schemas: { idParams, versionParams, createSessionBody, answerBody, editBody, listQuery, purchaseBody },
};