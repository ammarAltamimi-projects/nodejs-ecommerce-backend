const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    cartItem: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
          required: [true, "product required"],
        },
        variant: {
          type: mongoose.Schema.ObjectId,
          required: [true, "variant required"],
        },
        store: {
          type: mongoose.Schema.ObjectId,
          ref: "Store",
          required: [true, "store required"],
        },
        quantity: {
          type: Number,
          required: [true, "quantity required"],
        },
        shippingFee: {
          type: Number,
        },
        additionalFee: {
          type: Number,
          default:0
        },

          // Snapshot Fields
        snapshot: {
          productName:{
            type: String,
              },
          variantName:{
            type: String,
              },
          price: {
            type: Number,
            min: [0, "price cannot be negative"],
          },
          imageCover: {
            url: { type: String, required: [true, "image URL required"] },
            public_id: { type: String, required: [true, "image public ID required"] },
          },
          shippingFeeMethod:{
            type: String,
            enum: ["item", "weight","fixed" ],
              },
        },
        status: { 
          type: String, 
          enum: ['available', 'unavailable', 'out_of_stock'],
          default: 'available'
        }

      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user required"],
    },
    appliedCoupon: {
      type: String,
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    shippingFees: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const cartModel = mongoose.model("Cart", cartSchema);

module.exports = cartModel;
