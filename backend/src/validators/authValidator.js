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

const validateRegister = [
  body('username')
    .notEmpty().withMessage('Username is required').bail()
    .isString().withMessage('Username must be a string').bail()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Invalid email address').bail()
    .isString().withMessage('Email must be a string').bail()
    .isLength({ min: 8 }).withMessage('Email must be at least 8 characters long'),
  body('password')
    .notEmpty().withMessage('Password is required').bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateResult,
];

const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Invalid email address').bail()
    .isString().withMessage('Email must be a string').bail()
    .isLength({ min: 8 }).withMessage('Email must be at least 8 characters long'),
  body('password')
    .notEmpty().withMessage('Password is required').bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateResult,
];

const validateVerifyOtp = [
  body('email')
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Invalid email address').bail(),
  body('otp')
    .notEmpty().withMessage('OTP is required').bail()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').bail()
    .isNumeric().withMessage('OTP must contain only numbers'),
  validateResult,
];

const validateResetPassword = [
  body('newPassword')
    .notEmpty().withMessage('Password is required').bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required').bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validateResult,
];

module.exports = { validateRegister, validateLogin, validateVerifyOtp, validateResetPassword };