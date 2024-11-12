const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");
const {
  ensureUniqueModelValue,
  setSlug,
  checkPasswordConfirm,
  checkCurrentPassword,
} = require("./customValidator");

//admin
exports.createUserValidator = [
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
    .isMobilePhone(["ar-YE", "ar-EG", "ar-SA"])
    .withMessage(
      "Invalid phone number only accepted YE,Egy and SA Phone numbers"
    ),
  check("password")
    .notEmpty()
    .withMessage("user password required")
    .isLength({ min: 8 })
    .withMessage("too short password")
    .custom(async (password, { req }) => checkPasswordConfirm(password, req)),
  check("passwordConfirm")
    .notEmpty()
    .withMessage("password confirmation required"),
  validatorMiddleware,
];

exports.updateUserValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short user name")
    .isLength({ max: 32 })
    .withMessage("too long user name")
    .custom((val, { req }) => setSlug(val, req,User)),
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .optional()
    .custom((val, { req }) => ensureUniqueModelValue(val, req,req.params.id, User,{email:val})),
  check("phone")
    .optional()
    .isMobilePhone(["ar-YE", "ar-EG", "ar-SA", "en-IN"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),
  validatorMiddleware,
];

exports.updateUserPasswordValidator = [
  check("id").isMongoId().withMessage("Invalid user id format"),
  check("currentPassword").notEmpty().withMessage("current password required"),
  check("password")
    .notEmpty()
    .withMessage("user password required ")
    .isLength({ min: 6 })
    .withMessage("too short password")
    .custom(async (password, { req }) => checkPasswordConfirm(password, req))
    .custom(async (val, { req }) =>
      checkCurrentPassword(req.body.currentPassword, req, User)
    ),
  check("passwordConfirm").notEmpty().withMessage("user password required "),
  validatorMiddleware,
];

exports.deleteUserValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  validatorMiddleware,
];

exports.getUserValidator = [
  check("id").isMongoId().withMessage("Invalid User id format"),
  validatorMiddleware,
];

//user
exports.updateLoggedUserDataValidator = [
  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short user name")
    .isLength({ max: 32 })
    .withMessage("too long user name")
    .custom((val, { req }) => setSlug(val, req,User)),
  check("email")
    .isEmail()
    .withMessage("Invalid user email format")
    .optional()
    .custom((val, { req }) => ensureUniqueModelValue(val, req, req.params.id,User,{email:val})),
  check("phone")
    .optional()
    .isMobilePhone(["ar-YE", "ar-EG", "ar-SA", "en-IN"])
    .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),
  validatorMiddleware,
];

exports.updateLoggedUserPasswordValidator = [
  check("currentPassword").notEmpty().withMessage("current password required"),
  check("password")
    .notEmpty()
    .withMessage("user password required ")
    .isLength({ min: 6 })
    .withMessage("too short password")
    .custom((password, { req }) => checkPasswordConfirm(password, req))
    .custom(async (val, { req }) =>
      checkCurrentPassword(req.body.currentPassword, req, User)
    ),
  check("passwordConfirm").notEmpty().withMessage("current password required"),
  validatorMiddleware,
];
