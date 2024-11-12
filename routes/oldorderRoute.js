// const express = require("express");

// const router = express.Router({ mergeParams: true }); // get user id

// const {
//   createFilterObj,
//   getOrders,
//   createCashOrder,
//   updateOrderToPaid,
//   updateOrderToDelivered,
//   getOrder,
//   checkoutSession,
// } = require("../services/orderService");
// const {
//   createCashOrderValidator,
//   updateOrderToPaidValidator,
//   updateOrderToDeliveredValidator,
//   getOrderValidator,
//   checkoutSessionValidator,
//   validatorUserId,
// } = require("../utils/validators/orderValidator  ");
// const { protect } = require("../middlewares/protectMiddleware");
// const { allowedTo } = require("../middlewares/allowedToMiddleware");

// router.get(
//   "/",
//   protect,
//   allowedTo("user", "admin", "manager"),
//   validatorUserId, // validate user id in params for get order for specific user not only my user because my user i already have
//   createFilterObj, // get list of order for specific user
//   getOrders
// );

// router.post(
//   "/:cartId",
//   protect,
//   allowedTo("user"),
//   createCashOrderValidator,
//   createCashOrder
// );

// router.get(
//   "/checkout-session/:cartId",
//   protect,
//   allowedTo("user"),
//   checkoutSessionValidator,
//   checkoutSession
// );

// router
//   .route("/:id")
//   .get(protect, allowedTo("admin", "manager"), getOrderValidator, getOrder);

// router.put(
//   "/:id/isPaid",
//   protect,
//   allowedTo("admin", "manager"),
//   updateOrderToPaidValidator,
//   updateOrderToPaid
// );
// router.put(
//   "/:id/isDelivered",
//   protect,
//   allowedTo("admin", "manager"),
//   updateOrderToDeliveredValidator,
//   updateOrderToDelivered
// );

// module.exports = router;
