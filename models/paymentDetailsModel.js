const mongoose = require("mongoose");

const paymentDetailsSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
      required: [true, "Order required"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user required"],
    },
    paymentInetnetId: {
      type: String,
      required: [true, "Payment Intent ID required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "Paypal", "Stripe"],
      required: [true, "payment Method required"],
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Declined",
        "Cancelled",
        "Refunded",
        "PartiallyRefunded",
        "Chargeback",
      ],
      required: [true, "status required"],
    },
    amount: {
      type: Number,
      required: [true, "amount required"],
    },
    currency: {
      type: String,
      required: [true, "currency required"],
    },
  },
  { timestamps: true }
);

const paymentDetailsModel = mongoose.model(
  "PaymentDetails",
  paymentDetailsSchema
);

module.exports = paymentDetailsModel;
