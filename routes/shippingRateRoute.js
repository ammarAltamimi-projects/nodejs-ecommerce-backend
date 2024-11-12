const express = require("express");

const router = express.Router();

const {
  getShippingRate,
  createOrUpdateShippingRate,
} = require("../services/shippingRateService");

const {
  createOrUpdateShippingRateValidator,
  getShippingRateValidator,
} = require("../utils/validators/shippingRateValidator");
const { protect } = require("../middlewares/protectMiddleware");
const { allowedTo } = require("../middlewares/allowedToMiddleware");

router
  .route("/")
  .post(
    protect,
    allowedTo("seller"),
    createOrUpdateShippingRateValidator,
    createOrUpdateShippingRate
  );
router
  .route("/:id")
  .get(protect, allowedTo("seller"), getShippingRateValidator, getShippingRate);

module.exports = router;
