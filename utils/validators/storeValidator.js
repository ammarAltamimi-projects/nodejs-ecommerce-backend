const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");
const Store = require("../../models/storeModel");
const {
  ensureUniqueModelValue,
  setSlug,
  allFieldsImagesRequired,
  ensureDocumentExistsById,
  validateUserOwnership,
  isTimeMinLessThanTimeMax
} = require("./customValidator");

exports.createStoreValidator = [
  check("name")
    .notEmpty()
    .withMessage("Store required")
    .isLength({ min: 3 })
    .withMessage("too short Store name")
    .isLength({ max: 32 })
    .withMessage("too long Store name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,false,Store,{name:val}))
    .custom((val, { req }) => setSlug(val, req,Store)),
  check("description")
    .notEmpty()
    .withMessage("Store description required")
    .isLength({ min: 10 })
    .withMessage("too short Store description")
    .isLength({ max: 500 })
    .withMessage("too long Store description"),
  check("ratingsAverage").optional().isFloat({ min: 1, max: 5 }),
  check("ratingsQuantity").optional().isInt(),
  check("user")
    .optional()
    .isMongoId()
    .withMessage("Invalid user id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, User)),
  check("email")
    .isEmail()
    .withMessage("Invalid Store email format")
    .notEmpty()
    .withMessage("Store email required")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,false, Store,{email:val})),
  check("phone")
    .isMobilePhone(["ar-YE", "ar-EG", "ar-SA"])
    .withMessage(
      "Invalid phone number only accepted YE,Egy and SA Phone numbers"
    ),
  check("imageCover").custom((val, { req }) =>
    allFieldsImagesRequired(val, req,["imageCover","images"])
  ),

  check("defaultDeliveryTimeMin").optional().isFloat()
  .custom((val, { req }) => isTimeMinLessThanTimeMax(val, req)),

  check("defaultDeliveryTimeMax").optional().isFloat(),
  validatorMiddleware,
];

exports.updateStoreValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Store id format")
    .custom(async (storeId, { req }) =>
      validateUserOwnership(storeId, req, Store)
    ),
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short Store name")
    .isLength({ max: 32 })
    .withMessage("too long Store name")
    .custom((val, { req }) => ensureUniqueModelValue(val,req.params.id, req, Store,{name:val}))
    .custom((val, { req }) => setSlug(val, req,Store)),
  check("description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("too short Store description")
    .isLength({ max: 500 })
    .withMessage("too long Store description"),
  check("ratingsAverage").optional().isFloat({ min: 1, max: 5 }),
  check("ratingsQuantity").optional().isInt(),
  check("user")
    .optional()
    .isMongoId()
    .withMessage("Invalid user id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, User)),
  check("email")
    .isEmail()
    .withMessage("Invalid Store email format")
    .optional()
    .custom((val, { req }) => ensureUniqueModelValue(val, req, req.params.id,Store,{email:val})),
  check("phone")
    .optional()
    .isMobilePhone(["ar-YE", "ar-EG", "ar-SA"])
    .withMessage(
      "Invalid phone number only accepted YE,Egy and SA Phone numbers"
    ),
      check("defaultDeliveryTimeMin").optional().isFloat()
      .custom((val, { req }) => isTimeMinLessThanTimeMax(val, req)),
    
      check("defaultDeliveryTimeMax").optional().isFloat(),

  validatorMiddleware,
];

exports.deleteStoreValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom(async (storeId, { req }) => {
      if (req.user.role === "seller") {
        await validateUserOwnership(storeId, req, Store);
      }
      return true;
    }),
  validatorMiddleware,
];

exports.getStoreValidator = [
  check("slug").notEmpty().withMessage("slug is required"),
  validatorMiddleware,
];

exports.updateFollowingUserValidator = [
  check("id").isMongoId().withMessage("Invalid Store id format"),
  validatorMiddleware,
];


exports.updateStoreStatusValidator = [
  check("id").isMongoId().withMessage("Invalid Store id format"),
  check("status")
  .notEmpty()
  .withMessage("status required"),
  validatorMiddleware,
];