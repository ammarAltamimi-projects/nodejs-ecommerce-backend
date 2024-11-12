const mongoose = require("mongoose");
const GroupOrder = require("./groupOrderModel");
const PaymentDetails = require("./paymentDetailsModel");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "user required"],
    },
    shippingAddress: {
      type: mongoose.Schema.ObjectId,
      ref: "Address",
      required: [true, "Address required"],
    },
    // snapshot for shippingAddress if ref deleted
    snapshot: {
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      phone: {
        type: String,
      },
      alias: {
        type: String,
      },
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      state: {
        type: String,
      },
      city: {
        type: String,
      },
      country: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      defaultAddress: {
        type: String,
      },
    },
    shippingFees: {
      type: Number,
    },
    subTotal: {
      type: Number,
    },
    total: {
      type: Number,
    },
    orderStatus: {
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
    paymentStatus: {
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
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "Paypal", "Stripe"],
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name profileImg email phone",
  });
  this.populate({
    path: "shippingAddress",
  });

  next();
});

// Define virtual field
orderSchema.virtual("groupOrders", {
  ref: "GroupOrder",
  foreignField: "order",
  localField: "_id",
});
orderSchema.pre(["findOneAndDelete", "deleteMany"], async function (next) {
  const orders = await this.model.find(this.getQuery());

  if (orders.length > 0) {
    const ordersIds = orders.map((p) => p._id);
    await GroupOrder.deleteMany({ order: { $in: ordersIds } });
    await PaymentDetails.deleteMany({ order: { $in: ordersIds } });
  }

  next();
});

const orderModel = mongoose.model("Order", orderSchema);

module.exports = orderModel;
