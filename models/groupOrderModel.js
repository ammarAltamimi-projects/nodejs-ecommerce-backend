const mongoose = require("mongoose");

const groupOrderSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
      required: [true, "Order required"],
    },

    store: {
      type: mongoose.Schema.ObjectId,
      ref: "Store",
      required: [true, "Store required"],
    },
    coupon: {
      type: mongoose.Schema.ObjectId,
      ref: "Coupon",
    },
    // snapshot for coupon if ref deleted
    snapshot: {
      name: {
        type: String,
      },
      discount: {
        type: Number,
      },
    },
    OrderItem: [
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
          default: 0,
        },

        // Snapshot Fields
        snapshot: {
          productName: {
            type: String,
          },
          variantName: {
            type: String,
          },
          price: {
            type: Number,
            min: [0, "price cannot be negative"],
          },
          imageCover: {
            url: { type: String, required: [true, "image URL required"] },
            public_id: {
              type: String,
              required: [true, "image public ID required"],
            },
          },
          shippingFeeMethod: {
            type: String,
            enum: ["item", "weight", "fixed"],
          },
        },
        status: {
          type: String,
          enum: ["available", "unavailable", "out_of_stock"],
          default: "available",
        },

        // item status
        productStatus: {
          type: String,
          enum: [
            "Pending",
            "Confirmed",
            "Processing",
            "OnHold",
            "Backordered",
            "Shipped",
            "OutforDelivery",
            "Delivered",
            "AwaitingPickup",
            "PartiallyShipped",
            "Cancelled",
            "Failed",
            "Returned",
            "Refunded",
          ],
    

          default: "Pending",
        },
        hasBeenShipped: {
          type: Boolean,
          default: false,
        },
        hasBeenReturned: {
          type: Boolean,
          default: false,
        },
        DeliveredAt: {
          type: Date,
        },
        ReturnedAt : {
          type: Date,
        },
        
      },
    ],
    groupShippingFees: {
      type: Number,
      required: [true, "groupShippingFees required"],
    },
    groupSubTotal: {
      type: Number,
      required: [true, "groupSubTotal required"],
    },
    total: {
      type: Number,
      required: [true, "total required"],
    },
    shippingService: {
      type: String,
      required: [true, "shippingService required"],
    },
    shippingDeliveryMin: {
      type: String,
      required: [true, "shippingDeliveryMin required"],
    },
    shippingDeliveryMax: {
      type: String,
      required: [true, "shippingDeliveryMax required"],
    },
    groupOrderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "OnHold",
        "Backordered",
        "Shipped",
        "OutforDelivery",
        "Delivered",
        "AwaitingPickup",
        "PartiallyShipped",
        "Cancelled",
        "Failed",
        "Returned",
        "Refunded",
      ],

      default: "Pending",
    },
    DeliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

groupOrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "order",
  });
  this.populate({
    path: "store",
  });

  next();
});

const groupOrderModel = mongoose.model("GroupOrder", groupOrderSchema);

module.exports = groupOrderModel;
