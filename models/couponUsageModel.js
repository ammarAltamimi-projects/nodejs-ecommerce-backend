const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
  coupon: {
    type: mongoose.Schema.ObjectId,
    ref: "Coupon",
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: "Order"
  }
},
{
  timestamps: true,
});

const couponUsageModel = mongoose.model("CouponUsage", couponUsageSchema);

module.exports = couponUsageModel;
