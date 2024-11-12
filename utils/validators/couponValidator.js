const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Coupon = require("../../models/couponModel");
const Store = require("../../models/storeModel");
const { ensureUniqueModelValue,validateUserOwnership,validateReferenceOwnership,ensureStartDateLessThanExpireDate } = require("./customValidator");

exports.createCouponValidator = [
  check("name")
    .notEmpty()
    .withMessage("coupon required")
    .isLength({ min: 2 })
    .withMessage("too short coupon name")
    .isLength({ max: 50 })
    .withMessage("too long coupon name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req, false,Coupon,{name:val})),
    check("start")
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("start date is Date")
    .custom((val, { req }) => ensureStartDateLessThanExpireDate(val, req,"expire"))
    .notEmpty()
    .withMessage("start date required"),
  check("expire")
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("coupon is Date")
    .isAfter(new Date().toISOString())
    .withMessage("Expiration date must be after the current date")
    .notEmpty()
    .withMessage("expire date required"),
    check("store")
    .notEmpty()
    .withMessage("store required")
    .isMongoId()
    .withMessage("Invalid store id format")
    .custom(async (storeId, { req }) =>
          validateUserOwnership(storeId, req, Store)
        ),
  check("discount")
    .isInt({ min: 0, max: 100 })
    .withMessage("discount percentage must be betwenn 0 and 100")
    .notEmpty()
    .withMessage("discount percentage required"),
  validatorMiddleware,
];

exports.updateCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon id format")
       .custom(async (id, { req }) =>
            validateReferenceOwnership(id, req, Coupon,"store")
          ),
  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short coupon name")
    .isLength({ max: 50 })
    .withMessage("too long coupon name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req, req.params.id,Coupon,{name:val})),
    check("start")
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("start date is Date")
    .custom((val, { req }) => ensureStartDateLessThanExpireDate(val, req,"expire"))
    .optional(),
  check("expire")
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("coupon is Date")
    .isAfter(new Date().toISOString())
    .withMessage("Expiration date must be after the current date")
    .optional(),
    check("store")
    .optional()
    .isMongoId()
    .withMessage("Invalid store id format")
    .custom(async (storeId, { req }) =>
      validateUserOwnership(storeId, req, Store)
    ),
  check("discount")
    .isInt({ min: 0, max: 100 })
    .withMessage("discount percentage must be betwenn 0 and 100")
    .optional(),
  validatorMiddleware,
];

exports.deleteCouponValidator = [
  check("id").isMongoId().withMessage("Invalid coupon id format")
  .custom(async (id, { req }) =>
    validateReferenceOwnership(id, req, Coupon,"store")
  ),
  validatorMiddleware,
];

exports.getCouponValidator = [
  check("id").isMongoId().withMessage("Invalid coupon id format"),
  validatorMiddleware,
];

exports.getStoreCouponsValidator = [
  check("storeId").isMongoId().withMessage("Invalid store id format")
  .custom(async (storeId, { req }) =>
    validateUserOwnership(storeId, req, Store)
  ),
  validatorMiddleware,
];
