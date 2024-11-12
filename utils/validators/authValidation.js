const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");
const {
  ensureUniqueModelValue,
  setSlug,
  checkPasswordConfirm,
  check6DigitsResetCode,
} = require("./customValidator");

exports.signUpValidator = [
  check("name")
    .notEmpty()
    .withMessage("user name required ")
    .isLength({ min: 2 })
    .withMessage("too short user name")
    .isLength({ max: 32 })
    .withMessage("too long user name")
    .custom((val, { req }) => setSlug(val, req,User)),
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .notEmpty()
    .withMessage("user email required")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,false, User,{email:val})),
  check("phone")
    .isMobilePhone(["ar-YE", "ar-EG", "ar-SA", "en-IN"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),
  check("password")
    .notEmpty()
    .withMessage("user password required")
    .isLength({ min: 6 })
    .withMessage("too short password")
    .custom(async (password, { req }) => checkPasswordConfirm(password, req)),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("password confirmation required"),
  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .notEmpty()
    .withMessage("user email required"),
  check("password")
    .notEmpty()
    .withMessage("user password required")
    .isLength({ min: 6 })
    .withMessage("too short password"),
  validatorMiddleware,
];

exports.forgetPasswordValidator = [
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .notEmpty()
    .withMessage("user email required"),
  validatorMiddleware,
];

exports.verifyPassResetCodeValidator = [
  check("resetCode")
    .notEmpty()
    .withMessage("reset code required")
    .custom(async (resetCode, { req }) =>
      check6DigitsResetCode(resetCode, req)
    ),
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .notEmpty()
    .withMessage("user email required"),
  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .notEmpty()
    .withMessage("user email required"),
  check("password")
    .notEmpty()
    .withMessage("user password required ")
    .isLength({ min: 6 })
    .withMessage("too short password")
    .custom(async (password, { req }) => checkPasswordConfirm(password, req)),
  check("passwordConfirm").notEmpty().withMessage("user password required "),
  validatorMiddleware,
];
