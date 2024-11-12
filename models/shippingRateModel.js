const mongoose = require("mongoose");

const shippingRateScheme = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: [true, "Store required"],
    },
    country: {
      type: mongoose.Schema.ObjectId,
      ref: "Country",
    },

    //custom shipping
    returnPolicy: {
      type: String,
      required: [true, "returnPolicy required"],

    },
    shippingService: {
      type: String,
      required: [true, "shippingService required"],
    },
    shippingFeePerItem: {
      type: Number,
      required: [true, "shippingFeePerItem required"],
    },
    shippingFeeForAdditionalItem: {
      type: Number,
      required: [true, "shippingFeeForAdditionalItem required"],
    },
    shippingFeePerKg: {
      type: Number,
      required: [true, "shippingFeePerKg required"],
    },
    shippingFeeFixed: {
      type: Number,
      required: [true, "shippingFeeFixed required"],
    },
    deliveryTimeMin: {
      type: Number,
      required: [true, "deliveryTimeMin required"],
    },
    deliveryTimeMax: {
      type: Number,
      required: [true, "deliveryTimeMax required"],
    },
  },

  { timestamps: true }
);

const ShippingRateModel = mongoose.model("ShippingRate", shippingRateScheme);

module.exports = ShippingRateModel;
