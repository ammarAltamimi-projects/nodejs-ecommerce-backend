const { check } = require("express-validator");
const {
  validatorMiddleware,
} = require("../../middlewares/validatorMiddleware");
const OfferTag = require("../../models/offerTagModel");
const {
  ensureUniqueModelValue,
  setSlug,
  ensureStartDateLessThanExpireDate,
  checkDiscountPercentage,
} = require("./customValidator");

exports.createOfferTagValidator = [
  check("name")
    .notEmpty()
    .withMessage("offerTag required")
    .isLength({ min: 3 })
    .withMessage("too short offerTag name")
    .isLength({ max: 32 })
    .withMessage("too long offerTag name")
    .custom((val, { req }) =>
      ensureUniqueModelValue(val, req, false, OfferTag, { name: val })
    )
    .custom((val, { req }) => setSlug(val, req, OfferTag)),
  check("saleStartDate")
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("start date is Date")
    .custom((val, { req }) =>
      ensureStartDateLessThanExpireDate(val, req, "saleEndDate")
    )
    .notEmpty()
    .withMessage("start date required"),
  check("saleEndDate")
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("end date is Date")
    .isAfter(new Date().toISOString())
    .withMessage("Expiration date must be after the current date")
    .notEmpty()
    .withMessage("expire date required"),
  check("discountType").notEmpty().withMessage("discount Type required"),
  check("discountValue")
    .notEmpty()
    .withMessage("discount Value required")
    .isFloat()
    .withMessage("discount Value must number")
    .custom((val, { req }) => checkDiscountPercentage(val, req)),

  validatorMiddleware,
];

exports.updateOfferTagValidator = [
  check("id").isMongoId().withMessage("Invalid offerTag id format"),
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short offerTag name")
    .isLength({ max: 32 })
    .withMessage("too long offerTag name")
    .custom((val, { req }) =>
      ensureUniqueModelValue(val, req, req.params.id, OfferTag, { name: val })
    )
    .custom((val, { req }) => setSlug(val, req, OfferTag)),
  check("saleStartDate")
    .optional()
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("start date is Date")
    .custom((val, { req }) =>
      ensureStartDateLessThanExpireDate(val, req, "saleEndDate")
    ),
  check("saleEndDate")
    .optional()
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("end date is Date")
    .isAfter(new Date().toISOString())
    .withMessage("Expiration date must be after the current date"),
  check("discountType").optional(),
  check("discountValue")
    .optional()

    .isFloat()
    .withMessage("discount Value must number")
    .custom((val, { req }) => checkDiscountPercentage(val, req)),
  validatorMiddleware,
];

exports.deleteOfferTagValidator = [
  check("id").isMongoId().withMessage("Invalid offerTag id format"),
  validatorMiddleware,
];

exports.getOfferTagValidator = [
  check("id").isMongoId().withMessage("Invalid offerTag id format"),
  validatorMiddleware,
];
