const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Product = require("../../models/productModel");
const User = require("../../models/userModel");
const { ensureDocumentExistsById,ensureSubDocumentExistsById } = require("./customValidator");

exports.createHistoryValidator = [
  check("productId")
    .isMongoId()
    .withMessage("Invalid product id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Product)),
      check("variantId").isMongoId().withMessage("Invalid variant id format"),
  validatorMiddleware,
];

exports.deleteHistoryValidator = [
  check("historyId")
    .isMongoId()
    .withMessage("Invalid history Id format")
    .custom((val, { req }) => ensureSubDocumentExistsById(val, req, User,{_id: req.user._id},"history")),
    validatorMiddleware,
];
