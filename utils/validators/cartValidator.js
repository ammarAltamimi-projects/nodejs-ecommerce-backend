const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartModel");
const { ensureDocumentExistsById,ensureSubDocumentExistsById,validateUserOwnership,validateReferenceOwnership } = require("./customValidator");

exports.addProductToCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("product id required")
    .isMongoId()
    .withMessage("Invalid product id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Product)),
  check("variantId")
    .notEmpty()
    .withMessage("variantId required")
    .isMongoId()
    .withMessage("Invalid variantId  format")
      .custom((val, { req }) => ensureSubDocumentExistsById(val, req, Product, {_id:req.body.productId},"variant")),
  check("qty").notEmpty().withMessage("qty is required").isInt(),
  validatorMiddleware,
];

exports.updateCartItemQuantityValidator = [
  check("cartId").isMongoId().withMessage("Invalid cartId format")
  .custom((val, { req }) =>
    ensureSubDocumentExistsById(val, req, Cart, {user: req.user._id} , "cartItem"))
  .custom(async (cartId, { req }) =>
        validateUserOwnership(cartId, req, Cart)
      )
        .custom(async (cartId, { req }) =>
          validateReferenceOwnership(cartId, req, Cart,"store")
        ),
  check("qty")
    .notEmpty()
    .withMessage("productId required")
    .isInt()
    .withMessage("product quantity is number"),
  validatorMiddleware,
];

exports.removeSpecificCartItemValidator = [
  check("cartId").isMongoId().withMessage("Invalid cart  id format")
    .custom((val, { req }) =>
      ensureSubDocumentExistsById(val, req, Cart, {user: req.user._id} , "cartItem")
    ).custom(async (cartId, { req }) =>
      validateUserOwnership(cartId, req, Cart)
    )
    .custom(async (cartId, { req }) =>
      validateReferenceOwnership(cartId, req, Cart,"store")
    ),
  validatorMiddleware,
];

exports.removeMultiCartItemValidator = [
  check("cartItemIds")
   .notEmpty()
  .withMessage("cartItemIds required")
  .isArray()
  .withMessage("cartItemIds is array"),
  check("cartItemIds.*")
  .isMongoId()
  .withMessage("Invalid cartItem id format")
  .custom(async (cartItemIds, { req }) => ensureSubDocumentExistsById(cartItemIds , req,Cart , {user:req.user._id},"cartItem")),
  validatorMiddleware,
];

exports.applyCouponValidator = [
  check("name").notEmpty().withMessage("coupon name is required"),
  validatorMiddleware,
];

