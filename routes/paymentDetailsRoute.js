const express = require("express");

const router = express.Router();

const {
  getPayments,
  getMyPayment,
  createFilterObj,
  createStoreFilterObj,
  getMyStorePayment,
  createCashPayment,
  createStripePayment,
  createPaypalPayment,
} = require("../services/paymentDetailService");

const {
  createPaymentValidator,
  getStorePaymentValidator,
} = require("../utils/validators/paymentDetailsValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router.get("/", protect, allowedTo("admin"), getPayments);
router.get("/my-payment", protect, allowedTo("user"), createFilterObj,getMyPayment);
router.get(
  "/:storeId/my-store-payment",
  protect,
  allowedTo("seller"),
  getStorePaymentValidator,
  createStoreFilterObj,
  getMyStorePayment
);
router.post(
  "/:orderId/payment-cash",
  protect,
  allowedTo("user"),
  createPaymentValidator,
  createCashPayment
);
// router.post(
//   "/:orderId/payment-stripe",
//   protect,
//   allowedTo("user"),
//   createPaymentValidator,
//   createStripePayment
// );
// router.post(
//   "/:orderId/payment-paypal",
//   protect,
//   allowedTo("user"),
//   createPaymentValidator,
//   createPaypalPayment
// );

module.exports = router;
