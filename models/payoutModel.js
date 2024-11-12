const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.ObjectId,
      ref: "PaymentDetails",
      required: true,
    },
    store:{
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: true,
    },
    groupOrder: {
      type: mongoose.Schema.ObjectId,
      ref: "GroupOrder",
      required: true,
    },
    payoutShippingFees: {
      type: Number,
      required: [true, "groupShippingFees required"],
    },
    payoutSubTotal: {
      type: Number,
      required: [true, "groupSubTotal required"],
    },
    total: {
      type: Number,
      required: [true, "total required"],
    },
    status: {
      type: String,
      enum: ["Scheduled", "Paid", "Reversed"],
      default: "Pending",
    },
    scheduledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const PayoutModel = mongoose.model("Payout", payoutSchema);

module.exports = PayoutModel;
