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

const validateContact = [
  body('name')
    .notEmpty().withMessage('Name is required').bail()
    .isString().withMessage('Name must be a string').bail()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Please provide a valid email').bail()
    .normalizeEmail(),

  body('subject')
    .notEmpty().withMessage('Subject is required').bail()
    .isString().withMessage('Subject must be a string').bail()
    .isLength({ min: 3, max: 150 }).withMessage('Subject must be between 3 and 150 characters'),

  body('message')
    .notEmpty().withMessage('Message is required').bail()
    .isString().withMessage('Message must be a string').bail()
    .isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),

    validateResult
];

module.exports = { validateContact };