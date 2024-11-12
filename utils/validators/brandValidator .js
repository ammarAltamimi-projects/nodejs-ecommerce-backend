const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Brand = require("../../models/brandModel");
const {
  ensureUniqueModelValue,
  setSlug,
  singleImageRequired,
  ensureDocumentExistsById,
  ensureDocumentBelongToParent,
  ensureAllDocumentsExistByIds,
  ensureAllDocumentsBelongToParent,
} = require("./customValidator");
const Category = require("../../models/categoryModel");
const SubCategory = require("../../models/subCategoryModel");

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("brand required")
    .isLength({ min: 3 })
    .withMessage("too short brand name")
    .isLength({ max: 32 })
    .withMessage("too long brand name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,false, Brand,{name:val}))
    .custom((val, { req }) => setSlug(val, req,Brand)),
  check("image").custom((val, { req }) => singleImageRequired(val, req)),
  check("category")
    .notEmpty()
    .withMessage("category required")
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Category)),
  check("subCategories")
    .notEmpty()
    .withMessage("subcategories required")
    .isArray()
    .withMessage("subcategories is array")
    .custom((subcategoriesReceived, { req }) =>
      ensureAllDocumentsExistByIds(subcategoriesReceived, req, SubCategory)
    )
    .custom(async (subcategoriesReceived, { req }) =>
      ensureAllDocumentsBelongToParent(
        subcategoriesReceived,
        req,
        SubCategory,
        {
          category: req.body.category,
        },
        req.body.category
      )
    ),
  check("subCategories.*")
    .isMongoId()
    .withMessage("Invalid subCategory id format"),
  validatorMiddleware,
];

exports.updateBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand id format"),
  check("name")
    .optional()
    .isLength({ min: 3 })
    .withMessage("too short brand name")
    .isLength({ max: 32 })
    .withMessage("too long brand name")
    .custom((val, { req }) => ensureUniqueModelValue(val, req,req.params.id, Brand,{name:val}))
    .custom((val, { req }) => setSlug(val, req,Brand)),
  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Category)),

  check("subCategories")
    .optional()
    .isArray()
    .withMessage("subcategories is array")
    .custom((subcategoriesReceived, { req }) =>
      ensureAllDocumentsExistByIds(subcategoriesReceived, req, SubCategory)
    )
    .custom(async (subcategoriesReceived, { req }) =>
      ensureAllDocumentsBelongToParent(
        subcategoriesReceived,
        req,
        SubCategory,
        {
          category: req.body.category,
        },
        req.body.category
      )
    ),
  check("subCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid subCategory id format"),

  validatorMiddleware,
];

exports.deleteBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand id format"),
  validatorMiddleware,
];

exports.getBrandValidator = [
  check("id").isMongoId().withMessage("Invalid brand id format"),
  validatorMiddleware,
];
