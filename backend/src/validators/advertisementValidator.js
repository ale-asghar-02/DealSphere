const { body, validationResult } = require('express-validator');

function validateResult(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

// FormData mein khali / null value string ban kar aati hai ("", "null", "undefined", "N/A").
// Yahan unko "" bana dete hain taake condition optional ho (animal, bird, website, job, service...).
// Agar field bheji hi nahi gayi (undefined) to usay touch nahi karte, update mein purani value rahe gi.
const JUNK_VALUES = ['', 'null', 'undefined', 'n/a', 'na', 'not applicable', 'none'];

function normalizeAdBody(req, res, next) {
  if (req.body && req.body.condition !== undefined) {
    const raw = req.body.condition;
    const v = raw === null ? '' : String(raw).trim();
    req.body.condition = JUNK_VALUES.includes(v.toLowerCase()) ? '' : v;
  }
  next();
}

// checkFalsy: true => "" ho to bhi optional maana jaye (v6 aur v7 dono mein chalta hai)
const conditionRule = body('condition')
  .optional({ checkFalsy: true })
  .isIn(['New', 'Used', 'Open Box'])
  .withMessage('Condition must be New, Used, or Open Box');

const validateCreateAds = [
  normalizeAdBody,

  body('title')
    .notEmpty().withMessage('Title is required').bail()
    .isString().withMessage('Title must be a string').bail()
    .isLength({ min: 10, max: 120 }).withMessage('Title must be between 10 and 120 characters'),

  body('description')
    .notEmpty().withMessage('Description is required').bail()
    .isString().withMessage('Description must be a string').bail()
    .isLength({ min: 30, max: 5000 }).withMessage('Description must be between 30 and 5000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required').bail()
    .isMongoId().withMessage('Category must be a valid ID'),

  body('subCategory')
    .notEmpty().withMessage('Sub-category is required').bail()
    .isMongoId().withMessage('Sub-category must be a valid ID'),

  conditionRule,

  body('price')
    .notEmpty().withMessage('Price is required').bail()
    .isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0'),

  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required').bail()
    .isString().withMessage('Phone number must be a string').bail()
    .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10 to 15 digits'),

  body('phoneNumberStatus')
    .optional()
    .isIn(['show', 'hide']).withMessage('Phone number status must be show or hide'),

  body('country')
    .notEmpty().withMessage('Country is required').bail()
    .isString().withMessage('Country must be a string'),

  body('city')
    .notEmpty().withMessage('City is required').bail()
    .isString().withMessage('City must be a string'),

  body('address')
    .notEmpty().withMessage('Address is required').bail()
    .isString().withMessage('Address must be a string').bail()
    .isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),

  // Images multer se aati hain (req.files), body() se check nahi ho sakti,
  // isliye custom check laga rahe hain
  body('adsImages').custom((value, { req }) => {
    if (!req.files || req.files.length === 0) {
      throw new Error('At least one image is required');
    }
    return true;
  }),

  validateResult,
];

const validateUpdateAds = [
  normalizeAdBody,

  body('title')
    .optional()
    .isString().withMessage('Title must be a string').bail()
    .isLength({ min: 10, max: 120 }).withMessage('Title must be between 10 and 120 characters'),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string').bail()
    .isLength({ min: 30, max: 5000 }).withMessage('Description must be between 30 and 5000 characters'),

  body('category')
    .optional()
    .isMongoId().withMessage('Category must be a valid ID'),

  body('subCategory')
    .optional()
    .isMongoId().withMessage('Sub-category must be a valid ID'),

  conditionRule,

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0'),

  body('phoneNumber')
    .optional()
    .isString().withMessage('Phone number must be a string').bail()
    .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10 to 15 digits'),

  body('phoneNumberStatus')
    .optional()
    .isIn(['show', 'hide']).withMessage('Phone number status must be show or hide'),

  body('country')
    .optional()
    .isString().withMessage('Country must be a string'),

  body('city')
    .optional()
    .isString().withMessage('City must be a string'),

  body('address')
    .optional()
    .isString().withMessage('Address must be a string').bail()
    .isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),

  validateResult,
];

module.exports = { validateCreateAds, validateUpdateAds };