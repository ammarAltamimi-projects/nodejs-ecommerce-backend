const { check } = require("express-validator");
const {
  validatorMiddleware,
} = require("../../middlewares/validatorMiddleware");
const {
  ensureStartDateLessThanExpireDateInArray,
} = require("./customValidator");

exports.updateBannerValidator = [
  check("bannerDetails")
    .custom((value) => Array.isArray(value) && value.length > 0)
    .withMessage("enter the bannerDetails"),
  check("bannerDetails.*.startDate")
    .optional()
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("start date is Date")
    .custom((val, { req , path}) =>
      ensureStartDateLessThanExpireDateInArray(val, req,path, "endDate")
    ),
  check("bannerDetails.*.endDate")
    .optional()
    .isDate({ format: "MM/DD/YYYY" })
    .withMessage("endDate is Date")
    .isAfter(new Date().toISOString())
    .withMessage("Expiration date must be after the current date"),
  validatorMiddleware,
];
