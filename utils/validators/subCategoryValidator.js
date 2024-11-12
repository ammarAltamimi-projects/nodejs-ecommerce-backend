const { check, body } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const SubCategory = require("../../models/subCategoryModel");
const Category = require("../../models/categoryModel");
const {
  ensureUniqueModelValue,
  setSlug,
  ensureDocumentExistsById,
  singleImageRequired,
  validateOwnership,
} = require("./customValidator");

exports.validatorCategoryId = [
  check("categoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Category)),
  validatorMiddleware,
];

exports.validatorCategoryIdForSpecificSubcategory = [
  check("categoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Category))
    .custom((val, { req }) =>
      validateOwnership(val, req, SubCategory, "category")
    ),
  validatorMiddleware,
];

exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("subCategory name required")
    .isLength({ min: 2 })
    .withMessage("too short subCategory name")
    .isLength({ max: 32 })
    .withMessage("too long subCategory name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req, false,SubCategory,{name:val}))
    .custom((val, { req }) => setSlug(val, req,SubCategory)),
  check("category")
    .notEmpty()
    .withMessage("category required")
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom((val, {req}) => ensureDocumentExistsById(val, req, Category)),
  check("image").custom((val, { req }) => singleImageRequired(val, req)),

  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid subCategory id format"),
  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("too short subCategory name")
    .isLength({ max: 32 })
    .withMessage("too long subCategory name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req, req.params.id,SubCategory,{name:val}))
    .custom((val, { req }) => setSlug(val, req,SubCategory)),
  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom((val, {req}) => ensureDocumentExistsById(val, req, Category)),
  validatorMiddleware,
];

exports.putSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid subCategory id format"),
  validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid subCategory id format"),
  validatorMiddleware,
];

exports.getSubCategoryValidator = [
  check("id").isMongoId().withMessage("Invalid subCategory id format"),
  validatorMiddleware,
];
