const mongoose = require("mongoose");
const CouponUsage = require("./couponUsageModel")

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "coupon name required"],
      minlength: [2, "too short coupon name"],
      maxlength: [50, "too long coupon name"],
      unique: [true, "coupon name unique"],
      trim: true,

    },
    start: {
      type: Date,
      required: [true, "coupon start date required"],
    },
    expire: {
      type: Date,
      required: [true, "coupon expiration date required"],
    },
    store: {
          type: mongoose.Schema.ObjectId,
          ref: "Store",
          required: [true, "store required"],
        },
    discount: {
      type: Number,
      required: [true, "coupon discount percentage required"],
      min: [0, "discount percentage must be greater than 0"],
      max: [100, "discount percentage must be less than or equal to 100"],
    },
  },
  { timestamps: true }
);

couponSchema.pre(["findOneAndDelete", "deleteMany"], async function (next) {
  const coupons = await this.model.find(this.getQuery()); 
  
  if (coupons.length > 0) {
    const couponsIds = coupons.map((p) => p._id);
    await CouponUsage.deleteMany({ coupon: { $in: couponsIds } }); ;

  }

  next();
});

const couponModel = mongoose.model("Coupon", couponSchema);

module.exports = couponModel;
