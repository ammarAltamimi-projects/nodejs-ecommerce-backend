const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Country = require("../../models/countryModel");
const Address = require("../../models/addressModel");
const {
  ensureUniqueDefaultUser,
  ensureDocumentExistsById,
  validateUserOwnership,
  ensureUniqueUserAddressAlias
} = require("./customValidator");

exports.addToAddressValidator = [
  check("firstName")
  .notEmpty()
  .withMessage("firstName is required"),
  check("lastName")
  .notEmpty()
  .withMessage("lastName is required"),
  check("phone")
  .notEmpty()
  .withMessage("phone number is required")
  .isMobilePhone(["ar-YE", "ar-EG", "ar-SA", "en-IN"])
  .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),
  check("alias")
    .notEmpty()
    .withMessage("alias is required")
    .isLength({ min: 2 })
    .withMessage("too short alias address ")
    .isLength({ max: 10 })
    .withMessage("too long alias address ")
    .custom(async (val, { req }) => ensureUniqueUserAddressAlias(val,req, Address)),
  check("address1")
    .notEmpty()
    .withMessage("address1 is required")
    .isLength({ min: 5 })
    .withMessage("too short address1  ")
    .isLength({ max: 256 })
    .withMessage("too long address1  "),
    check("state")
    .notEmpty()
    .withMessage("state is required")
    .isLength({ min: 2 })
    .withMessage("too short state address ")
    .isLength({ max: 50 })
    .withMessage("too long state address "),
  check("city")
    .notEmpty()
    .withMessage("city is required")
    .isLength({ min: 2 })
    .withMessage("too short city address ")
    .isLength({ max: 50 })
    .withMessage("too long city address "),
    check("country")
    .notEmpty()
    .withMessage("country required")
    .isMongoId()
    .withMessage("Invalid country id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Country)),
  check("postalCode")
    .notEmpty()
    .withMessage("postal code is required")
    .isPostalCode("US")
    .withMessage("postal code is wrong"),
  validatorMiddleware,
];

exports.updateAddressValidator = [
  check("id")
  .isMongoId()
  .withMessage("Invalid address id format")
  .custom(async (val, { req }) =>  validateUserOwnership(val, req, Address)),
  check("firstName")
  .optional(),
  check("lastName")
  .optional(),
  check("phone")
  .optional()
  .isMobilePhone(["ar-YE", "ar-EG", "ar-SA", "en-IN"])
  .withMessage("Invalid phone number only accepted Egy and SA Phone numbers"),
  check("alias")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short alias address ")
    .isLength({ max: 10 })
    .withMessage("too long alias address ")
    .custom(async (val, { req }) => ensureUniqueUserAddressAlias(val,req, Address)),

  check("address1")
    .optional()
    .isLength({ min: 5 })
    .withMessage("too short address1  ")
    .isLength({ max: 256 })
    .withMessage("too long address1  "),
    check("state")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short state address ")
    .isLength({ max: 50 })
    .withMessage("too long state address "),
  check("city")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short city address ")
    .isLength({ max: 50 })
    .withMessage("too long city address "),
    check("country")
    .optional()
    .isMongoId()
    .withMessage("Invalid country id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Country)),
  check("postalCode")
    .optional()
    .isPostalCode("US")
    .withMessage("postal code is wrong"),
  validatorMiddleware,
];
exports.deleteAddressValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid address id format")
    .custom(async (val, { req }) =>  validateUserOwnership(val, req, Address)),
  validatorMiddleware,
];

exports.updateToDefaultAddressValidator = [
  check("addressId")
    .isMongoId()
    .withMessage("Invalid address id format")
    .custom(async (val, { req }) =>  validateUserOwnership(val, req, Address))
    .custom(async (val, { req }) =>  ensureUniqueDefaultUser(val, req, Address)),
  validatorMiddleware,
];
