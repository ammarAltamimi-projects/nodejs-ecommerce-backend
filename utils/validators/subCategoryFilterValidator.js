// const { check } = require("express-validator");
// const Option = require("../../models/filterOptionModel");
// const SubCategory = require("../../models/subCategoryModel");
// const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
// const {
//   ensureDocumentExistsById,
//   ensureAllDocumentsExistByIds,
// } = require("./customValidator");

// exports.createSubCategoryFilterValidator = [
//   check("subCategory")
//     .notEmpty()
//     .withMessage("subCategory id is  required")
//     .isMongoId()
//     .withMessage("Invalid subCategory id format")
//     .custom((val, req) => ensureDocumentExistsById(val, req, SubCategory)),

//   check("options")
//     .notEmpty()
//     .withMessage("options required")
//     .isArray()
//     .withMessage("options is array")
//     .custom((optionsReceived, { req }) =>
//       ensureAllDocumentsExistByIds(optionsReceived, req, Option)
//     ),
//   validatorMiddleware,
// ];

// exports.updateSubCategoryFilterValidator = [
//   check("subCategory")
//     .optional()
//     .isMongoId()
//     .withMessage("Invalid subCategory id format")
//     .custom((val, req) => ensureDocumentExistsById(val, req, SubCategory)),

//   check("options")
//     .optional()
//     .isArray()
//     .withMessage("options is array")
//     .custom((optionsReceived, { req }) =>
//       ensureAllDocumentsExistByIds(optionsReceived, req, Option)
//     ),
//   validatorMiddleware,
// ];

// exports.deleteSubCategoryFilterValidator = [
//   check("id").isMongoId().withMessage("Invalid subcategory filter  format"),
//   validatorMiddleware,
// ];

// exports.getSubCategoryFilterValidator = [
//   check("id").isMongoId().withMessage("Invalid subcategory filter  format"),
//   validatorMiddleware,
// ];
