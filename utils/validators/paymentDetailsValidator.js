const { check } = require("express-validator");
const { validatorMiddleware } = require("../../middlewares/validatorMiddleware");
const {
  validateUserOwnership,
  validateReferenceOwnership
} = require("./customValidator");
const Store = require("../../models/storeModel");
const Order = require("../../models/orderModel");


exports.getStorePaymentValidator = [
  check("storeId").isMongoId().withMessage("Invalid store id format")
   .custom(async (storeId, { req }) => validateUserOwnership(storeId, req, Store)),
  validatorMiddleware,
];

exports.createPaymentValidator = [
  check("orderId").isMongoId().withMessage("Invalid order id format")
  .custom(async (orderId, { req }) => validateUserOwnership(orderId, req, Order))
        .custom(async (orderId, { req }) =>
            validateReferenceOwnership(orderId, req, Order,"shippingAddress")
          ),
  
  validatorMiddleware,
];

