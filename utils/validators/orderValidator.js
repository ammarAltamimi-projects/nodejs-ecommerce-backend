const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const Cart = require("../../models/cartModel");
const Store = require("../../models/storeModel");
const Order = require("../../models/orderModel");
const GroupOrder = require("../../models/groupOrderModel");
const Address = require("../../models/addressModel");
const { ensureDocumentExistsById,validateUserOwnership, validateReferenceOwnership } = require("./customValidator");

exports.createOrderValidator = [
  check("cart")
    .notEmpty()
    .withMessage("cartId required")
    .isMongoId()
    .withMessage("Invalid cart id format")
    .custom((val, { req }) => ensureDocumentExistsById(val, req, Cart)),
    check("address")
    .notEmpty()
    .withMessage("addressId required")
    .isMongoId()
    .withMessage("Invalid address id format")
    .custom((val, { req }) => validateUserOwnership(val, req, Address)),

  validatorMiddleware,
];


exports.storeGroupValidator = [
  check("storeId").isMongoId().withMessage("Invalid store id format")
  .custom((val, { req }) => validateUserOwnership(val, req, Store)),
  validatorMiddleware,
];

exports.orderValidator = [
  check("id").isMongoId().withMessage("Invalid order id format")
    .custom(async (orderId, { req }) =>
          validateUserOwnership(orderId, req, Order)
        )
        .custom(async (orderId, { req }) =>
          validateReferenceOwnership(orderId, req, Order,"shippingAddress")
        )
        ,
  validatorMiddleware,
];

exports.updateGroupOrderValidator = [
  check("groupId").isMongoId().withMessage("Invalid group id format")
  .custom(async (groupId, { req }) =>
    validateReferenceOwnership(groupId, req, GroupOrder,"store")
  ),
  validatorMiddleware,
];

exports.updateItemOrderValidator = [
  check("groupId").isMongoId().withMessage("Invalid group id format")

  .custom(async (groupId, { req }) =>
    validateReferenceOwnership(groupId, req, GroupOrder,"store")
  ),
  check("itemId").isMongoId().withMessage("Invalid item id format"),
  validatorMiddleware,
];



exports.cancelledOrderValidator = [
  check("groupId").isMongoId().withMessage("Invalid group id format"),
  check("itemId").isMongoId().withMessage("Invalid item id format"),
  validatorMiddleware,
];
