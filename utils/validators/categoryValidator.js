const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Category = require("../../models/categoryModel");
const {
  ensureUniqueModelValue,
  setSlug,
  singleImageRequired,
} = require("./customValidator");

exports.createCategoryValidator = [
  check("name")
  .trim()
    .notEmpty()
    .withMessage("category required")
    .isLength({ min: 3 })
    .withMessage("too short category name")
    .isLength({ max: 32 })
    .withMessage("too long category name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,false, Category,{name:val}))
    .custom((val, { req }) => setSlug(val, req,Category)),
  check("image")
  .custom((val, { req }) => singleImageRequired(val, req)),

  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category id format"),
  check("name")
  .trim()
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short category name")
    .isLength({ max: 32 })
    .withMessage("too long category name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,req.params.id, Category,{name:val}))
    .custom((val, { req }) => setSlug(val, req,Category)),
  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category id format"),
  validatorMiddleware,
];

exports.getCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid category id format"),
  validatorMiddleware,
];
