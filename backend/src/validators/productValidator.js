const { body, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

// Runs after the rule chain and forwards the first error to AppError
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  next();
};

// multipart/form-data sends nested fields (contactInfo, attributes) as raw
// JSON strings, not objects — parse them before the rule chain runs so
// dot-path checks like "contactInfo.phoneNumber" actually work
const parseJsonFields = (fields) => (req, res, next) => {
  for (const field of fields) {
    if (req.body[field] && typeof req.body[field] === "string") {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        return next(new AppError(`${field} must be valid JSON`, 400));
      }
    }
  }
  next();
};

const validateCreateProduct = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 10, max: 120 })
    .withMessage("Title must be between 10 and 120 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 30, max: 5000 })
    .withMessage("Description must be between 30 and 5000 characters"),

  body("category").notEmpty().withMessage("Category is required").isMongoId().withMessage("Category must be a valid id"),

  body("subCategory").notEmpty().withMessage("Sub category is required").isMongoId().withMessage("Sub category must be a valid id"),

  body("price").notEmpty().withMessage("Price is required").isFloat({ min: 0 }).withMessage("Price must be a positive number"),

  body("isPriceNegotiable").optional().isBoolean().withMessage("isPriceNegotiable must be a boolean"),

  body("country").trim().notEmpty().withMessage("Country is required"),

  body("city").trim().notEmpty().withMessage("City is required"),

  body("contactInfo.phoneNumber").trim().notEmpty().withMessage("Phone number is required"),

  body("contactInfo.showPhone").optional().isBoolean().withMessage("showPhone must be a boolean"),

  body("contactInfo.chatOnly").optional().isBoolean().withMessage("chatOnly must be a boolean"),

  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

  body("attributes").optional().isArray().withMessage("Attributes must be an array"),

  handleValidationErrors,
];

const validateUpdateProduct = [
  body("title").optional().trim().isLength({ min: 10, max: 120 }).withMessage("Title must be between 10 and 120 characters"),

  body("description").optional().trim().isLength({ min: 30, max: 5000 }).withMessage("Description must be between 30 and 5000 characters"),

  body("category").optional().isMongoId().withMessage("Category must be a valid id"),

  body("subCategory").optional().isMongoId().withMessage("Sub category must be a valid id"),

  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),

  body("isPriceNegotiable").optional().isBoolean().withMessage("isPriceNegotiable must be a boolean"),

  body("country").optional().trim().notEmpty().withMessage("Country cannot be empty"),

  body("city").optional().trim().notEmpty().withMessage("City cannot be empty"),

  body("contactInfo.phoneNumber").optional().trim().notEmpty().withMessage("Phone number cannot be empty"),

  body("contactInfo.showPhone").optional().isBoolean().withMessage("showPhone must be a boolean"),

  body("contactInfo.chatOnly").optional().isBoolean().withMessage("chatOnly must be a boolean"),

  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

  body("attributes").optional().isArray().withMessage("Attributes must be an array"),

  handleValidationErrors,
];

const validateUpdateStock = [
  body("action")
    .trim()
    .notEmpty()
    .withMessage("Action is required")
    .isIn(["increase", "decrease", "set"])
    .withMessage("Action must be increase, decrease or set"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),

  handleValidationErrors,
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateStock,
  parseJsonFields,
};